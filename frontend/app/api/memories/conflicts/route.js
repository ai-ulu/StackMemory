import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

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

// LLM-based conflict analysis (Blueprint spec)
async function analyzeConflict(oldContent, newContent) {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return {
        type: 'conflict',
        analysis: 'OpenAI key not configured',
        options: [newContent, oldContent, `${oldContent} ve ayrıca ${newContent}`],
      };
    }
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sen bir hafıza çelişkisi analiz uzmanısın. Kullanıcının eski ve yeni ifadelerini karşılaştır.
          
Görevin:
1. Bu bir güncelleme mi (bilgi değişti) yoksa gerçek bir çelişki mi (iki bilgi aynı anda doğru olamaz) belirle.
2. Güncelleme ise, güncellenmiş birleşik bir cümle öner.
3. Çelişki ise, kullanıcıya sorulacak 3 seçenek üret.

JSON formatında yanıt ver:
{
  "type": "update" | "conflict",
  "analysis": "kısa açıklama",
  "mergedContent": "birleştirilmiş içerik (sadece update için)",
  "options": ["seçenek 1", "seçenek 2", "seçenek 3"] (sadece conflict için)
}`
        },
        {
          role: 'user',
          content: `Eski bilgi: "${oldContent}"
Yeni bilgi: "${newContent}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Conflict analysis error:', error);
    return {
      type: 'conflict',
      analysis: 'Analiz yapılamadı',
      options: [newContent, oldContent, `${oldContent} ve ayrıca ${newContent}`],
    };
  }
}

// POST - Analyze and detect conflicts
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, oldMemoryId, newContent, resolution } = body;

    // Action: detect - Check for conflicts before saving
    if (action === 'detect') {
      // Generate embedding for new content
      let embedding = null;
      try {
        const embedResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: newContent.slice(0, 8000),
        });
        embedding = embedResponse.data[0].embedding;
      } catch (e) {
        console.error('Embedding error:', e);
      }

      // Search for similar memories (potential conflicts)
      if (embedding) {
        const { data: similar, error } = await supabase.rpc('match_memories', {
          query_embedding: embedding,
          match_threshold: 0.8, // High threshold for conflict detection
          match_count: 5,
          user_id_filter: user.id,
          include_team: false,
        });

        if (!error && similar && similar.length > 0) {
          // Analyze each potential conflict with LLM
          for (const mem of similar) {
            const analysis = await analyzeConflict(mem.content, newContent);
            
            if (analysis.type === 'conflict' || analysis.type === 'update') {
              return NextResponse.json({
                hasConflict: true,
                conflictingMemory: {
                  id: mem.id,
                  content: mem.content,
                  type: mem.type,
                  similarity: mem.similarity,
                },
                analysis,
              });
            }
          }
        }
      }

      return NextResponse.json({ hasConflict: false });
    }

    // Action: resolve - Apply conflict resolution
    if (action === 'resolve') {
      if (!resolution || !resolution.type) {
        return NextResponse.json({ error: 'Resolution type required' }, { status: 400 });
      }

      const { type: resolutionType, newContent: resolvedContent } = resolution;

      switch (resolutionType) {
        case 'update':
          // Move old memory to versions, update with new content
          if (oldMemoryId) {
            // Get current memory
            const { data: oldMemory } = await supabase
              .from('memories')
              .select('*')
              .eq('id', oldMemoryId)
              .single();

            if (oldMemory) {
              // Create version record
              await supabase.from('memory_versions').insert({
                memory_id: oldMemoryId,
                version: oldMemory.version || 1,
                content: oldMemory.content,
                confidence: oldMemory.confidence,
                status: 'superseded',
                changed_by: user.id,
                change_type: 'update',
              });

              // Update memory with new content
              const { data: updated, error } = await supabase
                .from('memories')
                .update({
                  content: resolvedContent || newContent,
                  version: (oldMemory.version || 1) + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', oldMemoryId)
                .select()
                .single();

              if (error) throw error;
              return NextResponse.json({ success: true, memory: updated, action: 'updated' });
            }
          }
          break;

        case 'keep_old':
          // Don't save new memory, keep old one
          return NextResponse.json({ success: true, action: 'kept_old' });

        case 'keep_both':
          // Save new memory as separate entry
          const { data: newMem, error: insertError } = await supabase
            .from('memories')
            .insert({
              user_id: user.id,
              content: resolvedContent || newContent,
              type: 'fact',
              confidence: 0.8,
              status: 'active',
              truth_type: 'user_claim',
              scope: 'private',
              write_reason: 'Conflict resolution - kept both',
              write_intent: 'user_explicit',
              write_source: 'manual',
            })
            .select()
            .single();

          if (insertError) throw insertError;
          return NextResponse.json({ success: true, memory: newMem, action: 'kept_both' });

        case 'custom':
          // Update old memory with custom content
          if (oldMemoryId && resolvedContent) {
            const { data: customUpdated, error: customError } = await supabase
              .from('memories')
              .update({
                content: resolvedContent,
                updated_at: new Date().toISOString(),
              })
              .eq('id', oldMemoryId)
              .select()
              .single();

            if (customError) throw customError;
            return NextResponse.json({ success: true, memory: customUpdated, action: 'custom' });
          }
          break;

        default:
          return NextResponse.json({ error: 'Invalid resolution type' }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Conflict API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - List pending conflicts
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get memories with pending conflicts
    const { data: conflicts, error } = await supabase
      .from('memories')
      .select(`
        id, content, type, confidence, status,
        conflict_with, created_at
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .not('conflict_with', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch conflicting memories
    const conflictsWithDetails = await Promise.all(
      (conflicts || []).map(async (conflict) => {
        const { data: conflictingMemory } = await supabase
          .from('memories')
          .select('id, content, type, created_at')
          .eq('id', conflict.conflict_with)
          .single();

        return {
          ...conflict,
          conflictingMemory,
        };
      })
    );

    return NextResponse.json(conflictsWithDetails);
  } catch (error) {
    console.error('Get conflicts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
