import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PRICING_PLANS } from '@/lib/billing';

function getPlanId() {
  const value = process.env.NEXT_PUBLIC_DEFAULT_PLAN || 'free';
  return PRICING_PLANS[value] ? value : 'free';
}

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error('Unauthorized');
    }

    const { count: memoryCount, error: memoryError } = await supabase
      .from('memories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', data.user.id)
      .eq('status', 'active');

    if (memoryError) {
      throw new Error(memoryError.message);
    }

    const planId = getPlanId();
    const plan = PRICING_PLANS[planId];
    const memoryLimit = plan.memories;
    const usagePercent = memoryLimit === -1 ? 0 : Math.min(100, Math.round(((memoryCount || 0) / memoryLimit) * 100));

    return NextResponse.json({
      summary: {
        planId,
        planName: plan.name,
        memoryCount: memoryCount || 0,
        memoryLimit,
        usagePercent,
        searchesPerDay: plan.searches_per_day,
        features: plan.features,
        plans: PRICING_PLANS,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
