import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergentmethods.ai/v1',
});

/**
 * Team Memories API
 * 
 * Shared memories within a team.
 * Features:
 * - Share personal memories with team
 * - Create team-wide memories
 * - Access control based on role
 */

// GET - List team memories
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    // Get team memories
    let query = supabase
      .from('memories')
      .select(`
        id,
        content,
        type,
        confidence,
        created_at,
        user_id,
        scope
      `)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: memories, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      memories: memories || [],
      role: membership.role,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create team memory
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const body = await request.json();
    const { content, type = 'fact', shareFromPersonal, personalMemoryId } = body;

    // Check membership (only members and admins can create)
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role === 'viewer') {
      return NextResponse.json({ error: 'Write access required' }, { status: 403 });
    }

    // If sharing from personal memory
    if (shareFromPersonal && personalMemoryId) {
      const { data: personalMemory } = await supabase
        .from('memories')
        .select('*')
        .eq('id', personalMemoryId)
        .eq('user_id', user.id)
        .single();

      if (!personalMemory) {
        return NextResponse.json({ error: 'Personal memory not found' }, { status: 404 });
      }

      // Create copy for team
      const { data: teamMemory, error } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          team_id: teamId,
          content: personalMemory.content,
          type: personalMemory.type,
          confidence: personalMemory.confidence,
          embedding: personalMemory.embedding,
          status: 'active',
          scope: 'team',
          write_source: 'share',
          write_reason: `Shared from personal memory by ${user.email}`,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        memory: teamMemory,
        message: 'Memory shared with team',
      });
    }

    // Create new team memory
    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    // Generate embedding
    let embedding = null;
    try {
      const embResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content.slice(0, 8000),
      });
      embedding = embResponse.data[0].embedding;
    } catch (e) {
      console.error('Embedding error:', e);
    }

    const { data: memory, error } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        team_id: teamId,
        content,
        type,
        confidence: 0.8,
        embedding,
        status: 'active',
        scope: 'team',
        write_source: 'team',
        write_intent: 'user_explicit',
        write_reason: `Created for team by ${user.email}`,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      memory,
      message: 'Team memory created',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove team memory
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const { searchParams } = new URL(request.url);
    const memoryId = searchParams.get('memoryId');

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }

    // Check if admin or memory owner
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    const { data: memory } = await supabase
      .from('memories')
      .select('user_id')
      .eq('id', memoryId)
      .eq('team_id', teamId)
      .single();

    const isOwner = memory?.user_id === user.id;
    const isAdmin = membership?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Soft delete
    const { error } = await supabase
      .from('memories')
      .update({ status: 'deleted' })
      .eq('id', memoryId)
      .eq('team_id', teamId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Memory removed from team' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
