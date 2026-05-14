import type { SupabaseClient } from '@supabase/supabase-js';
import { PRICING_PLANS, type PlanId } from '@/lib/billing';

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_end: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function normalizePlanId(planId?: string | null): PlanId {
  if (planId && planId in PRICING_PLANS) return planId as PlanId;
  return 'free';
}

export class BillingSubscriptionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getActiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null> {
    const { data, error } = await this.supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ACTIVE_STATUSES)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as SubscriptionRow | null) ?? null;
  }

  async upsertSubscription(input: {
    userId: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId: string;
    stripePriceId?: string | null;
    planId: PlanId;
    status: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: string | null;
    trialEnd?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const { error } = await this.supabase
      .from('billing_subscriptions')
      .upsert({
        user_id: input.userId,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        stripe_price_id: input.stripePriceId,
        plan_id: input.planId,
        status: input.status,
        current_period_start: input.currentPeriodStart,
        current_period_end: input.currentPeriodEnd,
        cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
        canceled_at: input.canceledAt,
        trial_end: input.trialEnd,
        metadata: input.metadata ?? {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'stripe_subscription_id',
      });

    if (error) throw new Error(error.message);
  }
}
