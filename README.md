# StackMemory

**Shared Memory Layer For AI Coding Workflows**

```
One memory. Many tools. Same project context.
```

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](docker-compose.yml)
[![MCP](https://img.shields.io/badge/MCP-supported-green)](mcp-server/README.md)
[![API](https://img.shields.io/badge/API-bridge-ready-blue)](bridge/server.py)

## What It Is

StackMemory is a shared memory layer for developers, AI power users, and builders working across multiple AI coding tools.

It is designed for workflows that span tools such as:
- Claude Desktop and MCP-compatible clients
- Cursor and VS Code AI-assisted development
- Codex-style agents and internal developer copilots
- Bolt, Lovable, and Replit-style builder environments
- Custom AI apps that need persistent user or project memory

StackMemory can be used in two ways:
- As a **developer-facing memory workspace**
- As a **memory backend** through REST API, WebSocket, MCP, and SDK

## Core Value

AI tools are good at generating output and bad at preserving durable context across sessions and surfaces.

StackMemory gives you one place to store and retrieve:
- project context
- coding preferences
- architecture decisions
- active work items
- reusable instructions

The goal is simple:

**Stop re-explaining your project to every AI tool.**

## Core Product Surfaces

- [frontend](frontend) - user-facing memory workspace
- [bridge](bridge) - REST and WebSocket bridge for apps and agents
- [bridge/README.md](bridge/README.md) - quick start for n8n and custom app integration
- [mcp-server](mcp-server) - MCP server for compatible tools
- [sdk/python](sdk/python) - Python SDK for custom integrations

## Key Features

- **Shared project memory** across coding workflows
- **Semantic recall** for prior decisions and preferences
- **Memory write + search APIs** for custom tools
- **MCP integration** for AI coding clients
- **User-controlled memory** with inspect, edit, export, and delete flows
- **Security-oriented design** with encryption and access control layers

## Example Use Cases

### For End Users

- Resume work in Claude after starting in Cursor
- Keep your coding style and project rules available across sessions
- Preserve architecture choices and stack preferences
- Reuse the same context in IDE agents, web tools, and custom workflows

### For Builders

- Add persistent memory to your own AI coding assistant
- Store project-specific constraints and user preferences
- Use StackMemory as a retrieval layer behind your agent system
- Expose memory through API, bridge, or MCP depending on the client

## Quick Start

### Local App

```bash
git clone https://github.com/ai-ulu/emergent-ai-ulu.com
cd emergent-ai-ulu.com
cp .env.example .env
docker-compose up -d
```

### Python SDK

```python
from ai_ulu import AIULU

ulu = AIULU(api_key="ulu_full_xxx...")

result = ulu.ask("What project constraints have I already defined?")
print(result.answer)

ulu.remember("Prefer TypeScript and small diffs", type="preference")
```

### MCP Server

See [mcp-server/README.md](mcp-server/README.md) for Claude Desktop and MCP-compatible configuration.

### n8n / Custom App Bridge

See [bridge/README.md](bridge/README.md) for HTTP examples covering:
- memory writes from automation flows
- memory search before agent execution
- query orchestration for custom AI apps

The frontend also includes a builder-focused integration guide at `/integrations`.

## Product Direction

This repository is being shaped around a focused product direction:

**StackMemory is for AI-native development workflows first.**

That means the primary focus is:
- developers using multiple AI coding tools
- teams that need shared project context
- builders embedding memory into their own AI applications

It is not being optimized first for generic consumer chat memory, bots, or broad non-technical use cases.

## Architecture

```text
AI Coding Tools / Agents
        |
        v
   MCP / API / SDK
        |
        v
    StackMemory Bridge
        |
        v
    Memory Engine
        |
        v
   Storage + Retrieval
```

## Repository Notes

Important directories:
- [frontend](frontend)
- [backend](backend)
- [bridge](bridge)
- [mcp-server](mcp-server)
- [sdk](sdk)
- [chrome-extension](chrome-extension)

Secondary or later-stage surfaces:
- [bots](bots)
- [monitoring](monitoring)
- [nginx](nginx)

## License

MIT
