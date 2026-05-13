# StackMemory Product Vision

## One Memory Layer for Every AI Agent

StackMemory is not a notes app, a simple vector database, or a chat-history wrapper.

StackMemory is an **Agent Memory OS**: a shared, portable, user-owned memory layer for LLMs, autonomous agents, automation systems, MCP servers, coding copilots, workflow runners, and future personal AI models.

The product goal is simple:

> A user should not need to re-explain themselves, their projects, their preferences, their constraints, or their decisions to every AI tool they use.

StackMemory becomes the shared brain behind:

- Claude / Claude Code style coding agents
- Cursor / IDE copilots
- Codex-style repo agents
- Replit / cloud IDE agents
- n8n / Zapier / workflow automation agents
- Telegram / Discord / WhatsApp bots
- WordPress / e-commerce / marketplace operators
- Internal copilots and custom AI SaaS products
- Future personal AI companions and local small models

---

## North Star

**Every agent asks StackMemory before acting, and writes back after learning.**

A good agent session should follow this loop:

1. **Prefetch** relevant memory before execution.
2. **Act** with the right user/project context.
3. **Reflect** on what changed.
4. **Store** durable facts, preferences, rules, decisions, tasks, failures, and successes.
5. **Adapt** memory ranking from feedback.
6. **Consolidate** many low-level memories into high-value insights.

---

## Product Thesis

Most AI memory today is fragmented:

- ChatGPT memory is tied to ChatGPT.
- Claude project memory is tied to Claude.
- Cursor rules are tied to one editor/workspace.
- Agent frameworks usually keep memory inside one app or pipeline.
- Vector databases store data, but do not behave like a personal brain.

StackMemory should be different:

- **Model-agnostic**: works with any LLM.
- **Tool-agnostic**: works with MCP, REST, SDK, CLI, and automations.
- **User-owned**: memory belongs to the user or organization, not to one AI vendor.
- **Inspectable**: users can view, edit, export, import, approve, or delete memories.
- **Adaptive**: ranking changes based on feedback and usefulness.
- **Temporal**: memories age, decay, resurface, consolidate, or become shadow memories.
- **Personalizable**: over time it can generate a personal profile, a behavior model, and eventually training data for a small personal model.

---

## Product Layers

### 1. StackMemory Core

The durable memory substrate.

Core responsibilities:

- Store typed memories.
- Search and recall memories.
- Enforce namespace isolation.
- Enforce auth, quota, billing, and rate limits.
- Provide MCP, REST, SDK, and CLI access.
- Support import/export and deletion.
- Track memory access and usefulness.

### 2. StackMemory Brain

The cognitive layer.

Brain responsibilities:

- Think over retrieved memories.
- Detect contradictions.
- Simulate decisions against historical memory.
- Dream across namespaces/projects.
- Consolidate raw memories into insights.
- Adapt ranking weights from feedback.
- Report cognitive health.

### 3. StackMemory Persona

The personal intelligence layer.

Persona responsibilities:

- Build a stable personal profile from memory.
- Infer preferences, constraints, and working style.
- Generate agent-specific prompt packs.
- Compile task-specific context before an agent acts.
- Create supervised datasets for future personal model tuning.

### 4. Personal Mini Model Path

The long-term evolution.

The system should eventually support:

- A personal reranker trained from feedback.
- A user-specific context compiler.
- A small local/server-side model or adapter trained on approved memory-derived examples.
- A portable personal AI brain that can move across tools.

---

## The Personal AI Brain Loop

```text
User action / Agent event
        ↓
Memory capture
        ↓
PII/secret scrub + write intent guard
        ↓
Typed memory storage
        ↓
Scoring: semantic + keyword + importance + frequency + emotion + decay
        ↓
Quantum-like candidate selection
        ↓
Context compiler
        ↓
Agent execution
        ↓
Feedback / correction / outcome
        ↓
Adaptation + consolidation
        ↓
Personal profile / future model dataset
```

---

## Memory Types

Current core types should remain:

- `identity`
- `preference`
- `fact`
- `project`
- `rule`
- `decision`
- `task`
- `insight`

Productization should add:

- `goal` — long-term objective or desired outcome
- `constraint` — budget, time, access, legal, technical, or operational limit
- `correction` — user correction that should override previous behavior
- `failure` — attempted approach that did not work
- `success_pattern` — approach that worked well for this user/project
- `skill` — user skill, knowledge, or learning state
- `relationship` — important people, teams, clients, vendors, or roles
- `workflow` — recurring process or automation pattern

---

## Differentiator: Quantum-like Memory Selection

StackMemory should not retrieve memories as a flat top-K list only.

It should treat every candidate memory as a probability amplitude that may become relevant depending on context. The final context should emerge from multiple signals:

- Semantic similarity
- Keyword overlap
- Memory type
- Importance
- Confidence
- Recency
- Access frequency
- Emotional or operational weight
- Namespace/project relevance
- User feedback history
- Contradiction risk
- Temporal decay

This is not literal quantum computing in the hardware sense. It is a quantum-inspired scoring and collapse model:

1. Build a candidate superposition from search results.
2. Score each candidate with multiple weighted signals.
3. Suppress stale/noisy/contradicted memories.
4. Amplify high-value, recent, reinforced, or task-critical memories.
5. Collapse into the smallest useful context pack for the requesting agent.

---

## Differentiator: Time-Decaying Memory

Not every memory should remain equally important forever.

StackMemory should support memory aging:

- Recently used memories stay strong.
- Unused memories gradually decay.
- High-importance rules decay slowly.
- Tasks decay faster than identity/preferences.
- Deprecated or contradicted memories become shadow memories.
- Consolidated insights can replace many low-level fragments.

This avoids a bloated, noisy, overconfident AI memory.

---

## MVP Definition

The first sellable version should let a user:

1. Sign up.
2. Create an API key.
3. Copy an MCP configuration.
4. Connect one AI tool or automation pipeline.
5. Store and recall memories by project namespace.
6. Use `prefetch` before an agent action.
7. Store outcomes after an agent action.
8. View, edit, delete, export, and import memories.
9. See a personal/project memory graph.
10. Run brain status and consolidation.

---

## First Buyer Profiles

### AI power users

People who use multiple AI tools and hate repeating context.

### Developers and indie hackers

People building with Claude Code, Cursor, Codex-style agents, Replit, Bolt, Lovable, and n8n.

### Agent builders

Teams building autonomous workflows, AI SaaS, internal copilots, and automation agents.

### Operators

People managing content, e-commerce, ads, support, marketplaces, WordPress sites, and workflows through agents.

---

## Positioning

### Primary tagline

**One memory layer for every AI agent.**

### Secondary tagline

**Stop re-explaining yourself to every AI tool.**

### Technical tagline

**Model-agnostic persistent memory for LLM agents, MCP tools, and automation systems.**

---

## Rule for Refactors

This repository already contains valuable code. Refactoring must preserve working value.

Preferred approach:

1. Keep the existing MCP-first architecture.
2. Add product boundaries and specs before large rewrites.
3. Move legacy pieces behind compatibility adapters when possible.
4. Avoid deleting valuable experiments until they are replaced by tested equivalents.
5. Use feature flags for new brain/persona behavior.

---

## Strategic Endgame

StackMemory starts as shared agent memory.

It becomes a personal context engine.

Then it becomes a personal AI brain.

Eventually, it can produce or power a small personalized model that understands the user better than a generic LLM session ever could.
