# Changelog

All notable changes to StackMemory will be documented in this file.

## [3.2.0] - 2026-05-06 - Architecture Unification 🧹

### Changed — Single source of truth
- **Memories now live exclusively in the MCP server** (Cloudflare D1 + Vectorize).
  The Next.js frontend `/api/memories/*` and `/api/brain/*` routes were rewritten
  as thin proxies that call MCP via JSON-RPC.
- **Supabase is now identity-only** — auth, billing, teams, conversations,
  marketplace. The `memories` table is no longer written to from the dashboard.
- New `frontend/lib/mcp/client.ts` — typed JSON-RPC client (21 tools).
- New `frontend/lib/mcp/auth.ts` — single helper that maps the authenticated
  user to a `user:<id>` MCP namespace. Clients can never set namespaces directly.

### Removed
- `backend/` (FastAPI + MongoDB) — duplicated MCP CRUD with no production users.
- `bridge/` (Python REST proxy) — frontend now talks to MCP directly.
- `frontend/lib/brain/helpers.ts` — replaced by `mcp.callTool('brain_*')`.
- Frontend Supabase writes inside memory/brain routes.

### Added
- `ARCHITECTURE.md` — definitive component + data-flow reference.
- `MCP_SERVER_URL`, `NEXT_PUBLIC_MCP_SERVER_URL`, `MCP_SERVER_TOKEN`
  environment variables (see `.env.example`).
- `docker compose --profile selfhost` for local MCP development.
- `make mcp-deploy` for one-command Cloudflare deploys.

### Migration notes
- `MCP_SERVER_URL` defaults to `https://stackmemory-mcp.pages.dev/mcp` — no
  config change required for hosted deployments.
- Self-hosters should run `wrangler deploy` from `mcp-server/` and point the
  frontend at their worker URL.
- Existing Supabase `memories` rows are not migrated (clean-start release);
  archive via `pg_dump` if needed.



## [5.1.0] - 2026-05-06 - Ulu-Brain v2: Simulation & Imagination 🔮

### Added — brain_simulate: Decision Simulation Engine
- 🎯 **Risk-scored decision testing** before committing to major changes
  - Retrieves past `decision`, `rule`, and `insight` memories for the topic
  - Hybrid search: keyword + vector + cross-namespace (optional)
  - **Positive/negative signal detection** — bilingual patterns (EN/TR):
    - 🔴 Negative: `avoid, failed, deprecated, mistake, yapma, kaçın, hata, başarısız`
    - 🟢 Positive: `prefer, success, recommended, best, tercih, başarılı, önerilen`
  - **Decision conflict finder** — flags existing decisions that would be overridden
  - **Affected namespace mapping** — shows which projects are impacted
  - **5-level verdict system**: 🔴 HIGH RISK → 🟡 MODERATE → 🟠 CAUTION → 🟢 LOW RISK → ⚪ UNCHARTED
  - Overall risk score: 0.0 - 1.0 (weighted: high_risk×0.4, medium×0.2, contradictions×0.15)

### Added — brain_dream: Cross-Namespace Ideation Engine
- 💭 **Creative cross-pollination** between isolated project namespaces
  - Gathers high-value memories from each namespace (up to 10 namespaces, 30 memories each)
  - Extracts keyword signatures per namespace (word frequency + tag weighting)
  - **Bridge discovery** — finds shared concepts between namespace pairs (Jaccard threshold: 2+ shared keywords with freq ≥ 2)
  - **Bridge strength scoring** — `shared_keywords / min(ns_a_size, ns_b_size)`
  - **Unique pattern detection** — concepts with freq ≥ 3 that exist ONLY in one namespace
  - Focus mode: optional topic filter to guide the dream
  - Namespace filter: dream between specific namespaces
  - Example output: `💡 "e-commerce" and "game-engine" share [cache, latency, queue]`

### Changed
- MCP Server version: v3.0 → **v3.1.0**
- Total tools: 19 → **21**
- Bundle size: 100.9kb → 117.4kb

## [5.0.0] - 2026-05-06 - Ulu-Brain v1: Cognitive Layer 🧠

### Added — Ulu-Brain: 4 New Cognitive Tools
- 🧠 **`brain_think`** — Contextual reasoning engine
  - Retrieves top memories via hybrid search (vector + keyword)
  - Analyzes graph connections between retrieved memories
  - **Contradiction detection**: same-type memories with overlapping topics but different time periods
  - Returns cognitive assessment: confidence level, knowledge freshness, strategic recommendation
  - Supports `quick` (5), `normal` (10), `deep` (20) analysis depth
- 🔄 **`brain_adapt`** — Adaptive weight feedback loop
  - Records `useful`, `not_useful`, or `critical` feedback per memory
  - Auto-adjusts H-score weights per namespace (learning rate: 0.02, clamped [0.05, 0.60])
  - Boosts/decays `importance_score` on individual memories
  - Weights normalize to sum=1.0 after each adaptation
  - New D1 tables: `brain_config` (weights), `brain_feedback` (history)
- 🧹 **`brain_consolidate`** — Cognitive housekeeping
  - Clusters similar memories using Jaccard keyword similarity
  - Generates `insight` type memories summarizing each cluster
  - Links insights to source memories via `consolidated_from` graph relations
  - Vectorize embeddings generated for searchable insights
  - `dry_run` mode for preview without committing
- 📊 **`brain_status`** — Cognitive health report
  - Memory distribution by type and namespace
  - Freshness metrics (7d/30d created, 7d accessed, never accessed)
  - Adaptive weight state per namespace with useful ratio
  - Recent feedback activity
  - Cognitive load assessment: `nascent`, `healthy`, `cluttered`, `overloaded`
  - Actionable recommendations

### Added — New Memory Type
- 💡 **`insight`** type — consolidated knowledge generated by `brain_consolidate`
  - Importance score: 0.85 (high value — consolidated knowledge)
  - Added to all type validations: schema.sql, MCP server, frontend types, H-score maps

### Changed
- MCP Server version: v2.1 → **v3.0.0 (Ulu-Brain)**
- Total tools: 15 → **19**
- Bundle size: 75.8kb → 100.9kb
- README: Complete Ulu-Brain documentation section with usage examples

## [4.1.0] - 2026-05-06 - Audit Fixes: Type Consistency, Real Graph API, Configurable H-Score 🔧

### Fixed — Architecture Consistency (Audit §4.1)
- 🗂 **Memory type CHECK constraint** expanded from 3 → 7 types across all layers:
  - `schema.sql`: Added `project`, `rule`, `decision`, `task` to CHECK constraint
  - `mcp-server`: All 11 type validation points updated (enum, filter, store, import)
  - `chat/route.js`: H-score `importanceMap` and `moodTypeMap` extended for all 7 types

### Fixed — Stale Demo Code Removal (Audit §4.2)
- 🗑 **`/api/memory/graph`** — Replaced 130 lines of hardcoded demo data with real Supabase query
  - Supports both hosted (Supabase) and local dev mode
  - Auth-gated, returns max 200 active memories
  - Memory types aligned to actual schema (`IDENTITY`, `FACT`, `PREFERENCE`, etc.)
- 🗑 **`memory-graph/page.tsx`** — Removed client-side `generateDemoData()` function
  - Stats cards updated from `CONVERSATION`/`KNOWLEDGE` to `IDENTITY`/`FACT`

### Changed — Configurable H-Score Weights (Audit §4.4)
- ⚙️ **H-score weights** now configurable via environment variables for A/B testing:
  - `HSCORE_ALPHA` (similarity), `HSCORE_BETA` (decay), `HSCORE_GAMMA` (importance)
  - `HSCORE_DELTA` (frequency), `HSCORE_EPSILON` (emotional), `HSCORE_DECAY_RATE`
  - Defaults unchanged: α=0.35, β=0.15, γ=0.25, δ=0.10, ε=0.15, λ=0.02
  - Added to `.env.example` with documentation

### Changed — Structured Logging (Audit §4.5)
- 📊 **MCP Server** — Added structured JSON logger (`log()` function)
  - All `console.error` calls replaced with `log(level, component, message, data)`
  - Output format: `{"ts":"...","level":"ERROR","component":"vectorize","message":"..."}`
  - Enables Cloudflare Logpush / Sentry integration

## [4.0.0] - 2026-05-06 - MCP Server v2.1 Production Hardening 🛡️🧠

### Added — Security
- 🔐 **PII / Secret Auto-Scrubbing** on `store_memory`, `update_memory`, `sm_import_memories`
  - 15 regex patterns: email, credit card, phone, SSN, API keys (GitHub/GitLab/Slack/Supabase/AWS/Google), JWT, passwords
  - Sensitive data redacted before storage, original never persisted

### Added — Namespace Isolation
- 🏗️ **`namespace` parameter** on all 15 MCP tools for project-level isolation
  - DB schema: `namespace` column + composite index `(user_id, namespace)`
  - Auto-migration for existing tables, backward compatible (default: `'global'`)
  - `sm_memory_summary` shows namespace distribution in global mode

### Added — Semantic Search
- 🧠 **Cloudflare Vectorize + Workers AI** integration
  - `@cf/baai/bge-base-en-v1.5` (768-dim) embeddings on store
  - Hybrid search: vector similarity + keyword relevance + confidence + recency
  - Graceful fallback to keyword-only if bindings unavailable

### Added — Memory Decay
- 📉 **Automatic memory aging** with exponential decay (30-day half-life)
  - `last_accessed`, `access_count`, `importance_score` columns
  - `touchMemories()` auto-updates on every retrieval
  - Decay score integrated into all search/query ranking

### Added — Proactive Memory Injection
- 🚦 **`sm_prefetch` tool** — router-level pre-fetch for LLM context injection
  - Pass a raw user message → get top-K relevant memories ranked by vector + keyword + decay + importance
  - 5-signal scoring: semantic (35%) + keyword (20%) + confidence (15%) + recency (15%) + importance (15%)

### Added — Smart Truncation
- 📏 Content capped at 500 chars per memory in search/list/graph responses
- Hard cap: 200 items per response, 500 records per export/cluster

### Added — Search Improvements
- 🎯 **Keyword relevance scoring** with density, position, and occurrence bonuses
- **Multi-signal ranking** in `query_memories`: content + tags + confidence + decay
- `get_memory_graph`: `filter_keyword` parameter for sub-graph extraction

### Changed — Frontend Compatibility
- `Memory` interface in `types.ts` now includes `namespace`, `importance_score`, `last_accessed`, `access_count`
- `MEMORY_NAMESPACE` constant added for future adoption

### Infrastructure
- `wrangler.toml`: Workers AI + Vectorize bindings added
- MCP Server build: 75.1KB (was 65.2KB)
- 0 TypeScript errors, esbuild clean

## [3.5.0] - 2026-02-11 - H(x,ψ) Scoring System 🎯

### Added
- ✅ **H(x,ψ) Puanlama Sistemi** - Akıllı bellek sıralama
  - MemoryScorer sınıfı (similarity, decay, importance, frequency)
  - Cosine similarity hesaplama
  - Soft decay (exponential time decay)
  - Logarithmic frequency scaling
  - Configurable weights (α, β, γ, δ)
- ✅ **H(x,ψ) API** - 3 yeni endpoint
  - POST /api/memory/recall/h-score (H(x,ψ) ile arama)
  - GET /api/memory/h-score/weights (ağırlıkları getir)
  - POST /api/memory/h-score/weights (ağırlıkları güncelle)
- ✅ **MemoryOrchestrator Entegrasyonu**
  - H(x,ψ) ile otomatik sıralama
  - Episodic + Vector birleşik arama
  - Geriye dönük uyumluluk (use_h_score flag)
- ✅ **Tests** - 19 yeni test, 100% passing
  - H(x,ψ) formula correctness
  - Weight configuration
  - Monotonic decay
  - Ranking accuracy
  - Property-based tests (Özellik 37, 38, 39, 41)

### Changed
- 🔧 **backend/lib/memory_orchestrator.py** - H(x,ψ) entegrasyonu
- 🔧 **backend/server.py** - H(x,ψ) endpoints eklendi
- 🔧 **backend/tests/** - 19 yeni test eklendi

### Technical Details
- 🎯 H(x,ψ) = α(1-similarity) + β*decay + γ*importance + δ*frequency
- 🎯 Varsayılan ağırlıklar: α=0.4, β=0.2, γ=0.3, δ=0.1
- 🎯 Decay halflife: 30 gün
- 🎯 Tüm testler geçti: 34/34 ✅

## [3.4.0] - 2026-02-11 - Memory System Release 🧠

### Added
- ✅ **Memory System** - Comprehensive memory management
  - VectorStore (cosine similarity search)
  - EpisodicMemory (time-ordered episodes)
  - ShortTermMemory (FIFO buffer)
  - MemoryOrchestrator (multi-layer coordination)
- ✅ **Memory API** - 6 FastAPI endpoints
  - POST /api/memory/interaction
  - POST /api/memory/recall
  - GET /api/memory/stats
  - GET /api/memory/recent
  - POST /api/memory/episode
  - GET /api/memory/episodes
- ✅ **Memory Graph** - Interactive visualization
  - React-Force-Graph-2D integration
  - H(x,ψ) score-based node sizing
  - Similarity-based edges
  - Type-based coloring
  - Interactive tooltips
- ✅ **Memory Dashboard** - Full UI
  - 3 tabs: Graph, List, Search
  - Real-time stats
  - Semantic search
  - Memory details panel
- ✅ **Tests** - 26 tests, 100% passing
  - Backend: 15 unit tests (pytest)
  - Frontend: 11 E2E tests (Playwright)
- ✅ **Documentation**
  - MEMORY_SYSTEM_IMPLEMENTATION.md
  - MEMORY_SYSTEM_COMPARISON.md

### Changed
- 🔧 **backend/requirements.txt** - numpy, pytest-asyncio eklendi
- 🔧 **backend/server.py** - Memory endpoints eklendi
- 🔧 **frontend/package.json** - react-force-graph-2d eklendi

### Technical Details
- 🎯 H(x,ψ) algorithm (simplified)
- 🎯 Cosine similarity for vectors
- 🎯 MongoDB integration
- 🎯 Async/await everywhere
- 🎯 Graceful error handling
- 🎯 Production-ready logging

### Security
- 🔒 Input validation (Pydantic)
- 🔒 MongoDB injection prevention
- 🔒 Error handling at all levels
- 🔒 No secrets in code

### Performance
- ⚡ Numpy vectorization
- ⚡ Async I/O
- ⚡ Memory-efficient deque
- ⚡ Canvas-based graph rendering
- ⚡ Lazy loading

---

## [3.3.0] - 2026-02-11 - Production Ready Release 🚀

### Added
- ✅ **Dockerfile'lar** - Tüm servisler için production-ready Docker images
  - Frontend (Next.js 14 multi-stage build)
  - Backend (FastAPI)
  - Bridge (REST + WebSocket)
  - MCP Server (Claude/Cursor)
  - Bots (Slack, Discord, Telegram)
- ✅ **.env.example** - Environment variables template
- ✅ **.dockerignore** - Docker build optimization
- ✅ **.gitignore** - Git ignore patterns
- ✅ **Test scripts** - package.json test commands
- ✅ **next.config.js** - Production optimization
- ✅ **PRODUCTION_READY.md** - Deployment guide
- ✅ **CHANGELOG.md** - Version history

### Changed
- 🔧 **package.json** - Test scripts eklendi (test, test:watch, test:coverage)
- 🔧 **docker-compose.yml** - Health checks ve profiles

### Security
- 🔒 Secrets .env.example'a taşındı
- 🔒 .gitignore ile sensitive files korunuyor
- 🔒 API key scoped permissions

### Fixed
- 🐛 Missing Dockerfile'lar
- 🐛 Missing test scripts
- 🐛 Exposed secrets in .env

---

## [3.2.0] - 2026-01-19 - Universal Bridge Release

### Added
- 📡 Universal Bridge (REST + WebSocket + OpenAPI)
- 🔌 ChatGPT Actions support
- 🌐 Multi-protocol support

---

## [3.1.0] - 2026-01-15 - MCP Hub Release

### Added
- 🌐 MCP Hub Orchestrator
- 🔍 Brave Search connector
- 💻 GitHub connector (code/repo/issues)

---

## [3.0.0] - 2026-01-10 - Core Features Complete

### Added
- 🧠 H(x,ψ) Algorithm (spec-aligned)
- 📊 Memory Graph visualization
- ⚔️ Conflict Resolution UI
- 🔑 API Key Management
- 📤 Export/Import (JSON/CSV)
- 🧪 Test suite (Vitest)

### Changed
- 🎨 UI/UX improvements
- ⚡ Performance optimizations

---

## [2.0.0] - 2025-12-01 - Architecture Overhaul

### Added
- 🏗️ Microservices architecture
- 🐳 Docker Compose orchestration
- 📦 Python SDK
- 🤖 Bot framework (Slack, Discord)

### Changed
- 🔄 Migrated to Next.js 14
- 🗄️ Supabase integration
- 🔐 Authentication system

---

## [1.0.0] - 2025-10-01 - Initial Release

### Added
- 🎉 First public release
- 💾 Memory storage
- 🔍 Search functionality
- 🌐 REST API
- 📚 Documentation

---

## Upcoming

### [3.4.0] - Planned
- 🔄 Local-first mode (IndexedDB)
- 🔄 Sync engine
- 🔒 Privacy mode
- 📊 Enhanced analytics

### [4.0.0] - Future
- 🤖 Multi-agent orchestration
- 🧠 Advanced AI features
- 🌍 Multi-region support
- 📱 Mobile apps

---

**Legend:**
- ✅ Added
- 🔧 Changed
- 🐛 Fixed
- 🔒 Security
- 📚 Documentation
- ⚡ Performance
- 🎨 UI/UX

