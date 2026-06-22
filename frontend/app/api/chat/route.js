import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getModelConfig } from '@/lib/models';
import OpenAI from 'openai';
import { appendMessage, listMemories, updateConversation } from '@/lib/dev/local-data';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

// Lazily instantiate OpenAI client to avoid crashing on load when key is absent.
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

// Memory-First System Prompt (LOCKED)
const SYSTEM_PROMPT_BASE = `Sen StackMemory üzerinden çalışan, **hafıza öncelikli mimari** kullanan bir yapay zeka asistanısın.

TEMEL KURALLAR:
1. Hafıza bütünlüğü > Hız > Yaratıcılık
2. Emin olmadığında tahmin yapma - bunu söyle
3. Yardımcı, doğal ve profesyonel ol
4. Türkçe yanıt ver

Kullanıcıyla doğal bir sohbet yürüt.`;

// Generate embedding for text (with fallback)
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

// Quantum-Inspired Heuristic Scoring (StackMemory v2.1)
// H(x,ψ,E) = α·S + β·D + γ·I + δ·F + ε·E
// Extended with Emotional Resonance parameter
// Referans: StackMemory teknik blueprint - algoritmik detaylandırma
function calculateHScore(memory, similarity, emotionalContext = null) {
  // v2.1 Optimized weights (A/B test ready)
  const α = 0.35;  // similarity weight
  const β = 0.15;  // decay weight
  const γ = 0.25;  // importance weight
  const δ = 0.10;  // frequency weight
  const ε = 0.15;  // emotional resonance weight (NEW)

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

  // Emotional Resonance: E(x, mood)
  // Maps memory type to emotional states
  // happy → preferences boost, stressed → identity boost, focused → facts boost
  let emotionalResonance = 0.5; // neutral default
  if (emotionalContext) {
    const moodTypeMap = {
      happy: { preference: 1.0, identity: 0.7, fact: 0.5 },
      stressed: { identity: 1.0, preference: 0.5, fact: 0.7 },
      focused: { fact: 1.0, identity: 0.6, preference: 0.4 },
      curious: { fact: 0.9, preference: 0.8, identity: 0.6 },
      nostalgic: { identity: 0.9, preference: 0.9, fact: 0.5 },
      neutral: { identity: 0.7, preference: 0.7, fact: 0.7 },
    };
    const moodMap = moodTypeMap[emotionalContext] || moodTypeMap.neutral;
    emotionalResonance = moodMap[memory.type] || 0.5;
  }

  // Calculate H score (lower is better for retrieval priority)
  // Using (1 - value) to convert "higher is better" to "lower is better"
  const H = α * (1 - similarity) 
          + β * (1 - decayFactor) 
          + γ * (1 - importance) 
          + δ * (1 - frequency)
          + ε * (1 - emotionalResonance);

  return { H, decayFactor, importance, frequency, emotionalResonance };
}

// Detect emotional context from message
function detectEmotionalContext(message) {
  const lowerMessage = message.toLowerCase();
  
  const emotionPatterns = {
    happy: /mutlu|sevinç|harika|süper|güzel|eğlen|keyif|neşe|happy|joy|great|awesome/i,
    stressed: /stres|endişe|kaygı|gergin|sıkıntı|problem|sorun|stress|anxious|worried/i,
    focused: /odaklan|çalış|öğren|araştır|analiz|focus|work|study|research/i,
    curious: /merak|öğrenmek|nedir|nasıl|neden|curious|wonder|what|how|why/i,
    nostalgic: /hatırla|geçmiş|eskiden|zamanlar|remember|past|used to/i,
  };

  for (const [mood, pattern] of Object.entries(emotionPatterns)) {
    if (pattern.test(lowerMessage)) {
      return mood;
    }
  }

  return 'neutral';
}

// Search memories with quantum-inspired scoring + emotional resonance
async function searchMemories(supabase, embedding, userId, limit = 3, emotionalContext = null) {
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

    // Apply quantum-inspired scoring with emotional resonance and rerank
    const scored = (data || []).map(mem => {
      const sim = mem.similarity || 0.7;
      const { H, decayFactor, importance, frequency, emotionalResonance } = calculateHScore(mem, sim, emotionalContext);
      return { ...mem, H, decayFactor, importance, frequency, emotionalResonance, similarity: sim };
    });

    // Sort by H score (ascending - lower is better)
    scored.sort((a, b) => a.H - b.H);

    // Take top N
    const topMemories = scored.slice(0, limit);

    // Track access for decay
    // Batch track memory access (N+1 fix)
    try {
      const memoryIds = topMemories.map(m => m.id);
      await supabase.rpc('batch_track_memory_access', { memory_uuids: memoryIds });
    } catch (e) {}

    return topMemories.map(mem => ({
      ...mem,
      influence_percentage: Math.round((1 - mem.H) * 100),
      emotionalMatch: emotionalContext ? Math.round(mem.emotionalResonance * 100) : null,
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

// Auto-tag generation (client-side, fast rule-based)
function generateMemoryTags(content, type) {
  const tags = [type];
  const lower = content.toLowerCase();
  if (/kod|code|github|deploy|bug|api|veritaban|database|server|docker/.test(lower)) tags.push('technical');
  if (/para|fiyat|ödeme|budget|fatura|salary|maaş/.test(lower)) tags.push('finance');
  if (/toplantı|meeting|takvim|calendar|randevu|deadline|teslim/.test(lower)) tags.push('work');
  if (/sağlık|health|doktor|ilaç|spor|egzersiz|uyku|sleep/.test(lower)) tags.push('health');
  if (/aile|family|arkadaş|friend|sevgili|partner|çocuk|anne|baba/.test(lower)) tags.push('personal');
  if (/öğren|learn|kitap|book|kurs|course|üniversite|okul/.test(lower)) tags.push('education');
  return [...new Set(tags)];
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
        tags: generateMemoryTags(content, classification.type),
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

function scoreLocalMemory(memory, message) {
  const messageTerms = new Set(
    message
      .toLowerCase()
      .split(/[^a-zA-Z0-9_]+/)
      .filter((term) => term.length > 2)
  );

  const memoryTerms = new Set(
    (memory.content || '')
      .toLowerCase()
      .split(/[^a-zA-Z0-9_]+/)
      .filter((term) => term.length > 2)
  );

  let overlap = 0;
  for (const term of messageTerms) {
    if (memoryTerms.has(term)) {
      overlap += 1;
    }
  }

  const similarity = messageTerms.size > 0 ? overlap / messageTerms.size : 0;
  const confidence = memory.confidence || 0.8;
  const accessScore = Math.min((memory.access_count || 0) / 10, 1);
  const score = similarity * 0.6 + confidence * 0.3 + accessScore * 0.1;

  return {
    score,
    similarity,
    overlap,
  };
}

async function searchLocalMemories(userId, message, limit = 3) {
  const memories = await listMemories(userId);
  if (!memories.length) return [];

  return memories
    .map((memory) => {
      const { score, similarity, overlap } = scoreLocalMemory(memory, message);
      return {
        ...memory,
        similarity,
        overlap,
        influence_percentage: Math.round(score * 100),
      };
    })
    .filter((memory) => memory.influence_percentage >= 25)
    .sort((a, b) => b.influence_percentage - a.influence_percentage)
    .slice(0, limit);
}

export async function POST(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { message, conversationId, model = 'gpt-4o-mini' } = body;
      if (!message || !conversationId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      await appendMessage(conversationId, 'user', message);
      await updateConversation(user.id, conversationId, { model });
      const memories = await searchLocalMemories(user.id, message, 3);
      const sourceType = memories.length > 0 ? 'mixed' : 'api';
      const memoryContext = memories.length > 0
        ? `\n\nKULLANILABILECEK HAFIZA:\n${memories.map((memory, index) => {
            const reason = memory.write_reason || memory.write_source || 'Recorded context';
            return `${index + 1}. [${memory.type}] ${memory.content} (Guven: %${Math.round((memory.confidence || 0.8) * 100)}, Etki: %${memory.influence_percentage}, Kaynak: ${reason})`;
          }).join('\n')}\n\nBu baglami dogal sekilde kullan ve hangi kisimlarin proje kurali, tercih veya karar oldugunu ayirt et.`
        : '';

      const config = getModelConfig();
      const modelName = config.models[model] || config.models['gpt-4o-mini'];
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      (async () => {
        let fullResponse = '';
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            source: sourceType,
            memory_used: memories.length > 0,
            memories: memories.map((memory) => ({
              id: memory.id,
              content: memory.content,
              type: memory.type,
              influence: memory.influence_percentage || 50,
              confidence: Math.round((memory.confidence || 0.8) * 100),
              scope: memory.scope || 'private',
              source: memory.write_source || 'manual',
              reason: memory.write_reason || 'Recorded context',
              relatedContext: `Matched ${memory.overlap || 0} shared terms with the current prompt`,
            })),
          })}\n\n`));

          const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: `${SYSTEM_PROMPT_BASE}${memoryContext}` },
                { role: 'user', content: message },
              ],
              stream: true,
              temperature: 0.7,
              max_tokens: 2000,
            }),
          });

          if (!response.ok) {
            throw new Error('Model API error');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (!content) continue;
                fullResponse += content;
                await writer.write(encoder.encode(`data: {"content": ${JSON.stringify(content)}}\n\n`));
              } catch {}
            }
          }

          if (fullResponse) {
            await appendMessage(conversationId, 'assistant', fullResponse, { source_type: sourceType });
          }

          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          await writer.write(encoder.encode(`data: {"error": ${JSON.stringify(error.message)}}\n\n`));
        } finally {
          await writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

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

    // Detect emotional context from message (v2.1 Emotional Resonance)
    const emotionalContext = detectEmotionalContext(message);

    // Search for relevant memories (if not in privacy mode)
    let memories = [];
    let memoryIds = [];
    if (!privacyMode) {
      memories = await searchMemories(supabase, userEmbedding, user.id, 3, emotionalContext);
      memoryIds = memories.map(m => m.id);
    }

    // Get recent conversation messages
    const recentMessages = await getRecentMessages(supabase, conversationId, 15);

    // Build system prompt with memories
    let systemPrompt = SYSTEM_PROMPT_BASE;

    // Add emotional context hint if detected
    if (emotionalContext !== 'neutral') {
      const moodLabels = {
        happy: 'Kullanıcı mutlu görünüyor',
        stressed: 'Kullanıcı stresli görünüyor, sakin ve destekleyici ol',
        focused: 'Kullanıcı odaklanmış, direkt ve net cevaplar ver',
        curious: 'Kullanıcı meraklı, detaylı bilgi ver',
        nostalgic: 'Kullanıcı geçmişi düşünüyor',
      };
      systemPrompt += `\n\n💭 DUYGUSAL BAĞLAM: ${moodLabels[emotionalContext] || ''}`;
    }

    if (memories.length > 0) {
      systemPrompt += `\n\n🧠 HATIRLADIKLARIM:\n`;
      memories.forEach((mem, idx) => {
        const typeLabel = mem.type === 'identity' ? 'Kimlik' : mem.type === 'preference' ? 'Tercih' : 'Bilgi';
        const emotionalTag = mem.emotionalMatch ? ` (Duygusal uyum: %${mem.emotionalMatch})` : '';
        systemPrompt += `${idx + 1}. [${typeLabel}]${emotionalTag} ${mem.content}\n`;
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
            content: m.content || '',
            type: m.type,
            influence: m.influence_percentage || 50,
            confidence: Math.round((m.confidence || 0.8) * 100),
            scope: m.scope || 'private',
            source: m.write_source || 'memory',
            reason: m.write_reason || 'Recalled from prior context',
            relatedContext: m.emotionalMatch
              ? `Emotional match: %${m.emotionalMatch}`
              : `Similarity: %${Math.round((m.similarity || 0) * 100)}`,
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
