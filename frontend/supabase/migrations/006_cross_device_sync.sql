-- =============================================
-- 006: Cross-Device Sync Visibility
-- =============================================

-- 1. user_devices: kayıtlı cihazlar
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,          -- client-generated fingerprint
  device_name TEXT NOT NULL,        -- "iPhone 15", "MacBook Pro", "Chrome / Windows"
  device_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'browser', 'cli', 'unknown')),
  platform TEXT,                    -- "iOS", "Android", "macOS", "Windows", "Linux"
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_trusted BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, device_id)
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own devices" ON user_devices
  FOR ALL USING (auth.uid() = user_id);

-- 2. sync_log: hangi cihazdan ne sync'lendi
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  memories_pushed INTEGER DEFAULT 0,   -- local -> remote
  memories_pulled INTEGER DEFAULT 0,   -- remote -> local
  conflicts_resolved INTEGER DEFAULT 0,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'partial', 'error')),
  error_message TEXT
);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sync logs" ON sync_log
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sync_log_user_device
  ON sync_log(user_id, device_id, synced_at DESC);

-- 3. memories tablosuna device_id ekle (hangi cihazdan geldi)
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS source_device_id TEXT;

-- 4. get_device_sync_summary: son sync durumunu göster
CREATE OR REPLACE FUNCTION get_device_sync_summary(p_user_id UUID)
RETURNS TABLE (
  device_id TEXT,
  device_name TEXT,
  device_type TEXT,
  last_seen_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  total_memories_synced BIGINT,
  is_trusted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.device_id,
    d.device_name,
    d.device_type,
    d.last_seen_at,
    MAX(s.synced_at) AS last_sync_at,
    COALESCE(SUM(s.memories_pushed + s.memories_pulled), 0) AS total_memories_synced,
    d.is_trusted
  FROM user_devices d
  LEFT JOIN sync_log s ON s.device_id = d.device_id AND s.user_id = d.user_id
  WHERE d.user_id = p_user_id
  GROUP BY d.device_id, d.device_name, d.device_type, d.last_seen_at, d.is_trusted
  ORDER BY d.last_seen_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_device_sync_summary(UUID) TO authenticated;
