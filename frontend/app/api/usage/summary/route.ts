import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/usage/summary
 * 
 * Token tasarrufu ve kullanım metriklerini döndürür.
 * Query params: period (gün), agentId (opsiyonel)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query params
    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get('period') || '30');
    const agentId = searchParams.get('agentId');

    // Tarih aralığı hesapla
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Temel sorgu
    let query = supabase
      .from('ai_usage_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .eq('event_type', 'context_build');

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Usage summary error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      );
    }

    // Metrikleri hesapla
    const totalRequests = events.length;
    const totalInputTokens = events.reduce((sum, e) => sum + (e.input_tokens || 0), 0);
    const totalFinalTokens = events.reduce((sum, e) => sum + (e.output_tokens || 0), 0);
    const totalSavedTokens = totalInputTokens - totalFinalTokens;
    
    // USD tasarruf tahmini (OpenAI gpt-4o fiyatları yaklaşık: $2.50 / 1M input token)
    const estimatedSavedUsd = (totalSavedTokens / 1_000_000) * 2.50;
    
    const avgContextReduction = totalInputTokens > 0 
      ? totalSavedTokens / totalInputTokens 
      : 0;

    // Agent bazlı kırılım
    const byAgent: Record<string, { requests: number; savedTokens: number }> = {};
    events.forEach((event: any) => {
      const aid = event.agent_id || 'unknown';
      if (!byAgent[aid]) {
        byAgent[aid] = { requests: 0, savedTokens: 0 };
      }
      byAgent[aid].requests += 1;
      byAgent[aid].savedTokens += (event.input_tokens || 0) - (event.output_tokens || 0);
    });

    // Günlük kırılım
    const byDay: Record<string, { requests: number; savedTokens: number }> = {};
    events.forEach((event: any) => {
      const day = new Date(event.created_at).toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = { requests: 0, savedTokens: 0 };
      }
      byDay[day].requests += 1;
      byDay[day].savedTokens += (event.input_tokens || 0) - (event.output_tokens || 0);
    });

    return NextResponse.json({
      totalRequests,
      totalInputTokens,
      totalFinalTokens,
      totalSavedTokens,
      estimatedSavedUsd: parseFloat(estimatedSavedUsd.toFixed(2)),
      avgContextReduction: parseFloat(avgContextReduction.toFixed(2)),
      byAgent: Object.entries(byAgent).map(([agentId, data]) => ({
        agentId,
        ...data,
      })),
      byDay: Object.entries(byDay).map(([date, data]) => ({
        date,
        ...data,
      })).sort((a, b) => a.date.localeCompare(b.date)),
      period,
    });
  } catch (error) {
    console.error('Usage summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage summary' },
      { status: 500 }
    );
  }
}
