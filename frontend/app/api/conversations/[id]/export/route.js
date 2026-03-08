import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Export conversation
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format = 'json' } = body;

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

    // Get messages (without memory_ids for privacy)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Log export
    await supabase
      .from('access_logs')
      .insert({
        user_id: user.id,
        resource_type: 'conversation',
        resource_id: id,
        action: 'export',
        metadata: { format },
      });

    const exportData = {
      title: conversation.title,
      model: conversation.model,
      created_at: conversation.created_at,
      exported_at: new Date().toISOString(),
      messages: messages || [],
    };

    if (format === 'json') {
      return NextResponse.json(exportData);
    }

    if (format === 'markdown') {
      let markdown = `# ${conversation.title}\n\n`;
      markdown += `> Model: ${conversation.model}\n`;
      markdown += `> Created: ${new Date(conversation.created_at).toLocaleString('tr-TR')}\n\n`;
      markdown += `---\n\n`;

      for (const msg of (messages || [])) {
        const role = msg.role === 'user' ? '**You**' : '**StackMemory**';
        const time = new Date(msg.created_at).toLocaleTimeString('tr-TR');
        markdown += `### ${role} (${time})\n\n`;
        markdown += `${msg.content}\n\n`;
      }

      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${conversation.title}.md"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
