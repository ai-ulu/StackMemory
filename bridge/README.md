# StackMemory Bridge

REST and WebSocket bridge for StackMemory.

Use this service when you want to connect:
- n8n workflows
- internal AI apps
- custom copilots
- agent runtimes
- backend services that need shared project memory

## What It Exposes

- `POST /v1/memory`
  Write new memory records such as project rules, preferences, decisions, or tasks.
- `POST /v1/search`
  Retrieve relevant memory before an agent or automation step.
- `POST /v1/query`
  Ask StackMemory to combine query + retrieval into one response path.
- `POST /v1/orchestrate`
  Run a higher-level workflow against the memory layer.
- WebSocket support
  Use for real-time workflows and streaming integrations.

## Example: n8n Memory Write

Use an HTTP Request node:

```http
POST http://localhost:8080/v1/memory
Authorization: Bearer ulu_full_xxx
Content-Type: application/json

{
  "content": "Prefer small diffs and TypeScript-first changes",
  "type": "preference",
  "source": "n8n"
}
```

## Example: n8n Memory Search

Call this before your agent node:

```http
POST http://localhost:8080/v1/search
Authorization: Bearer ulu_full_xxx
Content-Type: application/json

{
  "query": "active project constraints",
  "limit": 5
}
```

## Example: Custom App Query

Use this in your own backend or copilot service:

```http
POST http://localhost:8080/v1/query
Authorization: Bearer ulu_full_xxx
Content-Type: application/json

{
  "query": "What should this coding agent remember before editing the repo?",
  "source": "custom_app",
  "context": {
    "workspace": "stackmemory-web"
  }
}
```

## Recommended Pattern

1. Write durable project context into StackMemory.
2. Search or query that context before each agent step.
3. Return important new decisions or task updates back into memory.

This keeps Claude Code, Cursor, custom apps, and automation workflows aligned on the same project state.
