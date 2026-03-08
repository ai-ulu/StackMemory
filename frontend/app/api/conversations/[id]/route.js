import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteConversation, getConversation, updateConversation } from '@/lib/dev/local-data';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

// GET - Get conversation with messages
export async function GET(request, { params }) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      const { id } = await params;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const conversation = await getConversation(user.id, id);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Get messages error:', msgError);
    }

    return NextResponse.json({
      ...conversation,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update conversation
export async function PUT(request, { params }) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      const { id } = await params;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { title } = body;
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      const conversation = await updateConversation(user.id, id, { title });
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update conversation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete conversation
export async function DELETE(request, { params }) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      const { id } = await params;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const deleted = await deleteConversation(user.id, id);
      if (!deleted) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete conversation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
