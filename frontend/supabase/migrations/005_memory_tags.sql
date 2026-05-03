-- =============================================
-- 005: Automatic Memory Tagging System
-- =============================================

-- 1. tags kolonu ekle
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Index for fast tag filtering
CREATE INDEX IF NOT EXISTS idx_memories_tags
  ON memories USING GIN (tags);

-- 3. auto_tag_memory: AI yerine kural tabanlı hızlı tagging
--    (embedding+AI tagging frontend'de yapılacak, bu fallback)
CREATE OR REPLACE FUNCTION auto_tag_memory(memory_content TEXT, memory_type TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result_tags TEXT[] := '{}';
  lower_content TEXT := lower(memory_content);
BEGIN
  -- Type bazlı temel tag
  result_tags := array_append(result_tags, memory_type);

  -- Kategori tespiti
  IF lower_content ~ '(kod|code|github|deploy|bug|api|veritaban|database|server|docker)' THEN
    result_tags := array_append(result_tags, 'technical');
  END IF;
  IF lower_content ~ '(para|fiyat|ödeme|budget|fatura|salary|maaş|₺|\$|€)' THEN
    result_tags := array_append(result_tags, 'finance');
  END IF;
  IF lower_content ~ '(toplantı|meeting|takvim|calendar|randevu|deadline|teslim)' THEN
    result_tags := array_append(result_tags, 'work');
  END IF;
  IF lower_content ~ '(sağlık|health|doktor|ilaç|spor|egzersiz|uyku|sleep)' THEN
    result_tags := array_append(result_tags, 'health');
  END IF;
  IF lower_content ~ '(aile|family|arkadaş|friend|sevgili|partner|çocuk|anne|baba)' THEN
    result_tags := array_append(result_tags, 'personal');
  END IF;
  IF lower_content ~ '(öğren|learn|kitap|book|kurs|course|üniversite|okul|school)' THEN
    result_tags := array_append(result_tags, 'education');
  END IF;

  RETURN result_tags;
END;
$$;

-- 4. Trigger: yeni memory eklendiğinde otomatik tag
CREATE OR REPLACE FUNCTION trigger_auto_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tags IS NULL OR array_length(NEW.tags, 1) IS NULL THEN
    NEW.tags := auto_tag_memory(NEW.content, NEW.type);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_tag_on_insert ON memories;
CREATE TRIGGER auto_tag_on_insert
  BEFORE INSERT ON memories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_tag();

-- 5. Mevcut memory'leri retroaktif tagla
UPDATE memories
SET tags = auto_tag_memory(content, type)
WHERE tags IS NULL OR array_length(tags, 1) IS NULL;
