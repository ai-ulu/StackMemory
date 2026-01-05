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
const SYSTEM_PROMPT_BASE = `Sen AI-ULU, **memory-first architecture** ile tasarlanmış bir yapay zeka asistanısın.

TEMEL KURALLAR (DEĞİŞTİRİLEMEZ):
1. Hafıza bütünlüğü > Hız > Yaratıcılık
2. Asla tahmin yapma, kaynak belirsizse belirt
3. Hafıza ve API çıktısını sessizce karıştırma
4. Önemsiz/çöp veriyi kaydetme
5. Her yanıtta kaynak şeffaflığı sağla

KAYNAK ETİKETLEME:
- Hafızadan gelen bilgiyi [HAFIZA] ile işaretle
- API'den geleni [API] ile işaretle
- Saf muhakemeyi [ÇIKARIM] ile işaretle

Kullanıcı ile doğal, samimi ve yardımcı bir şekilde sohbet et.
Türkçe konuş.`;

// Generate embedding for text
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    return null;
  }
}

// Search memories with confidence scoring
async function searchMemories(supabase, embedding, userId, limit = 5) {
  if (!embedding) return [];
  
  try {
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id_filter: userId,
    });

    if (error) {
      console.error('Memory search error:', error);
      return [];
    }

    // Calculate influence percentage based on similarity * confidence * recency
    return (data || []).map(mem => {
      const recency = Math.exp(-(Date.now() - new Date(mem.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000));
      const influence = Math.round(mem.similarity * mem.confidence * recency * 100);
      return {
        ...mem,
        influence_percentage: influence,
      };
    }).sort((a, b) => b.influence_percentage - a.influence_percentage);
  } catch (err) {
    console.error('Memory search error:', err);
    return [];
  }
}

// Search similar messages
async function searchSimilarMessages(supabase, embedding, userId, limit = 3) {
  if (!embedding) return [];
  
  try {
    const { data, error } = await supabase.rpc('match_messages', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id_filter: userId,
    });

    return data || [];
  } catch (err) {
    console.error('Message search error:', err);
    return [];
  }
}

// Get recent messages from conversation
async function getRecentMessages(supabase, conversationId, limit = 15) {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  return data || [];
}

// Classify if message should be stored as memory
function classifyForMemory(content) {
  const lowerContent = content.toLowerCase();
  
  // Garbage patterns - don't store
  const garbagePatterns = [
    /^(ok|tamam|evet|hayır|yes|no|hi|merhaba|selam|teşekkür|thanks)$/i,
    /^.{1,10}$/,
  ];
  
  if (garbagePatterns.some(p => p.test(content.trim()))) {
    return { shouldStore: false, type: 'garbage' };
  }
  
  // Memory candidate patterns
  const memoryPatterns = [
    { pattern: /benim.*adım|my name is|i am called/i, type: 'identity' },
    { pattern: /çalışıyorum|work.*at|job|mesleğim/i, type: 'identity' },
    { pattern: /yaşıyorum|live.*in|from|şehir/i, type: 'identity' },
    { pattern: /seviyorum|severim|tercih|like|love|prefer|favori/i, type: 'preference' },
    { pattern: /her zaman|always|usually|genellikle/i, type: 'preference' },
    { pattern: /unutma|remember|hatırla/i, type: 'fact' },
  ];
  
  for (const { pattern, type } of memoryPatterns) {
    if (pattern.test(content)) {
      return { shouldStore: true, type };
    }
  }
  
  return { shouldStore: false, type: 'normal' };
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

    // Generate embedding for user message
    const userEmbedding = await generateEmbedding(message);

    // Search for relevant memories (if not in privacy mode)
    let memories = [];
    let memoryIds = [];
    if (!privacyMode && userEmbedding) {
      memories = await searchMemories(supabase, userEmbedding, user.id, 5);
      memoryIds = memories.map(m => m.id);
    }

    // Search for similar past messages
    const similarMessages = await searchSimilarMessages(supabase, userEmbedding, user.id, 3);

    // Get recent conversation messages
    const recentMessages = await getRecentMessages(supabase, conversationId, 15);

    // Build system prompt with memories (SOURCE TRANSPARENCY)
    let systemPrompt = SYSTEM_PROMPT_BASE;

    if (memories.length > 0) {
      systemPrompt += `\n\n📚 HAFIZADAN ALINAN BİLGİLER (Güvenilirlik sıralı):\n`;
      memories.forEach((mem, idx) => {
        const typeEmoji = mem.type === 'identity' ? '👤' : mem.type === 'preference' ? '❤️' : '📌';
        systemPrompt += `${idx + 1}. ${typeEmoji} [${mem.type.toUpperCase()}] (Etki: %${mem.influence_percentage}, Güven: ${Math.round(mem.confidence * 100)}%): ${mem.content}\n`;
      });
      systemPrompt += `\nBu hafızaları DOĞAL bir şekilde kullan. Kullandığında [HAFIZA] etiketi ile belirt.`;
    }

    if (similarMessages.length > 0) {
      systemPrompt += `\n\n💬 GEÇMİŞ KONUŞMALARDAN:\n`;
      similarMessages.forEach((msg, idx) => {
        systemPrompt += `- ${msg.content.slice(0, 100)}...\n`;
      });
    }

    // Build messages array for API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Determine source type
    const sourceType = memories.length > 0 ? 'mixed' : 'api';

    // Save user message to database
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        embedding: userEmbedding,
        source_type: 'api',
        memory_ids: [],
      });

    // Store as memory if candidate (not in privacy mode)
    if (!privacyMode) {
      const classification = classifyForMemory(message);
      if (classification.shouldStore) {
        await supabase
          .from('memories')
          .insert({
            user_id: user.id,
            content: message,
            type: classification.type,
            confidence: 0.8,
            status: 'active',
            truth_type: 'user_claim',
            scope: 'global',
            embedding: userEmbedding,
          });
        console.log('[Memory] Stored new memory:', classification.type);
      }
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString(), model })
      .eq('id', conversationId);

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
            content: m.content.slice(0, 50) + '...',
            type: m.type,
            influence: m.influence_percentage,
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

        // Save assistant response to database
        if (fullResponse) {
          const assistantEmbedding = await generateEmbedding(fullResponse);
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullResponse,
              embedding: assistantEmbedding,
              source_type: sourceType,
              memory_ids: memoryIds,
            });
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