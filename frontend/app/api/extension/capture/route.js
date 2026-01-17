import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergentmethods.ai/v1',
});

/**
 * Browser Extension Capture API
 * Allows browser extension to capture content and save to AI-ULU memory.
 */

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    return null;
  }
}

async function processCapture(content, url, title) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analiz et ve JSON döndür: {"summary": "özet (max 200 char)", "type": "identity|preference|fact", "confidence": 0.8, "tags": ["tag1"], "isRelevant": true}`
        },
        {
          role: 'user',
          content: `URL: ${url}\nBaşlık: ${title}\n\n${content.slice(0, 1500)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    return { summary: content.slice(0, 200), type: 'fact', confidence: 0.6, tags: [], isRelevant: true };
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, url, title, selectedText, autoProcess = true } = await request.json();
    const textToProcess = selectedText || content;

    if (!textToProcess) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    let memoryData;
    if (autoProcess) {
      const processed = await processCapture(textToProcess, url, title);
      if (!processed.isRelevant) {
        return NextResponse.json({ success: false, message: 'Not relevant' });
      }
      memoryData = { content: processed.summary, type: processed.type, confidence: processed.confidence, tags: processed.tags };
    } else {
      memoryData = { content: textToProcess.slice(0, 500), type: 'fact', confidence: 0.7, tags: [] };
    }

    const embedding = await generateEmbedding(memoryData.content);

    const { data: memory, error: insertError } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        content: memoryData.content,
        type: memoryData.type,
        confidence: memoryData.confidence,
        status: 'active',
        truth_type: 'user_claim',
        scope: 'private',
        embedding,
        write_reason: `Captured from: ${url}`,
        write_intent: 'user_explicit',
        write_source: 'extension',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      memory: { id: memory.id, content: memory.content, type: memory.type },
      source: { url, title },
      tags: memoryData.tags,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: memories } = await supabase
      .from('memories')
      .select('type, created_at')
      .eq('user_id', user.id)
      .eq('write_source', 'extension')
      .limit(100);

    return NextResponse.json({
      connected: true,
      user: { id: user.id },
      stats: { total: memories?.length || 0 },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
