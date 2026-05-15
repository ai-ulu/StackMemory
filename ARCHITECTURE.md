# StackMemory — Architecture (v3.5, Supabase-First)

> **TL;DR** — Supabase is the **Source of Truth**. The Next.js App handles cognitive logic, persistence (Postgres + pgvector), and identity. The MCP server is a high-performance **Bridge** that allows external AI agents to interact with this unified memory.

---

## The Unified Architecture

StackMemory uses a "Service-Repository" pattern to ensure that the same memory is accessible from both the web dashboard and external AI agents.

```
                 ┌──────────────────────────┐
                 │     Next.js Frontend      │
                 │   (UI + Cognitive logic) │
                 └──────────┬────────────────┘
                            │
                            │ (Service Layer)
                            ▼
                 ┌──────────────────────────┐
                 │    Memory Service Layer  │
                 │   (Consolidate / Dream)  │
                 └──────────┬────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │   Supabase DB     │       │   MCP Bridge      │
    │ (Postgres/vector) │◄─────►│ (App-Adapter)    │
    └───────────────────┘       └───────────────────┘
              ▲                           ▲
              │                           │
        (Web Dashboard)             (Claude / Cursor)
```

### Component Responsibilities

| Component | Responsibility | Stack |
|---|---|---|
| `frontend/features/` | Core business logic, memory consolidation, cognitive simulation. | TS, Next.js |
| `Supabase` | Persistent storage, Vector search (pgvector), RLS, Auth. | Postgres |
| `mcp-server/` | Exposing internal tools to external agents via JSON-RPC. | Node.js / Workers |
| `mcp-server/app-adapter` | Thin proxy that calls `frontend/api/*` endpoints. | TS |

### Why this structure?
- **Unified Logic:** Cognitive features like `dream` and `simulate` are written once in the frontend service layer and exposed to both the UI and the MCP.
- **Security:** Supabase RLS ensures that the MCP adapter can only access the user's data after proper authentication.
- **Speed:** Next.js Route Handlers provide a fast, scalable API surface.

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

1. **Deploy Supabase Schema:**
   Run `frontend/supabase/schema.sql` in your Supabase SQL editor.

2. **Configure Environment:**
   ```bash
   # frontend/.env.local
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Deploy MCP Bridge:**
   The MCP server can be deployed to any Node.js environment or Cloudflare Worker. It requires `STACKMEMORY_APP_URL` to point to your Next.js API.

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
