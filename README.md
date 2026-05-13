# StackMemory

Persistent memory infrastructure for AI agents and app-first AI products.

## Current architecture

StackMemory currently runs as an **app-first** product:

```txt
Dashboard UI
  ↓
Next.js App API
  ↓
Feature service / repository layer
  ↓
Supabase
```

MCP is still supported, but only as a thin adapter:

```txt
MCP client
  ↓
mcp-server/src/app-adapter.ts
  ↓
Next.js App API
  ↓
Supabase-backed service layer
```

The old monolithic MCP server entrypoint has been disabled. The active MCP entrypoint is:

```txt
mcp-server/src/app-adapter.ts
```

## Product surfaces

```txt
/dashboard
/dashboard/memories
/dashboard/brain
/dashboard/graph
/dashboard/settings
/dashboard/billing
```

## App API

```txt
GET    /api/memories
POST   /api/memories
GET    /api/memories/:id
PATCH  /api/memories/:id
DELETE /api/memories/:id
GET    /api/brain/status
POST   /api/brain/simulate
GET    /api/graph
GET    /api/settings/memory
PUT    /api/settings/memory
GET    /api/billing/summary
POST   /api/billing/create-checkout
```

## Setup

Read the deployment checklist first:

```txt
DEPLOYMENT.md
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

MCP adapter:

```bash
cd mcp-server
npm install
npm run build
npm run dev
```

## Supabase

Run the schema and migrations in this order:

```txt
frontend/supabase/schema.sql
frontend/supabase/migrations/20260513_memory_links.sql
```

Core tables used by the current dashboard:

```txt
memories
memory_settings
memory_versions
brain_config
brain_feedback
memory_links
```

## Environment

Use these examples:

```txt
.env.example
frontend/.env.example
mcp-server/wrangler.app-adapter.example.toml
```

Required app-first values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

MCP adapter values:

```env
STACKMEMORY_APP_URL=https://your-stackmemory-app.example.com
STACKMEMORY_APP_TOKEN=
```

## Status

Implemented:

```txt
App-first dashboard shell
Supabase memory repository
Memory CRUD UI
Brain dashboard MVP
Memory graph MVP
Settings UI
Billing summary UI
Dashboard auth gate
MCP app adapter
Legacy MCP entrypoint tombstone
```

Next:

```txt
CI build workflow
Stripe webhook persistence
Graph persistence through memory_links
Production deployment hardening
```

## License

MIT
