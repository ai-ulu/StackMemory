# StackMemory Deployment Checklist

StackMemory is currently **app-first**:

```txt
MCP client
  ↓
mcp-server/src/app-adapter.ts
  ↓
Next.js app API
  ↓
feature service / repository layer
  ↓
Supabase
```

The old monolithic MCP server entrypoint is disabled. The active MCP file is `mcp-server/src/app-adapter.ts`.

---

## 1. Frontend / App

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
cd frontend
npm run build
npm run start
```

Important scripts come from `frontend/package.json`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

---

## 2. Required frontend environment

Create `frontend/.env.local` from `frontend/.env.example`.

Required for app-backed memory:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Recommended defaults:

```env
STACKMEMORY_LOCAL_MODE=false
NEXT_PUBLIC_STACKMEMORY_LOCAL_MODE=false
NEXT_PUBLIC_DEFAULT_PLAN=free
```

Optional:

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_TEAM_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

---

## 3. Supabase setup

Run the main schema in Supabase SQL Editor:

```txt
frontend/supabase/schema.sql
```

Then run migrations in order:

```txt
frontend/supabase/migrations/20260513_memory_links.sql
frontend/supabase/migrations/20260513_memory_tags.sql
frontend/supabase/migrations/20260513_token_optimization.sql
```

Core tables/columns used by the current app shell:

```txt
memories
memories.tags
memory_settings
memory_versions
brain_config
brain_feedback
memory_links
ai_usage_events
context_builds
memory_retrieval_events
```

Required Supabase extension:

```sql
create extension if not exists vector;
```

The schema also enables RLS policies. Use a normal authenticated Supabase user for dashboard testing.

---

## 4. MCP app adapter

The active MCP adapter is:

```txt
mcp-server/src/app-adapter.ts
```

Local build:

```bash
cd mcp-server
npm install
npm run build
```

Local worker preview:

```bash
cd mcp-server
npm run dev
```

Deploy:

```bash
cd mcp-server
npm run deploy
```

MCP adapter environment:

```env
STACKMEMORY_APP_URL=https://your-stackmemory-app.example.com
STACKMEMORY_APP_TOKEN=
```

`STACKMEMORY_APP_TOKEN` is optional. If omitted, the adapter forwards the incoming `Authorization` header to the app API.

---

## 5. Current route map

App API:

```txt
GET    /api/memories?q=&type=&status=&scope=&tag=&limit=
POST   /api/memories
GET    /api/memories/:id
PATCH  /api/memories/:id
DELETE /api/memories/:id
GET    /api/brain/status
POST   /api/brain/simulate
GET    /api/graph?type=&status=&scope=&tag=&limit=
POST   /api/graph
DELETE /api/graph?id=
POST   /api/context/estimate
POST   /api/context/compile
GET    /api/usage/summary
GET    /api/settings/memory
PUT    /api/settings/memory
GET    /api/billing/summary
POST   /api/billing/create-checkout
```

Memory list filters:

```txt
q       content search
type    identity | preference | fact | project | rule | decision | task | insight
status  active | pending | deprecated
scope   private | team | org
tag     exact normalized tag match without #
limit   max rows, default 100 in API UI calls
```

Graph link POST body:

```json
{
  "sourceMemoryId": "memory-a-id",
  "targetMemoryId": "memory-b-id",
  "relationshipType": "supports",
  "weight": 0.8,
  "reason": "Same project context"
}
```

Context compile POST body:

```json
{
  "agentId": "coding-agent",
  "workspaceId": "stackmemory",
  "userRequest": "Continue refactoring billing without touching MCP.",
  "maxContextTokens": 6000,
  "strategy": "balanced",
  "filters": {
    "tag": "billing",
    "status": "active"
  }
}
```

Dashboard UI:

```txt
/dashboard
/dashboard/memories
/dashboard/context
/dashboard/brain
/dashboard/graph
/dashboard/settings
/dashboard/billing
```

MCP tools forwarded by the adapter:

```txt
list_memories
search_memories
store_memory
update_memory
delete_memory
brain_status
brain_simulate
get_memory_graph
```

---

## 6. Smoke test

After app startup and Supabase login:

1. Open `/dashboard`.
2. Create at least two memories in `/dashboard/memories` with tags.
3. Click one tag pill and confirm the list filters by that tag.
4. Confirm the memory appears in `/dashboard` recent signals.
5. Open `/dashboard/context`.
6. Run Estimate and confirm selected/omitted memory metrics render.
7. Run Compile + record and confirm usage summary cards update.
8. Open `/dashboard/brain` and check status/simulation.
9. Open `/dashboard/graph` and confirm graph data renders.
10. Use Create memory link to connect two memories.
11. Confirm graph source changes to `persisted` / `memory_links`.
12. Select one linked node and delete the persisted edge.
13. Open `/dashboard/settings`, change one setting, save, refresh.
14. Open `/dashboard/billing`, confirm memory usage count updates.

---

## 7. Known next steps

```txt
1. Read GitHub Actions logs and fix any build failures.
2. Add subscription table + Stripe webhook persistence.
3. Add usage/savings charts to Context dashboard.
4. Add graph search/filter controls to Graph UI.
5. Add richer tag suggestions/autocomplete to Memory Explorer.
6. Replace fallback mock repository only after tests cover Supabase paths.
```
