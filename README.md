<div align="center">

# StackMemory

**Persistent memory infrastructure for AI agents and coding tools.**

Give your AI the ability to remember — across sessions, projects, and tools.

[![Version](https://img.shields.io/badge/Platform-v3.2_Unified-blue?style=for-the-badge)](https://github.com/ai-ulu/StackMemory)
[![MCP](https://img.shields.io/badge/Protocol-MCP_2025--03--26-green?style=for-the-badge)](https://spec.modelcontextprotocol.io)
[![Runtime](https://img.shields.io/badge/Runtime-Cloudflare_Workers-orange?style=for-the-badge)](https://workers.cloudflare.com)
[![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)](LICENSE)

[Quick Start](#-quick-start) · [Product Dashboard](#-product-dashboard-mvp) · [Tools](#-tools-21) · [🧠 Ulu-Brain](#-ulu-brain-cognitive-layer) · [Python SDK](#-python-sdk) · [Architecture](#-architecture-v32--unified) · [Self-Host](#-self-hosting)

</div>

---

## What is StackMemory?

StackMemory is a **shared memory layer** that connects to any MCP-compatible AI tool. Your agent stores what it learns — project decisions, user preferences, code patterns — and retrieves it when relevant, automatically.

---

## 🧭 Product Dashboard MVP

The Next.js frontend now includes a productized dashboard for turning StackMemory into a shared memory operating layer for LLM agents, coding tools, automation systems and custom AI apps.

### Core app routes

| Route | Purpose |
|------|---------|
| `/dashboard` | Product command center with MCP-backed memory metrics |
| `/memories` | Memory explorer with search, type filter and namespace support |
| `/memories/new` | Create memory through `store_memory` |
| `/memories/[id]` | Detail, update and removal controls through MCP |
| `/brain` | Targeted context compiler preview |
| `/usage` | Token, retrieval and cost planning from memory records |
| `/runtime` | Active MCP endpoint, token state and namespace preview |
| `/settings` | Workspace and policy controls |

### Frontend MCP runtime env

```bash
MCP_SERVER_URL="https://stackmemory-mcp.pages.dev/mcp"
MCP_SERVER_TOKEN="optional-bearer-token"
STACKMEMORY_NAMESPACE="demo:stackmemory"
NEXT_PUBLIC_MCP_SERVER_URL="https://stackmemory-mcp.pages.dev/mcp"
NEXT_PUBLIC_STACKMEMORY_NAMESPACE="demo:stackmemory"
```

Runtime behavior:

```txt
Frontend route
→ frontend/lib/memories/service.js
→ frontend/lib/mcp/client.ts
→ StackMemory MCP server
→ Cloudflare D1 + Vectorize
```

Namespace behavior:

```txt
/runtime?namespace=team:alpha
→ links preserve namespace
→ /memories?namespace=team:alpha
→ create/update/remove/search/list use that namespace
```

Supabase is reserved for auth, teams, billing and workspace ownership. Memory records stay in the MCP backend.

---

## 🚀 Quick Start

### Live Endpoint

```txt
https://stackmemory-mcp.pages.dev/mcp
```

### Claude Desktop

```json
{
  "mcpServers": {
    "stackmemory": {
      "url": "https://stackmemory-mcp.pages.dev/mcp"
    }
  }
}
```

### Cursor / VS Code

```json
{
  "mcp": {
    "servers": {
      "stackmemory": {
        "url": "https://stackmemory-mcp.pages.dev/mcp",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Python SDK

```bash
pip install ai-ulu
```

```python
from ai_ulu import StackMemory

memory = StackMemory(api_url="https://stackmemory-mcp.pages.dev")
memory.store("Project uses Next.js 15 with App Router", namespace="my-project")
results = memory.search("routing", namespace="my-project")
```

---

## 🛠 Tools (21)

### Core

| Tool | What it does |
|------|-------------|
| `search_memories` | Hybrid search — keyword relevance + vector similarity + recency decay |
| `store_memory` | Store with automatic PII scrubbing and optional namespace isolation |
| `update_memory` | Update content, type, confidence, or tags |
| `delete_memory` | Remove/deactivate a memory record |
| `query_memories` | Natural language query with multi-signal ranking |
| `list_memories` | Paginated list with type/namespace filtering |

### Graph and cognitive layer

| Tool | What it does |
|------|-------------|
| `get_memory_graph` | Relationship graph with sub-graph filtering |
| `link_memories` | Create typed relationships between memories |
| `brain_think` | Retrieve, reason, detect contradictions and return assessment |
| `brain_adapt` | Feedback loop that tunes scoring per namespace |
| `brain_consolidate` | Cluster and summarize related memories |
| `brain_status` | Memory health and distribution report |
| `brain_simulate` | Decision simulation with risk scoring |
| `brain_dream` | Cross-namespace ideation and pattern transfer |

---

## 🏛 Architecture (v3.2 — Unified)

```txt
MCP clients ─┐
Dashboard ───┼──→ StackMemory MCP server ──→ Cloudflare D1 + Vectorize
Bots / SDK ──┘

Supabase: auth, billing, teams, workspaces
MCP: memory CRUD, search, graph, brain tools
```

| Component | Stack | Purpose |
|-----------|-------|---------|
| `mcp-server` | Cloudflare Workers, D1, Vectorize | All memory CRUD + cognitive layer |
| `frontend` | Next.js 15, Tailwind, shadcn | Dashboard UI + MCP-backed service calls |
| `frontend/lib/mcp` | TypeScript | JSON-RPC client + namespace bridge |
| `sdk/python` | Python | Client library |
| `bots` | Slack, Discord, Telegram | Chat integrations |
| `chrome-extension` | Manifest V3 | Browser memory capture |

---

## 🖥 Self-Hosting

```bash
cd mcp-server
npm install
npx wrangler d1 create stackmemory-mcp-db
npx wrangler vectorize create stackmemory-embeddings --dimensions=768 --metric=cosine
npx wrangler deploy
```

Full platform:

```bash
cp .env.example .env
docker compose up -d
```

---

## 📋 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **v3.2** | 2026-05-06 | Architecture unification: MCP is the memory source of truth; frontend is product dashboard. |
| v3.1 | 2026-05-06 | Ulu-Brain v2: decision simulation and cross-namespace ideation. |
| v3.0 | 2026-05-06 | Ulu-Brain v1: thinking, feedback, consolidation and status. |
| v2.1 | 2026-05-06 | PII scrubbing, namespace isolation, Vectorize semantic search and memory decay. |
| v2.0 | 2026-02-11 | Time queries, batch ops, export/import and concept clustering. |
| v1.0 | 2026-01-15 | Core CRUD, graph operations and MCP protocol. |

---

## 📄 License

MIT

---

<div align="center">

Built by [ai-ulu](https://github.com/ai-ulu)

**One memory. Many tools. Same project context.**

</div>
