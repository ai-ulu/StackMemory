import Stripe from 'stripe';

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });
}

// Price IDs (set these in Stripe Dashboard)
export const STRIPE_PRICES = {
  FREE: null, // No payment required
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
  TEAM_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID,
  TEAM_YEARLY: process.env.NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID,
};

// Create checkout session
export async function createCheckoutSession({ priceId, userId, userEmail, successUrl, cancelUrl }) {
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId,
        },
      },
      metadata: {
        userId,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Create customer portal session
export async function createPortalSession({ customerId, returnUrl }) {
  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Stripe portal error:', error);
    throw new Error('Failed to create portal session');
  }
}

// Get subscription status
export async function getSubscriptionStatus(customerId) {
  try {
    const stripe = getStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return { status: 'inactive', plan: 'free' };
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;

    // Determine plan based on price ID
    let plan = 'free';
    if (priceId === STRIPE_PRICES.PRO_MONTHLY || priceId === STRIPE_PRICES.PRO_YEARLY) {
      plan = 'pro';
    } else if (priceId === STRIPE_PRICES.TEAM_MONTHLY || priceId === STRIPE_PRICES.TEAM_YEARLY) {
      plan = 'team';
    }

    return {
      status: subscription.status,
      plan,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Get subscription error:', error);
    return { status: 'error', plan: 'free' };
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId) {
  try {
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true, subscription };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw new Error('Failed to cancel subscription');
  }
}

// Resume subscription
export async function resumeSubscription(subscriptionId) {
  try {
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return { success: true, subscription };
  } catch (error) {
    console.error('Resume subscription error:', error);
    throw new Error('Failed to resume subscription');
  }
}
