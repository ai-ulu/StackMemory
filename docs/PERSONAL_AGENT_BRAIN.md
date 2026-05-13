# Personal Agent Brain Architecture

## Purpose

This document defines the product architecture for turning StackMemory into a shared memory layer for LLM agents and, over time, a personal mini intelligence model.

The immediate goal is not to train a new LLM from scratch. The immediate goal is to build the infrastructure that behaves like a personal brain for agents:

- durable memory
- adaptive retrieval
- time decay
- contradiction handling
- context compilation
- feedback learning
- eventual dataset generation for a small personal model

---

## Core Concept

Every agent receives a task. Before the agent acts, StackMemory compiles a short, relevant context packet.

After the agent acts, StackMemory stores what changed.

```text
Agent asks: "What should I know before doing this?"
StackMemory answers: "Here is the minimal useful context."
Agent acts.
StackMemory records: "What did we learn? What should persist?"
```

This turns memory from passive storage into an active coordination layer.

---

## Main Components

### 1. Memory Store

The source of truth for typed memories.

Required fields:

- `id`
- `user_id` or tenant owner
- `namespace`
- `content`
- `type`
- `confidence`
- `importance_score`
- `created_at`
- `updated_at`
- `last_accessed`
- `access_count`
- `decay_factor`
- `status`
- `source`
- `write_intent`
- `tags`
- `metadata`

### 2. Memory Graph

The relationship map between memories.

Useful edge types:

- `supports`
- `contradicts`
- `updates`
- `derived_from`
- `consolidated_from`
- `belongs_to_project`
- `caused_by`
- `resolved_by`
- `similar_to`

### 3. Quantum-inspired Selector

A memory selection engine that builds a candidate set and collapses it into the smallest useful context.

This is quantum-inspired, not quantum hardware dependent.

The selector should model each memory as a weighted candidate with many signals.

### 4. Temporal Decay Engine

A memory aging engine.

It should reduce the effective score of stale memories while preserving important long-term identity, preference, rule, and decision memory.

### 5. Context Compiler

The engine that turns raw selected memories into a compact agent-ready context packet.

It should output structured context, not a raw memory dump.

### 6. Feedback Adapter

A learning loop that changes ranking based on outcomes.

Examples:

- user says a memory was useful
- user says a memory was wrong
- agent action succeeds
- agent action fails
- user corrects the assistant

### 7. Persona Builder

A higher layer that summarizes long-term user behavior.

It produces:

- user profile
- working style
- long-term goals
- constraints
- trusted defaults
- avoid list
- preferred output style
- project map

### 8. Personal Model Dataset Builder

A future component that turns approved memories and interactions into training/evaluation data.

It should never train on sensitive data without explicit consent.

---

## Quantum-inspired Memory Selection

### Why

Flat top-K vector search is not enough for a personal agent brain.

A memory can be semantically similar but outdated. Another memory can be less similar but mission-critical. A rule may be old but still valid. A task may be recent but already completed.

The selector needs multi-signal scoring.

### Candidate Superposition

Build candidate memories from several channels:

- vector similarity search
- keyword search
- namespace/project filter
- recent memory window
- high-importance memory pool
- active task memory pool
- explicit rule/constraint memory pool
- graph neighbors of top results

### Signal Weights

Suggested score components:

```text
amplitude(memory, query, agent, namespace) =
  semantic_similarity      * w_semantic
+ keyword_relevance        * w_keyword
+ type_priority            * w_type
+ importance_score         * w_importance
+ confidence               * w_confidence
+ recency_score            * w_recency
+ frequency_score          * w_frequency
+ emotional_weight         * w_emotional
+ namespace_match          * w_namespace
+ graph_centrality         * w_graph
+ feedback_score           * w_feedback
- contradiction_penalty    * w_contradiction
- decay_penalty            * w_decay
- noise_penalty            * w_noise
```

### Collapse

Collapse means selecting the final memory packet.

Rules:

- Select the smallest context that gives enough confidence.
- Prefer high-signal diversity over many similar memories.
- Include contradictions when they matter.
- Prefer current decisions over deprecated decisions.
- Prefer explicit user corrections over inferred facts.
- Keep hard rules and active constraints visible.
- Do not include low-confidence sensitive memories unless explicitly needed.

### Output

The selector should output:

```json
{
  "context_pack": [...],
  "excluded": [...],
  "contradictions": [...],
  "confidence": 0.0,
  "reasoning_summary": "why this context was selected"
}
```

---

## Time-Decaying Memory

### Why

Good memory forgets and compresses.

Without decay, a memory layer becomes noisy and stale. With too much decay, it forgets identity and durable rules.

### Memory Half-life by Type

Suggested defaults:

| Type | Suggested half-life | Notes |
|---|---:|---|
| identity | 365+ days | very slow decay |
| preference | 180 days | medium-slow decay unless reinforced |
| rule | 240 days | slow decay, high priority |
| decision | 120 days | decays unless referenced |
| project | 90 days | depends on project activity |
| task | 14 days | fast decay |
| fact | 90 days | medium decay |
| insight | 180 days | slow-medium decay |
| correction | 365 days | very slow decay, strong override |
| failure | 180 days | should prevent repeated mistakes |
| success_pattern | 240 days | reinforced if repeated |
| goal | 180 days | decays unless active |
| constraint | 120 days | refreshed by use |
| workflow | 180 days | reinforced by repetition |

### Effective Score

```text
effective_score = base_score * decay_factor * reinforcement_factor
```

Where:

```text
decay_factor = 0.5 ^ (age_days / half_life_days)
```

Reinforcement comes from:

- successful use
- user confirmation
- repeated access
- graph centrality
- consolidation into insight

### Shadow Memory

Some memories should not vanish completely.

When a memory is deleted, deprecated, contradicted, or superseded, it can become a shadow memory:

- not shown in normal recall
- available for audit/debug
- used only to prevent repeat mistakes when safe and allowed

---

## Context Compiler

The Context Compiler converts memory candidates into agent-ready instructions.

It should never dump raw memory blindly.

### Input

```json
{
  "user_id": "...",
  "namespace": "project:stackmemory",
  "agent": "cursor",
  "task": "refactor MCP auth",
  "depth": "normal",
  "risk_level": "medium"
}
```

### Output

```json
{
  "profile": "short user/project profile",
  "hard_rules": [],
  "preferences": [],
  "active_constraints": [],
  "relevant_decisions": [],
  "known_failures": [],
  "success_patterns": [],
  "active_tasks": [],
  "avoid": [],
  "confidence": 0.0,
  "memory_ids": []
}
```

### Agent-specific behavior

Different agents need different packs:

- Coding agent: rules, architecture, constraints, current tasks, failed approaches.
- Marketing agent: brand voice, audience, offers, past winners, avoid list.
- Automation agent: API keys policy, workflow rules, error history, schedules.
- Support bot: customer rules, tone, escalation policy.
- E-commerce agent: margins, sourcing rules, banned actions, marketplace constraints.

---

## Personal Mini Model Path

### Stage 1: Model-like memory engine

No training. The memory system behaves like a personal model by retrieving, ranking, compiling, and adapting context.

### Stage 2: Personal reranker

Train or tune a small ranking model from:

- useful/not useful feedback
- clicked memories
- accepted/rejected agent actions
- user corrections
- successful outcomes

### Stage 3: Personal context compiler

Train a small model or rules+LLM pipeline to turn memory into context packs in the user's preferred style.

### Stage 4: Personal adapter / LoRA

Generate approved examples for a small model adapter:

```json
{
  "instruction": "Plan this project for the user.",
  "memory_context": "approved compact profile + relevant memories",
  "preferred_response": "the kind of response the user accepted"
}
```

### Stage 5: Portable personal AI brain

The final system can power:

- hosted personal brain
- local personal brain
- team/org brain
- domain-specific brains for businesses

---

## Privacy and Safety Requirements

Personal memory is sensitive.

Required controls:

- explicit auth for every write/read
- server-side namespace enforcement
- API key scopes
- team/org isolation
- audit logs
- export
- delete
- forget/deprecate
- PII and secret scrubbing
- consent for training data generation
- clear separation between raw memory and model training data

---

## First Implementation Milestones

### Milestone 1: Foundation

- Preserve current MCP-first architecture.
- Add product docs and architecture boundaries.
- Add memory type roadmap.
- Add explicit quantum selector spec.
- Add temporal decay spec.

### Milestone 2: Secure Agent Memory Layer

- MCP auth required.
- API keys with scopes.
- User/team namespace enforcement.
- Quota and plan enforcement.
- Rate limits.

### Milestone 3: Context Compiler MVP

- `sm_prefetch` returns structured context packs.
- Agent type parameter.
- Task/risk/depth parameters.
- Hard rules, constraints, decisions, failures, tasks separated.

### Milestone 4: Brain Loop

- Feedback improves ranking.
- Consolidation creates insight memories.
- Corrections override old memories.
- Shadow memory prevents repeated mistakes.

### Milestone 5: Personal Model Dataset

- Approved memory-to-example pipeline.
- Export JSONL for evaluation/training.
- Consent and redaction gates.

---

## Non-goals for Now

- Do not train a full LLM from scratch.
- Do not replace the current MCP server with a new stack immediately.
- Do not delete valuable legacy experiments until their value is migrated.
- Do not claim end-to-end encryption unless implemented and tested.
- Do not expose public memory endpoints without auth.
