import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
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

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabase)
        break
      }

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

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const { user_id, plan_id } = session.metadata!

  // Update user subscription
  const { error } = await supabase
    .from('users')
    .update({
      subscription_plan: plan_id,
      subscription_status: 'active',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      updated_at: new Date().toISOString()
    })
    .eq('id', user_id)

  if (error) {
    console.error('Failed to update user subscription:', error)
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: subscription.status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update subscription status:', error)
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const { error } = await supabase
    .from('users')
    .update({
      subscription_plan: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to cancel subscription:', error)
  }
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  // Log successful payment
  console.log(`Payment succeeded for invoice: ${invoice.id}`)
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  // Log failed payment and notify user
  console.error(`Payment failed for invoice: ${invoice.id}`)
  
  // Update subscription status
  const subscriptionId =
    typeof (invoice as { subscription?: string | Stripe.Subscription | null }).subscription === 'string'
      ? (invoice as { subscription?: string | null }).subscription
      : (invoice as { subscription?: Stripe.Subscription | null }).subscription?.id

  if (subscriptionId) {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Failed to update payment status:', error)
    }
  }
}
