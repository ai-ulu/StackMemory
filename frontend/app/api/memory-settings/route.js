import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get memory settings
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('memory_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Get settings error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return defaults if no settings exist
    const settings = data || {
      enabled: true,
      privacy_mode: false,
      auto_save: true,
      show_resonance: true,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Memory settings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update memory settings
export async function PUT(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, privacy_mode, auto_save, show_resonance } = body;

    const updates = {
      user_id: user.id,
    };

    if (enabled !== undefined) updates.enabled = enabled;
    if (privacy_mode !== undefined) updates.privacy_mode = privacy_mode;
    if (auto_save !== undefined) updates.auto_save = auto_save;
    if (show_resonance !== undefined) updates.show_resonance = show_resonance;

    // Upsert - insert or update
    const { data, error } = await supabase
      .from('memory_settings')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Update settings error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}