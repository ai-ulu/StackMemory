# StackMemory MCP Server v2.1

**Model Context Protocol server for StackMemory** — Cloudflare Workers + D1 + Vectorize

Turn StackMemory into the shared memory layer for MCP-compatible AI coding tools and custom AI workflows.

## What This Does

The StackMemory MCP Server allows MCP-compatible clients to read and write memory through a shared backend. v2.1 adds production-grade security, project isolation, semantic search, and memory decay.

Typical targets:
- Claude Desktop
- Cursor and IDE-adjacent MCP workflows
- Windsurf-style coding tools
- Custom MCP-compatible clients

## Installation

```bash
npx @ai-ulu/mcp-server
```

Package and environment names remain backward-compatible for now.

## Configuration

Example Claude Desktop config:

```json
{
  "mcpServers": {
    "stackmemory": {
      "command": "npx",
      "args": ["@ai-ulu/mcp-server"],
      "env": {
        "AI_ULU_API_URL": "https://your-stackmemory-instance.com",
        "AI_ULU_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools (15)

### Core Tools
| Tool | Description |
|------|-------------|
| `search_memories` | Keyword search with relevance scoring + optional Vectorize semantic search |
| `store_memory` | Store memory with **PII auto-scrubbing** and namespace isolation |
| `update_memory` | Update memory content (PII scrubbed) |
| `delete_memory` | Soft-delete with Vectorize cleanup |
| `query_memories` | Natural language query with multi-signal ranking |
| `list_memories` | List with pagination, truncation, namespace filter |
| `get_memory_graph` | Graph with sub-graph filtering via `filter_keyword` |
| `link_memories` | Create relationships between memories |

### Extended Tools
| Tool | Description |
|------|-------------|
| `sm_time_query` | Time-based memory query |
| `sm_memory_summary` | Statistics with namespace distribution |
| `sm_batch_operations` | Bulk update/delete/tag operations |
| `sm_export_memories` | Export to JSON/CSV (max 500 records) |
| `sm_concept_cluster` | Concept clustering (max 500 memories) |
| `sm_import_memories` | Import with PII scrubbing |
| `sm_prefetch` | **Proactive memory injection** — pre-fetch relevant memories for LLM context |

## v2.1 Features

### 🔐 PII / Secret Auto-Scrubbing
All content is automatically scanned for sensitive data before storage:
- Email, phone, credit card, SSN
- API keys (GitHub, GitLab, Slack, Supabase, AWS, Google)
- JWT tokens, passwords

### 🏗️ Namespace Isolation
Every tool accepts an optional `namespace` parameter for project-level isolation:
```json
{ "content": "Uses Next.js 15", "namespace": "ulu-router" }
```

### 🧠 Semantic Search (Cloudflare Vectorize)
When Workers AI + Vectorize bindings are configured:
- Embeddings generated on `store_memory` via `@cf/baai/bge-base-en-v1.5`
- Hybrid search: vector similarity (40%) + keyword (30%) + confidence (15%) + recency (15%)
- Graceful fallback to keyword-only if bindings unavailable

### 📉 Memory Decay
- `last_accessed` and `access_count` auto-updated on retrieval
- `importance_score` per memory (0.0–1.0)
- Exponential decay with 30-day half-life in ranking

### 🚦 Proactive Memory Injection (`sm_prefetch`)
Router-level pre-fetch: pass a raw user message, get back the most relevant memories for LLM context injection.

## Cloudflare Setup

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"

[ai]
binding = "AI"

[[vectorize]]
binding = "VECTORIZE"
index_name = "stackmemory-embeddings"
```

Create the Vectorize index:
```bash
npx wrangler vectorize create stackmemory-embeddings --dimensions=768 --metric=cosine
```

## Product Position

StackMemory is designed for:
- shared project memory across AI coding tools
- developer preferences and decision recall
- custom AI products that need a memory backend

It is not just a generic chat memory layer. The main use case is AI-native development workflows.
