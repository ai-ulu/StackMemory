import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Create share link for conversation
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, expiresIn, maxViews, permissions } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomUUID().replace(/-/g, '');
    
    // Calculate expiry
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    }

    // Create shared link
    const { data: sharedLink, error: linkError } = await supabase
      .from('shared_links')
      .insert({
        conversation_id: conversationId,
        created_by: user.id,
        token,
        expires_at: expiresAt,
        max_views: maxViews || null,
        permissions: permissions || { canCopy: true, canExport: false },
      })
      .select()
      .single();

    if (linkError) {
      console.error('Create share link error:', linkError);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        is_shared: true,
        share_token: token,
        share_expires_at: expiresAt,
      })
      .eq('id', conversationId);

    // Log access
    await supabase
      .from('access_logs')
      .insert({
        user_id: user.id,
        resource_type: 'conversation',
        resource_id: conversationId,
        action: 'share_created',
        metadata: { token, expires_at: expiresAt },
      });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`;

    return NextResponse.json({
      ...sharedLink,
      share_url: shareUrl,
    });
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Revoke share link
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Delete shared link
    const { error } = await supabase
      .from('shared_links')
      .delete()
      .eq('token', token)
      .eq('created_by', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete share error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}