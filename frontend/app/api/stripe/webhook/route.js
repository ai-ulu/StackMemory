import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

/**
 * Stripe Webhook Handler
 * 
 * Handles subscription lifecycle events.
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          
          // Determine plan
          let plan = 'pro';
          if (priceId?.includes('enterprise')) plan = 'enterprise';

          // Update user profile
          await supabaseAdmin
            .from('profiles')
            .update({
              plan,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          console.log(`User ${userId} upgraded to ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              plan: 'free',
              stripe_subscription_id: null,
              subscription_status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          console.log(`User ${userId} subscription canceled, downgraded to free`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find user by customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          // TODO: Send email notification
          console.log(`Payment failed for user ${profile.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Next.js 14 App Router handles raw body automatically for webhooks
