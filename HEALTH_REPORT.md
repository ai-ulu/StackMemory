# StackMemory — Sağlık Raporu

> Tarih: 2026-06-22 · Mod: local · Yöntem: çalışan dev server üzerinde canlı smoke test + statik analiz

## 🎯 Yönetici Özeti

Proje **çürük değil, dağınık ve test edilmemiş**. Çekirdek hafıza katmanı (memory CRUD + arama + kalıcılık) local modda çalışıyor. Sorunlar **birkaç tekrar eden, mekanik bug** ve **ölü kod** ile sınırlı — mimari sağlam.

| Gösterge | Durum |
|----------|-------|
| Çekirdek memory akışı (create/list/search/graph) | 🟢 Çalışıyor |
| Disk kalıcılığı (`.local-dev/store.json`) | 🟢 Çalışıyor |
| Header-auth (çoklu-araç / MCP temeli) | 🟡 Route'ların yarısında kırık |
| OpenAI-modül crash bug'ı | 🟡 6 route (1'i düzeltildi) |
| SaaS route'ları (billing/stripe/encryption…) | ⚪ Kapsam dışı (Faz D) |
| Python backend (106 dosya) | 🔴 Ölü kod |
| MCP server | 🔴 `src/` boş, işlevsiz |

**Sonuç:** Yerinde sağlamlaştırma en efektif yol. Tahmini çekirdek düzeltme: küçük-orta.

---

## 1. Frontend API Route Sağlığı (40 route)

### 🟢 Çalışan çekirdek (header-auth ile 200)
`/health` · `/memories` (GET/POST) · `/memories/[id]` · `/memories/graph` · `/memories/search` · `/memories/query`*

\* `query` GET'te OpenAI-crash bug'ı var (aşağıda).

### 🟡 BUG A — Header-auth kırık (10 route)
`getLocalRequestUser()` çağrısına `request` argümanı **geçilmemiş**. Sonuç: tarayıcı cookie'siyle çalışır ama **header ile (curl/MCP/dış araç) 401 döner**. Bu, çoklu-araç ortak hafıza hedefinin önündeki en kritik engel.

Etkilenen: `/conversations`, `/conversations/[id]`, `/keys`, `/keys/[id]`, `/teams`, `/teams/[id]/members`, `/teams/[id]/memories`, `/share`, `/chat`, `/memory-settings`

**Düzeltme:** `getLocalRequestUser()` → `getLocalRequestUser(request)`. Mekanik, düşük risk.

### 🟡 BUG B — OpenAI-modül crash (6 route)
Modül seviyesinde `new OpenAI({apiKey: process.env.OPENAI_API_KEY})`. Key yokken route **yüklenirken 500** verir (local mode kolu OpenAI kullanmasa bile).

Etkilenen: `/chat`, `/embed`, `/extension/capture`, `/memories/conflicts`, `/memories/query`, `/teams/[id]/memories`
Düzeltilen: `/memories/search` ✅ (lazy-init pattern — diğerlerine de aynısı uygulanacak)

**Düzeltme:** Client'ı lazy yap (search'te uygulanan pattern). Mekanik.

### ⚪ SaaS route'ları — kapsam dışı (kişisel kullanımda gerekmiyor)
`/billing/*`, `/stripe/*`, `/webhooks/*`, `/encryption/*`, `/marketplace`, `/usage/summary`, `/auth/callback`, `/context/compile`, `/orchestrate`, `/memories/import|export|versions`, `/extension/capture`

Bunlar Supabase/Stripe gerektirir; Faz D (SaaS) için saklanmalı, şimdi dokunulmamalı.

---

## 2. Diğer Bileşenler

| Bileşen | Dosya | Durum | Öneri |
|---------|-------|-------|-------|
| **frontend** | — | 🟢 Çekirdek çalışıyor | KORU + düzelt |
| **backend** (FastAPI+Mongo) | 106 | 🔴 Ölü: frontend referans vermiyor, docker-compose'da yok | SİL |
| **mcp-server** | 3 | 🔴 `src/` boş, işlevsiz | Faz C'de yeniden yaz |
| **chrome-extension** | 4 | ⚪ Test edilmedi | Faz B'de değerlendir |
| **bridge** | 1 | ⚪ Minimal, test edilmedi | Faz C'de MCP ile değerlendir |
| **bots** (slack/discord/tg) | 8 | ⚪ Opsiyonel | Ertele |
| **sdk** | 5 | ⚪ Test edilmedi | Ertele |

---

## 3. OpenAI Key — Netleştirme

Çekirdek hafıza için **gerekli değil**. Sadece şunları açar:
- **Semantic arama** (anlamca yakın — keyword yerine embedding). Key yoksa keyword aramaya düşer.
- **AI chat** (`/chat`).

Memory CRUD, keyword arama, graph, kalıcılık → key'siz çalışır.

---

## 4. Önerilen Yol Haritası (yerinde sağlamlaştırma)

**Faz A — Çekirdeği sağlamlaştır (öncelik):**
1. BUG B: 5 kalan OpenAI-modül route'unu lazy-init yap
2. BUG A: 10 route'ta `getLocalRequestUser(request)` düzelt → header-auth her yerde çalışsın
3. `backend/` sil (ölü kod) → repo sadeleşir
4. Tüm GET + kritik POST route'larını yeniden smoke test et

**Faz B — Kişisel kullanım:** UI'ı tarayıcıda dene (login→dashboard→memory), günlük kullan, kalan UX bug'larını gider.

**Faz C — MCP aktif:** `mcp-server/src` yaz → frontend API'ye (header-auth ile) proxy → Claude/Cursor ortak hafıza.

**Faz D — SaaS:** Supabase production mode + billing aç, multi-tenant.

---

## 5. Şimdiye Kadar Yapılan
- ✅ Bağımlılıklar kuruldu (`--legacy-peer-deps`)
- ✅ Local mode env + dev server çalışıyor
- ✅ `/memories/search` OpenAI-crash bug'ı düzeltildi
- ✅ `.gitignore` düzeltildi (`.next/`, `.local-dev/`, bozuk satır)
- ✅ Smoke test: health + memory create/list/search/graph + disk kalıcılığı
