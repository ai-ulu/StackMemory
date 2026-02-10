<div align="center">

# 🧠 AI-ULU

**Your Personal AI Memory Assistant**

```
Remember Everything. Effortlessly.
```

[![Production Ready](https://img.shields.io/badge/production-ready-success)](https://github.com/ai-ulu/emergent-ai-ulu.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](docker-compose.yml)
[![Tests](https://img.shields.io/badge/tests-40%20passing-success)](frontend/e2e)
[![E2EE](https://img.shields.io/badge/E2EE-enabled-green)](backend/lib/encryption.py)
[![Security](https://img.shields.io/badge/security-RSA--2048%20%2B%20AES--256-brightgreen)](frontend/lib/encryption.ts)

[🚀 Try Free](https://ai-ulu.com/signup) · [📚 Docs](https://docs.ai-ulu.com) · [💬 Discord](https://discord.gg/aiulu) · [🐦 Twitter](https://twitter.com/aiulu)

</div>

---

## 🎯 What is AI-ULU?

AI-ULU is your **universal memory layer** for AI conversations.

Never lose context again. Your AI remembers everything across:
- 💬 **ChatGPT, Claude, Gemini** - Persistent memory across all AI chats
- 🖥️ **CLI & Terminal** - Command-line memory management
- 💼 **Slack, Discord, Telegram** - Team knowledge base
- 🔧 **VS Code, Cursor, Windsurf** - IDE integration via MCP
- 🌐 **Any Platform** - REST API + WebSocket + MCP Protocol

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🧠 Smart Memory
- **H(x,ψ) Scoring** - Intelligent memory ranking (similarity + decay + importance + frequency)
- **Semantic Search** - Find memories by meaning, not keywords
- **Auto-Capture** - AI automatically saves important info
- **Context Recall** - Remembers past conversations
- **Conflict Resolution** - Smart algorithm handles contradictions

</td>
<td width="50%">

### 🔒 Enterprise Security
- **End-to-End Encryption (E2EE)** - Your data is encrypted on your device before it reaches our servers
- **Zero-Knowledge Architecture** - We can't read your encrypted memories, only you can
- **Client-Side Encryption** - RSA-2048 + AES-256 encryption in your browser
- **Zero Trust Model** - No default access
- **Role-Based Access** - Granular permissions
- **Audit Logging** - Full transparency

</td>
</tr>
<tr>
<td width="50%">

### 🚀 Multi-Platform
- **Web App** - Beautiful, responsive UI
- **REST API** - Universal HTTP endpoints
- **WebSocket** - Real-time updates
- **MCP Protocol** - Claude, Cursor, Windsurf
- **CLI** - Terminal interface
- **Bots** - Slack, Discord, Telegram

</td>
<td width="50%">

### 👥 Team Collaboration
- **Shared Memory Pools** - Team knowledge base
- **Smart Sharing** - Secure chat export
- **Team Workspaces** - Isolated environments
- **Admin Dashboard** - Full control

</td>
</tr>
</table>

---

## 🚀 Quick Start

### 1️⃣ Web App (Easiest)

```bash
# Visit https://ai-ulu.com
# Sign up for free
# Start chatting with AI memory!
```

### 2️⃣ Self-Hosted (Docker)

```bash
git clone https://github.com/ai-ulu/emergent-ai-ulu.com
cd emergent-ai-ulu.com
cp .env.example .env
# Edit .env with your Supabase credentials
docker-compose up -d
```

Visit `http://localhost:3000` 🎉

### 3️⃣ CLI (Power Users)

```bash
# Install
pip install ai-ulu

# Configure
export AI_ULU_API_KEY=ulu_full_xxx...

# Use
ulu ask "What did I work on yesterday?"
ulu remember "I prefer dark mode" --type preference
ulu search "projects"
```

### 4️⃣ Python SDK

```python
from ai_ulu import AIULU

# Initialize
ulu = AIULU(api_key="ulu_full_xxx...")

# Query memory
response = ulu.ask("What do I like?")

# Store memory
ulu.remember("I love Python", type="preference")

# Search
results = ulu.search("machine learning projects")
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR AI APPS                         │
│   ChatGPT │ Claude │ CLI │ Slack │ VS Code │ Web ...   │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │       AI-ULU BRIDGE            │
         │   REST + WebSocket + MCP       │
         │   Rate Limiting │ Auth         │
         └───────────────┬────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │       AI-ULU CORE              │
         │   Memory Engine │ H(x,ψ)       │
         │   Semantic Search │ Embeddings │
         └───────────────┬────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │       SUPABASE                 │
         │   PostgreSQL │ Auth │ Storage  │
         └────────────────────────────────┘
```

---

## 🔐 Authentication & API

### API Keys

Get your API key from [Settings](https://ai-ulu.com/settings/keys)

```bash
Authorization: Bearer ulu_full_xxx...
```

### Scopes & Rate Limits

| Scope | Permissions | Rate Limit | Use Case |
|-------|-------------|------------|----------|
| `read` | Query, Search | 60/min | Read-only apps |
| `write` | + Create, Update | 30/min | Chat apps |
| `full` | + Delete | 100/min | Full control |
| `admin` | All operations | 200/min | Admin tools |

### API Endpoints

```
POST   /v1/query          Query memory with context
POST   /v1/memory         Store new memory
GET    /v1/memories       List all memories
DELETE /v1/memory/:id     Delete memory
POST   /v1/search         Semantic search
POST   /v1/orchestrate    MCP hub endpoint
WS     /ws/:session_id    Real-time updates
```

---

## 💻 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth

**Backend:**
- FastAPI (Python)
- PostgreSQL (Supabase)
- Redis (Caching)
- OpenAI Embeddings

**Infrastructure:**
- Docker + Docker Compose
- Nginx (Reverse Proxy)
- Prometheus + Grafana (Monitoring)
- GitHub Actions (CI/CD)

---

## 🧪 Testing

### Unit Tests
```bash
cd frontend
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

**Coverage:** 70% (28 tests passing)

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Headless
npm run test:e2e:ui      # Interactive UI
npm run test:e2e:headed  # See browser
```

**Coverage:** 31 tests × 5 browsers = 155 test runs

---

## 📦 Deployment

### Production (Docker)

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with production values

# 2. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 3. Check health
curl http://localhost:3000/api/health
curl http://localhost:8080/health

# 4. View logs
docker-compose logs -f
```

### Cloud Platforms

**Vercel (Frontend):**
```bash
vercel deploy
```

**Railway (Full Stack):**
```bash
railway up
```

**Fly.io:**
```bash
fly deploy
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Auth & Database
- [OpenAI](https://openai.com) - Embeddings
- [Vercel](https://vercel.com) - Hosting
- [shadcn/ui](https://ui.shadcn.com) - UI Components

---

<div align="center">

### 🚀 Ready to remember everything?

[**Try AI-ULU Free →**](https://ai-ulu.com/signup)

Made with ❤️ by the AI-ULU Team

[Website](https://ai-ulu.com) · [Docs](https://docs.ai-ulu.com) · [Discord](https://discord.gg/aiulu) · [Twitter](https://twitter.com/aiulu)

</div>
