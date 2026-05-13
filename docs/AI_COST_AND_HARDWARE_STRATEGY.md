# AI Cost and Hardware Strategy

## Purpose

StackMemory should not only remember context. It should also reduce the cost of using AI.

A shared memory layer becomes more valuable when it can decide:

- which memories are worth sending to an LLM
- which model should handle a task
- whether the task can be done locally
- whether a small model is enough
- when to use an expensive frontier model
- how to prevent repeated token waste
- when edge hardware should cache, summarize, or pre-process context

This document defines the cost and hardware strategy for StackMemory as an Agent Memory OS.

---

## Product Thesis

The more agents a user runs, the more expensive repeated context becomes.

Without StackMemory:

```text
Every agent session repeats the same project context.
Every LLM call pays again for the same background.
Every tool stores isolated memory.
Every automation overuses large models.
```

With StackMemory:

```text
Memory is stored once.
Relevant context is compiled before each action.
Small models handle cheap tasks.
Large models handle only high-value reasoning.
Edge devices cache local context.
Token usage becomes measurable and optimizable.
```

---

## Cost-Aware Memory Loop

```text
Incoming task
   ↓
Memory prefetch candidate search
   ↓
Cost-aware selector
   ↓
Context compression
   ↓
Model router chooses local/small/large model
   ↓
Agent execution
   ↓
Usage logging
   ↓
Feedback + memory update
   ↓
Cost analytics and optimization
```

---

## Token Cost Problems StackMemory Should Solve

### 1. Repeated Context Tax

Users repeatedly paste the same project rules, preferences, and constraints.

Solution:

- store durable context once
- compile short context packs per task
- use memory IDs and summaries instead of raw large context

### 2. Wrong Model for Small Tasks

Expensive LLMs are often used for classification, tagging, routing, scoring, summarization, or extraction.

Solution:

- local/small model for cheap deterministic tasks
- medium model for normal drafting/reasoning
- frontier model only for high-risk/high-value tasks

### 3. Over-Retrieval

Vector search top-K can return too many memories.

Solution:

- quantum-inspired selector
- token budget aware collapse
- diversity filtering
- stale-memory suppression
- context pack sections instead of raw dumps

### 4. No Usage Attribution

Users do not know which project, agent, model, or workflow burns tokens.

Solution:

- usage ledger
- cost per namespace
- cost per agent
- cost per model
- cost per workflow
- cost saved by local execution/cache

---

## Model Router

StackMemory should include or integrate with a model router.

The router decides what model class should handle a task.

### Suggested model classes

| Class | Use case | Example tasks |
|---|---|---|
| `local_tiny` | near-zero cost, low risk | classification, tagging, routing, cleanup |
| `local_small` | private/local basic reasoning | memory scoring, summarization, extraction |
| `hosted_small` | cheap cloud tasks | summaries, structured extraction, drafts |
| `hosted_medium` | normal agent reasoning | planning, coding support, workflow reasoning |
| `frontier` | high-value reasoning | architecture, hard code, legal/financial review support |
| `embedding` | semantic search | memory indexing/retrieval |
| `reranker` | relevance ranking | candidate memory ordering |

### Router input

```json
{
  "task": "refactor MCP auth",
  "agent_type": "coding_agent",
  "risk_level": "high",
  "latency_target_ms": 8000,
  "privacy_level": "normal",
  "budget_limit_usd": 0.05,
  "namespace": "project:stackmemory",
  "requires_code_reasoning": true
}
```

### Router output

```json
{
  "selected_model_class": "hosted_medium",
  "fallback_model_class": "frontier",
  "local_preprocessing": true,
  "max_input_tokens": 8000,
  "max_output_tokens": 2000,
  "estimated_cost_usd": 0.018,
  "reason": "coding task with medium-high risk; local model can compress context first"
}
```

---

## Token Budget Aware Context Compiler

The Context Compiler should accept a token budget.

Example:

```json
{
  "task": "Generate a fix plan for MCP auth",
  "agent_type": "coding_agent",
  "token_budget": 1800,
  "include_sections": ["hard_rules", "constraints", "decisions", "failures", "active_tasks"]
}
```

It should return:

```json
{
  "compiled_context": "short structured context",
  "estimated_tokens": 1240,
  "dropped_memory_ids": [],
  "compressed_memory_ids": [],
  "included_memory_ids": [],
  "confidence": 0.86
}
```

---

## Usage Ledger

StackMemory should track usage and estimated cost.

Suggested fields:

- `id`
- `user_id`
- `organization_id`
- `namespace`
- `agent_id`
- `workflow_id`
- `model_provider`
- `model_name`
- `model_class`
- `input_tokens`
- `output_tokens`
- `embedding_tokens`
- `estimated_cost_usd`
- `latency_ms`
- `cache_hit`
- `local_execution`
- `created_at`

---

## Cost Analytics Dashboard

The product dashboard should show:

- total estimated AI spend
- spend by agent
- spend by namespace/project
- spend by model/provider
- token savings from memory compression
- local execution savings
- cache hit rate
- expensive workflows
- suggested optimizations

Example insight:

```text
Your coding agent spent 42% of tokens repeating project context.
Enable compact context packs to reduce estimated cost by 28%.
```

---

## AI Hardware Strategy

StackMemory should support a hybrid model:

```text
Cloud LLMs for hard reasoning
Local/edge models for cheap, private, repeated tasks
Dedicated hardware only when usage justifies it
```

---

## Hardware Classes

### 1. No dedicated hardware

Best for MVP SaaS.

Use:

- hosted LLM APIs
- Cloudflare Workers AI / embeddings
- provider-hosted models
- vector database / Vectorize

### 2. Local CPU edge box

Best for offline cache, sync, lightweight classification, and automation.

Examples:

- mini PC
- Raspberry Pi
- old laptop
- local Linux box
- Windows machine with WSL2

Can run:

- SQLite cache
- local queue
- small Python/Node agent
- lightweight local models if acceptable

### 3. Consumer GPU box

Best for heavier local inference and privacy-sensitive tasks.

Examples:

- desktop with NVIDIA GPU
- used workstation
- mini workstation

Can run:

- local 7B/8B class models depending on VRAM
- local embedding models
- rerankers
- context compression

### 4. Cloud GPU / rented inference

Best for scalable or temporary workloads.

Use when:

- local hardware is unavailable
- usage spikes
- larger model inference is required
- teams need shared compute

### 5. Specialized AI hardware

Possible future path, not MVP.

Examples:

- NPUs
- Apple Neural Engine paths
- NVIDIA Jetson-style edge devices
- Coral TPU-style devices
- AI accelerator cards

Use only when there is a clear workload:

- vision inference
- robotics/inspection
- local speech
- low-latency edge decisions

---

## What Should Run Locally

Good local candidates:

- memory classification
- memory type detection
- duplicate detection
- PII/secret scanning
- context compression
- keyword extraction
- tag generation
- cheap summaries
- reranking small candidate sets
- offline queue processing
- local automation decisions with low risk

Bad local candidates for MVP:

- high-stakes legal/medical/financial reasoning
- complex code generation without review
- dangerous physical actions
- large multimodal reasoning
- high-risk autonomous decisions

---

## Local Model Roles

### Local classifier

Determines memory type, sensitivity, and namespace.

### Local compressor

Compresses raw memories before sending to cloud model.

### Local reranker

Reranks candidate memories after vector search.

### Local policy checker

Blocks unsafe actions before a physical or automation agent acts.

### Local fallback assistant

Provides basic offline response when cloud is unavailable.

---

## Cost Optimization Techniques

### 1. Memory compression

Turn long raw memories into compact durable insights.

### 2. Context caching

Cache compiled context packs per namespace/task/agent.

### 3. Semantic cache

If a similar task was already answered, reuse prior context/answer with freshness checks.

### 4. Model cascade

Try cheap/local model first. Escalate only when confidence is low.

### 5. Token budget caps

Every agent call should have a budget.

### 6. Summarize before send

Local/small model compresses context before expensive model call.

### 7. Use memory IDs

When possible, use references and short summaries instead of full raw memory.

### 8. Consolidation jobs

Scheduled `brain_consolidate` reduces many small memories into fewer high-value insights.

---

## Pricing Implications

StackMemory plans should eventually price around:

- memory count/storage
- searches/prefetch calls
- brain operations
- context compiler calls
- API keys/devices
- team seats
- usage ledger retention
- local/edge sync
- hosted AI usage passthrough or credits

Possible product plans:

### Free

- limited memories
- limited prefetch/search
- no hosted AI credits
- basic dashboard

### Pro

- high memory limits
- more prefetch calls
- basic cost analytics
- personal profile
- SDK/CLI/API

### Team

- shared namespaces
- team API keys
- audit logs
- cost by project/agent
- higher limits

### Builder / Enterprise

- custom model router
- edge gateway
- device identities
- usage ledger export
- private deployment
- local inference support

---

## MVP Cost Features

The first product version should include:

1. Token budget field in `sm_prefetch` / context compiler.
2. Estimated token count on compiled context.
3. Usage ledger table.
4. Cost by namespace and agent.
5. Cache hit tracking.
6. Simple model class recommendation.
7. Configurable local-first mode flag.

---

## Later Cost Features

- provider price table
- actual API billing sync
- model router dashboard
- automatic fallback and escalation
- local inference benchmark
- device hardware profile
- ROI calculator for buying/renting GPU hardware
- cost anomaly alerts

---

## Hardware ROI Logic

A hardware recommendation engine should answer:

```text
Should this user keep using cloud models, run a local model, rent GPU, or buy hardware?
```

Inputs:

- monthly token spend
- privacy requirement
- latency requirement
- number of agents
- offline requirement
- model size needed
- expected utilization
- power cost
- hardware cost
- maintenance ability

Output:

```json
{
  "recommendation": "stay_cloud_for_now",
  "reason": "monthly usage is below hardware break-even",
  "estimated_monthly_cloud_cost": 38.50,
  "estimated_hardware_break_even_months": 14,
  "best_next_step": "enable context compression and cache first"
}
```

---

## Design Rule

Do not start with expensive hardware.

Start with:

1. better memory selection
2. shorter context packs
3. cache
4. cheap model routing
5. local edge box for privacy/offline use
6. GPU only when numbers justify it

---

## Strategic Outcome

StackMemory should become both:

1. **Memory layer** — what every agent should know.
2. **Cost router** — how every agent should spend tokens wisely.

This creates a stronger product than a plain vector memory system.
