# 🧠 Ulu-Brain (Powered by StackMemory)

**The Persistent Cognitive Layer for AI Agents.**

StackMemory is not just a database; it is the **Context Control Plane** for the next generation of AI products. It provides AI agents with a long-term, self-evolving memory that mimics human cognitive processes—remembering what matters, forgetting what's redundant, and dreaming up new connections.

---

## ✨ The "Ulu-Brain" Advantage

While standard RAG systems simply fetch text, **Ulu-Brain** processes knowledge through a multi-layered cognitive engine:

### 🔮 Cognitive Engines (v5.1)
- **`brain_simulate`**: Run risk-scored decision testing before committing to major changes. It analyzes past successes and failures to provide a 5-level risk verdict.
- **`brain_dream`**: Discover hidden bridges between isolated projects. It creatively cross-pollinates ideas between different namespaces (e.g., "What can my 'Game Engine' project learn from my 'E-commerce' project?").
- **`brain_think`**: A contextual reasoning engine that detects contradictions and knowledge freshness to give strategic recommendations.
- **`brain_consolidate`**: Automatic cognitive housekeeping. It clusters similar memories and generates high-level **Insights** (Knowledge Synthesis).

### 📉 Scientific Token Optimization: H(x,ψ)
Ulu-Brain uses the proprietary **H(x,ψ) Scoring System** to rank memories based on:
- 🎯 **Similarity**: Semantic relevance.
- 📉 **Decay**: Exponential aging of unused knowledge.
- ⭐️ **Importance**: Human-verified or system-inferred weight.
- 📊 **Frequency**: How often the information is accessed.

**The Result:** Up to **60% reduction in prompt costs** by compiling only the highest-quality context block.

### 🛡️ Persistence & Safety
- **Memory Versioning:** A full audit trail for every thought. Restore past versions of any memory (Git for your brain).
- **Conflict Resolution:** Detects and flags contradictions in real-time, preventing "AI Hallucinations" caused by stale data.
- **Zero-Trust Security:** PII scrubbing (API keys, secrets, personal data) and strictly isolated namespaces.

---

## 👥 Who is this for?

### 👨‍💻 Power Developers
Your coding agent shouldn't forget your architecture decisions every 10 minutes. Use Ulu-Brain to persist coding styles, library choices, and "lessons learned" across sessions.

### 🏛️ AI-First Enterprises
Build a unified corporate memory. Isolated team namespaces ensure that marketing agents and engineering agents share knowledge only where you want them to.

### 🧪 Researchers & Writers
Connect thousands of notes, papers, and ideas. Let the `brain_dream` engine find the "missing link" in your research.

---

## 🛠 Tech Stack & Cognitive Layer

StackMemory is built for stability, privacy, and extreme context performance.

- **Frontend/API:** Next.js 14 (App Router) - Enterprise-grade React framework.
- **Primary Brain (DB):** [Supabase](https://supabase.com/) - Postgres-backed memory with Row Level Security (RLS).
- **Vektör & Search:** pgvector (Supabase) for semantic recall.
- **Auth & Billing:** Integrated Supabase Auth + Stripe Entitlements.
- **MCP Adapter:** High-performance proxy for AI Agent integration (Claude, Gemini, OpenAI).

## 🏗 Architecture: The Service-Repository Pattern

Unlike typical "vibe-coded" projects, StackMemory follows a strict architectural boundary:

1. **Service Layer:** High-level cognitive logic (Simulate, Dream, Think).
2. **Repository Layer:** Clean data access. Swappable implementations (Supabase is default).
3. **API Controllers:** Next.js Route Handlers managing authentication and billing gates.
4. **MCP Bridge:** A thin adapter that allows external AI agents to access your personal brain securely.

---

## 🚀 Quick Start

### 1. Setup Your Brain (Supabase)
1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** and run the contents of `frontend/supabase/schema.sql`. This will create the `memories`, `memory_versions`, and `brain_insights` tables with proper pgvector support.
3. Enable **Row Level Security (RLS)** as defined in the schema to protect your data.

### 2. Configuration
Create a `.env.local` file in the `frontend/` directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Optional for Brain Engines:
OPENAI_API_KEY=your_key
# or
GEMINI_API_KEY=your_key
```

### 3. Start Developing
```bash
# Start the Dashboard
cd frontend && npm install && npm run dev
```

### 4. Connect Your Agent
Add the following to your `claude_desktop_config.json` or Cursor settings:
```json
"mcpServers": {
  "stackmemory": {
    "command": "npx",
    "args": ["-y", "@ai-ulu/mcp-server"]
  }
}
```

---

## 🗺️ Roadmap

- [x] **v5.1:** Simulation & Ideation Engines.
- [ ] **v5.5:** Proactive Intelligence (Background auto-linking & conflict alerts).
- [ ] **v6.0:** Local-First Hybrid Sync (IndexedDB + Cloudflare).
- [ ] **v7.0:** Distributed Memory Graph (P2P Memory Sharing).

---

## 📄 License
MIT © AI-ULU. Built with ❤️ for the Agentic future.
