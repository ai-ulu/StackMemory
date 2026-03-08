import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { createMemory, listMemories } from '@/lib/dev/local-data';

// GET - List all user memories with filters
export async function GET(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const data = await listMemories(user.id, {
        includeDeprecated: searchParams.get('includeDeprecated') === 'true',
        includeShadow: searchParams.get('includeShadow') === 'true',
        type: searchParams.get('type') || undefined,
        scope: searchParams.get('scope') || undefined,
      });
      return NextResponse.json(data);
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeDeprecated = searchParams.get('includeDeprecated') === 'true';
    const includeShadow = searchParams.get('includeShadow') === 'true';
    const type = searchParams.get('type');
    const scope = searchParams.get('scope');

    let query = supabase
      .from('memories')
      .select(`
        id, content, type, confidence, status, truth_type, scope,
        language, version, decay_factor, last_accessed_at, access_count,
        write_reason, write_intent, write_source,
        is_shadow, conflict_with, requires_approval,
        created_at, updated_at
      `)
      .eq('user_id', user.id);

    if (!includeShadow) {
      query = query.eq('is_shadow', false);
    }

    if (!includeDeprecated) {
      query = query.neq('status', 'deprecated');
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (scope) {
      query = query.eq('scope', scope);
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

// POST - Create new memory with Write-Intent Guard
export async function POST(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const {
        content,
        type = 'fact',
        confidence = 0.8,
        scope = 'private',
        write_reason,
        write_intent = 'user_explicit',
        write_source = 'manual',
      } = body;

      if (!content) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
      }

      if (!['identity', 'preference', 'fact'].includes(type)) {
        return NextResponse.json({ error: 'Invalid memory type' }, { status: 400 });
      }

      if (!['user_explicit', 'auto_capture', 'correction', 'merge'].includes(write_intent)) {
        return NextResponse.json({ error: 'Invalid write_intent' }, { status: 400 });
      }

      const data = await createMemory(user.id, {
        content,
        type,
        confidence: Math.max(0, Math.min(1, confidence)),
        scope,
        write_reason,
        write_intent,
        write_source,
      });
      return NextResponse.json(data);
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check write permission
    const { data: canWrite } = await supabase.rpc('can_write_memory', { user_uuid: user.id });
    if (!canWrite) {
      return NextResponse.json({ 
        error: 'Write disabled. Check Safe Mode or Privacy Mode settings.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      content, 
      type = 'fact', 
      confidence = 0.8, 
      scope = 'private',
      // Write-Intent Guard (REQUIRED)
      write_reason,
      write_intent = 'manual',
      write_source = 'manual',
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Validate type
    if (!['identity', 'preference', 'fact'].includes(type)) {
      return NextResponse.json({ error: 'Invalid memory type' }, { status: 400 });
    }

    // Validate write-intent
    if (!['user_explicit', 'auto_capture', 'correction', 'merge'].includes(write_intent)) {
      return NextResponse.json({ error: 'Invalid write_intent' }, { status: 400 });
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
        language: 'en',
        // Write-Intent Guard
        write_reason: write_reason || 'Manual memory creation',
        write_intent,
        write_source,
      })
      .select()
      .single();

    if (error) {
      console.error('Create memory error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log
    await supabase.from('access_logs').insert({
      user_id: user.id,
      resource_type: 'memory',
      resource_id: data.id,
      action: 'create',
      metadata: { type, scope, write_intent },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
