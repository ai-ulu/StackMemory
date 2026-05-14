import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/features/auth/require-user';
import { BillingSubscriptionRepository } from '@/features/billing/billing.repository';
import { getAppBaseUrl } from '@/lib/app-url';
import { isLocalFeatureMode, getLocalFeatureUnavailableResponse } from '@/lib/dev/local-feature-guards';

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(req: NextRequest) {
  try {
    if (isLocalFeatureMode()) {
      return getLocalFeatureUnavailableResponse('billing_customer_portal');
    }

    const stripe = getStripeClient();
    const { supabase, user } = await requireUser();
    const repository = new BillingSubscriptionRepository(supabase);
    const subscription = await repository.getActiveSubscriptionForUser(user.id);

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active Stripe customer found' }, { status: 404 });
    }

    const appBaseUrl = getAppBaseUrl(req);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appBaseUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Customer portal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer portal session' },
      { status: 500 },
    );
  }
}
