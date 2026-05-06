# StackMemory — Architecture (v3.2, post-unification)

> **TL;DR** — One source of truth. The MCP server (Cloudflare D1 + Vectorize)
> owns every memory and every cognitive operation. The Next.js frontend is a
> thin proxy + dashboard. Supabase only handles identity, billing and teams.

---

## Why we refactored

Before v3.2 the platform stored memories in **three** places:

| Layer | Store | Used by |
|---|---|---|
| MCP server | Cloudflare D1 + Vectorize | Claude/Cursor/Windsurf clients |
| Frontend `/api/memories/*` | Supabase `memories` + pgvector | Web dashboard |
| Backend (FastAPI) | MongoDB | nobody, in practice |

The same memory written via the dashboard would never reach Claude, and vice
versa. The cognitive layer (`brain_*`) had two parallel implementations
(MCP-server TypeScript and frontend Next.js routes) drifting apart.

v3.2 collapses this into a single architecture.

---

## New architecture

```
                ┌──────────────────────────┐
                │     Next.js Frontend      │
                │  (dashboard + API proxy)  │
                └──────────┬────────────────┘
                           │  /api/memories/*
                           │  /api/brain/*
                           ▼
                ┌──────────────────────────┐
                │   StackMemory MCP server  │
                │  (Cloudflare Workers)     │
                ├──────────────────────────┤
                │ • 21 tools                │
                │ • Ulu-Brain cognitive     │
                │ • PII scrub + namespace   │
                └──────────┬────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌────────────┐            ┌────────────┐
       │ Cloudflare │            │ Cloudflare │
       │     D1     │            │ Vectorize  │
       │ (records)  │            │ (768-dim)  │
       └────────────┘            └────────────┘

Identity-only paths
─────────────────────
Supabase ── auth, profiles, teams, billing, conversations
            (NEVER memories — that lives in MCP only)
```

### Component responsibilities

| Component | Responsibility | Stack |
|---|---|---|
| `mcp-server/` | All memory CRUD, hybrid search, graph, cognitive layer | Cloudflare Workers, D1, Vectorize, TS |
| `frontend/` | Dashboard UI, MCP proxy routes, Supabase auth | Next.js 15, Tailwind, shadcn |
| `frontend/lib/mcp/` | JSON-RPC client + auth → namespace bridge | TS |
| `bots/` | Slack / Discord / Telegram → MCP via SDK | Python |
| `chrome-extension/` | Capture-to-memory → MCP via SDK | Manifest V3 |
| `sdk/python/` | `pip install ai-ulu` client library | Python |

### Removed components

| Removed | Why |
|---|---|
| `backend/` (FastAPI/MongoDB) | Duplicated MCP CRUD; never reached production. |
| `bridge/` (Python REST proxy) | Frontend now talks to MCP directly. |
| `frontend/lib/brain/helpers.ts` | Replaced by `mcp.callTool('brain_*')`. |
| Frontend Supabase writes to `memories` table | Replaced by `mcp.store/list/update/delete`. |

---

## Namespace model

The MCP server enforces tenant isolation via the `namespace` field. The
frontend never lets clients choose namespaces directly; they are derived
server-side from the authenticated Supabase user:

```
namespace = "user:" + supabaseUser.id
namespace = "user:" + supabaseUser.id + ":" + scope   // teams/projects
```

`frontend/lib/mcp/auth.ts` is the single place that performs this mapping.
Teams, projects and shared spaces will extend this with explicit scope
sub-namespaces (planned for v3.3).

---

## Request flow (write path)

```
User clicks "Save" in dashboard
        │
        ▼
POST /api/memories  (Next.js route handler)
        │
        ├──► getAuth(request)            ← Supabase session → userId
        │     namespace = "user:<id>"
        │
        ├──► mcp.store({ content, namespace, ... })
        │     POST  $MCP_SERVER_URL  (JSON-RPC tools/call)
        │     headers: Authorization: Bearer $MCP_SERVER_TOKEN  (optional)
        │
        └──► response → JSON to client
```

Same pattern for `search`, `update`, `delete`, `graph`, `query`, all `brain_*`.

---

## Backwards compatibility

- **MCP clients (Claude/Cursor/Windsurf):** unchanged.
- **Python SDK (`ai-ulu`):** unchanged.
- **Web dashboard:** API surface identical (same `/api/memories/*` paths and
  payloads), but data now lives in D1, not Supabase.
- **Existing Supabase `memories` rows:** archive only. v3.2 starts from a
  clean slate — `frontend/supabase/schema.sql` no longer creates the
  `memories` table for new deployments.

---

## Self-hosting

```bash
# 1. Deploy your own MCP server
cd mcp-server
npx wrangler d1 create stackmemory-mcp-db
npx wrangler vectorize create stackmemory-embeddings --dimensions=768 --metric=cosine
npx wrangler deploy

# 2. Point the frontend at it
echo "MCP_SERVER_URL=https://<your-worker>.workers.dev/mcp" >> .env

# 3. Run the dashboard
docker compose up -d
```

---

## Open questions / next steps

- **Memory versioning** (`/api/memories/[id]/versions`) and **conflict
  detection** (`/api/memories/conflicts`) routes still target Supabase —
  these features need first-class MCP tools (`sm_memory_versions`,
  `sm_detect_conflicts`) to fully unify. Tracked for v3.3.
- **Server-side auth on MCP:** the live endpoint is currently public. We
  should require a bearer token bound to the Supabase JWT so multi-tenant
  isolation can be enforced cryptographically, not just by namespace string.
- **Vector embeddings on write:** today the MCP server generates them via
  Workers AI. Frontend's old `/api/embed` route is now redundant and can be
  removed in a follow-up cleanup.
