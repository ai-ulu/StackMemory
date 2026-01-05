import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all user memories
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeDeprecated = searchParams.get('includeDeprecated') === 'true';
    const includeShadow = searchParams.get('includeShadow') === 'true';

    let query = supabase
      .from('memories')
      .select('id, content, type, confidence, status, truth_type, scope, created_at, updated_at, is_shadow, conflict_with')
      .eq('user_id', user.id);

    if (!includeShadow) {
      query = query.eq('is_shadow', false);
    }

    if (!includeDeprecated) {
      query = query.neq('status', 'deprecated');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Get memories error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Memories API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new memory
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, type = 'fact', confidence = 0.8, scope = 'global' } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Validate type
    if (!['identity', 'preference', 'fact'].includes(type)) {
      return NextResponse.json({ error: 'Invalid memory type' }, { status: 400 });
    }

    // Generate embedding
    let embedding = null;
    try {
      const embedResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        embedding = embedData.embedding;
      }
    } catch (e) {
      console.error('Embedding generation failed:', e);
    }

    const { data, error } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        content,
        type,
        confidence: Math.max(0, Math.min(1, confidence)),
        status: 'active',
        truth_type: 'user_claim',
        scope,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error('Create memory error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}