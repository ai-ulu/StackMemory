-- AI-ULU Database Schema v3 - Enterprise Edition
-- Memory-First + Team + Security Architecture

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================
-- CONVERSATIONS TABLE (Updated)
-- ============================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Yeni Sohbet',
  model TEXT DEFAULT 'gpt-4o-mini',
  
  -- Visibility scope
  visibility_scope TEXT NOT NULL DEFAULT 'private' 
    CHECK (visibility_scope IN ('private', 'team', 'org', 'external')),
  
  -- Sharing
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ,
  is_shared BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE (Updated)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  embedding vector(1536),
  
  -- Source tracking for transparency
  source_type TEXT DEFAULT 'api' CHECK (source_type IN ('memory', 'api', 'mixed')),
  memory_ids TEXT[] DEFAULT '{}',
  
  -- Audit
  edited_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMORIES TABLE (Updated)
-- ============================================
DROP TABLE IF EXISTS memories CASCADE;

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  content TEXT NOT NULL,
  
  -- Typed Memory
  type TEXT NOT NULL CHECK (type IN ('identity', 'preference', 'fact')),
  confidence FLOAT NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'deprecated')),
  truth_type TEXT NOT NULL DEFAULT 'user_claim' CHECK (truth_type IN ('user_claim', 'verified', 'system_inferred')),
  
  -- Scope
  scope TEXT NOT NULL DEFAULT 'private' CHECK (scope IN ('private', 'team', 'org')),
  
  -- Vector embedding
  embedding vector(1536),
  
  -- Language tag
  language TEXT DEFAULT 'tr',
  
  -- Approval for shared memories
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Contradiction tracking
  conflict_with UUID REFERENCES memories(id),
  
  -- Shadow memory (deleted but retained)
  is_shadow BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMORY SETTINGS TABLE
-- ============================================
DROP TABLE IF EXISTS memory_settings CASCADE;

CREATE TABLE memory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  privacy_mode BOOLEAN DEFAULT FALSE,
  auto_save BOOLEAN DEFAULT TRUE,
  show_resonance BOOLEAN DEFAULT TRUE,
  cross_language_memory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHARED LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  max_views INTEGER,
  permissions JSONB DEFAULT '{"canCopy": true, "canExport": false}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACCESS LOGS TABLE (Audit)
-- ============================================
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_team ON conversations(team_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_share ON conversations(share_token) WHERE share_token IS NOT NULL;

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Memories
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_team ON memories(team_id, created_at DESC) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(user_id, status) WHERE status = 'active' AND is_shadow = FALSE;
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Teams
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- Access logs
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs(resource_type, resource_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_conversations" ON conversations;
DROP POLICY IF EXISTS "users_own_messages" ON messages;
DROP POLICY IF EXISTS "users_own_memories" ON memories;
DROP POLICY IF EXISTS "users_own_settings" ON memory_settings;

-- Conversations policies
CREATE POLICY "users_own_conversations" ON conversations FOR ALL USING (
  user_id = auth.uid() OR
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- Messages policies  
CREATE POLICY "users_own_messages" ON messages FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE 
      user_id = auth.uid() OR
      team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  )
);

-- Memories policies
CREATE POLICY "users_own_memories" ON memories FOR ALL USING (
  user_id = auth.uid() OR
  (scope = 'team' AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())) OR
  (scope = 'org' AND team_id IN (
    SELECT t.id FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.user_id = auth.uid()
  ))
);

-- Memory settings policies
CREATE POLICY "users_own_settings" ON memory_settings FOR ALL USING (user_id = auth.uid());

-- Team members policies
CREATE POLICY "team_members_access" ON team_members FOR ALL USING (
  user_id = auth.uid() OR
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Shared links policies
CREATE POLICY "shared_links_access" ON shared_links FOR ALL USING (
  created_by = auth.uid() OR
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Match messages
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.user_id = user_id_filter
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Match memories (with scope support)
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  confidence float,
  similarity float,
  created_at timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    m.id,
    m.content,
    m.type,
    m.confidence,
    1 - (m.embedding <=> query_embedding) as similarity,
    m.created_at
  FROM memories m
  WHERE (
    m.user_id = user_id_filter OR
    (m.scope = 'team' AND m.team_id IN (SELECT team_id FROM team_members WHERE user_id = user_id_filter))
  )
    AND m.status = 'active'
    AND m.is_shadow = FALSE
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT encode(gen_random_bytes(16), 'hex');
$$;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
CREATE TRIGGER update_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON organizations TO authenticated;
GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON memories TO authenticated;
GRANT ALL ON memory_settings TO authenticated;
GRANT ALL ON shared_links TO authenticated;
GRANT ALL ON access_logs TO authenticated;
GRANT EXECUTE ON FUNCTION match_messages TO authenticated;
GRANT EXECUTE ON FUNCTION match_memories TO authenticated;
GRANT EXECUTE ON FUNCTION generate_share_token TO authenticated;