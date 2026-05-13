# MCP Server Refactor Plan

## Goal

Reduce the size and complexity of `src/index.ts` without changing runtime behavior.

Authentication, billing, OAuth, quota enforcement, and payment flows are intentionally out of scope for this refactor phase.

## Current Problem

`src/index.ts` currently contains too many responsibilities:

- environment types
- structured logging
- vector/embedding helpers
- memory decay helpers
- PII and secret scrubbing
- content truncation
- keyword relevance scoring
- CORS response helpers
- MCP tool definitions
- resource definitions
- prompt definitions
- stop words
- request routing
- memory operations
- brain operations

This makes it risky to evolve StackMemory into a product-grade memory engine.

## Refactor Principles

1. Preserve behavior first.
2. Move code in small commits.
3. Avoid large rewrites.
4. Avoid touching auth, billing, OAuth, payment, and quota logic in this phase.
5. Keep Cloudflare Worker compatibility.
6. Keep `src/index.ts` as the entrypoint.
7. Typecheck after every meaningful move.

## Target Structure

```text
mcp-server/src/
  index.ts
  core/
    env.ts
    logger.ts
    cors.ts
  vector/
    embeddings.ts
  memory/
    decay.ts
    pii.ts
    truncate.ts
    relevance.ts
  mcp/
    tools.ts
    resources.ts
    prompts.ts
  brain/
    scoring.ts
    consolidate.ts
    simulate.ts
    dream.ts
```

## Phase 1: Safe Helper Extraction

Move helpers that have low coupling:

1. logger
2. CORS helpers
3. memory decay
4. content truncation
5. keyword relevance scoring
6. PII/secret scrubbing
7. vector/embedding helpers

## Phase 2: Static MCP Metadata Extraction

Move static arrays:

1. `TOOLS`
2. `RESOURCES`
3. `PROMPTS`
4. `STOP_WORDS`

## Phase 3: Handler Extraction

Only after Phase 1 and 2 pass typecheck:

1. memory CRUD handlers
2. search/query handlers
3. import/export handlers
4. graph handlers
5. brain handlers

## Phase 4: Context Compiler

After the server is modular:

1. add cost-aware context compiler
2. evolve `sm_prefetch`
3. add token budget support
4. add agent type support
5. add quantum-inspired memory selector
6. add type-based time decay

## First Commit Done

Added:

```json
"typecheck": "tsc --noEmit"
```

This allows safer refactoring.

## Next Commit

Extract `logger` into:

```text
src/core/logger.ts
```

Then update `src/index.ts` imports.
