import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabase, extractKeywords, scoreKeywordRelevance, truncate, NEGATIVE_PATTERNS, POSITIVE_PATTERNS } from '@/lib/brain/helpers';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const decision = String(body.decision || '');
    if (!decision.trim()) return NextResponse.json({ error: 'decision is required' }, { status: 400 });

    const keywords = extractKeywords(decision);
    let memories: any[] = [];

    if (isLocalAuthMode()) {
      memories = (await listMemories(user.id, {})) || [];
    } else {
      const supabase = await getSupabase();
      const { data } = await supabase
        .from('memories')
        .select('id, content, type, confidence, created_at, access_count, tags, scope')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_shadow', false)
        .order('confidence', { ascending: false })
        .limit(200);
      memories = data || [];
    }

    // Score by relevance
    const scored = memories.map(m => ({
      ...m,
      sim_score: scoreKeywordRelevance(m.content || '', keywords) * 0.5 +
        (['decision', 'rule', 'insight'].includes(m.type) ? 0.2 : 0) +
        (m.confidence || 0.5) * 0.3,
    })).sort((a, b) => b.sim_score - a.sim_score).slice(0, 15);

    // Risk analysis
    const risks: any[] = [];
    const supports: any[] = [];
    const affectedTypes = new Set<string>();

    for (const m of scored) {
      const content = (m.content || '').toLowerCase();
      affectedTypes.add(m.type);

      const hasNegative = NEGATIVE_PATTERNS.some(p => content.includes(p));
      const isLowConf = (m.confidence || 0.8) < 0.5;

      if (hasNegative || isLowConf) {
        risks.push({
          level: isLowConf && hasNegative ? 'high' : hasNegative ? 'medium' : 'low',
          description: truncate(m.content, 200),
          source: `${String(m.id).slice(0, 8)} (${m.type})`,
        });
      }

      const hasPositive = POSITIVE_PATTERNS.some(p => content.includes(p));
      if (hasPositive && (m.confidence || 0.8) >= 0.6) {
        supports.push({
          description: truncate(m.content, 200),
          source: `${String(m.id).slice(0, 8)} (${m.type})`,
          confidence: m.confidence,
        });
      }
    }

    // Contradiction check
    const contradictions: any[] = [];
    for (const m of scored) {
      if (!['decision', 'rule'].includes(m.type)) continue;
      const overlap = keywords.filter(kw => (m.content || '').toLowerCase().includes(kw)).length;
      if (overlap >= 2) {
        contradictions.push({
          existing: truncate(m.content, 200),
          memory_id: String(m.id).slice(0, 8),
          type: m.type,
        });
      }
    }

    // Risk score
    const highRisks = risks.filter(r => r.level === 'high').length;
    const medRisks = risks.filter(r => r.level === 'medium').length;
    const riskScore = Math.min(1.0, (highRisks * 0.4 + medRisks * 0.2 + contradictions.length * 0.15) / Math.max(scored.length, 1));
    const confScore = supports.length > 0
      ? Math.round(supports.reduce((s: number, x: any) => s + x.confidence, 0) / supports.length * 100) / 100
      : 0;

    let verdict: string;
    if (riskScore > 0.6) verdict = '🔴 HIGH RISK — Multiple warnings and contradictions.';
    else if (riskScore > 0.3) verdict = '🟡 MODERATE RISK — Some historical concerns.';
    else if (contradictions.length > 0) verdict = '🟠 CAUTION — This overrides existing decisions.';
    else if (supports.length >= 2) verdict = '🟢 LOW RISK — Historical evidence supports this.';
    else verdict = '⚪ UNCHARTED — Limited historical data.';

    return NextResponse.json({
      decision_preview: decision.slice(0, 200),
      historical_context: {
        memories_analyzed: scored.length,
        past_decisions: scored.filter(m => m.type === 'decision').length,
        rules: scored.filter(m => m.type === 'rule').length,
        insights: scored.filter(m => m.type === 'insight').length,
      },
      risk_assessment: {
        overall_risk_score: Math.round(riskScore * 100) / 100,
        confidence_score: confScore,
        risks: risks.slice(0, 5),
        supports: supports.slice(0, 5),
      },
      decision_conflicts: contradictions,
      affected_types: [...affectedTypes],
      verdict,
      top_relevant: scored.slice(0, 8).map(m => ({
        id: m.id, content: truncate(m.content, 200), type: m.type,
        confidence: m.confidence, sim_score: m.sim_score,
      })),
    });
  } catch (error: any) {
    console.error('[brain/simulate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
