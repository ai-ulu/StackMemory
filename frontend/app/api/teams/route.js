import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { createLocalTeam, deleteLocalTeam, listLocalTeams } from '@/lib/dev/local-data';

/**
 * Teams API
 * 
 * Manage teams for shared/corporate memories.
 * Features:
 * - Create teams
 * - Invite members
 * - Manage roles (admin, member, viewer)
 * - Team memory sharing
 */

// GET - List user's teams
export async function GET(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const teams = await listLocalTeams(user.id);
      return NextResponse.json({ teams });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teams where user is a member
    const { data: memberships, error } = await supabase
      .from('team_members')
      .select(`
        role,
        joined_at,
        team:teams (
          id,
          name,
          description,
          avatar_url,
          created_at,
          owner_id
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ 
          teams: [],
          message: 'Teams feature requires database migration',
          migration: TEAMS_MIGRATION,
        });
      }
      throw error;
    }

    const teams = (memberships || []).map(m => ({
      ...m.team,
      role: m.role,
      joined_at: m.joined_at,
      isOwner: m.team.owner_id === user.id,
    }));

    return NextResponse.json({ teams });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new team
export async function POST(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { name, description } = body;

      if (!name || name.length < 2) {
        return NextResponse.json({ error: 'Team name required (min 2 chars)' }, { status: 400 });
      }

      const team = await createLocalTeam(user, { name, description });
      return NextResponse.json({
        team,
        message: 'Team created successfully',
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Team name required (min 2 chars)' }, { status: 400 });
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        description: description || '',
        owner_id: user.id,
      })
      .select()
      .single();

    if (teamError) {
      if (teamError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Teams table not configured',
          migration: TEAMS_MIGRATION,
        }, { status: 500 });
      }
      throw teamError;
    }

    // Add owner as admin member
    await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'admin',
      });

    return NextResponse.json({ 
      team: { ...team, role: 'admin', isOwner: true },
      message: 'Team created successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete team (owner only)
export async function DELETE(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const teamId = searchParams.get('id');

      if (!teamId) {
        return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
      }

      const deleted = await deleteLocalTeam(user.id, teamId);
      if (!deleted) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      return NextResponse.json({ success: true, message: 'Team deleted' });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('id');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Check ownership
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (!team || team.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete team (cascades to members and memories)
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Database migration SQL
const TEAMS_MIGRATION = `
-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add team_id to memories for shared memories
ALTER TABLE memories ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS teams_owner_id_idx ON teams(owner_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS memories_team_id_idx ON memories(team_id);

-- RLS Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see teams they're members of
CREATE POLICY "Users can view own teams" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- Team owners can manage their teams
CREATE POLICY "Owners can manage teams" ON teams
  FOR ALL USING (owner_id = auth.uid());

-- Users can view their memberships
CREATE POLICY "Users can view own memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage members
CREATE POLICY "Admins can manage members" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
`;
