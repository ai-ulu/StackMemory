# 🔍 AI-ULU: Mevcut Kod vs Yeni Spesifikasyonlar Analiz Raporu

**Analiz Tarihi:** 17 Ocak 2026  
**Hazırlayan:** OpenHands AI

---

## 📊 Genel Değerlendirme Özeti

| Kategori | Mevcut Durum | Hedef (v2.0) | Uyumluluk |
|----------|--------------|--------------|-----------|
| **H(x,ψ) Algoritması** | ✅ Temel implementasyon mevcut | Gelişmiş ağırlıklandırma | 🟡 %70 |
| **Veritabanı Şeması** | ✅ Schema v4 (Enterprise) | memories + memory_versions | 🟢 %95 |
| **Backend Proxy (API İzolasyonu)** | ✅ Next.js API Routes | Edge Functions | 🟢 %90 |
| **Memory Graph Görselleştirme** | ❌ Yok | D3.js/React-Force-Graph | 🔴 %0 |
| **Conflict Resolution UI** | 🟡 Backend mantığı var | Tam UI entegrasyonu | 🟡 %40 |
| **Local-First Mimari** | ❌ Yok | IndexedDB/SQLite WASM | 🔴 %0 |
| **Client-Side Embedding** | ❌ Yok | Transformers.js | 🔴 %0 |
| **Sync Engine** | ❌ Yok | PostgreSQL ↔ SQLite | 🔴 %0 |

---

## 1. 🧠 H(x,ψ) Algoritması

### Mevcut Durum ✅
```javascript
// /frontend/app/api/chat/route.js - Satır 39-66
function calculateHScore(memory, similarity) {
  const α = 0.5;  // similarity weight
  const β = 0.2;  // decay weight
  const γ = 0.2;  // importance weight
  const δ = 0.1;  // frequency weight

  // Age decay (decoherence): exp(-λ * days)
  const λ = 0.02;
  const decayFactor = Math.exp(-λ * daysSinceAccess);

  // Importance based on type
  const importanceMap = { identity: 0.9, preference: 0.7, fact: 0.5 };
  
  // H = α(1-sim) + β(1-decay) + γ(1-importance) + δ(1-frequency)
}
```

### Spesifikasyon Gereksinimleri
| Parametre | Mevcut | Hedef | Fark |
|-----------|--------|-------|------|
| α (Similarity) | 0.5 | **0.4** | ⚠️ Ayarlanmalı |
| β (Decay) | 0.2 | 0.2 | ✅ Eşleşiyor |
| γ (Importance) | 0.2 | **0.3** | ⚠️ Ayarlanmalı |
| δ (Frequency) | 0.1 | 0.1 | ✅ Eşleşiyor |
| identity score | 0.9 | **1.0** | ⚠️ Ayarlanmalı |
| preference score | 0.7 | 0.7 | ✅ Eşleşiyor |
| fact score | 0.5 | **0.4** | ⚠️ Ayarlanmalı |

### Eksikler
- [ ] Ağırlık katsayıları A/B testi için yapılandırılabilir olmalı
- [ ] Frequency normalizasyonu: `F(x) = min(1, log(frequency) / log(F_max))`

---

## 2. 🗄️ Veritabanı Şeması

### Mevcut Durum ✅ (Çok Kapsamlı)
```sql
-- /frontend/supabase/schema.sql - Schema v4

-- memories tablosu (Satır 134-188)
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  content_hash TEXT GENERATED ALWAYS AS (encode(sha256(content::bytea), 'hex')) STORED,
  type TEXT NOT NULL CHECK (type IN ('identity', 'preference', 'fact')),
  confidence FLOAT NOT NULL DEFAULT 0.8,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'deprecated')),
  embedding vector(1536),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  decay_factor FLOAT DEFAULT 1.0,
  conflict_with UUID REFERENCES memories(id),
  is_shadow BOOLEAN DEFAULT FALSE,
  -- ... daha fazla alan
);

-- memory_versions tablosu (Satır 193-214)
CREATE TABLE IF NOT EXISTS memory_versions (
  id UUID PRIMARY KEY,
  memory_id UUID REFERENCES memories(id),
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  status TEXT NOT NULL,
  change_type TEXT CHECK (change_type IN ('create', 'update', 'restore', 'deprecate')),
);
```

### Karşılaştırma
| Alan | Mevcut | Spesifikasyon | Durum |
|------|--------|---------------|-------|
| `embedding` boyutu | vector(1536) | vector(1536) veya vector(384) | ⚠️ 384 seçeneği eksik |
| `type` değerleri | identity/preference/fact | Kimlik/Tercih/Bilgi | ✅ Eşleşiyor |
| `last_accessed` | ✅ Var | last_used | ✅ Var (farklı isim) |
| `access_count` (frequency) | ✅ Var | frequency | ✅ Var |
| `decay_factor` | ✅ Var | Hesaplanmalı | ✅ Var |
| `memory_versions` | ✅ Var | ✅ Gerekli | ✅ Tam uyumlu |
| RLS politikaları | ✅ Kapsamlı | Zorunlu | ✅ Mevcut |

### Fonksiyonlar
```sql
-- Mevcut fonksiyonlar (Satır 248-337)
✅ calculate_decay_factor(last_access, half_life_days)
✅ match_memories(query_embedding, threshold, count, user_id, include_team)
✅ track_memory_access(memory_uuid)
✅ can_write_memory(user_uuid)
✅ restore_memory_version(memory_uuid, target_version)
```

---

## 3. 🔐 Güvenlik ve API İzolasyonu

### Mevcut Durum ✅
```javascript
// /frontend/app/api/chat/route.js
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // ✅ Sunucu tarafında
  baseURL: process.env.OPENAI_BASE_URL,
});

// JWT doğrulama (Satır 272-275)
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Karşılaştırma
| Güvenlik Özelliği | Mevcut | Spesifikasyon | Durum |
|-------------------|--------|---------------|-------|
| API Key Sunucu Tarafı | ✅ | ✅ | 🟢 Uyumlu |
| JWT Doğrulama | ✅ | ✅ | 🟢 Uyumlu |
| RLS user_id filtresi | ✅ | ✅ | 🟢 Uyumlu |
| Rate Limiting | ✅ (DB'de) | Sunucuda | 🟡 Kısmen |
| can_write_memory kontrolü | ✅ | ✅ | 🟢 Uyumlu |

---

## 4. 🕸️ Memory Graph Görselleştirme

### Mevcut Durum ❌
- **Yok** - Herhangi bir graf görselleştirme komponenti bulunmuyor
- D3.js veya React-Force-Graph kütüphaneleri yüklü değil

### Spesifikasyon Gereksinimleri
```markdown
**Gerekli Endpoint:** /api/memories/graph
**Kütüphane:** D3.js veya React-Force-Graph
**Görsel Elemanlar:**
  - Node (Hafıza): Tip bazlı renkler (Violet/Teal/Grey)
  - Node boyutu: H(x,ψ) puanına göre
  - Edge: Kosinüs Benzerliği > 0.7
  - Hover: Tam metin + S, D, I, F değerleri
```

### Gerekli Geliştirmeler
- [ ] `react-force-graph` veya `d3` paketini yükle
- [ ] `/api/memories/graph` endpoint'i oluştur
- [ ] `MemoryGraph.jsx` komponenti oluştur
- [ ] Settings sayfasına entegre et

---

## 5. ⚡ Conflict Resolution (Çelişki Çözümü)

### Mevcut Durum 🟡 (Kısmi)
```typescript
// /frontend/lib/memory/types.ts - Satır 146-184
export function checkContradiction(
  newContent: string,
  existingMemories: Memory[]
): { hasContradiction: boolean; conflictingMemory?: Memory } {
  const negationPairs = [
    ['seviyorum', 'sevmiyorum'],
    ['like', 'don\'t like'],
    // ...
  ];
  // Basit negation detection
}

// /frontend/lib/memory/client.ts - Satır 92-107
if (contradiction.hasContradiction) {
  // PENDING olarak kaydet, conflict_with bağla
  status: MEMORY_STATUS.PENDING,
  conflict_with: contradiction.conflictingMemory?.id,
}
```

### Eksikler
| Özellik | Mevcut | Spesifikasyon | Durum |
|---------|--------|---------------|-------|
| Basit çelişki tespiti | ✅ | ✅ | 🟢 |
| LLM ile çelişki analizi | ❌ | GPT-4o prompt | 🔴 Eksik |
| Kullanıcı sorgulama UI | ❌ | 3 seçenekli dialog | 🔴 Eksik |
| Status: Superseded | ❌ | memory_versions'a taşı | 🔴 Eksik |
| Kosinüs Benzerliği > 0.8 | ❌ | Tetikleyici koşul | 🔴 Eksik |

### Gerekli Prompt (Spesifikasyondan)
```
"Kullanıcı daha önce [x] demişti, şimdi [x'] diyor. 
Bu bir güncelleme mi, yoksa çelişki mi? 
Güncelleme ise [x]'i yeniden yaz, 
çelişki ise kullanıcıya sorulacak 3 seçenekli bir soru üret."
```

---

## 6. 🏠 Local-First Mimari

### Mevcut Durum ❌
- IndexedDB kullanımı yok
- SQLite WASM entegrasyonu yok
- Transformers.js (client-side embedding) yok
- Sync Engine yok

### Spesifikasyon Gereksinimleri
```markdown
1. Hassas Veri Tespiti:
   - type: identity → Yerel depolama
   - type: preference → Yerel depolama
   
2. Vektörleştirme:
   - Sadece anonimleştirilmiş embedding'ler buluta gönderilir
   
3. Teknolojiler:
   - IndexedDB veya SQLite (WASM)
   - Transformers.js (client-side embedding)
   - Sync Engine: PostgreSQL ↔ SQLite
```

### Gerekli Paketler
```bash
npm install @xenova/transformers  # Client-side embedding
npm install sql.js               # SQLite WASM
npm install @electric-sql/pglite # veya Electric SQL
```

---

## 7. 🎨 Frontend UI Eksikleri

### Chat Page (`/app/chat/page.js`)
| Özellik | Mevcut | Spesifikasyon | Durum |
|---------|--------|---------------|-------|
| NeuralResonancePanel | ✅ | Memory Badge | 🟢 Var |
| SourceBadge | ✅ | Şeffaflık | 🟢 Var |
| PrivacyMode toggle | ✅ | Gizlilik | 🟢 Var |
| Conflict Resolution uyarısı | ❌ | Dialog | 🔴 Eksik |
| Memory Graph linki | ❌ | Görselleştirme | 🔴 Eksik |

### Settings Page (`/app/settings/page.js`)
| Özellik | Mevcut | Spesifikasyon | Durum |
|---------|--------|---------------|-------|
| Memory listesi | ✅ | Hafıza Kontrol Paneli | 🟢 Var |
| Version history | ✅ | Sürüm geçmişi | 🟢 Var |
| Decay/Freshness gösterimi | ✅ | Tazelik | 🟢 Var |
| "Hafıza Depolama ve Gizlilik" bölümü | 🟡 | Local-First seçeneği | 🟡 Kısmi |
| Export/Import | ❌ | Cihaz değişiminde | 🔴 Eksik |
| Memory Graph sayfası | ❌ | Ayrı sekme | 🔴 Eksik |

---

## 8. 🚀 Öncelikli Geliştirme Listesi

### 🔴 Kritik (Hemen Yapılmalı)
1. **Memory Graph Komponenti** - Yatırımcı sunumu için şart
2. **Conflict Resolution UI** - Çelişki uyarı dialog'u
3. **H(x,ψ) Ağırlık Güncellemesi** - α=0.4, γ=0.3

### 🟡 Önemli (Sprint 1-2)
4. **Local-First Mimari Temeli** - IndexedDB + Transformers.js
5. **LLM Çelişki Analizi** - GPT-4o entegrasyonu
6. **Export/Import Özelliği** - Yerel hafızalar için

### 🟢 İyileştirme (Sprint 3+)
7. **Sync Engine** - PostgreSQL ↔ SQLite
8. **A/B Test Altyapısı** - Ağırlık optimizasyonu
9. **Zero-Knowledge Prensibi** - Tam implementasyon

---

## 9. 📁 Dosya Yapısı Önerisi

```
/frontend
├── app/
│   ├── api/
│   │   ├── memories/
│   │   │   ├── graph/           # 🆕 YENİ
│   │   │   │   └── route.js
│   │   │   └── conflicts/       # 🆕 YENİ
│   │   │       └── route.js
│   └── memory-graph/            # 🆕 YENİ
│       └── page.js
├── components/
│   ├── memory/                  # 🆕 YENİ
│   │   ├── MemoryGraph.jsx
│   │   ├── ConflictDialog.jsx
│   │   └── MemoryExportImport.jsx
├── lib/
│   ├── memory/
│   │   ├── local-store.ts       # 🆕 IndexedDB
│   │   ├── sync-engine.ts       # 🆕 Sync
│   │   └── client-embedding.ts  # 🆕 Transformers.js
```

---

## 10. 📊 Sonuç

| Metrik | Değer |
|--------|-------|
| **Toplam Uyumluluk** | ~55% |
| **Backend Hazırlığı** | ~85% |
| **Frontend Hazırlığı** | ~40% |
| **Local-First** | ~0% |
| **Tahmini Tamamlanma Süresi** | 8-10 hafta |

### Güçlü Yanlar
- ✅ Veritabanı şeması çok kapsamlı (Enterprise-ready)
- ✅ H(x,ψ) algoritması temel olarak mevcut
- ✅ Güvenlik katmanı sağlam
- ✅ Memory versioning sistemi hazır

### Zayıf Yanlar
- ❌ Görselleştirme tamamen eksik
- ❌ Local-First mimari hiç yok
- ❌ Çelişki çözümü UI'ı eksik
- ❌ Client-side compute stratejisi uygulanmamış

---

*Bu rapor, AI-ULU Teknik Blueprint v2.0 dokümanlarına göre hazırlanmıştır.*
