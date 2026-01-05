import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get single memory with full details
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Track access
    await supabase.rpc('track_memory_access', { memory_uuid: id });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update memory (triggers versioning)
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
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
    const { confidence, status, content, scope } = body;

    const updates = {};
    if (confidence !== undefined) {
      updates.confidence = Math.max(0, Math.min(1, confidence));
    }
    if (status && ['active', 'pending', 'deprecated'].includes(status)) {
      updates.status = status;
    }
    if (content) {
      updates.content = content;
      // Regenerate embedding for new content
      try {
        const embedResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content }),
        });
        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          updates.embedding = embedData.embedding;
        }
      } catch (e) {
        console.error('Embedding regeneration failed:', e);
      }
    }
    if (scope && ['private', 'team', 'org'].includes(scope)) {
      updates.scope = scope;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Update triggers versioning automatically via trigger
    const { data, error } = await supabase
      .from('memories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update memory error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log
    await supabase.from('access_logs').insert({
      user_id: user.id,
      resource_type: 'memory',
      resource_id: id,
      action: 'update',
      metadata: { updates: Object.keys(updates) },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Shadow delete (never hard delete)
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'User requested deletion';

    // Shadow delete - mark as shadow, never actually delete
    const { error } = await supabase
      .from('memories')
      .update({ 
        is_shadow: true,
        status: 'deprecated',
        shadow_reason: reason,
        shadowed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete memory error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log
    await supabase.from('access_logs').insert({
      user_id: user.id,
      resource_type: 'memory',
      resource_id: id,
      action: 'delete',
      metadata: { shadow_reason: reason },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Memory moved to shadow (retained but hidden)' 
    });
  } catch (error) {
    console.error('Delete memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}