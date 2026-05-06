-- ============================================
-- AI-ULU Database Schema v4 - Enterprise Memory Platform
-- Memory-First + Versioning + Team + Zero Trust Security
-- ============================================
-- 
-- IMPORTANT: Run this in Supabase SQL Editor
-- This schema is designed to be idempotent (safe to run multiple times)
--
-- Prerequisites:
-- 1. Enable pgvector extension in Supabase Dashboard
-- 2. Ensure auth.users table exists (Supabase Auth)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. ORGANIZATIONS
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
-- 2. TEAMS  
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Team memory settings
  memory_sharing_enabled BOOLEAN DEFAULT TRUE,
  require_memory_approval BOOLEAN DEFAULT FALSE,
  
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TEAM MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{"canWrite": true, "canDelete": false, "canInvite": false}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================
-- 4. USER PROFILES (Extended)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  
  -- Safe Mode: read allowed, write disabled
  safe_mode BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT DEFAULT 'gpt-4o-mini',
  
  -- Visibility scope (FIREWALL)
  visibility_scope TEXT NOT NULL DEFAULT 'private' 
    CHECK (visibility_scope IN ('private', 'team', 'org', 'external')),
  
  -- Ownership transfer
  original_owner_id UUID REFERENCES auth.users(id),
  transferred_at TIMESTAMPTZ,
  
  -- Sharing
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ,
  is_shared BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  embedding vector(1536),
  
  -- Source transparency (MANDATORY)
  source_type TEXT DEFAULT 'api' CHECK (source_type IN ('memory', 'api', 'mixed')),
  memory_ids UUID[] DEFAULT '{}',
  memory_influences JSONB DEFAULT '[]', -- [{id, content_preview, influence_pct}]
  
  -- Edit tracking
  edited_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. MEMORIES (Core Asset)
-- ============================================
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  content TEXT NOT NULL,
  content_hash TEXT GENERATED ALWAYS AS (encode(sha256(content::bytea), 'hex')) STORED,
  
  -- Typed Memory (REQUIRED)
  -- Extended types: project, rule, decision, task (v2.1), insight (v3.0 brain_consolidate)
  type TEXT NOT NULL CHECK (type IN ('identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight')),
  confidence FLOAT NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'deprecated')),
  truth_type TEXT NOT NULL DEFAULT 'user_claim' CHECK (truth_type IN ('user_claim', 'verified', 'system_inferred')),
  
  -- Scope (FIREWALL)
  scope TEXT NOT NULL DEFAULT 'private' CHECK (scope IN ('private', 'team', 'org')),
  
  -- Vector embedding
  embedding vector(1536),
  
  -- Language support
  language TEXT DEFAULT 'en',
  semantic_group_id UUID, -- Cross-language alignment
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES memories(id),
  
  -- Write-Intent Guard (REQUIRED for writes)
  write_reason TEXT,
  write_intent TEXT CHECK (write_intent IN ('user_explicit', 'auto_capture', 'correction', 'merge')),
  write_source TEXT CHECK (write_source IN ('chat', 'manual', 'import', 'system')),
  
  -- Memory Decay / Freshness
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  decay_factor FLOAT DEFAULT 1.0, -- Decreases over time if unused
  
  -- Team approval flow
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Contradiction tracking
  conflict_with UUID REFERENCES memories(id),
  conflict_resolution TEXT,
  
  -- Shadow memory (deleted but retained, never surfaced)
  is_shadow BOOLEAN DEFAULT FALSE,
  shadow_reason TEXT,
  shadowed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. MEMORY VERSIONS (History)
-- ============================================
CREATE TABLE IF NOT EXISTS memory_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  
  -- Snapshot
  content TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  status TEXT NOT NULL,
  
  -- Change tracking
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  change_type TEXT CHECK (change_type IN ('create', 'update', 'restore', 'deprecate')),
  
  -- Diff from previous
  diff_summary JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(memory_id, version)
);

-- ============================================
-- 9. MEMORY SETTINGS (Per User)
-- ============================================
CREATE TABLE IF NOT EXISTS memory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Core settings
  enabled BOOLEAN DEFAULT TRUE,
  privacy_mode BOOLEAN DEFAULT FALSE, -- Stealth: no read, no write
  safe_mode BOOLEAN DEFAULT FALSE, -- Read only, no write
  auto_save BOOLEAN DEFAULT TRUE,
  
  -- Display
  show_resonance BOOLEAN DEFAULT TRUE,
  show_heatmap BOOLEAN DEFAULT TRUE,
  
  -- Language
  cross_language_memory BOOLEAN DEFAULT TRUE,
  preferred_language TEXT DEFAULT 'en',
  
  -- Decay settings
  enable_decay BOOLEAN DEFAULT TRUE,
  decay_half_life_days INTEGER DEFAULT 90,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. SHARED LINKS
-- ============================================
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Expiry & limits
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  
  -- Security
  password_hash TEXT,
  require_auth BOOLEAN DEFAULT FALSE,
  
  -- Permissions
  permissions JSONB DEFAULT '{"canCopy": true, "canExport": false}',
  
  -- Session tracking
  last_viewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. ACCESS LOGS (Full Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Resource
  resource_type TEXT NOT NULL CHECK (resource_type IN ('conversation', 'message', 'memory', 'team', 'share')),
  resource_id UUID NOT NULL,
  
  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'create', 'read', 'update', 'delete',
    'share_create', 'share_view', 'share_revoke',
    'export', 'transfer', 'approve', 'reject'
  )),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Details
  metadata JSONB DEFAULT '{}',
  
  -- Anomaly detection flag
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. RATE LIMITS
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_minutes INTEGER DEFAULT 60,
  max_requests INTEGER DEFAULT 100,
  
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- INDEXES
-- ============================================

-- Organizations & Teams
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_team ON conversations(team_id, updated_at DESC) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_share ON conversations(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_visibility ON conversations(visibility_scope);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Memories
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_team ON memories(team_id, created_at DESC) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(user_id) WHERE status = 'active' AND is_shadow = FALSE;
CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope, status);
CREATE INDEX IF NOT EXISTS idx_memories_semantic_group ON memories(semantic_group_id) WHERE semantic_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_decay ON memories(last_accessed_at, decay_factor);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Memory Versions
CREATE INDEX IF NOT EXISTS idx_memory_versions_memory ON memory_versions(memory_id, version DESC);

-- Access Logs
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_anomaly ON access_logs(is_anomaly) WHERE is_anomaly = TRUE;

-- Rate Limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON rate_limits(user_id, endpoint);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for clean re-run
DO $$ 
BEGIN
  -- Drop all policies on each table
  DROP POLICY IF EXISTS "org_members_access" ON organizations;
  DROP POLICY IF EXISTS "team_access" ON teams;
  DROP POLICY IF EXISTS "team_members_access" ON team_members;
  DROP POLICY IF EXISTS "user_profiles_access" ON user_profiles;
  DROP POLICY IF EXISTS "conversations_access" ON conversations;
  DROP POLICY IF EXISTS "messages_access" ON messages;
  DROP POLICY IF EXISTS "memories_access" ON memories;
  DROP POLICY IF EXISTS "memory_versions_access" ON memory_versions;
  DROP POLICY IF EXISTS "memory_settings_access" ON memory_settings;
  DROP POLICY IF EXISTS "shared_links_access" ON shared_links;
  DROP POLICY IF EXISTS "access_logs_access" ON access_logs;
  DROP POLICY IF EXISTS "rate_limits_access" ON rate_limits;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Organizations: members can read
CREATE POLICY "org_members_access" ON organizations FOR SELECT USING (
  id IN (
    SELECT t.org_id FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = auth.uid()
  )
);

-- Teams: members can access
CREATE POLICY "team_access" ON teams FOR ALL USING (
  id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  OR org_id IN (
    SELECT t.org_id FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
  )
);

-- Team Members: members can see team, admins can modify
CREATE POLICY "team_members_access" ON team_members FOR ALL USING (
  user_id = auth.uid() OR
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- User Profiles: own profile only
CREATE POLICY "user_profiles_access" ON user_profiles FOR ALL USING (id = auth.uid());

-- Conversations: owner + team members (respecting visibility)
CREATE POLICY "conversations_access" ON conversations FOR ALL USING (
  user_id = auth.uid() OR
  (visibility_scope IN ('team', 'org') AND team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ))
);

-- Messages: via conversation access
CREATE POLICY "messages_access" ON messages FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE
      user_id = auth.uid() OR
      (visibility_scope IN ('team', 'org') AND team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      ))
  )
);

-- Memories: scope-aware access (FIREWALL)
CREATE POLICY "memories_access" ON memories FOR ALL USING (
  -- Private: owner only
  (scope = 'private' AND user_id = auth.uid()) OR
  -- Team: team members only
  (scope = 'team' AND team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )) OR
  -- Org: org members only
  (scope = 'org' AND team_id IN (
    SELECT t.id FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = auth.uid()
  ))
);

-- Memory Versions: via memory access
CREATE POLICY "memory_versions_access" ON memory_versions FOR ALL USING (
  memory_id IN (SELECT id FROM memories WHERE user_id = auth.uid())
);

-- Memory Settings: own settings only
CREATE POLICY "memory_settings_access" ON memory_settings FOR ALL USING (user_id = auth.uid());

-- Shared Links: creator or conversation owner
CREATE POLICY "shared_links_access" ON shared_links FOR ALL USING (
  created_by = auth.uid() OR
  conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
);

-- Access Logs: own logs or admin
CREATE POLICY "access_logs_access" ON access_logs FOR SELECT USING (
  user_id = auth.uid()
);

-- Rate Limits: own limits only
CREATE POLICY "rate_limits_access" ON rate_limits FOR ALL USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_organizations_timestamp ON organizations;
CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_teams_timestamp ON teams;
CREATE TRIGGER update_teams_timestamp BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_conversations_timestamp ON conversations;
CREATE TRIGGER update_conversations_timestamp BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_memories_timestamp ON memories;
CREATE TRIGGER update_memories_timestamp BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_memory_settings_timestamp ON memory_settings;
CREATE TRIGGER update_memory_settings_timestamp BEFORE UPDATE ON memory_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON user_profiles;
CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Memory version on update
CREATE OR REPLACE FUNCTION create_memory_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.confidence IS DISTINCT FROM NEW.confidence THEN
    INSERT INTO memory_versions (memory_id, version, content, confidence, status, changed_by, change_type, diff_summary)
    VALUES (
      NEW.id,
      NEW.version,
      OLD.content,
      OLD.confidence,
      OLD.status,
      auth.uid(),
      'update',
      jsonb_build_object(
        'old_content', left(OLD.content, 100),
        'new_content', left(NEW.content, 100),
        'confidence_change', NEW.confidence - OLD.confidence
      )
    );
    NEW.version = COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS memory_versioning ON memories;
CREATE TRIGGER memory_versioning BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION create_memory_version();

-- Memory access tracking (for decay)
CREATE OR REPLACE FUNCTION track_memory_access(memory_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE memories 
  SET 
    last_accessed_at = NOW(),
    access_count = access_count + 1
  WHERE id = memory_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Memory decay calculation
CREATE OR REPLACE FUNCTION calculate_decay_factor(
  last_access TIMESTAMPTZ,
  half_life_days INTEGER DEFAULT 90
)
RETURNS FLOAT AS $$
DECLARE
  days_elapsed FLOAT;
BEGIN
  days_elapsed = EXTRACT(EPOCH FROM (NOW() - last_access)) / 86400.0;
  RETURN POWER(0.5, days_elapsed / half_life_days);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Match memories with decay and scope
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10,
  user_id_filter UUID DEFAULT NULL,
  include_team BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  type TEXT,
  confidence FLOAT,
  similarity FLOAT,
  decay_factor FLOAT,
  final_score FLOAT,
  scope TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH user_team_ids AS (
    SELECT team_id FROM team_members WHERE user_id = user_id_filter
  )
  SELECT
    m.id,
    m.content,
    m.type,
    m.confidence,
    1 - (m.embedding <=> query_embedding) as similarity,
    calculate_decay_factor(m.last_accessed_at, 90) as decay_factor,
    (1 - (m.embedding <=> query_embedding)) * m.confidence * calculate_decay_factor(m.last_accessed_at, 90) as final_score,
    m.scope,
    m.created_at
  FROM memories m
  WHERE 
    m.status = 'active'
    AND m.is_shadow = FALSE
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
    AND (
      (m.scope = 'private' AND m.user_id = user_id_filter)
      OR (include_team AND m.scope = 'team' AND m.team_id IN (SELECT team_id FROM user_team_ids))
    )
  ORDER BY final_score DESC
  LIMIT match_count;
$$;

-- Match messages
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 5,
  user_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE 
    c.user_id = user_id_filter
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Check write permission (Safe Mode + Privacy Mode)
CREATE OR REPLACE FUNCTION can_write_memory(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  settings_record RECORD;
  profile_record RECORD;
BEGIN
  -- Get user settings
  SELECT * INTO settings_record FROM memory_settings WHERE user_id = user_uuid;
  SELECT * INTO profile_record FROM user_profiles WHERE id = user_uuid;
  
  -- Check Privacy Mode (Stealth)
  IF settings_record.privacy_mode = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- Check Safe Mode
  IF settings_record.safe_mode = TRUE OR profile_record.safe_mode = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- Check if memory is enabled
  IF settings_record.enabled = FALSE THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limit check
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_uuid UUID,
  endpoint_name TEXT,
  max_req INTEGER DEFAULT 100,
  window_min INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  rate_record RECORD;
BEGIN
  SELECT * INTO rate_record 
  FROM rate_limits 
  WHERE user_id = user_uuid AND endpoint = endpoint_name;
  
  IF NOT FOUND THEN
    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start, window_minutes, max_requests)
    VALUES (user_uuid, endpoint_name, 1, NOW(), window_min, max_req);
    RETURN TRUE;
  END IF;
  
  -- Check if window expired
  IF rate_record.window_start + (rate_record.window_minutes || ' minutes')::INTERVAL < NOW() THEN
    UPDATE rate_limits 
    SET request_count = 1, window_start = NOW()
    WHERE user_id = user_uuid AND endpoint = endpoint_name;
    RETURN TRUE;
  END IF;
  
  -- Check limit
  IF rate_record.request_count >= rate_record.max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Increment
  UPDATE rate_limits 
  SET request_count = request_count + 1
  WHERE user_id = user_uuid AND endpoint = endpoint_name;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transfer conversation ownership
CREATE OR REPLACE FUNCTION transfer_conversation_ownership(
  conversation_uuid UUID,
  new_owner_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  conv_record RECORD;
BEGIN
  SELECT * INTO conv_record FROM conversations WHERE id = conversation_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verify current user is owner
  IF conv_record.user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  -- Transfer
  UPDATE conversations
  SET 
    original_owner_id = COALESCE(original_owner_id, user_id),
    user_id = new_owner_uuid,
    transferred_at = NOW()
  WHERE id = conversation_uuid;
  
  -- Log
  INSERT INTO access_logs (user_id, resource_type, resource_id, action, metadata)
  VALUES (auth.uid(), 'conversation', conversation_uuid, 'transfer', 
    jsonb_build_object('new_owner', new_owner_uuid));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore memory version
CREATE OR REPLACE FUNCTION restore_memory_version(
  memory_uuid UUID,
  target_version INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  version_record RECORD;
BEGIN
  SELECT * INTO version_record 
  FROM memory_versions 
  WHERE memory_id = memory_uuid AND version = target_version;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Restore
  UPDATE memories
  SET 
    content = version_record.content,
    confidence = version_record.confidence,
    status = version_record.status
  WHERE id = memory_uuid AND user_id = auth.uid();
  
  -- Log restoration
  INSERT INTO memory_versions (memory_id, version, content, confidence, status, changed_by, change_type)
  SELECT 
    memory_uuid,
    (SELECT MAX(version) + 1 FROM memory_versions WHERE memory_id = memory_uuid),
    version_record.content,
    version_record.confidence,
    version_record.status,
    auth.uid(),
    'restore';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON organizations TO authenticated;
GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON memories TO authenticated;
GRANT ALL ON memory_versions TO authenticated;
GRANT ALL ON memory_settings TO authenticated;
GRANT ALL ON shared_links TO authenticated;
GRANT ALL ON access_logs TO authenticated;
GRANT ALL ON rate_limits TO authenticated;

GRANT EXECUTE ON FUNCTION match_memories TO authenticated;
GRANT EXECUTE ON FUNCTION match_messages TO authenticated;
GRANT EXECUTE ON FUNCTION can_write_memory TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION track_memory_access TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_decay_factor TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_conversation_ownership TO authenticated;
GRANT EXECUTE ON FUNCTION restore_memory_version TO authenticated;

-- ============================================
-- DONE
-- ============================================
-- Schema v4 ready for enterprise deployment
