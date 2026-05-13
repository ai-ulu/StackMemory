# StackMemory User Scenarios

StackMemory is a shared, inspectable and portable memory layer for Claude Code, Cursor, Codex-style agents, Replit, n8n and custom AI applications.

## MVP user journeys

### 1. First-time user onboarding

A developer lands on the marketing page, chooses a workflow such as Claude Code, Cursor, Replit or Custom App, creates an account and lands on the dashboard with the selected workflow preserved.

Success criteria:
- The user understands that StackMemory is a shared memory layer for AI coding tools.
- The selected workflow is preserved through signup and login.
- The dashboard shows clear next actions.

### 2. Create and inspect the first memory

The user opens Memories, creates a project rule, preference, decision or task, then opens the memory detail page to inspect metadata.

Example memories:
- Rule: keep MCP, billing and OAuth for later phases.
- Preference: finish the full product skeleton before polish.
- Decision: StackMemory is a shared agent memory layer.
- Task: build dashboard, memories, brain, agents and workflows screens.

Success criteria:
- Memories are visible in a searchable list.
- Each memory has a detail route.
- The detail view can later show type, source, confidence, importance, decay and access history.

### 3. Compile context for an agent run

The user opens Brain, selects an agent type, token budget and risk level, then previews which memories would be included in the next agent context.

Success criteria:
- The user can see what the agent will remember before running it.
- The context compiler explains why memories were selected.
- The user can later copy or send compiled context to a tool.

### 4. Connect an AI tool

The user opens Agents, picks Claude Code, Cursor, Replit, Codex-style agent, n8n or Custom App, then follows the setup path to Integrations and Docs.

Success criteria:
- Each agent has a clear configure path.
- Configure links guide the user to setup docs or integration cards.
- StackMemory feels like a bridge across multiple tools.

### 5. Use StackMemory as infrastructure

A builder opens Integrations, chooses REST API, SDK or n8n, then follows Docs to wire memory write and search calls into their own product.

Success criteria:
- StackMemory is positioned as both app and infrastructure.
- The builder sees API, SDK and automation entry points.
- Docs explain memory write, search and context preview flows.

### 6. Track usage and cost pressure

The user opens Usage to understand context compiled count, estimated tokens, token savings and projected cost.

Success criteria:
- Usage signals exist before billing work begins.
- The product can later show whether memory reduces repeated prompt cost.
- Token budget pressure is visible per workflow.

### 7. Control and trust memory

The user opens Memories or Settings to inspect, edit, archive, delete or export stored context.

Success criteria:
- Memory is not a black box.
- The user can control retention and sensitive data rules.
- Export and deletion concepts are visible early.

## First flows to wire

1. Dashboard to Memories, Brain and Usage.
2. Memories list item to Memory Detail.
3. Agents to Integrations to Docs.
4. Brain to Agents after context preview.
5. Integrations to Docs setup path.

## Later-phase work

- MCP server production wiring.
- Billing and payment plans.
- OAuth/provider account linking.
- Real usage metering.
- Real memory search and write APIs.
- Organization/team permissions.
