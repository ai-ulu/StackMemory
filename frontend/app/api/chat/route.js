import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getModelConfig } from '@/lib/models';
import OpenAI from 'openai';

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergentmethods.ai/v1',
});

// Memory-First System Prompt (LOCKED)
const SYSTEM_PROMPT_BASE = `Sen AI-ULU, **hafıza öncelikli mimari** ile çalışan bir yapay zeka asistanısın.

TEMEL KURALLAR:
1. Hafıza bütünlüğü > Hız > Yaratıcılık
2. Emin olmadığında tahmin yapma - bunu söyle
3. Yardımcı, doğal ve profesyonel ol
4. Türkçe yanıt ver

Kullanıcıyla doğal bir sohbet yürüt.`;

// Generate embedding for text (with fallback)
async function generateEmbedding(text) {
  try {
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

// Quantum-Inspired Heuristic Scoring (AI-ULU v2.0)
// H(x,ψ) = α·S + β·D + γ·I + δ·F
// Referans: AI-ULU Teknik Blueprint - Algoritmik Detaylandırma
function calculateHScore(memory, similarity) {
  // v2.0 Optimized weights (A/B test ready)
  const α = 0.4;  // similarity weight (reduced from 0.5)
  const β = 0.2;  // decay weight
  const γ = 0.3;  // importance weight (increased from 0.2)
  const δ = 0.1;  // frequency weight

  // Age decay (decoherence): D(x) = e^(-λ·Δt)
  const daysSinceAccess = memory.last_accessed_at 
    ? (Date.now() - new Date(memory.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
    : (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const λ = 0.02; // decay rate (configurable)
  const decayFactor = Math.exp(-λ * daysSinceAccess);

  // Importance based on type (v2.0 values)
  // Kimlik=1.0, Tercih=0.7, Bilgi=0.4
  const importanceMap = { identity: 1.0, preference: 0.7, fact: 0.4 };
  const importance = importanceMap[memory.type] || 0.4;

  // Frequency: F(x) = min(1, log(frequency) / log(F_max))
  const F_max = 100; // Maximum expected frequency
  const rawFrequency = memory.access_count || 1;
  const frequency = Math.min(1, Math.log(rawFrequency + 1) / Math.log(F_max));

  // Calculate H score (lower is better for retrieval priority)
  // Using (1 - value) to convert "higher is better" to "lower is better"
  const H = α * (1 - similarity) 
          + β * (1 - decayFactor) 
          + γ * (1 - importance) 
          + δ * (1 - frequency);

  return { H, decayFactor, importance, frequency };
}

// Search memories with quantum-inspired scoring
async function searchMemories(supabase, embedding, userId, limit = 3) {
  if (!embedding) return [];
  
  try {
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit * 2, // Get more candidates for reranking
      user_id_filter: userId,
      include_team: false,
    });

    if (error) {
      console.log('match_memories not available, using fallback');
      return await searchMemoriesFallback(supabase, userId, limit);
    }

    // Apply quantum-inspired scoring and rerank
    const scored = (data || []).map(mem => {
      const sim = mem.similarity || 0.7;
      const { H, decayFactor, importance } = calculateHScore(mem, sim);
      return { ...mem, H, decayFactor, importance, similarity: sim };
    });

    // Sort by H score (ascending - lower is better)
    scored.sort((a, b) => a.H - b.H);

    // Take top N
    const topMemories = scored.slice(0, limit);

    // Track access for decay
    for (const mem of topMemories) {
      try {
        await supabase.rpc('track_memory_access', { memory_uuid: mem.id });
      } catch (e) {}
    }

    return topMemories.map(mem => ({
      ...mem,
      influence_percentage: Math.round((1 - mem.H) * 100),
    }));
  } catch (err) {
    console.error('Memory search error:', err.message);
    return [];
  }
}

// Fallback with basic scoring
async function searchMemoriesFallback(supabase, userId, limit = 3) {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id, content, type, confidence, scope, created_at, last_accessed_at, access_count')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (error) {
      console.log('memories table not available');
      return [];
    }

    // Apply basic scoring
    const scored = (data || []).map(mem => {
      const { H, decayFactor, importance } = calculateHScore(mem, mem.confidence || 0.8);
      return { ...mem, H, decayFactor, importance };
    });

    scored.sort((a, b) => a.H - b.H);

    return scored.slice(0, limit).map(mem => ({
      ...mem,
      influence_percentage: Math.round((1 - mem.H) * 100),
    }));
  } catch (err) {
    return [];
  }
}

// Get recent messages from conversation
async function getRecentMessages(supabase, conversationId, limit = 15) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.log('messages table query error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    return [];
  }
}

// Check if user can write memory (with fallback)
async function canWriteMemory(supabase, userId) {
  try {
    const { data } = await supabase.rpc('can_write_memory', { user_uuid: userId });
    return data === true;
  } catch {
    // Fallback: check settings directly
    try {
      const { data: settings } = await supabase
        .from('memory_settings')
        .select('enabled, privacy_mode, safe_mode')
        .eq('user_id', userId)
        .single();
      
      if (!settings) return true; // Default: allow
      return settings.enabled && !settings.privacy_mode && !settings.safe_mode;
    } catch {
      return true; // Default: allow if table doesn't exist
    }
  }
}

// Classify message for memory storage
function classifyForMemory(content) {
  const lowerContent = content.toLowerCase();
  
  // Garbage patterns - don't store these
  const garbagePatterns = [
    /^(ok|okay|yes|no|hi|hello|hey|thanks|thank you|sure|right|got it|tamam|evet|hayır|merhaba|teşekkürler|selam)$/i,
    /^.{1,15}$/,
  ];
  
  if (garbagePatterns.some(p => p.test(content.trim()))) {
    return { shouldStore: false, type: 'garbage' };
  }
  
  // Memory candidate patterns with intent (Turkish + English)
  const memoryPatterns = [
    // Identity patterns
    { pattern: /benim adım|adım|ben .+ (olarak|oluyorum)|my name is|i am called/i, type: 'identity', intent: 'user_explicit' },
    { pattern: /olarak çalışıyorum|işim|mesleğim|i work|my job|profession/i, type: 'identity', intent: 'user_explicit' },
    { pattern: /yaşıyorum|şehrinde|ülkesinde|i live|i'm from|my city/i, type: 'identity', intent: 'user_explicit' },
    
    // Preference patterns
    { pattern: /severim|sevmem|tercih|hoşlanırım|hoşlanmam|i (like|love|prefer|enjoy|hate|dislike)/i, type: 'preference', intent: 'user_explicit' },
    { pattern: /favorim|her zaman|genellikle|asla|my favorite|i always|i usually|i never/i, type: 'preference', intent: 'user_explicit' },
    
    // Fact patterns
    { pattern: /unutma|hatırla|aklında tut|remember|don't forget|keep in mind/i, type: 'fact', intent: 'user_explicit' },
  ];
  
  for (const { pattern, type, intent } of memoryPatterns) {
    if (pattern.test(content)) {
      return { shouldStore: true, type, intent };
    }
  }
  
  return { shouldStore: false, type: 'normal' };
}

// Store memory with Write-Intent Guard (with fallback)
async function storeMemory(supabase, userId, content, embedding, classification) {
  if (!classification.shouldStore) return null;
  
  try {
    const { data, error } = await supabase
      .from('memories')
      .insert({
        user_id: userId,
        content,
        type: classification.type,
        confidence: 0.8,
        status: 'active',
        truth_type: 'user_claim',
        scope: 'private',
        embedding,
        language: 'tr',
        write_reason: 'Kullanıcı sohbet sırasında kişisel bilgi paylaştı',
        write_intent: classification.intent || 'auto_capture',
        write_source: 'chat',
      })
      .select('id')
      .single();

    if (error) {
      console.log('Memory store skipped:', error.message);
      return null;
    }

    console.log('[Memory] Stored:', classification.type, data?.id);
    return data;
  } catch (err) {
    console.log('Memory store error:', err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId, model = 'gpt-4o-mini', privacyMode = false } = body;

    if (!message || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check write permission
    const canWrite = await canWriteMemory(supabase, user.id);

    // Generate embedding for user message (don't fail if embedding fails)
    const userEmbedding = await generateEmbedding(message);

    // Search for relevant memories (if not in privacy mode)
    let memories = [];
    let memoryIds = [];
    if (!privacyMode) {
      memories = await searchMemories(supabase, userEmbedding, user.id, 3);
      memoryIds = memories.map(m => m.id);
    }

    // Get recent conversation messages
    const recentMessages = await getRecentMessages(supabase, conversationId, 15);

    // Build system prompt with memories
    let systemPrompt = SYSTEM_PROMPT_BASE;

    if (memories.length > 0) {
      systemPrompt += `\n\n🧠 HATIRLADIKLARIM:\n`;
      memories.forEach((mem, idx) => {
        const typeLabel = mem.type === 'identity' ? 'Kimlik' : mem.type === 'preference' ? 'Tercih' : 'Bilgi';
        systemPrompt += `${idx + 1}. [${typeLabel}] ${mem.content}\n`;
      });
      systemPrompt += `\nBu bilgileri doğal bir şekilde kullan.`;
    }

    // Build messages array for API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Determine source type
    const sourceType = memories.length > 0 ? 'mixed' : 'api';

    // Save user message to database (graceful - don't fail if table doesn't exist)
    try {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
          embedding: userEmbedding,
          source_type: 'api',
        });
    } catch (e) {
      console.log('Message save skipped:', e.message);
    }

    // Store as memory if candidate (Write-Intent Guard)
    if (canWrite && !privacyMode) {
      const classification = classifyForMemory(message);
      if (classification.shouldStore) {
        await storeMemory(supabase, user.id, message, userEmbedding, classification);
      }
    }

    // Log access (graceful)
    try {
      await supabase.from('access_logs').insert({
        user_id: user.id,
        resource_type: 'conversation',
        resource_id: conversationId,
        action: 'create',
        metadata: { 
          message_length: message.length,
          memories_used: memoryIds.length,
          privacy_mode: privacyMode,
        },
      });
    } catch (e) {
      // Ignore access log errors
    }

    // Update conversation timestamp (graceful)
    try {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString(), model })
        .eq('id', conversationId);
    } catch (e) {
      // Ignore update errors
    }

    // Get model configuration
    const config = getModelConfig();
    const modelName = config.models[model] || config.models['gpt-4o-mini'];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in background
    (async () => {
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: apiMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Model API error:', error);
          await writer.write(encoder.encode(`data: {"error": "Model API error"}\n\n`));
          await writer.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        // Send source info first (TRANSPARENCY)
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          source: sourceType,
          memory_used: memories.length > 0,
          memories: memories.map(m => ({
            id: m.id,
            content: (m.content || '').slice(0, 50) + '...',
            type: m.type,
            influence: m.influence_percentage || 50,
          })),
        })}\n\n`));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                await writer.write(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  await writer.write(encoder.encode(`data: {"content": ${JSON.stringify(content)}}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Save assistant response to database (graceful)
        if (fullResponse) {
          try {
            const assistantEmbedding = await generateEmbedding(fullResponse);
            await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullResponse,
                embedding: assistantEmbedding,
                source_type: sourceType,
              });
          } catch (e) {
            console.log('Assistant message save skipped:', e.message);
          }
        }

        await writer.close();
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write(encoder.encode(`data: {"error": "${error.message}"}\n\n`));
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
