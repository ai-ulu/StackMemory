-- AI-ULU Database Schema v2 - Memory-First Architecture
-- Run this in your Supabase SQL Editor

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Yeni Sohbet',
  model TEXT DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE (with embeddings)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  embedding vector(1536),
  -- Source tracking for transparency
  source_type TEXT DEFAULT 'api' CHECK (source_type IN ('memory', 'api', 'mixed')),
  memory_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMORIES TABLE (Memory-First Architecture)
-- ============================================
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  
  -- Typed Memory (REQUIRED)
  type TEXT NOT NULL CHECK (type IN ('identity', 'preference', 'fact')),
  confidence FLOAT NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'deprecated')),
  truth_type TEXT NOT NULL DEFAULT 'user_claim' CHECK (truth_type IN ('user_claim', 'verified', 'system_inferred')),
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'session', 'temp')),
  
  -- Vector embedding
  embedding vector(1536),
  
  -- Contradiction tracking
  conflict_with UUID REFERENCES memories(id),
  
  -- Shadow memory (deleted but retained)
  is_shadow BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMORY SETTINGS TABLE (per user)
-- ============================================
CREATE TABLE IF NOT EXISTS memory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  privacy_mode BOOLEAN DEFAULT FALSE,
  auto_save BOOLEAN DEFAULT TRUE,
  show_resonance BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Memories
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_user_active ON memories(user_id, status) WHERE status = 'active' AND is_shadow = FALSE;
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own conversations" ON conversations;
DROP POLICY IF EXISTS "Users access own messages" ON messages;
DROP POLICY IF EXISTS "Users manage own memories" ON memories;
DROP POLICY IF EXISTS "Users manage own memory_settings" ON memory_settings;

-- Create policies
CREATE POLICY "Users manage own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users access own messages"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own memories"
  ON memories FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own memory_settings"
  ON memory_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Match messages (for conversation context)
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

-- Match memories (for memory-first retrieval)
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
  WHERE m.user_id = user_id_filter
    AND m.status = 'active'
    AND m.is_shadow = FALSE
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
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

DROP TRIGGER IF EXISTS update_memory_settings_updated_at ON memory_settings;
CREATE TRIGGER update_memory_settings_updated_at
    BEFORE UPDATE ON memory_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON memories TO authenticated;
GRANT ALL ON memory_settings TO authenticated;
GRANT EXECUTE ON FUNCTION match_messages TO authenticated;
GRANT EXECUTE ON FUNCTION match_memories TO authenticated;