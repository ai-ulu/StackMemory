import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan_id } = await req.json()

    if (!plan_id || !['pro', 'team'].includes(plan_id)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get price ID from environment
    const priceId = plan_id === 'pro'
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_TEAM_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: {
        user_id: user.id,
        plan_id
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
