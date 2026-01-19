# 🧠 AI-ULU - The Universal AI Backbone

<div align="center">

![AI-ULU Logo](https://img.shields.io/badge/AI--ULU-v3.2-purple?style=for-the-badge&logo=brain&logoColor=white)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Python](https://img.shields.io/badge/Python-SDK-blue?style=flat-square&logo=python)](sdk/python)
[![Discord](https://img.shields.io/badge/Discord-Bot-5865F2?style=flat-square&logo=discord)](bots/discord)
[![Slack](https://img.shields.io/badge/Slack-Bot-4A154B?style=flat-square&logo=slack)](bots/slack)

**Tek bir beyin, her yerde.** ChatGPT'de konusun, VS Code'da kodla, Notion'da not al. AI-ULU hepsini hatirlar ve birlestirir.

[Demo](https://ai-ulu.com) • [Docs](https://docs.ai-ulu.com) • [Discord](https://discord.gg/aiulu) • [Twitter](https://twitter.com/aiulu)

</div>

---

## 🌍 Universal Ecosystem

AI-ULU sadece bir eklenti degil, tum yapay zeka araclarinizin arkasindaki **ortak hafiza ve islemci katmanidir**. Hangi araci kullanirsaniz kullanin, AI-ULU oradadir.

| Kategori | Desteklenen Platformlar & Araclar | Entegrasyon Tipi |
|----------|-----------------------------------|-------------------|
| **🤖 AI Chatbots** | **ChatGPT** (GPT Actions), **Claude.ai**, **Perplexity**, **Gemini**, **HuggingChat** | Custom Actions / Extension |
| **💻 IDE & Code** | **VS Code**, **Cursor**, **Zed**, **JetBrains** (IntelliJ/PyCharm), **Neovim** | Extension / MCP / CLI |
| **💬 Messaging** | **Slack**, **Discord**, **Telegram**, **WhatsApp**, **Microsoft Teams** | Bot / Webhooks |
| **🛠️ Agent Frameworks** | **LangChain**, **AutoGPT**, **BabyAGI**, **LlamaIndex**, **CrewAI** | SDK / API |
| **🖥️ Terminal / CLI** | **Bash**, **Zsh**, **PowerShell**, **Warp**, **iTerm2** | CLI Tool (`ulu`) |
| **☁️ Cloud & Data** | **Notion**, **Google Drive**, **Linear**, **Jira**, **Trello**, **Obsidian** | MCP Connectors |
| **🌐 Web** | **Chrome**, **Firefox**, **Safari**, **Arc**, **Brave** | Browser Extension |
| **📱 Mobile** | **iOS** (Shortcuts), **Android** (Tasker) | PWA + Shortcuts |

---

## 🔌 Nasil Calisir?

```
                    ┌─────────────────────────────────────────┐
                    │         AI-ULU UNIVERSAL HUB            │
                    │      (The AI Operating System)          │
                    └───────────────────┬─────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│   REST API    │             │   WebSocket   │             │ MCP Protocol  │
│  (Universal)  │             │  (Real-time)  │             │(Claude/Cursor)│
└───────┬───────┘             └───────┬───────┘             └───────┬───────┘
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│  • ChatGPT    │             │  • Slack Bot  │             │  • Claude     │
│  • LangChain  │             │  • Discord    │             │  • Cursor     │
│  • CLI (ulu)  │             │  • Telegram   │             │  • Windsurf   │
│  • Any HTTP   │             │  • Live Apps  │             │  • Zed        │
└───────────────┘             └───────────────┘             └───────────────┘
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/agiulucom42-del/emergent-ai-ulu.com.git
cd emergent-ai-ulu.com

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start everything
docker-compose up -d

# Core services are now running:
# - Frontend: http://localhost:3000
# - Bridge API: http://localhost:8080
# - API Docs: http://localhost:8080/docs
```

### Option 2: Manual Installation

```bash
# Frontend
cd frontend && npm install && npm run dev

# Bridge Server
cd bridge && pip install -r requirements.txt && python server.py

# CLI Tool
chmod +x cli/ulu && sudo ln -s $(pwd)/cli/ulu /usr/local/bin/ulu
```

---

## 📦 Components

### 1. 🌐 Universal Bridge API (`/bridge`)

REST + WebSocket server that connects AI-ULU to everything.

```bash
# Start bridge
cd bridge && python server.py

# Query API
curl -X POST http://localhost:8080/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What do I prefer for breakfast?"}'

# Store memory
curl -X POST http://localhost:8080/v1/memory \
  -H "Content-Type: application/json" \
  -d '{"content": "I love coffee", "type": "preference"}'

# Full MCP Hub orchestration
curl -X POST http://localhost:8080/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"query": "Python best practices 2025"}'
```

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/query` | POST | Natural language query |
| `/v1/memory` | POST | Store memory |
| `/v1/search` | POST | Search memories |
| `/v1/orchestrate` | POST | Full MCP Hub query |
| `/v1/chat` | POST | Conversational chat |
| `/ws/{client_id}` | WS | Real-time WebSocket |
| `/openapi-gpt.json` | GET | OpenAPI for ChatGPT |
| `/docs` | GET | Interactive API docs |

### 2. 🖥️ CLI Tool (`/cli`)

Terminal interface for AI-ULU.

```bash
# Install
chmod +x cli/ulu
sudo ln -s $(pwd)/cli/ulu /usr/local/bin/ulu

# Usage
ulu ask "What's my favorite programming language?"
ulu remember "I prefer TypeScript over JavaScript" --type preference
ulu search "project deadlines"
ulu orchestrate "How to optimize React performance" -v
ulu chat  # Interactive mode
ulu status
```

### 3. 🐍 Python SDK (`/sdk/python`)

Use AI-ULU in any Python application.

```bash
pip install ai-ulu  # Coming soon
# Or install locally:
pip install -e sdk/python
```

```python
from ai_ulu import AIULU, MemoryType

# Initialize
ulu = AIULU(api_key="your-key")

# Ask a question
result = ulu.ask("What's my favorite color?")
print(result.answer)

# Store a memory
ulu.remember("I love Python", type=MemoryType.PREFERENCE)

# Search memories
results = ulu.search("programming")
for mem in results.memories:
    print(f"- {mem.content}")

# Full orchestration
result = ulu.orchestrate("Latest AI news")
print(result.answer)
```

### 4. 🦜 LangChain Integration

```python
from ai_ulu.langchain import AIULUMemory, AIULURetriever, create_ai_ulu_tools
from langchain.chains import ConversationChain
from langchain.chat_models import ChatOpenAI

# As conversation memory
memory = AIULUMemory()
chain = ConversationChain(llm=ChatOpenAI(), memory=memory)
response = chain.predict(input="I love pizza")
# Automatically stores preferences!

# As retriever
retriever = AIULURetriever()
docs = retriever.get_relevant_documents("my preferences")

# As agent tools
tools = create_ai_ulu_tools()
# Use with any LangChain agent
```

### 5. 💬 Slack Bot (`/bots/slack`)

```bash
# Setup
export SLACK_BOT_TOKEN=xoxb-xxx
export SLACK_SIGNING_SECRET=xxx
cd bots/slack && python bot.py

# Usage in Slack
@AI-ULU remember Meeting with client at 3pm tomorrow
@AI-ULU ask What meetings do I have?
@AI-ULU search project deadlines
@AI-ULU hub Latest React best practices
```

### 6. 🎮 Discord Bot (`/bots/discord`)

```bash
# Setup
export DISCORD_TOKEN=xxx
cd bots/discord && python bot.py

# Usage in Discord
!ulu ask What's my favorite game?
!ulu remember I prefer dark mode in all apps
!ulu search work projects
!ulu hub Python async patterns
```

### 7. 🤖 ChatGPT Custom GPT

Create a Custom GPT with AI-ULU memory:

1. Go to [ChatGPT](https://chat.openai.com) → Create GPT
2. In "Configure" → "Actions" → "Import from URL"
3. Enter: `https://bridge.ai-ulu.com/openapi-gpt.json`
4. Set Authentication: Bearer Token with your AI-ULU API key
5. Save and use!

Now ChatGPT can remember everything about you.

---

## 🏗️ Architecture

```
emergent-ai-ulu.com/
│
├── frontend/                 # Next.js 14 Web Application
│   ├── app/                  # App Router (pages, API routes)
│   ├── components/           # React components
│   ├── lib/                  # Core libraries
│   │   └── mcp-hub/          # MCP Orchestrator
│   └── public/               # Static assets
│
├── bridge/                   # Universal Bridge Server
│   ├── server.py             # FastAPI (REST + WebSocket)
│   └── requirements.txt
│
├── cli/                      # Command Line Interface
│   └── ulu                   # CLI executable
│
├── sdk/                      # SDKs
│   └── python/               # Python SDK
│       └── ai_ulu/
│           ├── client.py     # Main client
│           ├── memory.py     # Memory types
│           └── langchain.py  # LangChain integration
│
├── bots/                     # Chat Bots
│   ├── slack/                # Slack bot
│   ├── discord/              # Discord bot
│   └── telegram/             # Telegram bot
│
├── mcp-server/               # MCP Server for Claude/Cursor
│   └── src/index.ts
│
├── chrome-extension/         # Browser Extension
│
└── docker-compose.yml        # One-command deployment
```

---

## 🔧 Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key

# MCP Sources (Optional - enables more capabilities)
BRAVE_API_KEY=your_brave_key           # Web search
GITHUB_TOKEN=your_github_token         # Code search
NOTION_API_KEY=your_notion_key         # Notion integration
SLACK_BOT_TOKEN=your_slack_token       # Slack integration

# Payments (Optional)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email (Optional)
RESEND_API_KEY=your_resend_key

# Bots (Optional)
DISCORD_TOKEN=your_discord_token
TELEGRAM_TOKEN=your_telegram_token
```

---

## 💰 Pricing

| Plan | Price | Memories | MCP Calls | Features |
|------|-------|----------|-----------|----------|
| **Free** | $0/mo | 1,000 | 100/mo | Web, Extension, CLI |
| **Pro** | $9.99/mo | 100,000 | 10,000/mo | + API, Teams (5), Bots |
| **Enterprise** | $99/mo | Unlimited | Unlimited | + Self-hosted, Custom MCP, SLA |

---

## 📊 Roadmap

### v3.3 (Q1 2025)
- [ ] Telegram bot
- [ ] WhatsApp integration
- [ ] Obsidian plugin
- [ ] VS Code extension (native)

### v4.0 (Q2 2025)
- [ ] Local LLM support (Ollama/LM Studio)
- [ ] Siri & Google Assistant bridge
- [ ] IoT / Home Assistant
- [ ] Federated memory network

### v5.0 (Q3 2025)
- [ ] AI-to-AI memory sharing
- [ ] Browser automation (Puppeteer)
- [ ] Voice-first interface
- [ ] Enterprise SSO

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Development setup
git clone https://github.com/agiulucom42-del/emergent-ai-ulu.com.git
cd emergent-ai-ulu.com

# Frontend
cd frontend && npm install && npm run dev

# Bridge
cd bridge && pip install -r requirements.txt && python server.py

# Run tests
npm test && pytest
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

<div align="center">

**🧠 One brain, everywhere.**

**AI-ULU - The Universal AI Backbone**

[Website](https://ai-ulu.com) • [Docs](https://docs.ai-ulu.com) • [Discord](https://discord.gg/aiulu) • [Twitter](https://twitter.com/aiulu)

</div>
