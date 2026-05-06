<div align="center">

# StackMemory

**Persistent memory infrastructure for AI agents and coding tools.**

Give your AI the ability to remember — across sessions, projects, and tools.

[![Version](https://img.shields.io/badge/Platform-v3.2_Unified-blue?style=for-the-badge)](https://github.com/ai-ulu/StackMemory)
[![MCP](https://img.shields.io/badge/Protocol-MCP_2025--03--26-green?style=for-the-badge)](https://spec.modelcontextprotocol.io)
[![Runtime](https://img.shields.io/badge/Runtime-Cloudflare_Workers-orange?style=for-the-badge)](https://workers.cloudflare.com)
[![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)](LICENSE)

[Quick Start](#-quick-start) · [Tools](#-tools-21) · [🧠 Ulu-Brain](#-ulu-brain-cognitive-layer) · [Python SDK](#-python-sdk) · [Architecture](#-architecture) · [Self-Host](#-self-hosting)

</div>

---

## What is StackMemory?

StackMemory is a **shared memory layer** that connects to any MCP-compatible AI tool. Your agent stores what it learns — project decisions, user preferences, code patterns — and retrieves it when relevant, automatically.

**The problem:** AI tools forget everything between sessions. You repeat yourself. Context is lost. Mistakes are repeated.

**The fix:** StackMemory gives your AI persistent, searchable, project-isolated memory with automatic PII scrubbing and semantic search.

```
Claude Desktop ─┐
Cursor ──────────┤
Windsurf ────────┼──→ StackMemory MCP ──→ Cloudflare D1 + Vectorize
VS Code ─────────┤         │
Custom Agent ────┘    21 tools + cognitive layer, <50ms edge latency
```

---

## 🚀 Quick Start

### Live Endpoint (no setup required)

```
https://stackmemory-mcp.pages.dev/mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

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

Add to MCP settings:

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
| `update_memory` | Update content, type, confidence, or tags (PII scrubbed) |
| `delete_memory` | Soft-delete with Vectorize index cleanup |
| `query_memories` | Natural language query with multi-signal ranking |
| `list_memories` | Paginated list with type/namespace filtering |

### Graph

| Tool | What it does |
|------|-------------|
| `get_memory_graph` | Relationship graph with sub-graph filtering via `filter_keyword` |
| `link_memories` | Create typed relationships between memories |

### Advanced

| Tool | What it does |
|------|-------------|
| `sm_time_query` | Query by time range and temporal patterns |
| `sm_memory_summary` | Statistics with type/namespace distribution |
| `sm_batch_operations` | Bulk update, delete, or tag operations |
| `sm_export_memories` | Export to JSON or CSV (max 500 records) |
| `sm_concept_cluster` | Group memories by conceptual similarity |
| `sm_import_memories` | Import with duplicate handling and PII scrubbing |
| `sm_prefetch` | **Proactive injection** — pre-fetch relevant memories for LLM context |

### 🧠 Ulu-Brain (Cognitive Layer)

| Tool | What it does |
|------|-------------|
| `brain_think` | **Reasoning engine** — retrieves memories, analyzes graph connections, detects contradictions, returns strategic cognitive assessment |
| `brain_adapt` | **Feedback loop** — report useful/not_useful/critical feedback, auto-adjusts H-score weights per namespace over time |
| `brain_consolidate` | **Cognitive housekeeping** — clusters similar memories, generates `insight` summaries, links sources, reduces redundancy |
| `brain_status` | **Brain health report** — memory distribution, adaptive weights, freshness metrics, cognitive load assessment |
| `brain_simulate` | **Decision simulation** — analyzes past decisions/rules, detects risks and contradictions, maps affected namespaces, returns risk-scored verdict |
| `brain_dream` | **Cross-namespace ideation** — discovers unexpected connections between projects, identifies transferable patterns, suggests creative "blue ocean" ideas |

---

## 🔐 Security

Every memory goes through automatic PII/secret detection before storage:

| Category | Patterns detected |
|----------|------------------|
| Personal data | Email, phone numbers, credit cards, SSN |
| API keys | GitHub, GitLab, Slack, Supabase, AWS, Google |
| Auth tokens | JWT, generic API keys/secrets, passwords |

Detected values are replaced with `[TYPE_REDACTED]` — the original is never stored.

---

## 🏗 Namespace Isolation

Every tool accepts an optional `namespace` parameter to isolate memories by project:

```json
{ "content": "Uses Tailwind CSS v4", "namespace": "marketing-site" }
{ "content": "API rate limit is 100/min", "namespace": "backend-api" }
```

Memories from different namespaces never mix in search results. Default namespace is `global`.

---

## 🧠 Semantic Search

When Cloudflare Workers AI + Vectorize are configured, StackMemory uses hybrid search:

| Signal | Weight | Source |
|--------|--------|--------|
| Vector similarity | 40% | Cloudflare Vectorize (`bge-base-en-v1.5`, 768-dim) |
| Keyword relevance | 30% | Density + position + occurrence scoring |
| Confidence | 15% | Per-memory confidence score |
| Recency | 15% | Exponential decay, 30-day half-life |

Falls back to keyword-only search if vector bindings are unavailable.

---

## 📉 Memory Decay

Memories age naturally. Frequently accessed, high-importance memories surface first:

- **`last_accessed`** — auto-updated on every retrieval
- **`access_count`** — tracks retrieval frequency
- **`importance_score`** — per-memory weight (0.0–1.0)
- **Decay function** — exponential with 30-day half-life

---

## 🧠 Ulu-Brain (Cognitive Layer)

v3.0 adds a cognitive layer that transforms StackMemory from a passive data store into an active reasoning system.

### brain_think — Contextual Reasoning

Instead of just retrieving memories, `brain_think` **reasons** about them:

```json
{ "context": "Should we switch from REST to GraphQL?", "depth": "deep" }
```

Returns:
- **Key memories** ranked by multi-signal relevance
- **Graph connections** between retrieved memories
- **Contradiction detection** — finds conflicting decisions made at different times
- **Cognitive assessment** — confidence level, knowledge freshness, strategic recommendation

### brain_adapt — Behavioral Adaptation

A feedback loop that makes retrieval smarter over time:

```json
{ "memory_id": "abc-123", "feedback": "useful", "namespace": "my-project" }
```

- Reports whether a memory was `useful`, `not_useful`, or `critical`
- Auto-adjusts H-score weights **per namespace** using gradient-like updates
- Boosts `importance_score` of useful memories, decays unhelpful ones
- Learning rate: 0.02 per feedback event, clamped to [0.05, 0.60]

### brain_consolidate — Cognitive Housekeeping

Like a brain organizing memories during sleep:

```json
{ "namespace": "my-project", "min_cluster_size": 3, "dry_run": true }
```

- Clusters similar memories using Jaccard similarity
- Generates `insight` type memories that summarize each cluster
- Links insights to source memories via `consolidated_from` relations
- Embeddings generated for insights (searchable via Vectorize)
- Use `dry_run: true` to preview without committing

### brain_status — Cognitive Health Report

```json
{ "namespace": "my-project" }
```

Returns: memory distribution, namespace stats, freshness metrics, adaptive weight state, recent feedback activity, and a cognitive load assessment with actionable recommendations.

### brain_simulate — Decision Simulation (v3.1)

Test a decision against your entire knowledge base before committing:

```json
{ "decision": "Switch from REST to GraphQL", "namespace": "my-api", "include_cross_namespace": true }
```

Returns:
- **Historical context** — past decisions, rules, and insights related to the topic
- **Risk assessment** — risk score (0-1), supporting evidence, warning signals
- **Decision conflicts** — existing decisions this would override
- **Affected namespaces** — which projects would be impacted
- **Verdict**: 🔴 HIGH RISK / 🟡 MODERATE / 🟠 CAUTION / 🟢 LOW RISK / ⚪ UNCHARTED

Pattern detection uses bilingual keywords (EN/TR) for negative/positive signal analysis.

### brain_dream — Cross-Namespace Ideation (v3.1)

Like a brain dreaming — discovers unexpected connections between isolated projects:

```json
{ "focus": "performance optimization", "max_ideas": 5 }
```

Returns:
- **Dream connections** — keyword bridges between namespace pairs with strength scores
- **Unique patterns** — expertise isolated in one namespace that could transfer elsewhere
- **Dream summary** — top bridge with actionable insight

Example output:
```
💡 "e-commerce" and "game-engine" share concepts: [cache, latency, queue].
   Knowledge from one may transfer to the other.
🔮 "ml-pipeline" has unique expertise in [embedding, tokenizer, batch].
   Consider applying these patterns to other projects.
```

---

## 🏛 Architecture (v3.2 — Unified)

> One source of truth: the **MCP server** (Cloudflare D1 + Vectorize) owns
> every memory and every cognitive operation. The Next.js frontend is a thin
> proxy + dashboard. Supabase only handles identity, billing and teams.
> See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full reference.

```
                ┌──────────────────────────┐
   MCP clients ─►│   StackMemory MCP server │◄─ Web dashboard (Next.js)
   (Claude,      │   Cloudflare Workers     │   /api/memories/*  → MCP
    Cursor,      │   D1 + Vectorize         │   /api/brain/*     → MCP
    Windsurf)    │   21 tools + Ulu-Brain   │
                └──────────────────────────┘
                            ▲
                            │
        Bots / SDK / Chrome ext  (all → MCP)

   Supabase: auth, billing, teams, conversations  (NEVER memories)
```

| Component | Stack | Purpose |
|-----------|-------|---------|
| **mcp-server** | Cloudflare Workers, D1, Vectorize | All memory CRUD + cognitive layer (21 tools) |
| **frontend** | Next.js 15, Tailwind, shadcn | Dashboard UI + MCP proxy routes + Supabase auth |
| **frontend/lib/mcp** | TypeScript | JSON-RPC client + namespace bridge |
| **sdk/python** | Python | `pip install ai-ulu` — client library |
| **bots** | Slack, Discord, Telegram | Chat integrations (call MCP via SDK) |
| **chrome-extension** | Manifest V3 | Browser memory capture (calls MCP) |

> **Removed in v3.2:** legacy FastAPI `backend/` and Python `bridge/` services.
> See [CHANGELOG.md](./CHANGELOG.md#320---2026-05-06---architecture-unification-).


---

## 🐍 Python SDK

```bash
pip install ai-ulu
```

```python
from ai_ulu import StackMemory

mem = StackMemory(api_url="https://your-instance.com")

# Store
mem.store("User prefers dark mode", type="preference")

# Search
results = mem.search("dark mode", limit=5)

# Query (natural language)
results = mem.query("What are the user's UI preferences?")
```

### LangChain Integration

```python
from ai_ulu.langchain import StackMemoryRetriever

retriever = StackMemoryRetriever(api_url="https://your-instance.com")
# Use as any LangChain retriever
```

### CLI

```bash
ulu store "Project uses React 19"
ulu search "framework"
ulu list --type preference
```

---

## 🖥 Self-Hosting

### MCP Server Only (Cloudflare)

```bash
cd mcp-server
npm install
npx wrangler d1 create stackmemory-mcp-db
npx wrangler vectorize create stackmemory-embeddings --dimensions=768 --metric=cosine
npx wrangler deploy
```

### Full Platform (Docker)

```bash
cp .env.example .env
# Fill in your Supabase, OpenAI, and other keys
docker compose up -d
```

Services:
- **Dashboard**: `http://localhost:3000`
- **MCP server** (only with `--profile selfhost`): `http://localhost:8787/mcp`

### Makefile Commands

```bash
make install    # Install all dependencies
make dev        # Start development servers
make build      # Build Docker images
make deploy     # Deploy to production
make test       # Run tests
make health     # Check service health
```

---

## 📋 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **v3.2** | 2026-05-06 | 🧹 **Architecture Unification** — single source of truth (MCP server). Removed FastAPI backend + Python bridge. Frontend now proxies all memory/brain calls to MCP. |
| v3.1 | 2026-05-06 | 🧠 **Ulu-Brain v2** — `brain_simulate` (decision simulation + risk scoring), `brain_dream` (cross-namespace ideation + pattern transfer). 21 total tools. |
| v3.0 | 2026-05-06 | 🧠 **Ulu-Brain v1** — `brain_think` (reasoning), `brain_adapt` (feedback loop), `brain_consolidate` (housekeeping), `brain_status` (health). `insight` memory type. |
| v2.1 | 2026-05-06 | PII scrubbing, namespace isolation, Vectorize semantic search, memory decay, `sm_prefetch`, smart truncation |
| v2.0 | 2026-02-11 | Time queries, batch ops, export/import, concept clustering, H(x,ψ) scoring |
| v1.0 | 2026-01-15 | Core CRUD, graph operations, MCP protocol |

See [CHANGELOG.md](CHANGELOG.md) for full details.

---

## 📄 License

MIT

---

<div align="center">

Built by [ai-ulu](https://github.com/ai-ulu)

**One memory. Many tools. Same project context.**

</div>
