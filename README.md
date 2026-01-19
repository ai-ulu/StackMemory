# 🧠 AI-ULU - The Operating System for AI

<div align="center">

![AI-ULU Logo](https://img.shields.io/badge/AI--ULU-v3.0-purple?style=for-the-badge&logo=brain&logoColor=white)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-green?style=flat-square&logo=supabase)](https://supabase.com)

**Sizi Gercekten Hatirlayan Yapay Zeka**

[Demo](https://ai-ulu.com) • [Docs](https://docs.ai-ulu.com) • [Chrome Extension](#chrome-extension) • [MCP Server](#mcp-server)

</div>

---

## 🎯 What is AI-ULU?

AI-ULU is not just another AI assistant. It's the **Operating System for AI** - a memory-first architecture that makes any AI remember, learn, and coordinate across multiple sources.

### The Problem
- ChatGPT forgets you after every conversation
- Claude doesn't know your preferences
- Each AI tool works in isolation
- No coordination between AI systems

### The Solution
AI-ULU provides:
- **Persistent Memory** - Never repeat yourself
- **MCP Hub Orchestrator** - Query multiple sources (web, GitHub, Notion, etc.) from one place
- **Zero-Knowledge Privacy** - Sensitive data stays on your device
- **Works Everywhere** - Web, Chrome Extension, MCP Server for Claude/Cursor

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       AI-ULU HUB                                │
│                    (Central Orchestrator)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Claude    │    │   Cursor    │    │   Web App   │        │
│   │   Desktop   │    │    IDE      │    │             │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             ▼                                   │
│                    ┌────────────────┐                           │
│                    │  MCP Hub API   │                           │
│                    │ /api/orchestrate│                          │
│                    └───────┬────────┘                           │
│                            │                                    │
│          ┌─────────────────┼─────────────────┐                  │
│          ▼                 ▼                 ▼                  │
│   ┌────────────┐    ┌────────────┐    ┌────────────┐           │
│   │🧠 Memory   │    │🔍 Brave    │    │💻 GitHub   │           │
│   │  (Local)   │    │  Search    │    │   Code     │           │
│   └────────────┘    └────────────┘    └────────────┘           │
│          │                 │                 │                  │
│   ┌────────────┐    ┌────────────┐    ┌────────────┐           │
│   │📝 Notion   │    │💬 Slack    │    │🗄️ Postgres│           │
│   └────────────┘    └────────────┘    └────────────┘           │
│                                                                 │
│   Result: Claude doesn't know it queried 5 systems.            │
│           Seamless, magical experience.                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Core Memory System
| Feature | Description |
|---------|-------------|
| **H(x,ψ,E) Algorithm** | Quantum-inspired memory scoring with Similarity, Decay, Importance, Frequency, and Emotional Resonance |
| **Memory Types** | Identity (who you are), Preference (what you like), Fact (what you know) |
| **Conflict Resolution** | Automatic detection and resolution of contradicting memories |
| **Memory Graph** | Visual network of your memories and their relationships |
| **Memory Insights** | AI-powered analysis of your memory patterns |

### MCP Hub Orchestrator
| Feature | Description |
|---------|-------------|
| **Smart Routing** | Automatically routes queries to the right MCP sources |
| **Parallel Execution** | Query multiple sources simultaneously |
| **Result Synthesis** | Combine and deduplicate results from multiple sources |
| **Caching** | Intelligent caching to reduce latency and costs |
| **8 Built-in Connectors** | Memory, Brave Search, GitHub, Filesystem, Notion, Slack, PostgreSQL, Fetch |

### Privacy & Security
| Feature | Description |
|---------|-------------|
| **Local-First Mode** | Keep sensitive data on your device |
| **Zero-Knowledge** | Only anonymized vectors go to cloud |
| **API Key Isolation** | Keys never exposed to frontend |
| **Row Level Security** | Database-level user isolation |

### Platform Support
| Platform | Status |
|----------|--------|
| **Web Application** | ✅ Full Support |
| **Chrome Extension** | ✅ Full Support |
| **MCP Server** | ✅ For Claude/Cursor |
| **Mobile PWA** | ✅ Installable |
| **API** | ✅ REST & MCP Protocol |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/agiulucom42-del/emergent-ai-ulu.com.git
cd emergent-ai-ulu.com/frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key

# MCP Sources (Optional)
BRAVE_API_KEY=your_brave_key
GITHUB_TOKEN=your_github_token
NOTION_API_KEY=your_notion_key
SLACK_BOT_TOKEN=your_slack_token

# Payments (Optional)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email (Optional)
RESEND_API_KEY=your_resend_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Project Structure

```
emergent-ai-ulu.com/
├── frontend/                 # Next.js 14 Application
│   ├── app/                  # App Router
│   │   ├── api/              # API Routes
│   │   │   ├── chat/         # Chat API with memory
│   │   │   ├── memories/     # Memory CRUD
│   │   │   ├── orchestrate/  # MCP Hub API
│   │   │   ├── stripe/       # Payment webhooks
│   │   │   └── teams/        # Team features
│   │   ├── admin/            # Admin dashboard
│   │   ├── analytics/        # Usage analytics
│   │   ├── chat/             # Main chat interface
│   │   ├── pricing/          # Pricing page
│   │   └── settings/         # User settings
│   │
│   ├── components/           # React Components
│   │   ├── chat/             # Chat UI components
│   │   ├── memory/           # Memory UI components
│   │   ├── settings/         # Settings components
│   │   └── ui/               # Shared UI (shadcn)
│   │
│   ├── lib/                  # Core Libraries
│   │   ├── mcp-hub/          # MCP Orchestrator
│   │   │   ├── orchestrator/ # Registry, Router, Executor
│   │   │   ├── connectors/   # Real MCP connectors
│   │   │   └── synthesis/    # Result synthesis
│   │   ├── email.js          # Email notifications
│   │   ├── stripe.js         # Payment integration
│   │   ├── memory-*.js       # Memory utilities
│   │   └── supabase/         # Database client
│   │
│   └── public/               # Static assets
│
├── chrome-extension/         # Chrome Extension
│   ├── popup/                # Extension popup UI
│   ├── background/           # Service worker
│   ├── content/              # Content scripts
│   └── manifest.json         # Extension manifest
│
├── mcp-server/               # MCP Server for Claude/Cursor
│   └── src/
│       └── index.ts          # MCP protocol implementation
│
└── backend/                  # Python backend (optional)
    └── server.py
```

---

## 🔌 MCP Hub API

Query multiple sources with a single API call:

```bash
# Query the orchestrator
curl -X POST http://localhost:3000/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"query": "What are Python best practices for 2025?"}'
```

Response:
```json
{
  "success": true,
  "synthesized": {
    "answer": "Based on your preferences (Python, FastAPI) and latest information...",
    "sources": [
      {"name": "AI-ULU Memory", "type": "memory"},
      {"name": "Web Search", "type": "web"}
    ],
    "confidence": 0.85
  },
  "totalTime": 1234
}
```

---

## 🧩 Chrome Extension

### Installation
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension/` folder

### Features
- 📸 Capture page content
- ✂️ Capture selected text
- 🔍 Query memories from any page
- 🔌 MCP Hub integration

---

## 🖥️ MCP Server (for Claude/Cursor)

### Installation

```bash
cd mcp-server
npm install
npm run build
```

### Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ai-ulu": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "AI_ULU_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Available Tools
| Tool | Description |
|------|-------------|
| `search_memories` | Search your memory |
| `store_memory` | Save new memory |
| `query_memories` | Natural language query |
| `get_memory_graph` | Get memory relationships |
| `create_reminder` | Set reminder |
| `orchestrate_query` | Query MCP Hub |

---

## 💰 Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 1,000 memories, 100 MCP calls, Web + Extension |
| **Pro** | $9.99/mo | 100k memories, 10k MCP calls, API, Teams (5) |
| **Enterprise** | $99/mo | Unlimited, Custom MCP, Self-hosted, SLA 99.9% |

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account

### Database Setup

Run these SQL commands in Supabase:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Create memories table
create table memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  content text not null,
  embedding vector(1536),
  type text default 'fact',
  importance float default 0.5,
  access_count integer default 0,
  last_accessed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table memories enable row level security;

-- RLS Policy
create policy "Users can manage own memories"
  on memories for all
  using (auth.uid() = user_id);
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🔒 Security

- All API keys are server-side only
- Row Level Security on all tables
- Local-First mode for sensitive data
- No third-party tracking
- GDPR compliant data handling

---

## 📊 Roadmap

### v3.1 (Q1 2025)
- [ ] Mobile app (React Native)
- [ ] Voice memory input
- [ ] Memory templates
- [ ] Multi-language support

### v3.2 (Q2 2025)
- [ ] Redis caching layer
- [ ] More MCP connectors (Confluence, Linear, etc.)
- [ ] Memory sharing marketplace
- [ ] Enterprise SSO

### v4.0 (Q3 2025)
- [ ] Self-hosted Enterprise version
- [ ] Custom LLM support
- [ ] Federated memory network
- [ ] AI-to-AI memory sharing

---

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) - MCP Protocol
- [Supabase](https://supabase.com) - Database & Auth
- [Vercel](https://vercel.com) - Hosting
- [shadcn/ui](https://ui.shadcn.com) - UI Components

---

<div align="center">

**Built with 💜 by the AI-ULU Team**

[Website](https://ai-ulu.com) • [Twitter](https://twitter.com/aiulu) • [Discord](https://discord.gg/aiulu)

</div>
