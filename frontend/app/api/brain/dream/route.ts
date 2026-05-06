import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabase, STOP_WORDS, truncate } from '@/lib/brain/helpers';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const focus = String(body.focus || '');
    const maxIdeas = Math.min(10, Number(body.max_ideas) || 5);

    // Group memories by type (frontend uses type as namespace equivalent)
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
        .limit(300);
      memories = data || [];
    }

    if (focus) {
      const focusLower = focus.toLowerCase();
      const focusFiltered = memories.filter(m => (m.content || '').toLowerCase().includes(focusLower));
      if (focusFiltered.length > 10) memories = focusFiltered;
    }

    // Group by type
    const typePools = new Map<string, any[]>();
    for (const m of memories) {
      const t = m.type || 'fact';
      if (!typePools.has(t)) typePools.set(t, []);
      typePools.get(t)!.push(m);
    }

    if (typePools.size < 2) {
      return NextResponse.json({
        message: 'Need memories of at least 2 different types for cross-pollination.',
        types_found: typePools.size,
        tip: 'Store memories as identity, preference, rule, decision, project, task, insight to enable dreaming.',
      });
    }

    // Build keyword signatures per type
    type Sig = { type: string; keywords: Map<string, number>; memories: any[] };
    const signatures: Sig[] = [];

    for (const [type, mems] of typePools) {
      const kwMap = new Map<string, number>();
      for (const m of mems) {
        const words = (m.content || '').toLowerCase()
          .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length > 3 && !STOP_WORDS.has(w));
        for (const w of words) kwMap.set(w, (kwMap.get(w) || 0) + 1);
        // Tags
        try {
          const tags = typeof m.tags === 'string' ? JSON.parse(m.tags) : m.tags;
          if (Array.isArray(tags)) for (const t of tags) kwMap.set(String(t).toLowerCase(), (kwMap.get(String(t).toLowerCase()) || 0) + 2);
        } catch { /* ignore */ }
      }
      signatures.push({ type, keywords: kwMap, memories: mems });
    }

    // Find cross-type bridges
    type Connection = {
      type_a: string;
      type_b: string;
      bridge_keywords: string[];
      bridge_strength: number;
      memory_a: { id: string; content: string; type: string };
      memory_b: { id: string; content: string; type: string };
      insight: string;
    };
    const connections: Connection[] = [];

    for (let i = 0; i < signatures.length; i++) {
      for (let j = i + 1; j < signatures.length; j++) {
        const a = signatures[i], b = signatures[j];
        const shared: string[] = [];
        for (const [kw, cA] of a.keywords) {
          const cB = b.keywords.get(kw);
          if (cB && cA >= 2 && cB >= 2) shared.push(kw);
        }
        if (shared.length < 2) continue;

        const bridgeWords = shared.slice(0, 5);
        const bestA = a.memories.map(m => ({ m, s: bridgeWords.filter(w => (m.content || '').toLowerCase().includes(w)).length })).sort((x, y) => y.s - x.s)[0];
        const bestB = b.memories.map(m => ({ m, s: bridgeWords.filter(w => (m.content || '').toLowerCase().includes(w)).length })).sort((x, y) => y.s - x.s)[0];
        if (!bestA || !bestB || bestA.s < 1 || bestB.s < 1) continue;

        const strength = Math.round((shared.length / Math.min(a.keywords.size, b.keywords.size)) * 100) / 100;
        connections.push({
          type_a: a.type,
          type_b: b.type,
          bridge_keywords: bridgeWords,
          bridge_strength: strength,
          memory_a: { id: String(bestA.m.id).slice(0, 8), content: truncate(bestA.m.content, 150), type: bestA.m.type },
          memory_b: { id: String(bestB.m.id).slice(0, 8), content: truncate(bestB.m.content, 150), type: bestB.m.type },
          insight: `💡 "${a.type}" and "${b.type}" memories share [${bridgeWords.join(', ')}]. Cross-referencing may reveal deeper patterns.`,
        });
      }
    }

    connections.sort((a, b) => b.bridge_strength - a.bridge_strength);
    const top = connections.slice(0, maxIdeas);

    // Isolated patterns
    const uniquePatterns: any[] = [];
    for (const sig of signatures) {
      const unique: string[] = [];
      for (const [kw, count] of sig.keywords) {
        if (count < 3) continue;
        const elsewhere = signatures.some(s => s.type !== sig.type && s.keywords.has(kw));
        if (!elsewhere) unique.push(kw);
      }
      if (unique.length >= 3) {
        uniquePatterns.push({
          type: sig.type,
          unique_keywords: unique.slice(0, 8),
          suggestion: `🔮 "${sig.type}" memories have unique concepts [${unique.slice(0, 4).join(', ')}] not found in other types.`,
        });
      }
    }

    return NextResponse.json({
      focus: focus || 'free association',
      types_scanned: signatures.map(s => ({ type: s.type, memory_count: s.memories.length, keyword_count: s.keywords.size })),
      total_analyzed: memories.length,
      dream_connections: top,
      connections_found: connections.length,
      unique_patterns: uniquePatterns.slice(0, 5),
      dream_summary: top.length > 0
        ? `🧠 Found ${connections.length} cross-type connections. Top: "${top[0].type_a}" ↔ "${top[0].type_b}" via [${top[0].bridge_keywords.join(', ')}].`
        : '💭 No strong cross-type patterns found yet. Keep building diverse memory types.',
    });
  } catch (error: any) {
    console.error('[brain/dream]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
