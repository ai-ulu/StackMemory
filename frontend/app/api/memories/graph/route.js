import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';
export const dynamic = 'force-dynamic';

// H(x,ψ) calculation for node sizing
function calculateHScore(memory) {
  const α = 0.4, β = 0.2, γ = 0.3, δ = 0.1;
  const λ = 0.02;
  
  const daysSinceAccess = memory.last_accessed_at 
    ? (Date.now() - new Date(memory.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
    : (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
  
  const decayFactor = Math.exp(-λ * daysSinceAccess);
  const importanceMap = { identity: 1.0, preference: 0.7, fact: 0.4 };
  const importance = importanceMap[memory.type] || 0.4;
  const F_max = 100;
  const frequency = Math.min(1, Math.log((memory.access_count || 1) + 1) / Math.log(F_max));
  
  // Score (0-1, higher is better for display)
  const score = (decayFactor * 0.2 + importance * 0.5 + frequency * 0.1 + (memory.confidence || 0.8) * 0.2);
  
  return { score, decayFactor, importance, frequency };
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// GET - Fetch memory graph data for visualization
export async function GET(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const memories = (await listMemories(user.id)).slice(0, limit);

      if (!memories.length) {
        return NextResponse.json({ nodes: [], edges: [], stats: { total: 0 } });
      }

      const nodes = memories.map((memory) => ({
        id: memory.id,
        content: memory.content,
        contentPreview: memory.content.length > 100 ? `${memory.content.slice(0, 100)}...` : memory.content,
        type: memory.type,
        confidence: memory.confidence,
        hScore: {
          total: Math.round((memory.confidence || 0.8) * 100),
          decay: 100,
          importance: 100,
          frequency: Math.min(100, (memory.access_count || 0) * 10),
        },
        size: 10,
        color: getTypeColor(memory.type),
        accessCount: memory.access_count || 0,
        lastAccessed: memory.last_accessed_at,
        createdAt: memory.created_at,
      }));

      return NextResponse.json({
        nodes,
        edges: [],
        stats: {
          total: nodes.length,
          byType: {
            identity: nodes.filter((node) => node.type === 'identity').length,
            preference: nodes.filter((node) => node.type === 'preference').length,
            fact: nodes.filter((node) => node.type === 'fact').length,
          },
          connections: 0,
          avgConfidence: Math.round(nodes.reduce((sum, node) => sum + node.confidence, 0) / nodes.length * 100),
          avgHScore: Math.round(nodes.reduce((sum, node) => sum + node.hScore.total, 0) / nodes.length),
        },
      });
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.7');

    // Fetch user's top memories with embeddings
    const { data: memories, error } = await supabase
      .from('memories')
      .select(`
        id, content, type, confidence, status,
        embedding, last_accessed_at, access_count,
        created_at, decay_factor
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('is_shadow', false)
      .order('last_accessed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Fetch memories error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!memories || memories.length === 0) {
      return NextResponse.json({ nodes: [], edges: [], stats: { total: 0 } });
    }

    // Build nodes with H(x,ψ) scores
    const nodes = memories.map(memory => {
      const { score, decayFactor, importance, frequency } = calculateHScore(memory);
      
      return {
        id: memory.id,
        content: memory.content,
        contentPreview: memory.content.length > 100 
          ? memory.content.slice(0, 100) + '...' 
          : memory.content,
        type: memory.type,
        confidence: memory.confidence,
        // H(x,ψ) components for tooltip
        hScore: {
          total: Math.round(score * 100),
          decay: Math.round(decayFactor * 100),
          importance: Math.round(importance * 100),
          frequency: Math.round(frequency * 100),
        },
        // Visual properties
        size: 5 + score * 15, // Node size based on score (5-20)
        color: getTypeColor(memory.type),
        accessCount: memory.access_count || 0,
        lastAccessed: memory.last_accessed_at,
        createdAt: memory.created_at,
      };
    });

    // Build edges based on cosine similarity
    const edges = [];
    const memoriesWithEmbeddings = memories.filter(m => m.embedding && m.embedding.length > 0);
    
    for (let i = 0; i < memoriesWithEmbeddings.length; i++) {
      for (let j = i + 1; j < memoriesWithEmbeddings.length; j++) {
        const similarity = cosineSimilarity(
          memoriesWithEmbeddings[i].embedding,
          memoriesWithEmbeddings[j].embedding
        );
        
        if (similarity >= minSimilarity) {
          edges.push({
            source: memoriesWithEmbeddings[i].id,
            target: memoriesWithEmbeddings[j].id,
            similarity: Math.round(similarity * 100),
            // Edge width based on similarity (1-5)
            width: 1 + (similarity - minSimilarity) / (1 - minSimilarity) * 4,
          });
        }
      }
    }

    // Calculate stats
    const stats = {
      total: nodes.length,
      byType: {
        identity: nodes.filter(n => n.type === 'identity').length,
        preference: nodes.filter(n => n.type === 'preference').length,
        fact: nodes.filter(n => n.type === 'fact').length,
      },
      connections: edges.length,
      avgConfidence: Math.round(
        nodes.reduce((sum, n) => sum + n.confidence, 0) / nodes.length * 100
      ),
      avgHScore: Math.round(
        nodes.reduce((sum, n) => sum + n.hScore.total, 0) / nodes.length
      ),
    };

    return NextResponse.json({ nodes, edges, stats });
  } catch (error) {
    console.error('Memory graph API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get color based on memory type (matching Blueprint specs)
function getTypeColor(type) {
  const colors = {
    identity: '#8B5CF6',   // Violet
    preference: '#14B8A6', // Teal
    fact: '#6B7280',       // Grey
  };
  return colors[type] || colors.fact;
}
