# StackMemory Token Optimization Plan

## Goal

Turn StackMemory from a memory dashboard into a measurable token-cost and latency optimization layer for AI agents, AI app teams, and inference-heavy companies.

Core promise:

```txt
Send less repeated context.
Retrieve only relevant memory.
Preserve answer quality.
Measure token savings per request, agent, user, and workspace.
```

---

## Target users

```txt
AI agent developers
AI SaaS teams
Internal enterprise AI teams
RAG / support bot builders
LLMOps / platform engineering teams
GPU inference operators
Inference infrastructure vendors
```

---

## Product position

StackMemory should not be positioned only as “stores memories”.

Better positioning:

```txt
Context control plane for AI agents.
```

Alternative positioning:

```txt
Memory + context budget optimizer for agentic AI.
```

---

## Why it matters

Agentic AI systems often waste tokens by repeatedly sending:

```txt
old decisions
project summaries
static system instructions
irrelevant chat history
large tool outputs
full user profile blocks
full repo or workspace summaries
```

StackMemory should replace this with:

```txt
short stable system prompt
relevant memory retrieval
memory graph expansion
token budget enforcement
decay / deprecation filtering
cache-friendly prompt layout
```

---

## Phase 1 — Measurement foundation

Add token-cost accounting before heavy optimization.

### Features

```txt
request_id for every AI call
agent_id / workspace_id / user_id dimensions
input_tokens
output_tokens
cached_input_tokens when provider exposes it
retrieved_memory_count
retrieved_memory_tokens
final_context_tokens
estimated_cost_usd
latency_ms
ttfb_ms if available
model name
provider name
```

### New tables

```txt
ai_usage_events
context_builds
memory_retrieval_events
```

### Dashboard cards

```txt
Monthly token spend
Estimated savings
Average context tokens/request
Memory tokens/request
Cache hit ratio
Top expensive agents
Top expensive users/workspaces
```

---

## Phase 2 — Context budget engine

Add a server-side context compiler that builds prompts under a token budget.

### Input

```txt
user request
agent type
workspace/project id
available memories
memory graph edges
max_context_tokens
model context window
```

### Output

```txt
system block
stable cached block
retrieved memory block
tool result block
current request block
omitted memory report
```

### Rules

```txt
Never include deprecated memories by default.
Prefer high-confidence active memories.
Prefer same project/tag memories.
Expand via memory_links only when edge weight is high.
Summarize long memories before dropping important ones.
Hard cap final context tokens.
```

---

## Phase 3 — Cache-friendly prompt builder

Structure prompts so stable content stays stable and dynamic content appears later.

Recommended prompt order:

```txt
1. Stable system instructions
2. Stable product/team policy
3. Stable user/workspace memory summary
4. Retrieved dynamic memories
5. Tool results
6. Current user request
```

This makes provider prompt caching more effective and prevents dynamic tool output from breaking stable cache prefixes.

---

## Phase 4 — Memory compression

Add compression for memory blocks.

### Features

```txt
memory summary field
short_context field
embedding-backed retrieval
high-signal memory ranking
long memory compaction job
duplicate memory detection
conflict detection
```

---

## Phase 5 — Savings reports

Create reports that prove business value.

### Report examples

```txt
This workspace saved 42% input tokens this month.
Agent A reduced average prompt size from 18k to 5.5k tokens.
Graph retrieval avoided 12.4M repeated tokens.
Deprecated memories removed 8% useless context.
Estimated monthly API savings: $730.
```

---

## Phase 6 — API surface

Expose token optimization as product APIs.

```txt
POST /api/context/compile
POST /api/context/estimate
GET  /api/usage/summary
GET  /api/usage/agents
GET  /api/usage/workspaces
```

Example compile request:

```json
{
  "agentId": "coding-agent",
  "workspaceId": "stackmemory",
  "userRequest": "Continue refactoring billing",
  "maxContextTokens": 6000,
  "strategy": "balanced"
}
```

Example compile response:

```json
{
  "context": "compiled prompt/context",
  "metrics": {
    "includedMemoryCount": 12,
    "omittedMemoryCount": 43,
    "estimatedTokens": 5840,
    "estimatedSavingsTokens": 14200
  }
}
```

---

## Competitive wedge

Most memory tools focus on remembering.

StackMemory should focus on:

```txt
remembering only what matters right now
reducing repeated context
proving cost savings
supporting agentic workflows
connecting memory graph + token budget
```

---

## Pricing implication

Token savings can justify paid plans.

```txt
Free: basic memory CRUD
Pro: context compiler + usage dashboard
Team: workspace memory graph + savings reports
Enterprise: API gateway integration + custom retention + audit logs
```

---

## Next implementation tasks

```txt
1. Add ai_usage_events table.
2. Add token estimation helper.
3. Add /api/context/estimate endpoint.
4. Add /api/context/compile endpoint.
5. Add context budget rules using memories + memory_links.
6. Add usage dashboard cards.
7. Add savings report page.
8. Add provider adapters for OpenAI / Anthropic / Google token metadata.
9. Add cache-friendly prompt template builder.
10. Add docs explaining token savings strategy.
```
