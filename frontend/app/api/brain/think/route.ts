import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabase, extractKeywords, scoreKeywordRelevance, truncate } from '@/lib/brain/helpers';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const context = String(body.context || '');
    const depth = body.depth || 'normal';
    if (!context.trim()) return NextResponse.json({ error: 'context is required' }, { status: 400 });

    const topK = depth === 'quick' ? 5 : depth === 'deep' ? 20 : 10;
    const keywords = extractKeywords(context);
    let memories: any[] = [];

    if (isLocalAuthMode()) {
      const all = await listMemories(user.id, {});
      memories = (all || []).filter((m: any) => {
        const content = (m.content || '').toLowerCase();
        return keywords.some(kw => content.includes(kw));
      });
    } else {
      const supabase = await getSupabase();
      const { data } = await supabase
        .from('memories')
        .select('id, content, type, confidence, created_at, updated_at, last_accessed_at, access_count, tags, scope')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_shadow', false)
        .order('confidence', { ascending: false })
        .limit(100);
      memories = data || [];
    }

    // Score and rank
    const scored = memories.map(m => {
      const kw = scoreKeywordRelevance(m.content || '', keywords);
      const daysSince = m.last_accessed_at
        ? (Date.now() - new Date(m.last_accessed_at).getTime()) / 86400000
        : (Date.now() - new Date(m.created_at).getTime()) / 86400000;
      const decay = Math.exp(-0.02 * daysSince);
      const importanceMap: Record<string, number> = { identity: 1.0, preference: 0.7, fact: 0.4, rule: 0.9, decision: 0.8, project: 0.6, task: 0.5, insight: 0.85 };
      const importance = importanceMap[m.type] || 0.4;
      const score = kw * 0.4 + decay * 0.25 + importance * 0.35;
      return { ...m, think_score: Math.round(score * 100) / 100 };
    }).sort((a, b) => b.think_score - a.think_score).slice(0, topK);

    // Detect contradictions
    const contradictions: any[] = [];
    for (let i = 0; i < scored.length; i++) {
      for (let j = i + 1; j < scored.length; j++) {
        const a = scored[i], b = scored[j];
        if (a.type !== b.type) continue;
        const wordsA = new Set((a.content || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
        const wordsB = new Set((b.content || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
        const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
        const ratio = overlap / Math.max(Math.min(wordsA.size, wordsB.size), 1);
        if (ratio > 0.3 && ratio < 0.8) {
          const daysDiff = Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) / 86400000;
          if (daysDiff > 7) {
            contradictions.push({
              memory_a: String(a.id).slice(0, 8),
              memory_b: String(b.id).slice(0, 8),
              reason: `Same type (${a.type}), ${Math.round(ratio * 100)}% overlap, ${Math.round(daysDiff)} days apart`,
            });
          }
        }
      }
    }

    // Type distribution
    const typeDist: Record<string, number> = {};
    for (const m of scored) typeDist[m.type] = (typeDist[m.type] || 0) + 1;

    const highConf = scored.filter(m => m.confidence >= 0.8).length;
    const recentCount = scored.filter(m => (Date.now() - new Date(m.created_at).getTime()) / 86400000 < 30).length;

    return NextResponse.json({
      context_preview: context.slice(0, 150),
      depth,
      key_memories: scored.map(m => ({ id: m.id, content: truncate(m.content, 300), type: m.type, confidence: m.confidence, think_score: m.think_score })),
      memory_count: scored.length,
      type_distribution: typeDist,
      contradictions_found: contradictions.length,
      contradictions,
      cognitive_assessment: {
        confidence_level: highConf > scored.length / 2 ? 'high' : 'moderate',
        knowledge_freshness: recentCount > scored.length / 2 ? 'fresh' : recentCount > 0 ? 'mixed' : 'stale',
        recommendation: contradictions.length > 0
          ? `⚠️ ${contradictions.length} potential contradiction(s) detected.`
          : highConf >= 3
            ? '✅ Strong knowledge base on this topic.'
            : scored.length === 0
              ? '❌ No relevant memories found.'
              : '🔶 Limited knowledge. Consider gathering more context.',
      },
    });
  } catch (error: any) {
    console.error('[brain/think]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
