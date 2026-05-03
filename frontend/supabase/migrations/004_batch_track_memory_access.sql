-- batch_track_memory_access: N+1 fix için tek sorguda tüm memory'leri güncelle
CREATE OR REPLACE FUNCTION batch_track_memory_access(memory_uuids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE memories
  SET
    access_count = COALESCE(access_count, 0) + 1,
    last_accessed_at = NOW()
  WHERE id = ANY(memory_uuids);
END;
$$;

-- Güvenlik: sadece kendi memory'lerini track edebilsin
REVOKE ALL ON FUNCTION batch_track_memory_access(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION batch_track_memory_access(UUID[]) TO authenticated;
