<div align="center">

# AI-ULU

**Universal Memory & Context Infrastructure for AI**

```
One brain. Every AI. Everywhere.
```

[![PyPI](https://img.shields.io/pypi/v/ai-ulu?color=purple)](https://pypi.org/project/ai-ulu/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](docker-compose.yml)

[Docs](https://docs.ai-ulu.com) · [Discord](https://discord.gg/aiulu) · [Twitter](https://twitter.com/aiulu)

</div>

---

## What is AI-ULU?

AI-ULU is a **memory and context backbone** for AI applications.

- **Memory that persists** across sessions, tools, and platforms
- **Context that travels** with you—ChatGPT, CLI, Slack, your IDE
- **One API** to rule them all

## Install

```bash
pip install ai-ulu
```

## Quick Start

### CLI

```bash
export AI_ULU_API_KEY=ulu_full_xxx...

ulu ask "What's my favorite programming language?"
ulu remember "I prefer dark mode" --type preference
ulu search "projects"
```

### Python

```python
from ai_ulu import AIULU

ulu = AIULU(api_key="...")
ulu.ask("What do I like?")
ulu.remember("I love Python", type="preference")
```

### Self-Hosted

```bash
git clone https://github.com/agiulucom42-del/emergent-ai-ulu.com
cd emergent-ai-ulu.com
docker-compose up -d
```

## Features

| Feature | Description |
|---------|-------------|
| **REST API** | Universal HTTP endpoints |
| **WebSocket** | Real-time updates |
| **MCP Protocol** | Claude, Cursor, Windsurf |
| **SDK** | Python, LangChain |
| **CLI** | Terminal interface |
| **Bots** | Slack, Discord |

## Authentication

```bash
Authorization: Bearer ulu_full_xxx...
```

| Scope | Permissions | Rate Limit |
|-------|-------------|------------|
| `read` | Query, Search | 60/min |
| `write` | + Create, Update | 30/min |
| `full` | + Delete | 100/min |
| `admin` | All | 200/min |

## API

```
POST /v1/query       Query memory
POST /v1/memory      Store memory
POST /v1/search      Search
POST /v1/orchestrate MCP Hub
WS   /ws/{id}        Real-time
```

## Architecture

```
┌──────────────────────────────────────────┐
│            YOUR AI APPS                  │
│  ChatGPT │ CLI │ Slack │ VS Code │ ...  │
└────────────────────┬─────────────────────┘
                     │
         ┌───────────┴───────────┐
         │     AI-ULU BRIDGE     │
         │  REST + WS + MCP      │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │     AI-ULU CORE       │
         │  Memory │ Context     │
         └───────────────────────┘
```

## License

MIT

---

<div align="center">

**One brain. Every AI. Everywhere.**

</div>
