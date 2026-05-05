# StackMemory MCP v2.0

<p align="center">
  <strong>Shared Memory Layer for AI Coding Workflows</strong><br>
  <em>One memory. Many tools. Same project context.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0-blue?style=for-the-badge" alt="Version 2.0">
  <img src="https://img.shields.io/badge/MCP-Streamable_HTTP-green?style=for-the-badge" alt="MCP Streamable HTTP">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-orange?style=for-the-badge" alt="Cloudflare Pages">
  <img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" alt="MIT License">
</p>

---

## 🚀 Live Endpoint

```
https://stackmemory-mcp.pages.dev/mcp
```

Connect any MCP-compatible client using **Streamable HTTP** transport.

## 🛠️ Tools (14)

### Core Memory Operations

| # | Tool | Description |
|---|------|-------------|
| 1 | `search_memories` | Search memories by keyword or semantic query |
| 2 | `store_memory` | Store a new memory with metadata and tags |
| 3 | `update_memory` | Update an existing memory entry |
| 4 | `delete_memory` | Delete a memory by ID |
| 5 | `query_memories` | Advanced query with filters and sorting |
| 6 | `list_memories` | List all memories with pagination |

### Graph & Relationship

| # | Tool | Description |
|---|------|-------------|
| 7 | `get_memory_graph` | Retrieve the memory relationship graph |
| 8 | `link_memories` | Create a link between two memories |

### v2.0 — Advanced Operations

| # | Tool | Description |
|---|------|-------------|
| 9 | `sm_time_query` | Query memories by time range and temporal patterns |
| 10 | `sm_memory_summary` | Generate AI-powered summary of memory collections |
| 11 | `sm_batch_operations` | Perform batch create/update/delete operations |
| 12 | `sm_export_memories` | Export memories to JSON/CSV formats |
| 13 | `sm_concept_cluster` | Cluster memories by conceptual similarity |
| 14 | `sm_import_memories` | Import memories from external data sources |

## 📦 Installation

### Claude Desktop Configuration

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

## 🔧 Local Development

```bash
pnpm install
pnpm build
pnpm deploy
pnpm start
```

## 🏗️ Architecture

- **Runtime**: Cloudflare Workers (Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Transport**: MCP Streamable HTTP
- **Protocol**: JSON-RPC 2.0

## 📋 Version History

| Version | Changes |
|---------|---------|
| v2.0 | Added time queries, batch ops, export/import, concept clustering, AI summaries; migrated to Cloudflare Pages |
| v1.0 | Initial release with core CRUD and graph operations |

---

<p align="center">
  Built by <a href="https://github.com/ai-ulu">ai-ulu</a> · Part of the MCP Toolkit
</p>
