# StackMemory Positioning And Sales

## Product Definition

StackMemory is the shared memory layer for AI coding tools and AI-native development workflows.

It is built for:
- developers using multiple AI coding tools
- AI-heavy power users who switch between tools and sessions
- builders embedding memory into their own AI products

It is not primarily a generic consumer chat memory app.

## Who We Sell To

### Primary audience

- Claude Code users
- Cursor users
- Codex-style agent users
- Replit, Bolt, Lovable, VS Code AI workflow users
- solo developers and small technical teams using multiple AI tools daily

### Secondary audience

- builders creating internal copilots
- teams building AI agents or AI-native products
- developers who want to add memory to n8n pipelines, custom apps, MCP clients, or agent backends

## Core Problem

AI tools are improving quickly, but durable context is still fragmented.

The real workflow pain is:
- the same project context gets repeated in every new tool or session
- project rules and coding preferences are trapped inside one client
- architecture decisions and active tasks do not survive tool switching cleanly
- chat history exists, but shared working memory does not

## Why Now

The more AI tools a developer uses, the more expensive context loss becomes.

This problem is now urgent because:
- developers no longer use one AI surface, they use several
- coding workflows increasingly jump between agent, editor, chat, and automation
- tool-local memory does not solve cross-tool continuity
- prompt repetition is now a productivity tax

Short version:

**The more AI tools you use, the more important shared memory becomes.**

## Why Existing AI Memory Is Not Enough

Current AI memory systems are usually:
- tool-specific
- profile-oriented rather than project-oriented
- hard to inspect, edit, export, and reuse
- not designed for shared context across multiple coding environments

Important distinctions:
- chat history is not working memory
- tool-local memory is not shared workflow memory
- user profile memory is not project context memory

## Why StackMemory Is Better

StackMemory is designed around shared workflow context, not isolated app memory.

What makes it different:
- one memory layer across multiple AI coding tools
- project, rule, decision, task, and preference memory types
- MCP, API, bridge, and SDK access surfaces
- inspectable and manageable memory, not hidden personalization
- usable both as a product and as infrastructure

Core value statement:

**StackMemory does not just help one AI remember more. It helps your AI workflow remember the same thing everywhere.**

## Value Propositions

### For developer tool users

Stop re-explaining your project to every AI tool.

Use StackMemory to:
- carry repo rules across sessions
- persist coding preferences
- preserve architecture decisions
- keep active project context portable between tools

### For builders

Add durable memory to your AI app without building the memory stack yourself.

Use StackMemory to:
- write project rules and user preferences through API
- search memory before every agent step
- expose memory through bridge, SDK, or MCP
- centralize memory logic outside your application code

## Messaging Pillars

### Pillar 1: Shared context

Your project context should survive tool switching.

### Pillar 2: Durable project memory

Store decisions, rules, preferences, and active work as reusable context.

### Pillar 3: Multi-surface integration

Use the same memory layer in coding tools, automations, and custom AI apps.

### Pillar 4: User control

A serious memory product must let users inspect, edit, export, and delete what is stored.

## Pricing Messaging Matrix

### Free

Best for:
- trying personal memory workflows
- single-user exploration

Message:
- personal AI workflow memory
- basic project context capture
- limited recall and integrations

### Pro

Best for:
- developers using multiple AI coding tools
- serious individual workflows

Message:
- multi-tool workflow memory
- project-scoped recall
- stronger integrations and advanced retrieval

### Team

Best for:
- small technical teams
- shared coding context

Message:
- shared project memory
- team-level rules and decisions
- shared continuity across people and tools

### Enterprise / Builder

Best for:
- embedded memory use cases
- internal AI products
- advanced deployment and control needs

Message:
- embedded memory infrastructure
- self-hosted or controlled deployment
- policy, support, and deeper integration

## Objections And Responses

### "Chat history already does this."

Chat history is an archive.
StackMemory is reusable working context.

### "My AI tool already has memory."

Its memory usually works inside that product.
StackMemory is designed to work across your workflow.

### "I can do this with prompt templates."

Prompt templates are static.
StackMemory is living project context that can be updated, queried, and reused.

### "We can build this ourselves."

You can, but you are then building retrieval, structure, control, integration surfaces, and memory management UX in-house.

## Short Sales Copy

### One-line pitch

Shared memory for AI coding workflows.

### Short product pitch

StackMemory gives developers and builders one shared memory layer across AI coding tools, agents, and custom workflows.

### Developer pitch

Stop re-explaining your repo, coding rules, and project decisions to every AI tool.

### Builder pitch

Add durable memory to your AI product through API, bridge, MCP, or SDK instead of building the memory stack from scratch.

## Demo Talk Track

### 30-second pitch

StackMemory is the shared memory layer for AI coding workflows. Instead of repeating project rules, preferences, and decisions in every tool, you store them once and reuse them across Claude Code, Cursor, Codex-style agents, Replit, and custom AI apps.

### 2-minute demo structure

1. Show a project rule or architecture decision being saved once.
2. Switch to another tool or workflow.
3. Query StackMemory before the next task starts.
4. Show that the second tool begins with the same project context.
5. Explain that the same system also works through API, bridge, MCP, and SDK.

## Current Best Demo Flows

### Claude Code -> Cursor handoff

Show how repo rules, decisions, and active tasks persist across tool boundaries.

### Replit -> Codex-style prompt memory

Show how cloud IDE facts become reusable prompt context for the next agent run.

### Custom App / n8n -> memory write + recall

Show how a builder can embed StackMemory into an existing agent or automation workflow.

## Internal Rule

Do not optimize messaging around "universal AI memory for everyone."

Optimize messaging around:
- shared memory for AI coding workflows
- portable project context
- durable memory infrastructure for builders
