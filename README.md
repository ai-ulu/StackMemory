# StackMemory

**Context control plane for AI agents.**

StackMemory is persistent memory infrastructure for AI agents and app-first AI products. It stores long-lived memory, links related memories, and compiles only the relevant context needed for a request so teams can reduce repeated prompt tokens without losing useful context.

## Core promise

```txt
Remember what matters.
Retrieve only what is relevant.
Control context size.
Measure estimated token savings.
```

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
/dashboard/context
/dashboard/brain
/dashboard/graph
/dashboard/settings
/dashboard/billing
```

## App API

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
POST   /api/webhooks/stripe
```

## Token optimization MVP

StackMemory includes a first-pass context optimization layer:

```txt
frontend/features/context/context.optimizer.ts
frontend/features/context/context.telemetry.ts
frontend/features/context/components/ContextOptimizerClient.jsx
frontend/features/usage/usage.repository.ts
frontend/app/dashboard/context/page.js
frontend/app/api/context/estimate/route.ts
frontend/app/api/context/compile/route.ts
frontend/app/api/usage/summary/route.ts
frontend/supabase/migrations/20260513_token_optimization.sql
```

### Context dashboard

```txt
/dashboard/context
```

The dashboard can:

```txt
run estimate without writing telemetry
compile optimized context and record telemetry
preview the compiled context block
show estimated saved tokens
show estimated savings percentage
show agent savings leaderboard
show recent context builds
```

### Estimate context savings

```http
POST /api/context/estimate
```

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

Returns:

```txt
selected memory ids
omitted memory ids
estimated baseline tokens
final context tokens
estimated savings tokens
estimated savings percent
```

### Compile optimized context

```http
POST /api/context/compile
```

Returns a compiled context block plus metrics. It also records telemetry into:

```txt
context_builds
memory_retrieval_events
```

Supported strategies:

```txt
aggressive  smaller memory budget, stronger cost reduction
balanced    default memory budget
quality     larger memory budget, safer answer quality
```

### Usage summary

```http
GET /api/usage/summary
```

Returns aggregate context optimization metrics:

```txt
context builds
final context tokens
estimated saved tokens
estimated savings percent
selected / omitted memory counts
agent savings breakdown
recent context builds
```

## Billing persistence

Billing now has a Supabase-backed subscription persistence layer:

```txt
frontend/supabase/migrations/20260513_billing_subscriptions.sql
frontend/features/billing/billing.repository.ts
frontend/lib/supabase/admin.ts
frontend/app/api/webhooks/stripe/route.ts
frontend/app/api/billing/summary/route.js
```

Stripe checkout writes `user_id` and `plan_id` into checkout and subscription metadata. Stripe webhook events upsert subscription state into:

```txt
billing_subscriptions
```

The billing summary endpoint reads the active subscription first and falls back to `NEXT_PUBLIC_DEFAULT_PLAN` only when no active subscription exists.

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
frontend/supabase/migrations/20260513_memory_tags.sql
frontend/supabase/migrations/20260513_token_optimization.sql
frontend/supabase/migrations/20260513_billing_subscriptions.sql
```

Core tables used by the current dashboard and APIs:

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
billing_subscriptions
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

Stripe billing values:

```env
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_TEAM_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
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
Memory tags persistence and filtering
Brain dashboard MVP
Memory graph with persisted memory_links
Manual graph link creation/deletion
Settings UI
Billing summary UI
Billing subscriptions table
Stripe webhook subscription persistence
Dashboard auth gate
Context estimate API
Context compile API
Usage summary API
Context optimizer dashboard
Context telemetry tables
MCP app adapter
Legacy MCP entrypoint tombstone
GitHub Actions build workflow
```

Next:

```txt
CI build log fixes
Usage/savings charts
Graph search/filter controls
Production deployment hardening
```

## License

MIT
