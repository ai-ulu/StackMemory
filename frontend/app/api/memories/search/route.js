import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';
import OpenAI from 'openai';
export const dynamic = 'force-dynamic';

// Lazily instantiate the OpenAI client so the route does not crash on load
// when OPENAI_API_KEY is absent (e.g. local mode, which never needs embeddings).
let openaiClient = null;
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergentmethods.ai/v1',
    });
  }
  return openaiClient;
}

/**
 * Memory Search API
 * 
 * Semantic search across user memories using H(x,ψ) scoring.
 * Used by MCP Server and other integrations.
 */

async function generateEmbedding(text) {
  try {
    const openai = getOpenAI();
    if (!openai) return null;
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error.message);
    return null;
  }
}

// H(x,ψ) calculation
function calculateHScore(memory, similarity) {
  const α = 0.4, β = 0.2, γ = 0.3, δ = 0.1;
  
  const daysSinceAccess = memory.last_accessed_at 
    ? (Date.now() - new Date(memory.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
    : (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
  
  const λ = 0.02;
  const decayFactor = Math.exp(-λ * daysSinceAccess);
  
  const importanceMap = { identity: 1.0, preference: 0.7, fact: 0.4 };
  const importance = importanceMap[memory.type] || 0.4;
  
  const F_max = 100;
  const frequency = Math.min(1, Math.log((memory.access_count || 1) + 1) / Math.log(F_max));
  
  const H = α * (1 - similarity) + β * (1 - decayFactor) + γ * (1 - importance) + δ * (1 - frequency);
  
  return { H, decayFactor, importance, frequency };
}

export async function GET(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
      const limit = parseInt(searchParams.get('limit') || '10');
      const type = searchParams.get('type');

      if (!query) {
        return NextResponse.json({ error: 'Query parameter (q) is required' }, { status: 400 });
      }

      const normalized = query.toLowerCase();
      const memories = await listMemories(user.id, { type: type || undefined });
      const results = memories
        .filter((memory) => memory.content.toLowerCase().includes(normalized))
        .slice(0, limit)
        .map((memory) => ({
          id: memory.id,
          content: memory.content,
          type: memory.type,
          confidence: memory.confidence,
          similarity: 100,
          hScore: {
            total: Math.round((memory.confidence || 0.8) * 100),
            decay: 100,
            importance: 100,
            frequency: Math.min(100, (memory.access_count || 0) * 10),
          },
          scope: memory.scope,
          createdAt: memory.created_at,
        }));

      return NextResponse.json({ query, results, total: results.length });
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter (q) is required' }, { status: 400 });
    }

    // Generate embedding
    const embedding = await generateEmbedding(query);
    
    if (!embedding) {
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }

    // Search using pgvector
    const { data: memories, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit * 2, // Get more for reranking
      user_id_filter: user.id,
      include_team: false,
    });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Apply H(x,ψ) scoring and filter
    let results = (memories || [])
      .filter(m => (m.confidence || 0.8) >= minConfidence)
      .filter(m => !type || m.type === type)
      .map(mem => {
        const similarity = mem.similarity || 0.7;
        const { H, decayFactor, importance, frequency } = calculateHScore(mem, similarity);
        return {
          id: mem.id,
          content: mem.content,
          type: mem.type,
          confidence: mem.confidence,
          similarity: Math.round(similarity * 100),
          hScore: {
            total: Math.round((1 - H) * 100),
            decay: Math.round(decayFactor * 100),
            importance: Math.round(importance * 100),
            frequency: Math.round(frequency * 100),
          },
          scope: mem.scope,
          createdAt: mem.created_at,
        };
      })
      .sort((a, b) => b.hScore.total - a.hScore.total)
      .slice(0, limit);

    // Track access for decay
    for (const mem of results.slice(0, 5)) {
      try {
        await supabase.rpc('track_memory_access', { memory_uuid: mem.id });
      } catch (e) {}
    }

    return NextResponse.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('Memory search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
