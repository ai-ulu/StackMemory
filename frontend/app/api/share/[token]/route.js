import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - View shared conversation
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { token } = await params;

    // Get shared link
    const { data: sharedLink, error: linkError } = await supabase
      .from('shared_links')
      .select('*, conversations(id, title, model, created_at)')
      .eq('token', token)
      .single();

    if (linkError || !sharedLink) {
      return NextResponse.json({ error: 'Shared link not found' }, { status: 404 });
    }

    // Check expiry
    if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
    }

    // Check max views
    if (sharedLink.max_views && sharedLink.view_count >= sharedLink.max_views) {
      return NextResponse.json({ error: 'Link has reached maximum views' }, { status: 410 });
    }

    // Get messages (without exposing memory_ids for security)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', sharedLink.conversation_id)
      .order('created_at', { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Increment view count
    await supabase
      .from('shared_links')
      .update({ view_count: sharedLink.view_count + 1 })
      .eq('token', token);

    return NextResponse.json({
      conversation: sharedLink.conversations,
      messages: messages || [],
      permissions: sharedLink.permissions,
      view_count: sharedLink.view_count + 1,
    });
  } catch (error) {
    console.error('View shared error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}