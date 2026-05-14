import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isLocalFeatureMode, getLocalFeatureUnavailableResponse } from '@/lib/dev/local-feature-guards'
import { getAppBaseUrl } from '@/lib/app-url'
import Stripe from 'stripe'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(req: NextRequest) {
  try {
    if (isLocalFeatureMode()) {
      return getLocalFeatureUnavailableResponse('billing_checkout')
    }

    const stripe = getStripeClient()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan_id } = await req.json()

    if (!plan_id || !['pro', 'team'].includes(plan_id)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = plan_id === 'pro'
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_TEAM_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    const appBaseUrl = getAppBaseUrl(req)

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${appBaseUrl}/dashboard/billing?success=true`,
      cancel_url: `${appBaseUrl}/dashboard/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id
        }
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
