# StackMemory MCP Server

**Model Context Protocol server for StackMemory**

Turn StackMemory into the shared memory layer for MCP-compatible AI coding tools and custom AI workflows.

## What This Does

The StackMemory MCP Server allows MCP-compatible clients to read and write memory through a shared backend.

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

## Available Tools

- `search_memories`
- `store_memory`
- `update_memory`
- `delete_memory`
- `query_memories`
- `health_check`
- `bulk_store_memories`
- `list_memories`
- `get_memory_graph`

## Product Position

StackMemory is designed for:
- shared project memory across AI coding tools
- developer preferences and decision recall
- custom AI products that need a memory backend

It is not just a generic chat memory layer. The main use case is AI-native development workflows.
