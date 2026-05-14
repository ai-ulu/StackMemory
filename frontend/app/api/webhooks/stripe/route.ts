import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { isLocalFeatureMode, getLocalFeatureUnavailableResponse } from '@/lib/dev/local-feature-guards'
import { BillingSubscriptionRepository, normalizePlanId } from '@/features/billing/billing.repository'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function toIsoDate(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price?.id ?? null
}

async function persistSubscription(subscription: Stripe.Subscription) {
  const repository = new BillingSubscriptionRepository(createAdminClient())
  const userId = subscription.metadata?.user_id
  const planId = normalizePlanId(subscription.metadata?.plan_id)

  if (!userId) {
    console.warn(`Stripe subscription ${subscription.id} missing user_id metadata`)
    return
  }

  await repository.upsertSubscription({
    userId,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: getSubscriptionPriceId(subscription),
    planId,
    status: subscription.status,
    currentPeriodStart: toIsoDate(subscription.current_period_start),
    currentPeriodEnd: toIsoDate(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: toIsoDate(subscription.canceled_at),
    trialEnd: toIsoDate(subscription.trial_end),
    metadata: subscription.metadata ?? {},
  })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  if (!session.subscription) return

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await persistSubscription(subscription)
}

async function handlePaymentFailed(invoice: Stripe.Invoice, stripe: Stripe) {
  const subscriptionId =
    typeof (invoice as { subscription?: string | Stripe.Subscription | null }).subscription === 'string'
      ? (invoice as { subscription?: string | null }).subscription
      : (invoice as { subscription?: Stripe.Subscription | null }).subscription?.id

  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await persistSubscription(subscription)
}

export async function POST(req: NextRequest) {
  try {
    if (isLocalFeatureMode()) {
      return getLocalFeatureUnavailableResponse('stripe_webhook')
    }

    const stripe = getStripeClient()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
    }

    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, stripe)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await persistSubscription(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, stripe)
        break

      case 'invoice.payment_succeeded':
        console.log(`Payment succeeded for invoice: ${(event.data.object as Stripe.Invoice).id}`)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
