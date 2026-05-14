import type { SupabaseClient } from '@supabase/supabase-js';
import { PRICING_PLANS, type PlanId } from '@/lib/billing';
import { BillingSubscriptionRepository, normalizePlanId } from './billing.repository';

export type MemoryEntitlement = {
  planId: PlanId;
  planName: string;
  memoryCount: number;
  memoryLimit: number;
  canCreateMemory: boolean;
  remainingMemories: number | null;
};

function getFallbackPlanId(): PlanId {
  const value = process.env.NEXT_PUBLIC_DEFAULT_PLAN || 'free';
  return normalizePlanId(value);
}

export async function getMemoryEntitlement(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemoryEntitlement> {
  const subscriptionRepository = new BillingSubscriptionRepository(supabase);
  const subscription = await subscriptionRepository.getActiveSubscriptionForUser(userId).catch(() => null);
  const planId = subscription ? normalizePlanId(subscription.plan_id) : getFallbackPlanId();
  const plan = PRICING_PLANS[planId];

  const { count, error } = await supabase
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw new Error(error.message);

  const memoryCount = count || 0;
  const memoryLimit = plan.memories;
  const canCreateMemory = memoryLimit === -1 || memoryCount < memoryLimit;

  return {
    planId,
    planName: plan.name,
    memoryCount,
    memoryLimit,
    canCreateMemory,
    remainingMemories: memoryLimit === -1 ? null : Math.max(0, memoryLimit - memoryCount),
  };
}
