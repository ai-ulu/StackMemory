import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabase } from '@/lib/brain/helpers';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let memories: any[] = [];
    let brainConfig: any = null;
    let recentFeedback: any[] = [];

    if (isLocalAuthMode()) {
      memories = (await listMemories(user.id, {})) || [];
    } else {
      const supabase = await getSupabase();

      const { data: mems } = await supabase
        .from('memories')
        .select('id, type, confidence, created_at, last_accessed_at, access_count, scope')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_shadow', false);
      memories = mems || [];

      // Brain config (global)
      const { data: config } = await supabase
        .from('brain_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('namespace', 'global')
        .single();
      brainConfig = config;

      // Recent feedback
      const { data: fb } = await supabase
        .from('brain_feedback')
        .select('id, feedback, memory_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      recentFeedback = fb || [];
    }

    // Type distribution
    const typeDist: Record<string, number> = {};
    const scopeDist: Record<string, number> = {};
    let totalConf = 0;
    let freshCount = 0;
    let staleCount = 0;
    const now = Date.now();

    for (const m of memories) {
      typeDist[m.type] = (typeDist[m.type] || 0) + 1;
      scopeDist[m.scope || 'private'] = (scopeDist[m.scope || 'private'] || 0) + 1;
      totalConf += m.confidence || 0.8;

      const lastAccess = m.last_accessed_at ? new Date(m.last_accessed_at).getTime() : new Date(m.created_at).getTime();
      const daysSince = (now - lastAccess) / 86400000;
      if (daysSince < 7) freshCount++;
      else if (daysSince > 90) staleCount++;
    }

    const avgConf = memories.length > 0 ? Math.round((totalConf / memories.length) * 100) / 100 : 0;
    const freshRatio = memories.length > 0 ? Math.round((freshCount / memories.length) * 100) : 0;
    const staleRatio = memories.length > 0 ? Math.round((staleCount / memories.length) * 100) : 0;

    // Cognitive load assessment
    let loadLevel: string;
    let recommendation: string;
    if (memories.length > 500) {
      loadLevel = '🔴 High';
      recommendation = 'Run brain_consolidate to merge redundant memories and reduce noise.';
    } else if (memories.length > 200) {
      loadLevel = '🟡 Moderate';
      recommendation = 'Consider consolidating clusters to keep the brain lean.';
    } else if (memories.length > 50) {
      loadLevel = '🟢 Healthy';
      recommendation = 'Good memory count. Continue building knowledge.';
    } else {
      loadLevel = '⚪ Light';
      recommendation = 'The brain is still young. Store more memories for richer analysis.';
    }

    return NextResponse.json({
      memory_count: memories.length,
      type_distribution: typeDist,
      scope_distribution: scopeDist,
      average_confidence: avgConf,
      freshness: {
        fresh_7d: freshCount,
        stale_90d: staleCount,
        fresh_ratio: freshRatio + '%',
        stale_ratio: staleRatio + '%',
      },
      adaptive_weights: brainConfig ? {
        similarity: brainConfig.weight_similarity,
        decay: brainConfig.weight_decay,
        importance: brainConfig.weight_importance,
        frequency: brainConfig.weight_frequency,
        emotional: brainConfig.weight_emotional,
        total_feedback: brainConfig.total_feedback,
        useful_feedback: brainConfig.useful_feedback,
        last_adapted: brainConfig.last_adapted,
      } : { note: isLocalAuthMode() ? 'Not available in local mode' : 'No brain_config yet — use /api/brain/adapt' },
      recent_feedback: recentFeedback.map(f => ({
        feedback: f.feedback,
        memory_type: f.memory_type,
        when: f.created_at,
      })),
      cognitive_load: { level: loadLevel, recommendation },
    });
  } catch (error: any) {
    console.error('[brain/status]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
