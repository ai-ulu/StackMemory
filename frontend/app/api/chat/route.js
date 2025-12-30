import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getModelConfig } from '@/lib/models';
import OpenAI from 'openai';

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergentmethods.ai/v1',
});

// Generate embedding for text
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit text length
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    return null;
  }
}

// Search similar messages using vector similarity
async function searchSimilarMessages(supabase, embedding, userId, limit = 3) {
  if (!embedding) return [];
  
  try {
    // Call the RPC function for vector search
    const { data, error } = await supabase.rpc('match_messages', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id_filter: userId,
    });

    if (error) {
      console.error('Vector search error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Search error:', err);
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

  if (error) {
    console.error('Get messages error:', error);
    return [];
  }

  return data || [];
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
    const { message, conversationId, model = 'gpt-4o-mini' } = body;

    if (!message || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate embedding for user message
    const userEmbedding = await generateEmbedding(message);

    // Search for similar past messages (memories)
    const memories = await searchSimilarMessages(supabase, userEmbedding, user.id, 3);

    // Get recent conversation messages
    const recentMessages = await getRecentMessages(supabase, conversationId, 15);

    // Build system prompt with memories
    let systemPrompt = `Sen AI-ULU, kalıcı hafızaya sahip bir yapay zeka asistanısın. 
Kullanıcı ile doğal ve yardımcı bir şekilde sohbet et.
Türkçe konuş ve samimi ol.`;

    if (memories.length > 0) {
      systemPrompt += `\n\nGEÇMİŞ KONUŞMALARDAN HATIRALAR:\n`;
      memories.forEach((mem, idx) => {
        systemPrompt += `- ${mem.content}\n`;
      });
      systemPrompt += `\nBu hatıraları doğal bir şekilde kullan, gerektiğinde referans ver.`;
    }

    // Build messages array for API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Save user message to database
    const { data: userMsg, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        embedding: userEmbedding,
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('Save user message error:', userMsgError);
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

        // Send memory indicator if memories were used
        if (memories.length > 0) {
          await writer.write(encoder.encode(`data: {"memories": ${memories.length}}\n\n`));
        }

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