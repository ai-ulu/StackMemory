# StackMemory Productization Roadmap

## Goal

Turn StackMemory into a production-ready shared memory layer for LLM agents, automation systems, MCP clients, and future personal AI brains.

This roadmap assumes the existing MCP-first architecture is valuable and should be preserved.

---

## Phase 0 — Protect Valuable Code

Status: current branch starts here.

Actions:

- Do not start from a clean repo unless the current repo becomes impossible to maintain.
- Keep the MCP server as the memory source of truth.
- Keep the Next.js frontend as product dashboard and onboarding surface.
- Keep Supabase for identity, billing, teams, and non-memory product data.
- Keep Cloudflare D1 + Vectorize for memory backend unless benchmarking proves otherwise.

Deliverables:

- `PRODUCT_VISION.md`
- `docs/PERSONAL_AGENT_BRAIN.md`
- `docs/PRODUCTIZATION_ROADMAP.md`

---

## Phase 1 — Secure the Agent Memory Layer

Why this matters:

A shared memory layer is valuable only if it is safe. Public or weakly isolated memory access cannot become a SaaS product.

### Tasks

1. Add mandatory auth to MCP requests.
2. Support API keys with scopes.
3. Resolve user/team/org namespace server-side.
4. Block client-supplied namespace escalation.
5. Add quota enforcement by plan.
6. Add per-key and per-user rate limits.
7. Add audit logs for reads, writes, exports, deletes, and team access.
8. Add memory access policy tests.

### API key scopes

Suggested scopes:

- `memory:read`
- `memory:write`
- `memory:delete`
- `memory:export`
- `brain:read`
- `brain:write`
- `admin:keys`
- `admin:team`

### Done when

- An unauthenticated MCP request cannot read/write anything.
- A user cannot access another user's namespace by passing a custom namespace.
- Free/Pro/Team limits are enforced server-side.
- API keys can be revoked.

---

## Phase 2 — Fix SDK and CLI Around MCP

Why this matters:

The SDK/CLI should be the easiest way for agents and builders to adopt StackMemory.

### Tasks

1. Rename public package concepts from legacy AI-ULU to StackMemory while preserving compatibility.
2. Make the Python SDK talk to MCP JSON-RPC directly or to a supported REST gateway.
3. Add `prefetch`, `think`, `adapt`, `consolidate`, and `status` commands.
4. Add `mcp-config` command for supported clients.
5. Add environment variables:
   - `STACKMEMORY_API_KEY`
   - `STACKMEMORY_MCP_URL`
   - `STACKMEMORY_NAMESPACE`
6. Add examples for:
   - Claude Desktop / MCP
   - Cursor style workflow
   - n8n HTTP Request node
   - custom Python agent

### Desired CLI

```bash
stackmemory login
stackmemory key create --name "Cursor laptop"
stackmemory remember "Prefer small TypeScript diffs" --type preference --namespace project:stackmemory
stackmemory search "project rules" --namespace project:stackmemory
stackmemory prefetch "Refactor MCP auth" --agent cursor --depth normal
stackmemory think "Should we move memory storage to Supabase?" --depth deep
stackmemory mcp-config --client claude-desktop
```

### Done when

- A developer can install the SDK, create a key, store memory, search memory, and generate MCP config in under 10 minutes.

---

## Phase 3 — Context Compiler MVP

Why this matters:

Agents do not need raw memory dumps. They need small, structured, task-specific context packs.

### Tasks

1. Extend `sm_prefetch` into a context compiler.
2. Add input parameters:
   - `agent_type`
   - `task`
   - `risk_level`
   - `depth`
   - `namespace`
   - `include_failures`
   - `include_constraints`
3. Return separated context sections:
   - profile
   - hard rules
   - preferences
   - active constraints
   - relevant decisions
   - known failures
   - success patterns
   - active tasks
   - avoid list
4. Return memory IDs and confidence.
5. Add token budget controls.

### Done when

- A coding agent receives a useful context pack before acting.
- The pack is short enough to paste into an LLM prompt.
- It includes failures and corrections when relevant.

---

## Phase 4 — Quantum-inspired Selector

Why this matters:

Flat vector top-K retrieval is too weak for a personal brain.

### Tasks

1. Implement candidate superposition from:
   - vector results
   - keyword results
   - recent memories
   - high-importance memories
   - active tasks
   - hard rules
   - graph neighbors
2. Implement weighted scoring:
   - semantic
   - keyword
   - type priority
   - importance
   - confidence
   - recency
   - access frequency
   - emotional/operational weight
   - namespace match
   - graph centrality
   - feedback
   - contradiction penalty
   - decay penalty
3. Implement collapse strategy:
   - diversity
   - max token budget
   - contradiction awareness
   - hard-rule preservation
   - task relevance
4. Expose debug mode.

### Done when

- `sm_prefetch` explains why each memory was selected.
- Stale but semantically similar memories lose to more relevant current memories.
- Hard rules and corrections survive normal decay.

---

## Phase 5 — Time-Decaying Memory

Why this matters:

A personal memory system must forget, compress, and reinforce.

### Tasks

1. Add half-life values by memory type.
2. Calculate decay score during ranking.
3. Reinforce memory after useful retrieval.
4. Decay tasks faster than rules/preferences.
5. Add status transitions:
   - active
   - pending
   - deprecated
   - shadow
6. Add scheduled consolidation.
7. Add dashboard filters for stale/active/deprecated/shadow memory.

### Done when

- Old tasks no longer dominate retrieval.
- Important rules stay strong.
- Corrections override outdated memories.
- Consolidation reduces clutter.

---

## Phase 6 — Personal Profile and Persona Builder

Why this matters:

A mini personal AI model starts with a structured profile, not with raw logs.

### Tasks

1. Generate profile summaries by namespace and globally.
2. Track:
   - user working style
   - output preferences
   - business goals
   - technical preferences
   - constraints
   - active projects
   - avoid patterns
3. Add approval flow for inferred profile items.
4. Add exportable profile packs.
5. Add agent-specific prompt packs.

### Done when

- StackMemory can answer: "What should an agent know about this user/project?"
- The answer is concise, current, and editable.

---

## Phase 7 — Personal Model Dataset Builder

Why this matters:

Before training or tuning anything, the data must be clean, consented, structured, and useful.

### Tasks

1. Add approved training-data export.
2. Generate JSONL examples from:
   - memory context
   - user instruction
   - accepted response
   - correction
   - outcome
3. Redact secrets and sensitive data.
4. Add consent gates.
5. Add evaluation datasets for reranking and context compilation.

### Done when

- A user can export a clean personal dataset.
- Data is useful for a small reranker/context compiler.
- Sensitive memory is excluded unless explicitly approved.

---

## Phase 8 — Personal Mini Model

Why this matters:

The final vision is not just storage. It is a personal intelligence layer.

### Options

1. Personal reranker
2. Personal context compiler
3. Local embedding/ranking model
4. LoRA/adapters for small open models
5. Hybrid hosted/local personal brain

### Done when

- The system improves based on user-specific feedback.
- The memory engine can run partly without large LLM calls.
- The user can take their memory/profile/model data elsewhere.

---

## Product Names to Test

- StackMemory Core
- StackMemory Brain
- StackMemory Persona
- StackMemory Agent Brain
- StackMemory OS
- Personal Agent Brain
- Agent Memory OS

---

## Immediate Next PR After This Branch

Recommended next implementation PR:

**feat: secure MCP memory access with API key auth and namespace enforcement**

Scope:

- API key table/model
- key hashing
- key scopes
- auth middleware for MCP server
- user namespace resolver
- tests for namespace isolation
- docs for creating and using keys
