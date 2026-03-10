import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { listMemories } from '@/lib/dev/local-data';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergentmethods.ai/v1',
});

/**
 * Natural Language Memory Query API
 * 
 * Allows users to ask questions about their memories in natural language.
 * E.g., "What do I prefer for lunch?", "When did I mention my job?"
 */

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

async function searchMemories(supabase, embedding, userId, limit = 10) {
  if (!embedding) return [];
  
  try {
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
      user_id_filter: userId,
      include_team: false,
    });

    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}

async function generateAnswer(question, memories) {
  if (memories.length === 0) {
    return {
      answer: 'Bu konuda hafızamda kayıtlı bir bilgi bulamadım.',
      confidence: 0,
      sources: [],
    };
  }

  const memoryContext = memories.map((m, i) => 
    `[${i + 1}] (${m.type}, %${Math.round((m.confidence || 0.8) * 100)}): ${m.content}`
  ).join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sen bir hafıza asistanısın. Kullanıcının hafızalarına dayanarak sorulara cevap ver.

KURALLAR:
1. Sadece verilen hafızalara dayanarak cevap ver
2. Emin değilsen bunu belirt
3. Kısa ve net cevaplar ver
4. Türkçe cevap ver

JSON formatında cevap ver:
{
  "answer": "Cevap",
  "confidence": 0.0-1.0,
  "usedMemoryIndices": [1, 2],
  "reasoning": "Açıklama"
}`
        },
        {
          role: 'user',
          content: `HAFIZALAR:\n${memoryContext}\n\nSORU: ${question}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(content);
      return {
        answer: parsed.answer,
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning,
        sources: (parsed.usedMemoryIndices || []).map(i => memories[i - 1]).filter(Boolean),
      };
    } catch {
      return { answer: content, confidence: 0.5, sources: memories.slice(0, 3) };
    }
  } catch (error) {
    return { answer: 'Cevap oluşturulurken hata oluştu.', confidence: 0, sources: [], error: error.message };
  }
}

export async function POST(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { question, limit = 10 } = body;
      if (!question) {
        return NextResponse.json({ error: 'Question is required' }, { status: 400 });
      }

      const normalized = question.toLowerCase();
      const memories = (await listMemories(user.id))
        .filter((memory) => memory.content.toLowerCase().includes(normalized))
        .slice(0, limit);

      const answer = memories.length
        ? memories.map((memory) => memory.content).join('\n')
        : 'Bu konuda hafizamda kayitli bir bilgi bulamadim.';

      return NextResponse.json({
        question,
        answer,
        confidence: memories.length ? 0.8 : 0,
        sources: memories,
        totalMemoriesSearched: memories.length,
      });
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question, limit = 10 } = body;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const embedding = await generateEmbedding(question);
    const memories = await searchMemories(supabase, embedding, user.id, limit);
    const result = await generateAnswer(question, memories);

    return NextResponse.json({ question, ...result, totalMemoriesSearched: memories.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const memories = await listMemories(user.id);
      const typeCounts = { identity: 0, preference: 0, fact: 0 };
      memories.forEach((memory) => {
        if (typeCounts[memory.type] !== undefined) {
          typeCounts[memory.type]++;
        }
      });

      const suggestions = [];
      if (typeCounts.identity > 0) suggestions.push('Benim hakkimda ne biliyorsun?', 'Meslegim ne?');
      if (typeCounts.preference > 0) suggestions.push('Tercihlerim neler?', 'Hangi kurallari tercih ediyorum?');
      if (typeCounts.fact > 0) suggestions.push('Son ogrendigim bilgiler neler?', 'Hangi proje notlari kayitli?');

      return NextResponse.json({ suggestions: suggestions.slice(0, 6), memoryCounts: typeCounts });
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: memories } = await supabase
      .from('memories')
      .select('type')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const typeCounts = { identity: 0, preference: 0, fact: 0 };
    (memories || []).forEach(m => { if (typeCounts[m.type] !== undefined) typeCounts[m.type]++; });

    const suggestions = [];
    if (typeCounts.identity > 0) suggestions.push('Benim hakkımda ne biliyorsun?', 'Mesleğim ne?');
    if (typeCounts.preference > 0) suggestions.push('En sevdiğim şeyler neler?', 'Tercihlerim neler?');
    if (typeCounts.fact > 0) suggestions.push('Son öğrendiğin bilgiler neler?', 'Geçen hafta ne konuştuk?');

    return NextResponse.json({ suggestions: suggestions.slice(0, 6), memoryCounts: typeCounts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
