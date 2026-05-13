# App-first Foundation Plan

StackMemory uygulamasında öncelik MCP değil, uygulama deneyimidir. MCP sunucusu şimdilik park edilir; veri kaynağı ve ürün akışı Supabase + Next.js uygulaması üzerinden toparlanır.

## Sabit kararlar

- `mcp-server/` şimdilik dokunulmadan park edilir.
- Ana geliştirme merkezi `frontend/` olur.
- Supabase tek veri kaynağı olarak kullanılır.
- Uygulama ekranları doğrudan MCP veya Supabase'e dağınık bağlanmaz.
- Ortada feature/service/repository katmanı olur.
- MCP daha sonra sadece bu servisleri dışarı açan adapter olarak geri gelir.

## PR-1: app-first/foundation

Amaç: Uygulamayı MCP bağımlılığından ayıracak ilk temiz iskeleti kurmak.

Yapılacaklar:

- `frontend/lib/core/` ortak yardımcıları
- `frontend/lib/supabase/` client/server iskeleti
- `frontend/features/memory/` tipler, mock data, repository ve service katmanı
- `frontend/app/dashboard/page.js` ürün dashboard iskeleti
- `frontend/app/dashboard/memories/page.js` memory explorer MVP

Bu PR gerçek veriye yazmaz. Mock repository ile app ekranlarının MCP olmadan açılmasını sağlar.

## PR-2: Supabase memory adapter

- Supabase repository gerçek `memories` tablosuna bağlanacak.
- `/api/memories` route'ları eklenecek.
- Create/update/deprecate/delete akışı eklenecek.
- RLS ve user_id kontrolü bağlanacak.

## PR-3: Brain + Graph MVP

- Brain status ekranı
- Decision simulator basit versiyon
- Memory graph basit node/edge gösterimi
- `brain_feedback` kayıt akışı

## PR-4: Product shell

- Sidebar
- Topbar
- Project/namespace switcher
- Settings
- Billing kartları
- Usage meter
- Empty/loading/error states

## PR-5: MCP adapter

- MCP tool çağrıları doğrudan service layer'a gider.
- MCP kendi veritabanını tutmaz.
- Supabase tek kaynak olarak kalır.
