import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabase, extractKeywords, truncate, STOP_WORDS } from '@/lib/brain/helpers';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const dryRun = body.dry_run !== false; // default true for safety
    const maxClusters = Math.min(20, Number(body.max_clusters) || 10);

    let memories: any[] = [];

    if (isLocalAuthMode()) {
      memories = (await listMemories(user.id, {})) || [];
    } else {
      const supabase = await getSupabase();
      const { data } = await supabase
        .from('memories')
        .select('id, content, type, confidence, created_at, tags')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_shadow', false)
        .order('created_at', { ascending: false })
        .limit(500);
      memories = data || [];
    }

    if (memories.length < 3) {
      return NextResponse.json({
        message: 'Need at least 3 memories to consolidate.',
        memory_count: memories.length,
      });
    }

    // Build keyword map per memory
    const memKeywords = memories.map(m => {
      const kws: Set<string> = new Set(
        (m.content || '').toLowerCase()
          .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length > 3 && !STOP_WORDS.has(w))
      );
      return { mem: m, kws };
    });

    // Simple clustering: group memories that share >40% keywords
    const used = new Set<number>();
    const clusters: { members: any[]; keywords: string[] }[] = [];

    for (let i = 0; i < memKeywords.length; i++) {
      if (used.has(i)) continue;
      const cluster = [memKeywords[i]];
      used.add(i);

      for (let j = i + 1; j < memKeywords.length; j++) {
        if (used.has(j)) continue;
        const a = memKeywords[i].kws, b = memKeywords[j].kws;
        const shared = [...a].filter(w => b.has(w));
        const ratio = shared.length / Math.max(Math.min(a.size, b.size), 1);
        if (ratio >= 0.4 && shared.length >= 2) {
          cluster.push(memKeywords[j]);
          used.add(j);
        }
      }

      if (cluster.length >= 2) {
        const allKws = new Map<string, number>();
        for (const c of cluster) for (const w of c.kws) allKws.set(w, (allKws.get(w) || 0) + 1);
        const topKws = [...allKws.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
        clusters.push({ members: cluster.map(c => c.mem), keywords: topKws });
      }
    }

    const topClusters = clusters.sort((a, b) => b.members.length - a.members.length).slice(0, maxClusters);

    // Generate insight summaries
    const insights: any[] = [];
    let insightsCreated = 0;

    for (const cluster of topClusters) {
      const contents = cluster.members.map(m => truncate(m.content, 100));
      const avgConf = cluster.members.reduce((s: number, m: any) => s + (m.confidence || 0.8), 0) / cluster.members.length;
      const insightContent = `[Consolidated from ${cluster.members.length} memories] Topics: ${cluster.keywords.join(', ')}. Sources: ${contents.join(' | ')}`;

      const insight = {
        content: truncate(insightContent, 500),
        type: 'insight',
        confidence: Math.round(avgConf * 100) / 100,
        source_count: cluster.members.length,
        source_ids: cluster.members.map((m: any) => String(m.id).slice(0, 8)),
        keywords: cluster.keywords,
      };

      if (!dryRun && !isLocalAuthMode()) {
        const supabase = await getSupabase();
        const { data: created } = await supabase.from('memories').insert({
          user_id: user.id,
          content: insight.content,
          type: 'insight',
          confidence: insight.confidence,
          status: 'active',
          truth_type: 'system_inferred',
          scope: 'private',
          write_reason: 'brain_consolidate auto-generated insight',
          write_intent: 'auto_capture',
          write_source: 'system',
        }).select('id').single();

        if (created) {
          insightsCreated++;
          insight.content = `✅ ${insight.content}`;
        }
      }

      insights.push(insight);
    }

    return NextResponse.json({
      dry_run: dryRun,
      memories_analyzed: memories.length,
      clusters_found: clusters.length,
      clusters_shown: topClusters.length,
      insights_generated: insights.length,
      insights_committed: dryRun ? 0 : insightsCreated,
      insights,
      tip: dryRun ? 'Set dry_run: false to actually create insight memories.' : undefined,
    });
  } catch (error: any) {
    console.error('[brain/consolidate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
