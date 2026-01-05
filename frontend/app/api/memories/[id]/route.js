import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get single memory
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update memory
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confidence, status, content } = body;

    const updates = {};
    if (confidence !== undefined) {
      updates.confidence = Math.max(0, Math.min(1, confidence));
    }
    if (status && ['active', 'pending', 'deprecated'].includes(status)) {
      updates.status = status;
    }
    if (content) {
      updates.content = content;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Shadow delete memory (mark as shadow, never hard delete)
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Shadow delete - mark as shadow, never actually delete
    const { error } = await supabase
      .from('memories')
      .update({ 
        is_shadow: true,
        status: 'deprecated',
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete memory error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Memory moved to shadow' });
  } catch (error) {
    console.error('Delete memory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}