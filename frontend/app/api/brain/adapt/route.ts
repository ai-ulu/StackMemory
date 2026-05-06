import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabase, LEARNING_RATE, normalizeWeights } from '@/lib/brain/helpers';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const memoryId = String(body.memory_id || '');
    const feedback = String(body.feedback || '');
    const context = String(body.context || '').slice(0, 500);
    const namespace = String(body.namespace || 'global');

    if (!memoryId || !['useful', 'not_useful', 'critical'].includes(feedback)) {
      return NextResponse.json({ error: 'memory_id and valid feedback required' }, { status: 400 });
    }

    if (isLocalAuthMode()) {
      // Local mode: just acknowledge (no persistent brain_config)
      return NextResponse.json({
        feedback_recorded: true,
        memory_id: memoryId,
        feedback,
        note: 'Local mode — feedback acknowledged but weights not persisted',
      });
    }

    const supabase = await getSupabase();

    // 1. Verify memory exists
    const { data: mem } = await supabase
      .from('memories')
      .select('id, type, confidence, access_count')
      .eq('id', memoryId)
      .eq('user_id', user.id)
      .single();
    if (!mem) return NextResponse.json({ error: 'Memory not found' }, { status: 404 });

    // 2. Record feedback
    await supabase.from('brain_feedback').insert({
      user_id: user.id,
      memory_id: memoryId,
      namespace,
      feedback,
      memory_type: mem.type,
      context,
    });

    // 3. Adjust memory importance_score (via decay_factor column)
    const importanceAdj = feedback === 'critical' ? 0.1 : feedback === 'useful' ? 0.05 : -0.05;
    const newConf = Math.max(0.1, Math.min(1.0, (mem.confidence || 0.8) + importanceAdj));
    await supabase.from('memories').update({ confidence: newConf }).eq('id', memoryId);

    // 4. Get or create brain config for this namespace
    let { data: config } = await supabase
      .from('brain_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('namespace', namespace)
      .single();

    if (!config) {
      await supabase.from('brain_config').insert({ user_id: user.id, namespace });
      const r = await supabase.from('brain_config').select('*').eq('user_id', user.id).eq('namespace', namespace).single();
      config = r.data;
    }

    // 5. Adapt weights
    const w: Record<string, number> = {
      similarity: config!.weight_similarity,
      decay: config!.weight_decay,
      importance: config!.weight_importance,
      frequency: config!.weight_frequency,
      emotional: config!.weight_emotional,
    };

    const lr = feedback === 'critical' ? LEARNING_RATE * 2 : LEARNING_RATE;
    if (feedback === 'useful' || feedback === 'critical') {
      if ((mem.confidence || 0.8) > 0.7) w.importance += lr;
      if ((mem.access_count || 0) > 5) w.frequency += lr;
      w.decay += lr * 0.5;
    } else {
      w.similarity += lr;
      w.importance -= lr * 0.5;
    }

    const normalized = normalizeWeights(w);
    const totalFeedback = (config!.total_feedback || 0) + 1;
    const usefulFeedback = (config!.useful_feedback || 0) + (feedback !== 'not_useful' ? 1 : 0);

    await supabase.from('brain_config').update({
      weight_similarity: normalized.similarity,
      weight_decay: normalized.decay,
      weight_importance: normalized.importance,
      weight_frequency: normalized.frequency,
      weight_emotional: normalized.emotional,
      total_feedback: totalFeedback,
      useful_feedback: usefulFeedback,
      last_adapted: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id).eq('namespace', namespace);

    return NextResponse.json({
      feedback_recorded: true,
      memory_id: memoryId,
      feedback,
      confidence_adjusted: importanceAdj > 0 ? `+${importanceAdj}` : String(importanceAdj),
      namespace_weights: normalized,
      total_feedback: totalFeedback,
      useful_ratio: totalFeedback > 0 ? Math.round((usefulFeedback / totalFeedback) * 100) + '%' : 'n/a',
    });
  } catch (error: any) {
    console.error('[brain/adapt]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
