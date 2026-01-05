import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get memory versions (history)
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: memory, error: memError } = await supabase
      .from('memories')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (memError || !memory || memory.user_id !== user.id) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Get versions
    const { data: versions, error } = await supabase
      .from('memory_versions')
      .select('*')
      .eq('memory_id', id)
      .order('version', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(versions || []);
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Restore specific version
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { version } = body;

    if (!version) {
      return NextResponse.json({ error: 'Version number required' }, { status: 400 });
    }

    // Call restore function
    const { data, error } = await supabase.rpc('restore_memory_version', {
      memory_uuid: id,
      target_version: version,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Failed to restore version' }, { status: 400 });
    }

    // Log
    await supabase.from('access_logs').insert({
      user_id: user.id,
      resource_type: 'memory',
      resource_id: id,
      action: 'update',
      metadata: { restored_to_version: version },
    });

    return NextResponse.json({ success: true, restored_version: version });
  } catch (error) {
    console.error('Restore version error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}