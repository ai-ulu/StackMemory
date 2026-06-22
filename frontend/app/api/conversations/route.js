import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConversation, listConversations } from '@/lib/dev/local-data';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

// GET - List all conversations
export async function GET(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json(await listConversations(user.id));
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, model, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get conversations error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new conversation
export async function POST(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json().catch(() => ({}));
      const title = body.title || 'Yeni Sohbet';
      const model = body.model || 'gpt-4o-mini';
      return NextResponse.json(await createConversation(user.id, title, model));
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || 'Yeni Sohbet';
    const model = body.model || 'gpt-4o-mini';

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        model,
      })
      .select()
      .single();

    if (error) {
      console.error('Create conversation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
