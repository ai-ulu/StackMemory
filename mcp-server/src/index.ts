// StackMemory MCP Server v3.1.0 (Ulu-Brain v2) - Cloudflare Pages Worker
// MCP Protocol 2025-03-26 with Streamable HTTP Transport
// v3.1: brain_simulate (decision risk scoring), brain_dream (cross-namespace ideation)

interface Env {
  DB: D1Database;
  AI?: any;        // Workers AI binding (optional — graceful fallback)
  VECTORIZE?: any;  // Vectorize index binding (optional — graceful fallback)
}

// ============================================================
// Structured Logger
// ============================================================
const LOG_LEVEL = { ERROR: 'ERROR', WARN: 'WARN', INFO: 'INFO' } as const;

function log(level: string, component: string, message: string, data?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, component, message, ...data };
  if (level === LOG_LEVEL.ERROR) console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

// ============================================================
// Vectorize / Workers AI Helpers (graceful degradation)
// ============================================================
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'; // 768-dim
const EMBEDDING_DIM = 768;

async function generateEmbedding(text: string, env: Env): Promise<number[] | null> {
  if (!env.AI) return null;
  try {
    const truncated = text.slice(0, 512);
    const result = await env.AI.run(EMBEDDING_MODEL, { text: [truncated] });
    if (result?.data?.[0]) return result.data[0];
    return null;
  } catch (e) {
    log(LOG_LEVEL.ERROR, 'vectorize', 'Embedding generation failed', { error: String(e) });
    return null;
  }
}

async function vectorUpsert(id: string, embedding: number[], metadata: Record<string, string>, env: Env): Promise<boolean> {
  if (!env.VECTORIZE) return false;
  try {
    await env.VECTORIZE.upsert([{ id, values: embedding, metadata }]);
    return true;
  } catch (e) {
    log(LOG_LEVEL.ERROR, 'vectorize', 'Upsert failed', { error: String(e) });
    return false;
  }
}

async function vectorQuery(embedding: number[], topK: number, filter: Record<string, string>, env: Env): Promise<{ id: string; score: number }[]> {
  if (!env.VECTORIZE) return [];
  try {
    const results = await env.VECTORIZE.query(embedding, { topK, filter });
    return (results.matches || []).map((m: any) => ({ id: m.id, score: m.score }));
  } catch (e) {
    log(LOG_LEVEL.ERROR, 'vectorize', 'Query failed', { error: String(e) });
    return [];
  }
}

async function vectorDelete(ids: string[], env: Env): Promise<void> {
  if (!env.VECTORIZE) return;
  try { await env.VECTORIZE.deleteByIds(ids); } catch { /* best-effort */ }
}

// ============================================================
// Memory Decay Constants
// ============================================================
const DECAY_HALF_LIFE_DAYS = 30;

function calculateDecayScore(lastAccessed: string | null, createdAt: string): number {
  const ref = lastAccessed || createdAt;
  if (!ref) return 0.5;
  const daysSince = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-daysSince / DECAY_HALF_LIFE_DAYS);
}

// ============================================================
// PII / Secret Scrubbing
// ============================================================
const PII_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: 'EMAIL' },
  { pattern: /\b(?:\d[ -]*?){13,19}\b/g, label: 'CREDIT_CARD' },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, label: 'PHONE' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'SSN' },
  // API keys & tokens (generic patterns)
  { pattern: /\b(sk|pk|api|key|token|secret|password|bearer|auth)[-_]?[a-zA-Z0-9]{16,}\b/gi, label: 'API_KEY' },
  { pattern: /\bghp_[a-zA-Z0-9]{36,}\b/g, label: 'GITHUB_TOKEN' },
  { pattern: /\bgho_[a-zA-Z0-9]{36,}\b/g, label: 'GITHUB_OAUTH' },
  { pattern: /\bglpat-[a-zA-Z0-9\-_]{20,}\b/g, label: 'GITLAB_TOKEN' },
  { pattern: /\bxoxb-[a-zA-Z0-9\-]{20,}\b/g, label: 'SLACK_TOKEN' },
  { pattern: /\bxoxp-[a-zA-Z0-9\-]{20,}\b/g, label: 'SLACK_TOKEN' },
  { pattern: /\bsbp_[a-zA-Z0-9]{20,}\b/g, label: 'SUPABASE_KEY' },
  { pattern: /\beyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\b/g, label: 'JWT' },
  { pattern: /\bAKIA[A-Z0-9]{16}\b/g, label: 'AWS_KEY' },
  { pattern: /\bAIza[a-zA-Z0-9_-]{35}\b/g, label: 'GOOGLE_API_KEY' },
  // Passwords in common formats
  { pattern: /(?:password|passwd|pwd|şifre|sifre)\s*[:=]\s*\S+/gi, label: 'PASSWORD' },
];

function scrubPII(content: string): { cleaned: string; detected: string[]; hadPII: boolean } {
  let cleaned = content;
  const detected: string[] = [];

  for (const { pattern, label } of PII_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    if (regex.test(cleaned)) {
      detected.push(label);
      cleaned = cleaned.replace(new RegExp(pattern.source, pattern.flags), `[${label}_REDACTED]`);
    }
  }

  return { cleaned, detected, hadPII: detected.length > 0 };
}

// ============================================================
// Smart Content Truncation
// ============================================================
const MAX_CONTENT_PREVIEW = 500;  // chars per memory in search results
const MAX_RESPONSE_ITEMS = 200;   // hard cap on items in any response

function truncateContent(content: string, maxLen: number = MAX_CONTENT_PREVIEW): string {
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen) + '…[truncated]';
}

function truncateMemoryResults(
  memories: Record<string, unknown>[],
  maxItems: number = MAX_RESPONSE_ITEMS,
  truncateFields: boolean = true
): Record<string, unknown>[] {
  const limited = memories.slice(0, maxItems);
  if (!truncateFields) return limited;
  return limited.map(m => ({
    ...m,
    content: truncateContent(String(m.content || ''), MAX_CONTENT_PREVIEW),
  }));
}

// ============================================================
// Relevance Scoring (keyword-based ranking)
// ============================================================
function scoreRelevance(content: string, keywords: string[]): number {
  const lower = content.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    // Exact phrase match
    const idx = lower.indexOf(kw);
    if (idx === -1) continue;
    score += 1;
    // Bonus for match at start of content
    if (idx < 50) score += 0.5;
    // Bonus for multiple occurrences
    const occurrences = lower.split(kw).length - 1;
    if (occurrences > 1) score += Math.min(occurrences * 0.2, 1);
  }
  // Normalize by keyword count
  return keywords.length > 0 ? score / keywords.length : 0;
}

// ============================================================
// CORS Headers
// ============================================================
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
};

function corsResponse(body: string, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}

// ============================================================
// Tool Definitions
// ============================================================
const TOOLS = [
  // --- 8 Core Tools (v2.1 with namespace + PII) ---
  {
    name: 'search_memories',
    description: 'Search memories by keyword with relevance scoring. Results ranked by keyword density, position and confidence.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search keyword to find in memory content' },
        limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
        user_id: { type: 'string', description: 'Filter by user ID (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation (e.g. "ulu-router", "koltuk-yikama"). Omit for global.' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'store_memory',
    description: 'Store a new memory with PII auto-scrubbing, type classification, and confidence score. Sensitive data (API keys, passwords, emails) is automatically redacted before storage.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The memory content to store (PII/secrets auto-redacted)' },
        type: { type: 'string', description: 'Memory type (default: "fact")', enum: ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'] },
        confidence: { type: 'number', description: 'Confidence score from 0.0 to 1.0 (default: 0.8)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        user_id: { type: 'string', description: 'User ID (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation (e.g. "ulu-router")' },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_memory',
    description: 'Update an existing memory\'s content by ID. PII auto-scrubbing applied to new content.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Memory ID to update' },
        content: { type: 'string', description: 'New content for the memory (PII/secrets auto-redacted)' },
        type: { type: 'string', description: 'New memory type', enum: ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'] },
        confidence: { type: 'number', description: 'New confidence score (0.0-1.0)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags array (replaces existing)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_memory',
    description: 'Soft-delete a memory by ID. Sets deleted_at timestamp instead of removing the record.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Memory ID to soft-delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'query_memories',
    description: 'Natural language query for memories with relevance scoring. Extracts keywords, searches content and tags, ranks by keyword relevance and confidence.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query string' },
        limit: { type: 'number', description: 'Maximum results (default: 10)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_memories',
    description: 'List memories filtered by type and namespace, with pagination support. Content truncated to prevent context overflow.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by memory type', enum: ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'] },
        limit: { type: 'number', description: 'Maximum results (default: 20, max: 200)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
        include_deleted: { type: 'boolean', description: 'Include soft-deleted memories (default: false)' },
      },
    },
  },
  {
    name: 'get_memory_graph',
    description: 'Retrieve the memory graph with optional keyword filter for sub-graph extraction. Returns nodes, edges, and statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum nodes to return (default: 50, max: 200)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
        filter_keyword: { type: 'string', description: 'Optional keyword to extract a sub-graph of related nodes only' },
      },
    },
  },
  {
    name: 'link_memories',
    description: 'Create a relationship link between two memories.',
    inputSchema: {
      type: 'object',
      properties: {
        source_id: { type: 'string', description: 'Source memory ID' },
        target_id: { type: 'string', description: 'Target memory ID' },
        relation: { type: 'string', description: 'Relationship type (default: "related")' },
        weight: { type: 'number', description: 'Link weight/strength 0.0-1.0 (default: 0.5)' },
      },
      required: ['source_id', 'target_id'],
    },
  },
  // --- 6 Extended Tools (v2.1) ---
  {
    name: 'sm_time_query',
    description: 'Time-based memory query. Find memories within a specific time period or date range.',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Predefined period: last_day, last_week, last_month, last_year, custom', enum: ['last_day', 'last_week', 'last_month', 'last_year', 'custom'] },
        from_date: { type: 'string', description: 'Start date for custom period (ISO 8601 format, e.g., 2024-01-01)' },
        to_date: { type: 'string', description: 'End date for custom period (ISO 8601 format)' },
        type: { type: 'string', description: 'Optional type filter', enum: ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'] },
        limit: { type: 'number', description: 'Maximum results (default: 50, max: 200)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
      },
      required: ['period'],
    },
  },
  {
    name: 'sm_memory_summary',
    description: 'Get memory statistics and overview. Returns counts, type distribution, confidence metrics, and activity stats.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
      },
    },
  },
  {
    name: 'sm_batch_operations',
    description: 'Batch operations on memories: update confidence, delete old, add/remove tags. Transaction-based: all succeed or none.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'Operation type', enum: ['update_confidence', 'delete_old', 'add_tag', 'remove_tag'] },
        ids: { type: 'array', items: { type: 'string' }, description: 'Array of memory IDs (for update_confidence, add_tag, remove_tag)' },
        params: { type: 'object', description: 'Operation-specific parameters', properties: {
          confidence: { type: 'number', description: 'New confidence value (for update_confidence)' },
          tag: { type: 'string', description: 'Tag name (for add_tag/remove_tag)' },
          age_days: { type: 'number', description: 'Age threshold in days (for delete_old)' },
        }},
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'sm_export_memories',
    description: 'Export memories to JSON or CSV format with optional filters. Limited to 500 records per export.',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', description: 'Export format: json or csv', enum: ['json', 'csv'] },
        type: { type: 'string', description: 'Filter by memory type', enum: ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'] },
        include_deleted: { type: 'boolean', description: 'Include soft-deleted memories (default: false)' },
        include_links: { type: 'boolean', description: 'Include memory links in export (default: false)' },
        from_date: { type: 'string', description: 'Start date filter (ISO 8601)' },
        to_date: { type: 'string', description: 'End date filter (ISO 8601)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
        limit: { type: 'number', description: 'Maximum records to export (default: 500, max: 500)' },
      },
      required: ['format'],
    },
  },
  {
    name: 'sm_concept_cluster',
    description: 'Concept clustering of memories. Groups memories by shared keywords and tags into semantic clusters. Limited to 500 most recent memories.',
    inputSchema: {
      type: 'object',
      properties: {
        min_cluster_size: { type: 'number', description: 'Minimum memories per cluster (default: 2)' },
        max_clusters: { type: 'number', description: 'Maximum number of clusters (default: 10)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
        limit: { type: 'number', description: 'Maximum memories to analyze (default: 500, max: 500)' },
      },
    },
  },
  {
    name: 'sm_import_memories',
    description: 'Import memories from a JSON string. PII auto-scrubbing applied. Supports duplicate handling strategies.',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'JSON string containing array of memory objects with: content, type, confidence, tags' },
        duplicate_handling: { type: 'string', description: 'How to handle duplicates: skip, update, or create_new', enum: ['skip', 'update', 'create_new'] },
        user_id: { type: 'string', description: 'User ID for imported memories (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for imported memories' },
      },
      required: ['data', 'duplicate_handling'],
    },
  },
  {
    name: 'sm_prefetch',
    description: 'Proactive memory injection: given a raw user message, automatically finds the most relevant memories to inject into the LLM context. Returns top memories ranked by semantic + keyword + decay scoring. Ideal for router-level pre-fetch before model call.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Raw user message to find relevant memories for' },
        top_k: { type: 'number', description: 'Number of memories to return (default: 5, max: 20)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
        min_score: { type: 'number', description: 'Minimum relevance score threshold 0.0-1.0 (default: 0.1)' },
      },
      required: ['message'],
    },
  },
  // ========== Ulu-Brain: Cognitive Layer (v3.0) ==========
  {
    name: 'brain_think',
    description: 'Contextual reasoning engine. Given a question or context, retrieves relevant memories, analyzes contradictions and connections via the memory graph, and returns a structured cognitive analysis with key facts, conflicts, and strategic recommendations. Use this when the agent needs to *reason* about past knowledge, not just retrieve it.',
    inputSchema: {
      type: 'object',
      properties: {
        context: { type: 'string', description: 'Question, topic, or decision context to reason about' },
        depth: { type: 'string', description: 'Analysis depth: quick (top 5), normal (top 10), deep (top 20)', enum: ['quick', 'normal', 'deep'] },
        user_id: { type: 'string', description: 'User ID (default: "default")' },
        namespace: { type: 'string', description: 'Project namespace for isolation' },
      },
      required: ['context'],
    },
  },
  {
    name: 'brain_adapt',
    description: 'Adaptive weight feedback. Report whether a memory retrieval was useful or not. The system uses this feedback to gradually adapt H-score weights per namespace, making future retrievals more relevant over time. Call after a successful (or unsuccessful) memory usage.',
    inputSchema: {
      type: 'object',
      properties: {
        memory_id: { type: 'string', description: 'ID of the memory that was used' },
        feedback: { type: 'string', description: 'Was the memory helpful?', enum: ['useful', 'not_useful', 'critical'] },
        context: { type: 'string', description: 'What context was the memory used in (helps learn associations)' },
        namespace: { type: 'string', description: 'Project namespace' },
      },
      required: ['memory_id', 'feedback'],
    },
  },
  {
    name: 'brain_consolidate',
    description: 'Cognitive housekeeping. Scans memories for redundancy and clusters similar ones, then creates "insight" memories that summarize each cluster. Marks source memories as consolidated. Like a brain organizing memories during sleep. Run periodically or when memory count is high.',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: { type: 'string', description: 'Namespace to consolidate (default: all)' },
        user_id: { type: 'string', description: 'User ID (default: "default")' },
        min_cluster_size: { type: 'number', description: 'Minimum memories to form a cluster (default: 3)' },
        max_insights: { type: 'number', description: 'Maximum insights to generate per run (default: 5)' },
        dry_run: { type: 'boolean', description: 'Preview clusters without creating insights (default: false)' },
      },
    },
  },
  {
    name: 'brain_status',
    description: 'Cognitive state report. Returns the current "brain health": memory distribution by type and namespace, adaptive weight state, recent consolidation activity, memory freshness metrics, and overall cognitive load assessment.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User ID (default: "default")' },
        namespace: { type: 'string', description: 'Filter to specific namespace' },
      },
    },
  },
  {
    name: 'brain_simulate',
    description: 'Decision simulation engine. Before committing to a decision, simulates the outcome by analyzing past decisions, rules, and patterns in memory. Finds similar historical decisions and their results, detects potential risks from past failures, maps which namespaces/projects would be affected, and returns a risk-scored forecast. Use before any significant architectural or strategic decision.',
    inputSchema: {
      type: 'object',
      properties: {
        decision: { type: 'string', description: 'The proposed decision or action to simulate (e.g., "Switch from REST to GraphQL")' },
        namespace: { type: 'string', description: 'Primary namespace context' },
        user_id: { type: 'string', description: 'User ID (default: "default")' },
        include_cross_namespace: { type: 'boolean', description: 'Also check other namespaces for related patterns (default: true)' },
      },
      required: ['decision'],
    },
  },
  {
    name: 'brain_dream',
    description: 'Cross-namespace ideation engine. Explores connections between different projects/namespaces to discover unexpected patterns, transferable insights, and novel ideas. Like a brain dreaming — makes creative leaps by cross-pollinating knowledge across isolated domains. Run when seeking inspiration or fresh perspectives.',
    inputSchema: {
      type: 'object',
      properties: {
        focus: { type: 'string', description: 'Optional focus topic to guide the dream (leave empty for free association)' },
        user_id: { type: 'string', description: 'User ID (default: "default")' },
        max_ideas: { type: 'number', description: 'Maximum number of creative connections to generate (default: 5, max: 10)' },
        namespaces: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific namespaces to cross-pollinate (default: all)',
        },
      },
    },
  },
];

// ============================================================
// Resources
// ============================================================
const RESOURCES = [
  {
    uri: 'stackmemory://stats',
    name: 'Memory Statistics',
    description: 'Current statistics and overview of the memory store',
    mimeType: 'application/json',
  },
  {
    uri: 'stackmemory://recent',
    name: 'Recent Memories',
    description: 'Most recently stored memories',
    mimeType: 'application/json',
  },
  {
    uri: 'stackmemory://graph',
    name: 'Memory Graph',
    description: 'Full memory relationship graph',
    mimeType: 'application/json',
  },
];

// ============================================================
// Prompts
// ============================================================
const PROMPTS = [
  {
    name: 'memory_search',
    description: 'Search and analyze memories based on a topic or question',
    arguments: [
      { name: 'topic', description: 'Topic or question to search memories for', required: true },
    ],
  },
  {
    name: 'memory_review',
    description: 'Review and organize memories by type, identifying patterns and connections',
    arguments: [
      { name: 'type', description: 'Memory type to review: identity, preference, fact, or all', required: false },
    ],
  },
  {
    name: 'memory_cleanup',
    description: 'Identify duplicate, outdated, or low-confidence memories for cleanup',
    arguments: [],
  },
];

// ============================================================
// Stop Words for concept clustering
// ============================================================
const STOP_WORDS = new Set([
  // English
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'mine', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who',
  'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'because', 'if', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'any', 'up', 'out', 'off', 'over', 'down', 'also', 'like',
  'get', 'got', 'much', 'many', 'well', 'still', 'even', 'back', 'way', 'make', 'made',
  'know', 'think', 'say', 'said', 'go', 'went', 'come', 'came', 'see', 'saw', 'take',
  'took', 'want', 'really', 'thing', 'things', 'something', 'anything', 'everything',
  'nothing', 'one', 'two', 'three', 'first', 'last', 'new', 'old', 'good', 'bad',
  'big', 'small', 'long', 'short', 'high', 'low',
  // Turkish
  've', 'veya', 'ama', 'için', 'ile', 'bu', 'şu', 'o', 'bir', 'da', 'de', 'den',
  'dan', 'in', 'ın', 'un', 'ün', 'e', 'a', 'ye', 'ya', 'i', 'ı', 'u', 'ü',
  'ben', 'sen', 'biz', 'siz', 'onlar', 'benim', 'senin', 'bizim', 'sizin',
  'onların', 'mi', 'mı', 'mu', 'mü', 'ne', 'nasıl', 'neden', 'niçin', 'hangi',
  'kendi', 'daha', 'en', 'çok', 'az', 'her', 'tüm', 'bazı', 'hiç', 'var', 'yok',
  'olmak', 'etmek', 'yapmak', 'gelmek', 'gitmek', 'görmek', 'bilmek', 'istemek',
  'demek', 'almak', 'vermek', 'kullanmak', 'bulmak', 'sormak', 'anlamak',
]);

// ============================================================
// Database Initialization
// ============================================================
async function initDatabase(db: D1Database): Promise<void> {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'fact',
        confidence REAL NOT NULL DEFAULT 0.8,
        user_id TEXT NOT NULL DEFAULT 'default',
        namespace TEXT NOT NULL DEFAULT 'global',
        importance_score REAL NOT NULL DEFAULT 0.5,
        last_accessed TEXT,
        access_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT,
        tags TEXT DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS memory_links (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relation TEXT NOT NULL DEFAULT 'related',
        weight REAL NOT NULL DEFAULT 0.5,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
      CREATE INDEX IF NOT EXISTS idx_memories_deleted ON memories(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_memories_content ON memories(content);
      CREATE INDEX IF NOT EXISTS idx_memories_namespace ON memories(namespace);
      CREATE INDEX IF NOT EXISTS idx_memories_user_ns ON memories(user_id, namespace);
      CREATE INDEX IF NOT EXISTS idx_memory_links_source ON memory_links(source_id);
      CREATE INDEX IF NOT EXISTS idx_memory_links_target ON memory_links(target_id);
      CREATE TABLE IF NOT EXISTS brain_config (
        id TEXT PRIMARY KEY,
        namespace TEXT NOT NULL DEFAULT 'global',
        weight_similarity REAL NOT NULL DEFAULT 0.35,
        weight_decay REAL NOT NULL DEFAULT 0.15,
        weight_importance REAL NOT NULL DEFAULT 0.25,
        weight_frequency REAL NOT NULL DEFAULT 0.10,
        weight_emotional REAL NOT NULL DEFAULT 0.15,
        total_feedback INTEGER NOT NULL DEFAULT 0,
        useful_feedback INTEGER NOT NULL DEFAULT 0,
        last_adapted TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS brain_feedback (
        id TEXT PRIMARY KEY,
        memory_id TEXT NOT NULL,
        namespace TEXT NOT NULL DEFAULT 'global',
        feedback TEXT NOT NULL,
        memory_type TEXT,
        context TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_brain_feedback_ns ON brain_feedback(namespace);
      CREATE INDEX IF NOT EXISTS idx_brain_feedback_created ON brain_feedback(created_at);
    `);
    // Migrations: add columns for existing tables (safe if already exists)
    const migrations = [
      `ALTER TABLE memories ADD COLUMN namespace TEXT NOT NULL DEFAULT 'global'`,
      `ALTER TABLE memories ADD COLUMN importance_score REAL NOT NULL DEFAULT 0.5`,
      `ALTER TABLE memories ADD COLUMN last_accessed TEXT`,
      `ALTER TABLE memories ADD COLUMN access_count INTEGER NOT NULL DEFAULT 0`,
    ];
    for (const m of migrations) {
      try { await db.exec(m); } catch { /* column already exists */ }
    }
  } catch (e) {
    log(LOG_LEVEL.WARN, 'db', 'Table init (may already exist)', { error: String(e) });
  }
}

// Helper: bump access stats on retrieved memories (fire-and-forget)
async function touchMemories(ids: string[], db: D1Database): Promise<void> {
  if (ids.length === 0) return;
  try {
    const placeholders = ids.map(() => '?').join(',');
    await db.prepare(
      `UPDATE memories SET last_accessed = datetime('now'), access_count = access_count + 1 WHERE id IN (${placeholders})`
    ).bind(...ids).run();
  } catch { /* best-effort, don't block response */ }
}

// Helper: build namespace filter SQL clause
function nsFilter(namespace: string | undefined): { clause: string; param: string | null } {
  if (!namespace || namespace === 'global' || namespace === '') {
    return { clause: '', param: null };
  }
  return { clause: ` AND namespace = ?`, param: namespace };
}

// ============================================================
// Tool Handlers
// ============================================================

// 1. search_memories
async function searchMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const keyword = String(params.keyword || '');
  const limit = Math.min(Number(params.limit) || 10, MAX_RESPONSE_ITEMS);
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;

  if (!keyword.trim()) {
    return { content: [{ type: 'text', text: 'Error: keyword parameter is required' }], isError: true };
  }

  const ns = nsFilter(namespace);
  const fetchLimit = limit * 3; // fetch extra for re-ranking
  const bindParams: (string | number)[] = [`%${keyword}%`, userId];
  if (ns.param) bindParams.push(ns.param);
  bindParams.push(fetchLimit);

  const results = await env.DB.prepare(
    `SELECT id, content, type, confidence, user_id, namespace, created_at, updated_at, tags
     FROM memories 
     WHERE content LIKE ? AND user_id = ? AND deleted_at IS NULL${ns.clause}
     ORDER BY confidence DESC, created_at DESC 
     LIMIT ?`
  )
    .bind(...bindParams)
    .all();

  // Vectorize: semantic search if available
  const queryEmbedding = await generateEmbedding(keyword, env);
  const vectorFilter: Record<string, string> = { user_id: userId };
  if (namespace && namespace !== 'global') vectorFilter.namespace = namespace;
  const vectorHits = queryEmbedding ? await vectorQuery(queryEmbedding, limit * 2, vectorFilter, env) : [];

  // Merge vector results into keyword results
  const keywordIds = new Set((results.results as Record<string, unknown>[]).map(m => String(m.id)));
  if (vectorHits.length > 0) {
    const missingIds = vectorHits.filter(v => !keywordIds.has(v.id)).map(v => v.id);
    if (missingIds.length > 0) {
      const placeholders = missingIds.map(() => '?').join(',');
      const extra = await env.DB.prepare(
        `SELECT id, content, type, confidence, user_id, namespace, created_at, updated_at, tags, last_accessed FROM memories WHERE id IN (${placeholders}) AND deleted_at IS NULL`
      ).bind(...missingIds).all();
      results.results.push(...extra.results);
    }
  }

  // Build vector score lookup
  const vectorScoreMap = new Map(vectorHits.map(v => [v.id, v.score]));

  // Re-rank: keyword relevance + vector similarity + confidence + decay
  const keywords = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const scored = (results.results as Record<string, unknown>[]).map(m => {
    const kwScore = scoreRelevance(String(m.content), keywords);
    const vecScore = vectorScoreMap.get(String(m.id)) || 0;
    const decay = calculateDecayScore(m.last_accessed as string | null, String(m.created_at));
    const conf = Number(m.confidence || 0);
    // Weighted combination: vector 40% + keyword 30% + confidence 15% + recency 15%
    const finalScore = (vecScore > 0)
      ? vecScore * 0.4 + kwScore * 0.3 + conf * 0.15 + decay * 0.15
      : kwScore * 0.5 + conf * 0.3 + decay * 0.2;
    return { ...m, relevance_score: Math.round(finalScore * 100) / 100 };
  });
  scored.sort((a, b) => (b.relevance_score as number) - (a.relevance_score as number));

  const topResults = scored.slice(0, limit);
  const truncated = truncateMemoryResults(topResults);

  // Touch accessed memories (fire-and-forget)
  touchMemories(topResults.map(m => String((m as Record<string, unknown>).id)), env.DB);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        keyword,
        namespace: namespace || 'global',
        total: truncated.length,
        semantic_search: vectorHits.length > 0,
        memories: truncated,
      }, null, 2),
    }],
  };
}

// 2. store_memory (with PII scrubbing + namespace)
async function storeMemory(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const rawContent = String(params.content || '');
  const type = String(params.type || 'fact');
  const confidence = Number(params.confidence) || 0.8;
  const tags = Array.isArray(params.tags) ? params.tags : [];
  const userId = String(params.user_id || 'default');
  const namespace = String(params.namespace || 'global');

  if (!rawContent.trim()) {
    return { content: [{ type: 'text', text: 'Error: content parameter is required' }], isError: true };
  }

  if (!['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'].includes(type)) {
    return { content: [{ type: 'text', text: 'Error: type must be identity, preference, or fact' }], isError: true };
  }

  // PII / Secret scrubbing
  const { cleaned: content, detected, hadPII } = scrubPII(rawContent);

  const id = crypto.randomUUID();
  const tagsJson = JSON.stringify(tags);

  await env.DB.prepare(
    `INSERT INTO memories (id, content, type, confidence, user_id, namespace, tags, importance_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, content, type, Math.min(1, Math.max(0, confidence)), userId, namespace, tagsJson, 0.5)
    .run();

  // Vectorize: generate embedding and upsert (async, non-blocking)
  let vectorized = false;
  const embedding = await generateEmbedding(content, env);
  if (embedding) {
    vectorized = await vectorUpsert(id, embedding, { user_id: userId, namespace, type }, env);
  }

  const result: Record<string, unknown> = {
    success: true,
    memory: { id, content, type, confidence, user_id: userId, namespace, tags },
    vectorized,
  };
  if (hadPII) {
    result.pii_warning = `Sensitive data detected and redacted: ${detected.join(', ')}`;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2),
    }],
  };
}

// 3. update_memory (with PII scrubbing)
async function updateMemory(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const id = String(params.id || '');

  if (!id.trim()) {
    return { content: [{ type: 'text', text: 'Error: id parameter is required' }], isError: true };
  }

  const existing = await env.DB.prepare(
    `SELECT id, content, type, confidence, tags FROM memories WHERE id = ? AND deleted_at IS NULL`
  )
    .bind(id)
    .first();

  if (!existing) {
    return { content: [{ type: 'text', text: `Error: Memory with id ${id} not found or deleted` }], isError: true };
  }

  // PII scrub new content if provided
  let content: string;
  let piiWarning: string | null = null;
  if (params.content !== undefined) {
    const { cleaned, detected, hadPII } = scrubPII(String(params.content));
    content = cleaned;
    if (hadPII) piiWarning = `Sensitive data detected and redacted: ${detected.join(', ')}`;
  } else {
    content = String(existing.content);
  }

  const type = params.type !== undefined ? String(params.type) : String(existing.type);
  const confidence = params.confidence !== undefined ? Number(params.confidence) : Number(existing.confidence);
  const tags = params.tags !== undefined ? JSON.stringify(params.tags) : String(existing.tags);

  await env.DB.prepare(
    `UPDATE memories SET content = ?, type = ?, confidence = ?, tags = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(content, type, Math.min(1, Math.max(0, confidence)), tags, id)
    .run();

  const result: Record<string, unknown> = {
    success: true,
    memory: { id, content, type, confidence, tags: JSON.parse(tags) },
  };
  if (piiWarning) result.pii_warning = piiWarning;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2),
    }],
  };
}

// 4. delete_memory
async function deleteMemory(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const id = String(params.id || '');

  if (!id.trim()) {
    return { content: [{ type: 'text', text: 'Error: id parameter is required' }], isError: true };
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM memories WHERE id = ? AND deleted_at IS NULL`
  )
    .bind(id)
    .first();

  if (!existing) {
    return { content: [{ type: 'text', text: `Error: Memory with id ${id} not found or already deleted` }], isError: true };
  }

  await env.DB.prepare(
    `UPDATE memories SET deleted_at = datetime('now') WHERE id = ?`
  )
    .bind(id)
    .run();

  // Cleanup from Vectorize
  vectorDelete([id], env);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ success: true, id, deleted_at: new Date().toISOString() }, null, 2),
    }],
  };
}

// 5. query_memories (with relevance scoring + namespace + truncation)
async function queryMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const query = String(params.query || '');
  const limit = Math.min(Number(params.limit) || 10, MAX_RESPONSE_ITEMS);
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;

  if (!query.trim()) {
    return { content: [{ type: 'text', text: 'Error: query parameter is required' }], isError: true };
  }

  // Extract keywords from the natural language query
  const keywords = query
    .toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

  if (keywords.length === 0) {
    keywords.push(query.toLowerCase().trim());
  }

  const ns = nsFilter(namespace);
  const fetchLimit = limit * 3; // fetch more for re-ranking

  // Build OR conditions for each keyword
  const conditions = keywords.map(() => `(content LIKE ? OR tags LIKE ?)`).join(' OR ');
  const bindParams: (string | number)[] = [];
  for (const kw of keywords) {
    bindParams.push(`%${kw}%`, `%"${kw}"%`);
  }
  bindParams.push(userId);
  if (ns.param) bindParams.push(ns.param);
  bindParams.push(fetchLimit);

  const sql = `
    SELECT id, content, type, confidence, user_id, namespace, created_at, updated_at, tags
    FROM memories 
    WHERE (${conditions}) AND user_id = ? AND deleted_at IS NULL${ns.clause}
    ORDER BY confidence DESC, created_at DESC 
    LIMIT ?
  `;

  const results = await env.DB.prepare(sql).bind(...bindParams).all();

  // Vectorize: semantic search if available
  const queryEmbedding = await generateEmbedding(query, env);
  const vectorFilter: Record<string, string> = { user_id: userId };
  if (namespace && namespace !== 'global') vectorFilter.namespace = namespace;
  const vectorHits = queryEmbedding ? await vectorQuery(queryEmbedding, limit * 2, vectorFilter, env) : [];

  // Merge vector results
  const keywordIds = new Set((results.results as Record<string, unknown>[]).map(m => String(m.id)));
  if (vectorHits.length > 0) {
    const missingIds = vectorHits.filter(v => !keywordIds.has(v.id)).map(v => v.id);
    if (missingIds.length > 0) {
      const placeholders = missingIds.map(() => '?').join(',');
      const extra = await env.DB.prepare(
        `SELECT id, content, type, confidence, user_id, namespace, created_at, updated_at, tags, last_accessed FROM memories WHERE id IN (${placeholders}) AND deleted_at IS NULL`
      ).bind(...missingIds).all();
      results.results.push(...extra.results);
    }
  }

  const vectorScoreMap = new Map(vectorHits.map(v => [v.id, v.score]));

  // Re-rank: vector + keyword + tags + confidence + decay
  const scored = (results.results as Record<string, unknown>[]).map(m => {
    const kwScore = scoreRelevance(String(m.content), keywords);
    const tagScore = scoreRelevance(String(m.tags || ''), keywords);
    const vecScore = vectorScoreMap.get(String(m.id)) || 0;
    const decay = calculateDecayScore(m.last_accessed as string | null, String(m.created_at));
    const conf = Number(m.confidence || 0);
    const finalScore = (vecScore > 0)
      ? vecScore * 0.35 + kwScore * 0.25 + tagScore * 0.1 + conf * 0.15 + decay * 0.15
      : kwScore * 0.45 + tagScore * 0.15 + conf * 0.2 + decay * 0.2;
    return { ...m, relevance_score: Math.round(finalScore * 100) / 100 };
  });
  scored.sort((a, b) => (b.relevance_score as number) - (a.relevance_score as number));

  const topResults = scored.slice(0, limit);
  const truncated = truncateMemoryResults(topResults);

  // Touch accessed memories
  touchMemories(topResults.map(m => String((m as Record<string, unknown>).id)), env.DB);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        query,
        namespace: namespace || 'global',
        extracted_keywords: keywords,
        total: truncated.length,
        semantic_search: vectorHits.length > 0,
        memories: truncated,
      }, null, 2),
    }],
  };
}

// 6. list_memories (with namespace + truncation)
async function listMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const type = params.type as string | undefined;
  const limit = Math.min(Number(params.limit) || 20, MAX_RESPONSE_ITEMS);
  const offset = Number(params.offset) || 0;
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const includeDeleted = params.include_deleted === true;
  const ns = nsFilter(namespace);

  let sql = `
    SELECT id, content, type, confidence, user_id, namespace, created_at, updated_at, tags, deleted_at
    FROM memories 
    WHERE user_id = ?
  `;
  const bindParams: (string | number)[] = [userId];

  if (!includeDeleted) {
    sql += ` AND deleted_at IS NULL`;
  }
  if (ns.param) {
    sql += ns.clause;
    bindParams.push(ns.param);
  }
  if (type && ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'].includes(type)) {
    sql += ` AND type = ?`;
    bindParams.push(type);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindParams.push(limit, offset);

  const results = await env.DB.prepare(sql).bind(...bindParams).all();

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM memories WHERE user_id = ?`;
  const countParams: (string | number)[] = [userId];
  if (!includeDeleted) countSql += ` AND deleted_at IS NULL`;
  if (ns.param) { countSql += ns.clause; countParams.push(ns.param); }
  if (type && ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'].includes(type)) { countSql += ` AND type = ?`; countParams.push(type); }
  const countResult = await env.DB.prepare(countSql).bind(...countParams).first();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: (countResult as Record<string, unknown>)?.total || 0,
        namespace: namespace || 'global',
        offset,
        limit,
        memories: truncateMemoryResults(results.results as Record<string, unknown>[]),
      }, null, 2),
    }],
  };
}

// 7. get_memory_graph (with sub-graph filtering + namespace)
async function getMemoryGraph(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const limit = Math.min(Number(params.limit) || 50, MAX_RESPONSE_ITEMS);
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const filterKeyword = params.filter_keyword as string | undefined;
  const ns = nsFilter(namespace);

  let sql: string;
  const bindParams: (string | number)[] = [];

  if (filterKeyword && filterKeyword.trim()) {
    // Sub-graph: only nodes matching keyword
    sql = `SELECT id, content, type, confidence, namespace, created_at FROM memories WHERE user_id = ? AND deleted_at IS NULL AND content LIKE ?`;
    bindParams.push(userId, `%${filterKeyword}%`);
  } else {
    sql = `SELECT id, content, type, confidence, namespace, created_at FROM memories WHERE user_id = ? AND deleted_at IS NULL`;
    bindParams.push(userId);
  }
  if (ns.param) { sql += ns.clause; bindParams.push(ns.param); }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  bindParams.push(limit);

  const memories = await env.DB.prepare(sql).bind(...bindParams).all();
  const memoryIds = memories.results.map((m: Record<string, unknown>) => m.id as string);

  let links: Record<string, unknown>[] = [];
  if (memoryIds.length > 0) {
    const placeholders = memoryIds.map(() => '?').join(',');
    links = (await env.DB.prepare(
      `SELECT ml.id, ml.source_id, ml.target_id, ml.relation, ml.weight 
       FROM memory_links ml 
       WHERE ml.source_id IN (${placeholders}) OR ml.target_id IN (${placeholders})`
    )
      .bind(...memoryIds, ...memoryIds)
      .all()).results as Record<string, unknown>[];
  }

  const nodeCount = memories.results.length;
  const edgeCount = links.length;
  const avgConfidence = nodeCount > 0
    ? memories.results.reduce((sum: number, m: Record<string, unknown>) => sum + Number(m.confidence), 0) / nodeCount
    : 0;

  const typeDistribution: Record<string, number> = {};
  for (const m of memories.results as Record<string, unknown>[]) {
    typeDistribution[String(m.type)] = (typeDistribution[String(m.type)] || 0) + 1;
  }

  // Truncate node content for response size
  const truncatedNodes = truncateMemoryResults(memories.results as Record<string, unknown>[], limit, true);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        stats: { node_count: nodeCount, edge_count: edgeCount, avg_confidence: Math.round(avgConfidence * 100) / 100, type_distribution: typeDistribution },
        filter: filterKeyword || null,
        namespace: namespace || 'global',
        nodes: truncatedNodes,
        edges: links,
      }, null, 2),
    }],
  };
}

// 8. link_memories
async function linkMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const sourceId = String(params.source_id || '');
  const targetId = String(params.target_id || '');
  const relation = String(params.relation || 'related');
  const weight = Number(params.weight) || 0.5;

  if (!sourceId.trim() || !targetId.trim()) {
    return { content: [{ type: 'text', text: 'Error: source_id and target_id are required' }], isError: true };
  }

  // Verify both memories exist
  const source = await env.DB.prepare(`SELECT id FROM memories WHERE id = ? AND deleted_at IS NULL`).bind(sourceId).first();
  const target = await env.DB.prepare(`SELECT id FROM memories WHERE id = ? AND deleted_at IS NULL`).bind(targetId).first();

  if (!source) {
    return { content: [{ type: 'text', text: `Error: Source memory ${sourceId} not found or deleted` }], isError: true };
  }
  if (!target) {
    return { content: [{ type: 'text', text: `Error: Target memory ${targetId} not found or deleted` }], isError: true };
  }

  // Check for existing link
  const existing = await env.DB.prepare(
    `SELECT id FROM memory_links WHERE source_id = ? AND target_id = ? AND relation = ?`
  )
    .bind(sourceId, targetId, relation)
    .first();

  if (existing) {
    return { content: [{ type: 'text', text: `Error: Link already exists between ${sourceId} and ${targetId} with relation "${relation}"` }], isError: true };
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO memory_links (id, source_id, target_id, relation, weight) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, sourceId, targetId, relation, Math.min(1, Math.max(0, weight)))
    .run();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        link: { id, source_id: sourceId, target_id: targetId, relation, weight },
      }, null, 2),
    }],
  };
}

// 9. sm_time_query (with namespace + truncation)
async function timeQuery(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const period = String(params.period || 'last_week');
  const type = params.type as string | undefined;
  const limit = Math.min(Number(params.limit) || 50, MAX_RESPONSE_ITEMS);
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const ns = nsFilter(namespace);

  let fromDate: string;
  let toDate: string;

  if (period === 'custom') {
    fromDate = String(params.from_date || '');
    toDate = String(params.to_date || '');
    if (!fromDate || !toDate) {
      return { content: [{ type: 'text', text: 'Error: from_date and to_date are required for custom period' }], isError: true };
    }
  } else {
    const now = new Date();
    toDate = now.toISOString().slice(0, 19).replace('T', ' ');
    const periodDays: Record<string, number> = { last_day: 1, last_week: 7, last_month: 30, last_year: 365 };
    const days = periodDays[period] || 7;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    fromDate = from.toISOString().slice(0, 19).replace('T', ' ');
  }

  let sql = `
    SELECT id, content, type, confidence, namespace, created_at, updated_at, tags
    FROM memories 
    WHERE user_id = ? AND deleted_at IS NULL AND created_at >= ? AND created_at <= ?
  `;
  const bindParams: (string | number)[] = [userId, fromDate, toDate];

  if (ns.param) { sql += ns.clause; bindParams.push(ns.param); }
  if (type && ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'].includes(type)) { sql += ` AND type = ?`; bindParams.push(type); }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  bindParams.push(limit);

  const results = await env.DB.prepare(sql).bind(...bindParams).all();

  // Group by day with truncation
  const grouped: Record<string, Record<string, unknown>[]> = {};
  for (const mem of truncateMemoryResults(results.results as Record<string, unknown>[]) as Record<string, unknown>[]) {
    const day = String(mem.created_at).slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(mem);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period,
        namespace: namespace || 'global',
        from_date: fromDate,
        to_date: toDate,
        total: results.results.length,
        grouped_by_day: grouped,
      }, null, 2),
    }],
  };
}

// 10. sm_memory_summary (with namespace)
async function memorySummary(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const ns = nsFilter(namespace);

  // Helper to build filtered queries
  const baseWhere = `user_id = ?${ns.clause} AND deleted_at IS NULL`;
  const baseParams = ns.param ? [userId, ns.param] : [userId];

  const totalResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM memories WHERE ${baseWhere}`
  ).bind(...baseParams).first();

  const typeDist = await env.DB.prepare(
    `SELECT type, COUNT(*) as count FROM memories WHERE ${baseWhere} GROUP BY type`
  ).bind(...baseParams).all();

  const confResult = await env.DB.prepare(
    `SELECT AVG(confidence) as avg_confidence FROM memories WHERE ${baseWhere}`
  ).bind(...baseParams).first();

  const activeDayResult = await env.DB.prepare(
    `SELECT DATE(created_at) as day, COUNT(*) as count FROM memories WHERE ${baseWhere} GROUP BY DATE(created_at) ORDER BY count DESC LIMIT 1`
  ).bind(...baseParams).first();

  const activeWeekResult = await env.DB.prepare(
    `SELECT STRFTIME('%Y-W%W', created_at) as week, COUNT(*) as count FROM memories WHERE ${baseWhere} GROUP BY week ORDER BY count DESC LIMIT 1`
  ).bind(...baseParams).first();

  const topLinked = await env.DB.prepare(
    `SELECT m.id, m.content, COUNT(ml.id) as link_count 
     FROM memories m 
     LEFT JOIN memory_links ml ON (ml.source_id = m.id OR ml.target_id = m.id) 
     WHERE m.user_id = ? AND m.deleted_at IS NULL${ns.clause}
     GROUP BY m.id 
     ORDER BY link_count DESC 
     LIMIT 5`
  ).bind(...baseParams).all();

  const confTrend = await env.DB.prepare(
    `SELECT created_at, confidence FROM memories WHERE ${baseWhere} ORDER BY created_at DESC LIMIT 10`
  ).bind(...baseParams).all();

  const deletedWhere = `user_id = ?${ns.clause} AND deleted_at IS NOT NULL`;
  const deletedResult = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM memories WHERE ${deletedWhere}`
  ).bind(...baseParams).first();

  // Namespace distribution (only in global mode)
  let namespaceDist: Record<string, number> | null = null;
  if (!namespace) {
    const nsDist = await env.DB.prepare(
      `SELECT namespace, COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NULL GROUP BY namespace`
    ).bind(userId).all();
    namespaceDist = {};
    for (const row of nsDist.results as Record<string, unknown>[]) {
      namespaceDist[String(row.namespace)] = Number(row.count);
    }
  }

  const typeDistribution: Record<string, number> = {};
  for (const row of typeDist.results as Record<string, unknown>[]) {
    typeDistribution[String(row.type)] = Number(row.count);
  }

  const result: Record<string, unknown> = {
    total_memories: Number((totalResult as Record<string, unknown>)?.total || 0),
    deleted_memories: Number((deletedResult as Record<string, unknown>)?.count || 0),
    namespace: namespace || 'global',
    type_distribution: typeDistribution,
    average_confidence: Math.round(Number((confResult as Record<string, unknown>)?.avg_confidence || 0) * 100) / 100,
    most_active_day: activeDayResult ? { day: (activeDayResult as Record<string, unknown>).day, count: (activeDayResult as Record<string, unknown>).count } : null,
    most_active_week: activeWeekResult ? { week: (activeWeekResult as Record<string, unknown>).week, count: (activeWeekResult as Record<string, unknown>).count } : null,
    top_linked_memories: truncateMemoryResults(topLinked.results as Record<string, unknown>[], 5),
    confidence_trend: confTrend.results,
  };
  if (namespaceDist) result.namespace_distribution = namespaceDist;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2),
    }],
  };
}

// 11. sm_batch_operations
async function batchOperations(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const operation = String(params.operation || '');
  const ids = Array.isArray(params.ids) ? params.ids as string[] : [];
  const opParams = (params.params || {}) as Record<string, unknown>;
  const userId = String(params.user_id || 'default');

  try {
    let affectedCount = 0;

    switch (operation) {
      case 'update_confidence': {
        if (ids.length === 0) {
          return { content: [{ type: 'text', text: 'Error: ids array is required for update_confidence' }], isError: true };
        }
        const newConfidence = Number(opParams.confidence);
        if (isNaN(newConfidence) || newConfidence < 0 || newConfidence > 1) {
          return { content: [{ type: 'text', text: 'Error: params.confidence must be between 0 and 1' }], isError: true };
        }

        const placeholders = ids.map(() => '?').join(',');
        const result = await env.DB.prepare(
          `UPDATE memories SET confidence = ?, updated_at = datetime('now') WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`
        ).bind(newConfidence, ...ids, userId).run();

        affectedCount = result.meta?.changes || ids.length;
        break;
      }

      case 'delete_old': {
        const ageDays = Number(opParams.age_days) || 365;
        const result = await env.DB.prepare(
          `UPDATE memories SET deleted_at = datetime('now') WHERE user_id = ? AND deleted_at IS NULL AND created_at < datetime('now', '-' || ? || ' days')`
        ).bind(userId, ageDays).run();

        affectedCount = result.meta?.changes || 0;
        break;
      }

      case 'add_tag': {
        if (ids.length === 0) {
          return { content: [{ type: 'text', text: 'Error: ids array is required for add_tag' }], isError: true };
        }
        const tag = String(opParams.tag || '');
        if (!tag) {
          return { content: [{ type: 'text', text: 'Error: params.tag is required for add_tag' }], isError: true };
        }

        // Fetch existing tags, add new tag, update
        const placeholders = ids.map(() => '?').join(',');
        const memories = await env.DB.prepare(
          `SELECT id, tags FROM memories WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`
        ).bind(...ids, userId).all();

        const stmts: D1PreparedStatement[] = [];
        for (const mem of memories.results as Record<string, unknown>[]) {
          let tags: string[] = [];
          try { tags = JSON.parse(String(mem.tags)); } catch { tags = []; }
          if (!tags.includes(tag)) {
            tags.push(tag);
            stmts.push(
              env.DB.prepare(
                `UPDATE memories SET tags = ?, updated_at = datetime('now') WHERE id = ?`
              ).bind(JSON.stringify(tags), String(mem.id))
            );
          }
        }

        if (stmts.length > 0) {
          await env.DB.batch(stmts);
        }
        affectedCount = stmts.length;
        break;
      }

      case 'remove_tag': {
        if (ids.length === 0) {
          return { content: [{ type: 'text', text: 'Error: ids array is required for remove_tag' }], isError: true };
        }
        const tag = String(opParams.tag || '');
        if (!tag) {
          return { content: [{ type: 'text', text: 'Error: params.tag is required for remove_tag' }], isError: true };
        }

        const placeholders = ids.map(() => '?').join(',');
        const memories = await env.DB.prepare(
          `SELECT id, tags FROM memories WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`
        ).bind(...ids, userId).all();

        const stmts: D1PreparedStatement[] = [];
        for (const mem of memories.results as Record<string, unknown>[]) {
          let tags: string[] = [];
          try { tags = JSON.parse(String(mem.tags)); } catch { tags = []; }
          const filteredTags = tags.filter((t: string) => t !== tag);
          if (filteredTags.length !== tags.length) {
            stmts.push(
              env.DB.prepare(
                `UPDATE memories SET tags = ?, updated_at = datetime('now') WHERE id = ?`
              ).bind(JSON.stringify(filteredTags), String(mem.id))
            );
          }
        }

        if (stmts.length > 0) {
          await env.DB.batch(stmts);
        }
        affectedCount = stmts.length;
        break;
      }

      default:
        return { content: [{ type: 'text', text: `Error: Unknown operation "${operation}"` }], isError: true };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          operation,
          affected_count: affectedCount,
          summary: `${operation} completed successfully, ${affectedCount} memories affected`,
        }, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Batch operation failed: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

// 12. sm_export_memories (with limit + namespace)
async function exportMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const format = String(params.format || 'json');
  const type = params.type as string | undefined;
  const includeDeleted = params.include_deleted === true;
  const includeLinks = params.include_links === true;
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const exportLimit = Math.min(Number(params.limit) || 500, 500);
  const ns = nsFilter(namespace);

  let sql = `SELECT * FROM memories WHERE user_id = ?`;
  const bindParams: (string | number)[] = [userId];

  if (!includeDeleted) {
    sql += ` AND deleted_at IS NULL`;
  }
  if (ns.param) { sql += ns.clause; bindParams.push(ns.param); }
  if (type && ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'].includes(type)) {
    sql += ` AND type = ?`;
    bindParams.push(type);
  }
  if (fromDate) {
    sql += ` AND created_at >= ?`;
    bindParams.push(fromDate);
  }
  if (toDate) {
    sql += ` AND created_at <= ?`;
    bindParams.push(toDate);
  }

  sql += ` ORDER BY created_at ASC LIMIT ?`;
  bindParams.push(exportLimit);
  const memories = await env.DB.prepare(sql).bind(...bindParams).all();

  // Fetch links if requested
  let links: Record<string, unknown>[] = [];
  if (includeLinks && memories.results.length > 0) {
    const memoryIds = (memories.results as Record<string, unknown>[]).map((m: Record<string, unknown>) => String(m.id));
    const placeholders = memoryIds.map(() => '?').join(',');
    links = (await env.DB.prepare(
      `SELECT * FROM memory_links WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})`
    ).bind(...memoryIds, ...memoryIds).all()).results as Record<string, unknown>[];
  }

  if (format === 'csv') {
    const headers = ['id', 'content', 'type', 'confidence', 'user_id', 'created_at', 'updated_at', 'deleted_at', 'tags'];
    const rows = (memories.results as Record<string, unknown>[]).map((m: Record<string, unknown>) => {
      return headers.map(h => {
        const val = m[h];
        if (h === 'tags') return `"${String(val || '[]').replace(/"/g, '""')}"`;
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(',');
    });

    let csvOutput = headers.join(',') + '\n' + rows.join('\n');
    if (includeLinks && links.length > 0) {
      const linkHeaders = ['id', 'source_id', 'target_id', 'relation', 'weight', 'created_at'];
      csvOutput += '\n\n--- Memory Links ---\n' + linkHeaders.join(',') + '\n';
      csvOutput += links.map((l: Record<string, unknown>) => {
        return linkHeaders.map(h => l[h] ?? '').join(',');
      }).join('\n');
    }

    return {
      content: [{
        type: 'text',
        text: csvOutput,
      }],
    };
  }

  // JSON format
  const exportData: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    total_memories: memories.results.length,
    memories: memories.results,
  };

  if (includeLinks) {
    exportData.total_links = links.length;
    exportData.links = links;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(exportData, null, 2),
    }],
  };
}

// 13. sm_concept_cluster (with LIMIT + namespace - prevents O(n²) explosion)
async function conceptCluster(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const minClusterSize = Number(params.min_cluster_size) || 2;
  const maxClusters = Number(params.max_clusters) || 10;
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const clusterLimit = Math.min(Number(params.limit) || 500, 500);
  const ns = nsFilter(namespace);

  // Fetch memories with hard LIMIT to prevent O(n²) explosion
  const bindParams: (string | number)[] = [userId];
  let sql = `SELECT id, content, type, tags FROM memories WHERE user_id = ? AND deleted_at IS NULL`;
  if (ns.param) { sql += ns.clause; bindParams.push(ns.param); }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  bindParams.push(clusterLimit);

  const memories = await env.DB.prepare(sql).bind(...bindParams).all();

  if (memories.results.length === 0) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ clusters: [], total_memories: 0, message: 'No memories found for clustering' }, null, 2),
      }],
    };
  }

  // Extract keywords from each memory
  const memoryKeywords: Map<string, Set<string>> = new Map();
  const allKeywords: Map<string, string[]> = new Map(); // keyword -> memory IDs

  for (const mem of memories.results as Record<string, unknown>[]) {
    const content = String(mem.content || '').toLowerCase();
    const tags = (() => { try { return JSON.parse(String(mem.tags || '[]')); } catch { return []; } })() as string[];

    // Extract words from content
    const words = content
      .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !STOP_WORDS.has(w));

    // Combine with tags
    const keywords = new Set([...words, ...tags.map((t: string) => t.toLowerCase())]);
    memoryKeywords.set(String(mem.id), keywords);

    // Build reverse index
    for (const kw of keywords) {
      if (!allKeywords.has(kw)) allKeywords.set(kw, []);
      allKeywords.get(kw)!.push(String(mem.id));
    }
  }

  // Cluster memories by shared keywords (2+ shared)
  const memoryIds = Array.from(memoryKeywords.keys());
  const clusters: Map<string, Set<string>> = new Map();
  const assignedMemories: Set<string> = new Set();

  // Sort keywords by frequency (most shared first)
  const sortedKeywords = Array.from(allKeywords.entries())
    .filter(([, ids]) => ids.length >= minClusterSize)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [keyword, memIds] of sortedKeywords) {
    if (clusters.size >= maxClusters) break;

    const unassigned = memIds.filter(id => !assignedMemories.has(id));
    if (unassigned.length < minClusterSize) continue;

    // Check if these memories share 2+ keywords
    const commonKeywords: Set<string> = new Set();
    for (const mid of unassigned) {
      for (const kw of memoryKeywords.get(mid) || []) {
        let sharedCount = 0;
        for (const otherMid of unassigned) {
          if (memoryKeywords.get(otherMid)?.has(kw)) sharedCount++;
        }
        if (sharedCount >= minClusterSize) commonKeywords.add(kw);
      }
    }

    const clusterId = `cluster_${clusters.size + 1}`;
    const memberSet = new Set(unassigned);
    clusters.set(clusterId, memberSet);

    for (const mid of unassigned) {
      assignedMemories.add(mid);
    }
  }

  // Build cluster output
  const clusterResults = [];
  for (const [clusterId, memberIds] of clusters) {
    const memberArr = Array.from(memberIds);
    // Find shared keywords among cluster members
    const keywordSets = memberArr.map(id => memoryKeywords.get(id) || new Set());
    const sharedKws = new Set<string>();
    if (keywordSets.length > 0) {
      for (const kw of keywordSets[0]) {
        if (keywordSets.every(ks => ks.has(kw))) sharedKws.add(kw as string);
      }
    }

    // Get representative memories (top 3 by keyword overlap)
    const representativeIds = memberArr.slice(0, 3);
    const representatives = representativeIds.map(id => {
      const mem = (memories.results as Record<string, unknown>[]).find((m: Record<string, unknown>) => String(m.id) === id);
      return mem ? { id: String(mem.id), content: String(mem.content).slice(0, 100), type: mem.type } : null;
    }).filter(Boolean);

    // Get inter-cluster relationships
    const relatedClusters: string[] = [];
    for (const [otherClusterId, otherMemberIds] of clusters) {
      if (otherClusterId === clusterId) continue;
      const overlap = Array.from(memberIds).filter(id => otherMemberIds.has(id));
      if (overlap.length > 0) relatedClusters.push(otherClusterId);
    }

    clusterResults.push({
      id: clusterId,
      label: Array.from(sharedKws).slice(0, 5).join(', ') || `Cluster ${clusterId}`,
      member_count: memberArr.length,
      shared_keywords: Array.from(sharedKws).slice(0, 10),
      representatives,
      related_clusters: relatedClusters,
    });
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total_memories: memories.results.length,
        clustered_memories: assignedMemories.size,
        unclustered_memories: memories.results.length - assignedMemories.size,
        total_clusters: clusterResults.length,
        clusters: clusterResults,
      }, null, 2),
    }],
  };
}

// 14. sm_import_memories (with PII scrubbing + namespace)
async function importMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const dataStr = String(params.data || '');
  const duplicateHandling = String(params.duplicate_handling || 'skip');
  const userId = String(params.user_id || 'default');
  const namespace = String(params.namespace || 'global');

  if (!dataStr.trim()) {
    return { content: [{ type: 'text', text: 'Error: data parameter is required' }], isError: true };
  }

  let data: Array<Record<string, unknown>>;
  try {
    data = JSON.parse(dataStr);
    if (!Array.isArray(data)) {
      return { content: [{ type: 'text', text: 'Error: data must be a JSON array of memory objects' }], isError: true };
    }
  } catch {
    return { content: [{ type: 'text', text: 'Error: data must be valid JSON' }], isError: true };
  }

  let imported = 0;
  let skipped = 0;
  let updated = 0;
  let piiRedacted = 0;
  const newIds: string[] = [];

  for (const item of data) {
    const rawContent = String(item.content || '').trim();
    if (!rawContent) continue;

    // PII scrub each imported memory
    const { cleaned: content, hadPII } = scrubPII(rawContent);
    if (hadPII) piiRedacted++;

    const type = ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'].includes(String(item.type)) ? String(item.type) : 'fact';
    const confidence = Number(item.confidence) || 0.8;
    const tags = Array.isArray(item.tags) ? item.tags : [];

    // Check for duplicate by content
    const existing = await env.DB.prepare(
      `SELECT id, content, type, confidence, tags FROM memories WHERE content = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`
    ).bind(content, userId).first();

    if (existing) {
      if (duplicateHandling === 'skip') {
        skipped++;
        continue;
      } else if (duplicateHandling === 'update') {
        await env.DB.prepare(
          `UPDATE memories SET type = ?, confidence = ?, tags = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(type, Math.min(1, Math.max(0, confidence)), JSON.stringify(tags), String((existing as Record<string, unknown>).id)).run();
        updated++;
        continue;
      }
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO memories (id, content, type, confidence, user_id, namespace, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, content, type, Math.min(1, Math.max(0, confidence)), userId, namespace, JSON.stringify(tags)).run();

    imported++;
    newIds.push(id);
  }

  const result: Record<string, unknown> = {
    success: true,
    namespace,
    total_items: data.length,
    imported,
    skipped,
    updated,
    new_ids: newIds,
  };
  if (piiRedacted > 0) result.pii_redacted_count = piiRedacted;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2),
    }],
  };
}

// ============================================================
// Resource Handlers
// ============================================================
async function handleResourceRead(uri: string, env: Env): Promise<unknown> {
  switch (uri) {
    case 'stackmemory://stats': {
      const total = await env.DB.prepare(`SELECT COUNT(*) as total FROM memories WHERE deleted_at IS NULL`).first();
      const byType = await env.DB.prepare(`SELECT type, COUNT(*) as count FROM memories WHERE deleted_at IS NULL GROUP BY type`).all();
      const avgConf = await env.DB.prepare(`SELECT AVG(confidence) as avg FROM memories WHERE deleted_at IS NULL`).first();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            total_memories: (total as Record<string, unknown>)?.total || 0,
            type_distribution: Object.fromEntries((byType.results as Record<string, unknown>[]).map((r: Record<string, unknown>) => [r.type, r.count])),
            average_confidence: Math.round(Number((avgConf as Record<string, unknown>)?.avg || 0) * 100) / 100,
          }),
        }],
      };
    }
    case 'stackmemory://recent': {
      const recent = await env.DB.prepare(
        `SELECT id, content, type, confidence, created_at FROM memories WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10`
      ).all();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(recent.results),
        }],
      };
    }
    case 'stackmemory://graph': {
      const nodes = await env.DB.prepare(`SELECT id, content, type FROM memories WHERE deleted_at IS NULL LIMIT 100`).all();
      const edges = await env.DB.prepare(`SELECT * FROM memory_links LIMIT 100`).all();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ nodes: nodes.results, edges: edges.results }),
        }],
      };
    }
    default:
      return { contents: [{ uri, mimeType: 'text/plain', text: `Unknown resource: ${uri}` }] };
  }
}

// ============================================================
// Prompt Handlers
// ============================================================
function handlePromptGet(name: string, args: Record<string, string>): unknown {
  switch (name) {
    case 'memory_search': {
      const topic = args.topic || '';
      return {
        description: `Search and analyze memories for: ${topic}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please search the memory store for information about "${topic}". Use the search_memories and query_memories tools to find relevant memories, then provide a comprehensive analysis of what you find. Include connections between related memories and highlight any patterns or insights.`,
            },
          },
        ],
      };
    }
    case 'memory_review': {
      const type = args.type || 'all';
      return {
        description: `Review and organize ${type} memories`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review ${type === 'all' ? 'all' : type} memories in the store. Use list_memories to browse them, then organize them by themes, identify duplicate or redundant entries, and suggest improvements to the memory organization. Consider using sm_concept_cluster for automatic grouping.`,
            },
          },
        ],
      };
    }
    case 'memory_cleanup': {
      return {
        description: 'Identify and clean up problematic memories',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please analyze the memory store for cleanup opportunities. Look for:\n1. Duplicate or very similar memories\n2. Low-confidence memories that should be reviewed\n3. Outdated memories that could be archived\n4. Memories that could benefit from better tagging\n\nUse sm_memory_summary for an overview, then search_memories and list_memories to identify specific items. Suggest using sm_batch_operations for bulk cleanup actions.',
            },
          },
        ],
      };
    }
    default:
      return {
        description: 'Unknown prompt',
        messages: [{ role: 'user', content: { type: 'text', text: `Unknown prompt: ${name}` } }],
      };
  }
}

// 15. sm_prefetch — Proactive Memory Injection
async function prefetchMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const message = String(params.message || '');
  const topK = Math.min(Number(params.top_k) || 5, 20);
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const minScore = Number(params.min_score) || 0.1;

  if (!message.trim()) {
    return { content: [{ type: 'text', text: 'Error: message parameter is required' }], isError: true };
  }

  const ns = nsFilter(namespace);

  // Extract keywords from the user message
  const keywords = message
    .toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

  // 1. Vectorize semantic search (primary, if available)
  const queryEmbedding = await generateEmbedding(message, env);
  const vectorFilter: Record<string, string> = { user_id: userId };
  if (namespace && namespace !== 'global') vectorFilter.namespace = namespace;
  const vectorHits = queryEmbedding ? await vectorQuery(queryEmbedding, topK * 3, vectorFilter, env) : [];

  // 2. Keyword fallback search
  const fetchLimit = topK * 3;
  let keywordResults: Record<string, unknown>[] = [];
  if (keywords.length > 0) {
    const conditions = keywords.slice(0, 5).map(() => `content LIKE ?`).join(' OR ');
    const bindParams: (string | number)[] = keywords.slice(0, 5).map(kw => `%${kw}%`);
    bindParams.push(userId);
    if (ns.param) bindParams.push(ns.param);
    bindParams.push(fetchLimit);

    const kwResults = await env.DB.prepare(
      `SELECT id, content, type, confidence, namespace, created_at, last_accessed, importance_score, tags
       FROM memories WHERE (${conditions}) AND user_id = ? AND deleted_at IS NULL${ns.clause}
       ORDER BY confidence DESC, created_at DESC LIMIT ?`
    ).bind(...bindParams).all();
    keywordResults = kwResults.results as Record<string, unknown>[];
  }

  // 3. Merge and deduplicate
  const allIds = new Set<string>();
  const allMemories: Record<string, unknown>[] = [];

  // Add vector hits (fetch full records from D1)
  if (vectorHits.length > 0) {
    const vecIds = vectorHits.map(v => v.id);
    const placeholders = vecIds.map(() => '?').join(',');
    const vecRecords = await env.DB.prepare(
      `SELECT id, content, type, confidence, namespace, created_at, last_accessed, importance_score, tags
       FROM memories WHERE id IN (${placeholders}) AND deleted_at IS NULL`
    ).bind(...vecIds).all();
    for (const m of vecRecords.results as Record<string, unknown>[]) {
      allIds.add(String(m.id));
      allMemories.push(m);
    }
  }

  // Add keyword results
  for (const m of keywordResults) {
    if (!allIds.has(String(m.id))) {
      allIds.add(String(m.id));
      allMemories.push(m);
    }
  }

  // 4. Score all memories: vector + keyword + confidence + decay + importance
  const vectorScoreMap = new Map(vectorHits.map(v => [v.id, v.score]));
  const scored = allMemories.map(m => {
    const vecScore = vectorScoreMap.get(String(m.id)) || 0;
    const kwScore = keywords.length > 0 ? scoreRelevance(String(m.content), keywords) : 0;
    const decay = calculateDecayScore(m.last_accessed as string | null, String(m.created_at));
    const conf = Number(m.confidence || 0);
    const importance = Number(m.importance_score || 0.5);

    const finalScore = (vecScore > 0)
      ? vecScore * 0.35 + kwScore * 0.2 + conf * 0.15 + decay * 0.15 + importance * 0.15
      : kwScore * 0.35 + conf * 0.2 + decay * 0.2 + importance * 0.25;

    return { ...m, prefetch_score: Math.round(finalScore * 100) / 100 };
  });

  scored.sort((a, b) => (b.prefetch_score as number) - (a.prefetch_score as number));

  // 5. Filter by minimum score and take top_k
  const filtered = scored
    .filter(m => (m.prefetch_score as number) >= minScore)
    .slice(0, topK);

  // Touch accessed memories
  touchMemories(filtered.map(m => String((m as Record<string, unknown>).id)), env.DB);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message_preview: message.slice(0, 100),
        namespace: namespace || 'global',
        semantic_search: vectorHits.length > 0,
        total_candidates: allMemories.length,
        returned: filtered.length,
        memories: truncateMemoryResults(filtered),
      }, null, 2),
    }],
  };
}

// ============================================================
// 16. brain_think — Contextual Reasoning Engine
// ============================================================
async function brainThink(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const context = String(params.context || '');
  const depth = String(params.depth || 'normal');
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;

  if (!context.trim()) {
    return { content: [{ type: 'text', text: 'Error: context parameter is required' }], isError: true };
  }

  const topK = depth === 'quick' ? 5 : depth === 'deep' ? 20 : 10;
  const ns = nsFilter(namespace);

  // 1. Retrieve relevant memories (reuse prefetch scoring logic)
  const keywords = context.toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

  const queryEmbedding = await generateEmbedding(context, env);
  const vectorFilter: Record<string, string> = { user_id: userId };
  if (namespace && namespace !== 'global') vectorFilter.namespace = namespace;
  const vectorHits = queryEmbedding ? await vectorQuery(queryEmbedding, topK * 2, vectorFilter, env) : [];

  let keywordResults: Record<string, unknown>[] = [];
  if (keywords.length > 0) {
    const conditions = keywords.slice(0, 5).map(() => `content LIKE ?`).join(' OR ');
    const bindParams: (string | number)[] = keywords.slice(0, 5).map(kw => `%${kw}%`);
    bindParams.push(userId);
    if (ns.param) bindParams.push(ns.param);
    bindParams.push(topK * 2);

    const r = await env.DB.prepare(
      `SELECT id, content, type, confidence, namespace, created_at, updated_at, importance_score, tags
       FROM memories WHERE (${conditions}) AND user_id = ? AND deleted_at IS NULL${ns.clause}
       ORDER BY confidence DESC, created_at DESC LIMIT ?`
    ).bind(...bindParams).all();
    keywordResults = r.results as Record<string, unknown>[];
  }

  // Merge + deduplicate
  const seen = new Set<string>();
  const memories: Record<string, unknown>[] = [];
  if (vectorHits.length > 0) {
    const ids = vectorHits.map(v => v.id);
    const ph = ids.map(() => '?').join(',');
    const recs = await env.DB.prepare(
      `SELECT id, content, type, confidence, namespace, created_at, updated_at, importance_score, tags
       FROM memories WHERE id IN (${ph}) AND deleted_at IS NULL`
    ).bind(...ids).all();
    for (const m of recs.results as Record<string, unknown>[]) { seen.add(String(m.id)); memories.push(m); }
  }
  for (const m of keywordResults) {
    if (!seen.has(String(m.id))) { seen.add(String(m.id)); memories.push(m); }
  }

  // Score and rank
  const vecMap = new Map(vectorHits.map(v => [v.id, v.score]));
  const scored: (Record<string, unknown> & { think_score: number })[] = memories.map(m => {
    const vec = vecMap.get(String(m.id)) || 0;
    const kw = keywords.length > 0 ? scoreRelevance(String(m.content), keywords) : 0;
    const decay = calculateDecayScore(m.last_accessed as string | null, String(m.created_at));
    const score = vec > 0 ? vec * 0.4 + kw * 0.25 + decay * 0.2 + Number(m.importance_score || 0.5) * 0.15
                          : kw * 0.4 + decay * 0.25 + Number(m.importance_score || 0.5) * 0.35;
    return { ...m, think_score: Math.round(score * 100) / 100 };
  });
  scored.sort((a, b) => b.think_score - a.think_score);
  const topScored = scored.slice(0, topK);

  // 2. Get graph connections between these memories
  const memIds = topScored.map(m => String(m.id));
  let connections: Record<string, unknown>[] = [];
  if (memIds.length > 1) {
    const ph = memIds.map(() => '?').join(',');
    const linkResult = await env.DB.prepare(
      `SELECT source_id, target_id, relation, weight FROM memory_links
       WHERE source_id IN (${ph}) OR target_id IN (${ph})`
    ).bind(...memIds, ...memIds).all();
    connections = linkResult.results as Record<string, unknown>[];
  }

  // 3. Detect contradictions (same topic/type, different time, different content direction)
  const contradictions: { memory_a: string; memory_b: string; reason: string }[] = [];
  for (let i = 0; i < topScored.length; i++) {
    for (let j = i + 1; j < topScored.length; j++) {
      const a = topScored[i], b = topScored[j];
      if (a.type !== b.type) continue;
      // Check if keywords overlap significantly but content differs
      const wordsA = new Set(String(a.content).toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const wordsB = new Set(String(b.content).toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
      const overlapRatio = overlap / Math.max(Math.min(wordsA.size, wordsB.size), 1);

      if (overlapRatio > 0.3 && overlapRatio < 0.8) {
        // Significant topic overlap but not identical = potential contradiction
        const daysDiff = Math.abs(
          new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime()
        ) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) {
          contradictions.push({
            memory_a: String(a.id).slice(0, 8),
            memory_b: String(b.id).slice(0, 8),
            reason: `Same type (${a.type}), overlapping topic (${Math.round(overlapRatio * 100)}%), ${Math.round(daysDiff)} days apart — may reflect changed decisions`,
          });
        }
      }
    }
  }

  // 4. Build type distribution
  const typeDistribution: Record<string, number> = {};
  for (const m of topScored) {
    const t = String(m.type);
    typeDistribution[t] = (typeDistribution[t] || 0) + 1;
  }

  // 5. Generate strategic summary
  const highConfidence = topScored.filter(m => Number(m.confidence) >= 0.8);
  const lowConfidence = topScored.filter(m => Number(m.confidence) < 0.5);
  const recentCount = topScored.filter(m => {
    const days = (Date.now() - new Date(String(m.created_at)).getTime()) / (1000 * 60 * 60 * 24);
    return days < 30;
  }).length;

  touchMemories(memIds, env.DB);

  const analysis = {
    context_preview: context.slice(0, 150),
    depth,
    namespace: namespace || 'global',
    semantic_search: vectorHits.length > 0,

    key_memories: truncateMemoryResults(topScored),
    memory_count: topScored.length,
    type_distribution: typeDistribution,

    graph_connections: connections.length,
    connections: connections.slice(0, 20),

    contradictions_found: contradictions.length,
    contradictions,

    cognitive_assessment: {
      confidence_level: highConfidence.length > topScored.length / 2 ? 'high' : lowConfidence.length > topScored.length / 3 ? 'low' : 'moderate',
      knowledge_freshness: recentCount > topScored.length / 2 ? 'fresh' : recentCount > 0 ? 'mixed' : 'stale',
      recommendation: contradictions.length > 0
        ? `⚠️ ${contradictions.length} potential contradiction(s) detected. Review conflicting memories before proceeding.`
        : highConfidence.length >= 3
          ? '✅ Strong knowledge base on this topic. High confidence in retrieved context.'
          : scored.length === 0
            ? '❌ No relevant memories found. This is a new topic — consider storing key decisions.'
            : '🔶 Limited knowledge. Consider gathering more context before making decisions.',
    },
  };

  return { content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }] };
}

// ============================================================
// 17. brain_adapt — Adaptive Weight Feedback Loop
// ============================================================
const LEARNING_RATE = 0.02; // How fast weights adapt per feedback event
const WEIGHT_FLOOR = 0.05;  // Minimum weight to prevent any signal from going to zero
const WEIGHT_CEIL = 0.60;   // Maximum weight for any single signal

async function brainAdapt(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const memoryId = String(params.memory_id || '');
  const feedback = String(params.feedback || '');
  const context = String(params.context || '');
  const namespace = String(params.namespace || 'global');

  if (!memoryId || !['useful', 'not_useful', 'critical'].includes(feedback)) {
    return { content: [{ type: 'text', text: 'Error: memory_id and valid feedback (useful/not_useful/critical) required' }], isError: true };
  }

  // 1. Look up the memory to understand which signal drove its retrieval
  const mem = await env.DB.prepare('SELECT id, type, confidence, importance_score, access_count FROM memories WHERE id = ?').bind(memoryId).first();
  if (!mem) {
    return { content: [{ type: 'text', text: 'Error: memory not found' }], isError: true };
  }

  // 2. Record the feedback
  const feedbackId = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await env.DB.prepare(
    `INSERT INTO brain_feedback (id, memory_id, namespace, feedback, memory_type, context) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(feedbackId, memoryId, namespace, feedback, String(mem.type), context.slice(0, 500)).run();

  // 3. If "useful" or "critical", boost the memory's importance; if "not_useful", decay it
  if (feedback === 'critical') {
    await env.DB.prepare('UPDATE memories SET importance_score = MIN(1.0, importance_score + 0.1) WHERE id = ?').bind(memoryId).run();
  } else if (feedback === 'useful') {
    await env.DB.prepare('UPDATE memories SET importance_score = MIN(1.0, importance_score + 0.05) WHERE id = ?').bind(memoryId).run();
  } else {
    await env.DB.prepare('UPDATE memories SET importance_score = MAX(0.1, importance_score - 0.05) WHERE id = ?').bind(memoryId).run();
  }

  // 4. Adapt namespace-level weights based on accumulated feedback
  const configId = `config-${namespace}`;
  let config = await env.DB.prepare('SELECT * FROM brain_config WHERE id = ?').bind(configId).first();
  if (!config) {
    await env.DB.prepare(
      `INSERT INTO brain_config (id, namespace) VALUES (?, ?)`
    ).bind(configId, namespace).run();
    config = await env.DB.prepare('SELECT * FROM brain_config WHERE id = ?').bind(configId).first();
  }

  // Weight adaptation logic:
  // "useful" from high-confidence memory → boost importance weight
  // "useful" from recent memory → boost decay weight (recency matters)
  // "not_useful" → slightly boost similarity weight (need better matching)
  const w = {
    similarity: Number(config!.weight_similarity),
    decay: Number(config!.weight_decay),
    importance: Number(config!.weight_importance),
    frequency: Number(config!.weight_frequency),
    emotional: Number(config!.weight_emotional),
  };

  const lr = feedback === 'critical' ? LEARNING_RATE * 2 : LEARNING_RATE;

  if (feedback === 'useful' || feedback === 'critical') {
    const memType = String(mem.type);
    const isHighImportance = Number(mem.importance_score) > 0.7;
    const isFrequentlyUsed = Number(mem.access_count) > 5;

    if (isHighImportance) w.importance += lr;
    if (isFrequentlyUsed) w.frequency += lr;
    w.decay += lr * 0.5; // Slight recency boost for useful results
  } else {
    w.similarity += lr; // Need better matching
    w.importance -= lr * 0.5;
  }

  // Clamp and normalize to sum=1.0
  const keys = Object.keys(w) as (keyof typeof w)[];
  for (const k of keys) w[k] = Math.max(WEIGHT_FLOOR, Math.min(WEIGHT_CEIL, w[k]));
  const sum = keys.reduce((s, k) => s + w[k], 0);
  for (const k of keys) w[k] = Math.round((w[k] / sum) * 1000) / 1000;

  // Fix rounding to exactly 1.0
  const diff = 1.0 - keys.reduce((s, k) => s + w[k], 0);
  w.similarity = Math.round((w.similarity + diff) * 1000) / 1000;

  const totalFeedback = Number(config!.total_feedback) + 1;
  const usefulFeedback = Number(config!.useful_feedback) + (feedback !== 'not_useful' ? 1 : 0);

  await env.DB.prepare(
    `UPDATE brain_config SET
      weight_similarity = ?, weight_decay = ?, weight_importance = ?,
      weight_frequency = ?, weight_emotional = ?,
      total_feedback = ?, useful_feedback = ?,
      last_adapted = datetime('now'), updated_at = datetime('now')
    WHERE id = ?`
  ).bind(w.similarity, w.decay, w.importance, w.frequency, w.emotional, totalFeedback, usefulFeedback, configId).run();

  log(LOG_LEVEL.INFO, 'brain', 'Weight adaptation applied', { namespace, feedback, weights: w });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        feedback_recorded: true,
        memory_id: memoryId,
        feedback,
        importance_adjusted: feedback === 'critical' ? '+0.10' : feedback === 'useful' ? '+0.05' : '-0.05',
        namespace_weights: w,
        total_feedback: totalFeedback,
        useful_ratio: totalFeedback > 0 ? Math.round((usefulFeedback / totalFeedback) * 100) + '%' : 'n/a',
      }, null, 2),
    }],
  };
}

// ============================================================
// 18. brain_consolidate — Cognitive Housekeeping
// ============================================================
async function brainConsolidate(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const namespace = params.namespace as string | undefined;
  const userId = String(params.user_id || 'default');
  const minClusterSize = Math.max(2, Number(params.min_cluster_size) || 3);
  const maxInsights = Math.min(10, Number(params.max_insights) || 5);
  const dryRun = params.dry_run === true;

  const ns = nsFilter(namespace);
  const bindParams: (string | number)[] = [userId];
  if (ns.param) bindParams.push(ns.param);
  bindParams.push(500);

  // 1. Fetch active memories (exclude already-consolidated insights)
  const result = await env.DB.prepare(
    `SELECT id, content, type, confidence, namespace, created_at, importance_score, tags
     FROM memories WHERE user_id = ? AND deleted_at IS NULL${ns.clause}
     AND type != 'insight'
     ORDER BY created_at DESC LIMIT ?`
  ).bind(...bindParams).all();
  const memories = result.results as Record<string, unknown>[];

  if (memories.length < minClusterSize) {
    return { content: [{ type: 'text', text: JSON.stringify({ message: 'Not enough memories to consolidate', count: memories.length }) }] };
  }

  // 2. Build keyword-based clusters (same logic as sm_concept_cluster)
  const memKeywords = memories.map(m => {
    const content = String(m.content).toLowerCase();
    const words = content.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ').split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));
    let tags: string[] = [];
    try {
      const parsed = typeof m.tags === 'string' ? JSON.parse(String(m.tags)) : m.tags;
      if (Array.isArray(parsed)) tags = parsed.map(String);
    } catch { /* ignore */ }
    return { id: String(m.id), words: new Set([...words, ...tags]), memory: m };
  });

  // Jaccard similarity clustering
  const clusters: { members: typeof memKeywords; keyword_overlap: string[] }[] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < memKeywords.length && clusters.length < maxInsights * 2; i++) {
    if (assigned.has(memKeywords[i].id)) continue;
    const cluster = [memKeywords[i]];
    const sharedWords: Map<string, number> = new Map();
    for (const w of memKeywords[i].words) sharedWords.set(w, 1);

    for (let j = i + 1; j < memKeywords.length; j++) {
      if (assigned.has(memKeywords[j].id)) continue;
      const intersection = [...memKeywords[i].words].filter(w => memKeywords[j].words.has(w)).length;
      const union = new Set([...memKeywords[i].words, ...memKeywords[j].words]).size;
      const jaccard = union > 0 ? intersection / union : 0;
      if (jaccard > 0.15) {
        cluster.push(memKeywords[j]);
        for (const w of memKeywords[j].words) sharedWords.set(w, (sharedWords.get(w) || 0) + 1);
      }
    }

    if (cluster.length >= minClusterSize) {
      for (const c of cluster) assigned.add(c.id);
      const topWords = [...sharedWords.entries()]
        .filter(([, count]) => count >= Math.ceil(cluster.length / 2))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([w]) => w);
      clusters.push({ members: cluster, keyword_overlap: topWords });
    }
  }

  // 3. Generate insights from top clusters
  const insights: Record<string, unknown>[] = [];
  const topClusters = clusters.slice(0, maxInsights);

  for (const cluster of topClusters) {
    const memberContents = cluster.members.map(m => truncateContent(String(m.memory.content), 200));
    const types = [...new Set(cluster.members.map(m => String(m.memory.type)))];
    const avgConfidence = cluster.members.reduce((s, m) => s + Number(m.memory.confidence), 0) / cluster.members.length;

    // Create consolidated insight content
    const insightContent = `[Consolidated Insight] Topic: ${cluster.keyword_overlap.join(', ')}. ` +
      `Based on ${cluster.members.length} memories (types: ${types.join(', ')}). ` +
      `Key points: ${memberContents.join(' | ')}`;

    const insight = {
      cluster_size: cluster.members.length,
      keywords: cluster.keyword_overlap,
      member_ids: cluster.members.map(m => m.id),
      types,
      avg_confidence: Math.round(avgConfidence * 100) / 100,
      content_preview: insightContent.slice(0, 300),
    };

    if (!dryRun) {
      // Store the insight as a new memory
      const insightId = `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const insightNs = namespace || String(cluster.members[0].memory.namespace) || 'global';
      await env.DB.prepare(
        `INSERT INTO memories (id, content, type, confidence, user_id, namespace, importance_score, tags)
         VALUES (?, ?, 'insight', ?, ?, ?, 0.9, ?)`
      ).bind(
        insightId, insightContent.slice(0, 2000), Math.round(avgConfidence * 100) / 100,
        userId, insightNs, JSON.stringify(cluster.keyword_overlap)
      ).run();

      // Link insight to source memories
      for (const member of cluster.members) {
        const linkId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await env.DB.prepare(
          `INSERT INTO memory_links (id, source_id, target_id, relation, weight) VALUES (?, ?, ?, 'consolidated_from', 0.9)`
        ).bind(linkId, insightId, member.id).run();
      }

      // Generate embedding for the insight
      const embedding = await generateEmbedding(insightContent, env);
      if (embedding) await vectorUpsert(insightId, embedding, { type: 'insight', namespace: insightNs, user_id: userId }, env);

      Object.assign(insight, { insight_id: insightId, stored: true });
    }

    insights.push(insight);
  }

  log(LOG_LEVEL.INFO, 'brain', 'Consolidation complete', {
    namespace: namespace || 'all', clusters: clusters.length, insights: insights.length, dry_run: dryRun,
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        dry_run: dryRun,
        memories_analyzed: memories.length,
        clusters_found: clusters.length,
        insights_created: insights.length,
        insights,
      }, null, 2),
    }],
  };
}

// ============================================================
// 19. brain_status — Cognitive State Report
// ============================================================
async function brainStatus(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const userId = String(params.user_id || 'default');
  const namespace = params.namespace as string | undefined;
  const ns = nsFilter(namespace);

  // 1. Memory distribution
  const distParams: string[] = [userId];
  if (ns.param) distParams.push(ns.param);
  const typeDist = await env.DB.prepare(
    `SELECT type, COUNT(*) as count, AVG(confidence) as avg_confidence,
            AVG(importance_score) as avg_importance, AVG(access_count) as avg_access
     FROM memories WHERE user_id = ? AND deleted_at IS NULL${ns.clause}
     GROUP BY type ORDER BY count DESC`
  ).bind(...distParams).all();

  // 2. Namespace distribution
  const nsDist = await env.DB.prepare(
    `SELECT namespace, COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NULL GROUP BY namespace ORDER BY count DESC`
  ).bind(userId).all();

  // 3. Freshness metrics
  const freshParams: string[] = [userId];
  if (ns.param) freshParams.push(ns.param);
  const freshness = await env.DB.prepare(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as last_7d,
       SUM(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) as last_30d,
       SUM(CASE WHEN last_accessed > datetime('now', '-7 days') THEN 1 ELSE 0 END) as accessed_7d,
       SUM(CASE WHEN access_count = 0 THEN 1 ELSE 0 END) as never_accessed,
       SUM(CASE WHEN type = 'insight' THEN 1 ELSE 0 END) as insight_count
     FROM memories WHERE user_id = ? AND deleted_at IS NULL${ns.clause}`
  ).bind(...freshParams).first();

  // 4. Brain config (adaptive weights)
  const configId = namespace ? `config-${namespace}` : null;
  let weights = null;
  if (configId) {
    weights = await env.DB.prepare('SELECT * FROM brain_config WHERE id = ?').bind(configId).first();
  }
  // If no namespace-specific config, get all configs
  let allConfigs: Record<string, unknown>[] = [];
  if (!configId) {
    const configs = await env.DB.prepare('SELECT * FROM brain_config ORDER BY total_feedback DESC LIMIT 10').all();
    allConfigs = configs.results as Record<string, unknown>[];
  }

  // 5. Recent feedback activity
  const recentFeedback = await env.DB.prepare(
    `SELECT feedback, COUNT(*) as count FROM brain_feedback
     WHERE created_at > datetime('now', '-30 days')
     ${namespace ? 'AND namespace = ?' : ''}
     GROUP BY feedback`
  ).bind(...(namespace ? [namespace] : [])).all();

  // 6. Graph density
  const linkCount = await env.DB.prepare('SELECT COUNT(*) as count FROM memory_links').first();

  // 7. Cognitive load assessment
  const total = Number(freshness?.total || 0);
  const neverAccessed = Number(freshness?.never_accessed || 0);
  const insightCount = Number(freshness?.insight_count || 0);
  const accessedRecently = Number(freshness?.accessed_7d || 0);

  let cognitiveLoad = 'healthy';
  let recommendations: string[] = [];

  if (total > 500 && insightCount < 5) {
    cognitiveLoad = 'overloaded';
    recommendations.push('🧹 Run brain_consolidate — too many memories without consolidation');
  }
  if (neverAccessed > total * 0.5) {
    cognitiveLoad = total > 200 ? 'overloaded' : 'cluttered';
    recommendations.push(`📦 ${neverAccessed} memories never accessed — consider archiving or consolidating`);
  }
  if (total < 10) {
    cognitiveLoad = 'nascent';
    recommendations.push('🌱 Brain is new — keep storing key decisions, preferences, and project facts');
  }
  if (total > 50 && accessedRecently < 5) {
    recommendations.push('💤 Low recent activity — brain knowledge may be going stale');
  }
  if (recommendations.length === 0) {
    recommendations.push('✅ Brain is healthy and well-organized');
  }

  const status = {
    user_id: userId,
    namespace: namespace || 'all',
    memory_distribution: typeDist.results,
    namespace_distribution: nsDist.results,
    freshness: {
      total,
      created_last_7d: Number(freshness?.last_7d || 0),
      created_last_30d: Number(freshness?.last_30d || 0),
      accessed_last_7d: accessedRecently,
      never_accessed: neverAccessed,
      insights: insightCount,
    },
    graph: {
      total_links: Number(linkCount?.count || 0),
    },
    adaptive_weights: weights ? {
      namespace: weights.namespace,
      weights: {
        similarity: weights.weight_similarity,
        decay: weights.weight_decay,
        importance: weights.weight_importance,
        frequency: weights.weight_frequency,
        emotional: weights.weight_emotional,
      },
      total_feedback: weights.total_feedback,
      useful_ratio: Number(weights.total_feedback) > 0
        ? Math.round(Number(weights.useful_feedback) / Number(weights.total_feedback) * 100) + '%'
        : 'n/a',
      last_adapted: weights.last_adapted,
    } : allConfigs.length > 0 ? allConfigs.map(c => ({
      namespace: c.namespace,
      total_feedback: c.total_feedback,
      weights: { s: c.weight_similarity, d: c.weight_decay, i: c.weight_importance, f: c.weight_frequency, e: c.weight_emotional },
    })) : 'No adaptations yet — use brain_adapt to start learning',
    recent_feedback: recentFeedback.results,
    cognitive_assessment: {
      load: cognitiveLoad,
      recommendations,
    },
  };

  return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
}

// ============================================================
// 20. brain_simulate — Decision Simulation Engine
// ============================================================
async function brainSimulate(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const decision = String(params.decision || '');
  const namespace = params.namespace as string | undefined;
  const userId = String(params.user_id || 'default');
  const crossNs = params.include_cross_namespace !== false; // default true

  if (!decision.trim()) {
    return { content: [{ type: 'text', text: 'Error: decision parameter is required' }], isError: true };
  }

  const ns = nsFilter(namespace);
  const keywords = decision.toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

  // 1. Find past decisions and rules in the primary namespace
  const decisionTypes = ['decision', 'rule', 'insight'];
  const typeFilter = decisionTypes.map(() => '?').join(',');
  const baseParams: (string | number)[] = [...decisionTypes, userId];
  if (ns.param) baseParams.push(ns.param);
  baseParams.push(50);

  const pastDecisions = await env.DB.prepare(
    `SELECT id, content, type, confidence, namespace, created_at, importance_score, tags
     FROM memories WHERE type IN (${typeFilter}) AND user_id = ? AND deleted_at IS NULL${ns.clause}
     ORDER BY importance_score DESC, created_at DESC LIMIT ?`
  ).bind(...baseParams).all();

  // 2. Keyword search across ALL types for relevant context
  let relatedMemories: Record<string, unknown>[] = [];
  if (keywords.length > 0) {
    const kwConditions = keywords.slice(0, 5).map(() => `content LIKE ?`).join(' OR ');
    const kwParams: (string | number)[] = keywords.slice(0, 5).map(kw => `%${kw}%`);
    kwParams.push(userId);
    if (!crossNs && ns.param) kwParams.push(ns.param);
    kwParams.push(30);

    const kwResult = await env.DB.prepare(
      `SELECT id, content, type, confidence, namespace, created_at, importance_score, tags
       FROM memories WHERE (${kwConditions}) AND user_id = ? AND deleted_at IS NULL${!crossNs ? ns.clause : ''}
       ORDER BY confidence DESC, created_at DESC LIMIT ?`
    ).bind(...kwParams).all();
    relatedMemories = kwResult.results as Record<string, unknown>[];
  }

  // 3. Vector search for semantic similarity
  const queryEmbedding = await generateEmbedding(decision, env);
  const vectorFilter: Record<string, string> = { user_id: userId };
  if (!crossNs && namespace && namespace !== 'global') vectorFilter.namespace = namespace;
  const vectorHits = queryEmbedding ? await vectorQuery(queryEmbedding, 20, vectorFilter, env) : [];

  // Fetch full records for vector hits
  let vectorMemories: Record<string, unknown>[] = [];
  if (vectorHits.length > 0) {
    const vecIds = vectorHits.map(v => v.id);
    const ph = vecIds.map(() => '?').join(',');
    const vecResult = await env.DB.prepare(
      `SELECT id, content, type, confidence, namespace, created_at, importance_score, tags
       FROM memories WHERE id IN (${ph}) AND deleted_at IS NULL`
    ).bind(...vecIds).all();
    vectorMemories = vecResult.results as Record<string, unknown>[];
  }

  // 4. Merge and deduplicate all sources
  const allSeen = new Set<string>();
  const allMemories: Record<string, unknown>[] = [];
  for (const src of [pastDecisions.results, relatedMemories, vectorMemories]) {
    for (const m of src as Record<string, unknown>[]) {
      if (!allSeen.has(String(m.id))) { allSeen.add(String(m.id)); allMemories.push(m); }
    }
  }

  // 5. Score by relevance to the proposed decision
  const vecMap = new Map(vectorHits.map(v => [v.id, v.score]));
  const scored: (Record<string, unknown> & { sim_score: number })[] = allMemories.map(m => {
    const vec = vecMap.get(String(m.id)) || 0;
    const kw = keywords.length > 0 ? scoreRelevance(String(m.content), keywords) : 0;
    const typeBoost = ['decision', 'rule', 'insight'].includes(String(m.type)) ? 0.2 : 0;
    const score = (vec > 0 ? vec * 0.35 : 0) + kw * 0.3 + Number(m.importance_score || 0.5) * 0.15 + typeBoost;
    return { ...m, sim_score: Math.round(score * 100) / 100 };
  });
  scored.sort((a, b) => b.sim_score - a.sim_score);
  const topScored = scored.slice(0, 15);

  // 6. Analyze risk patterns
  const risks: { level: string; description: string; source_memory: string }[] = [];
  const supports: { description: string; source_memory: string; confidence: number }[] = [];
  const affectedNamespaces = new Set<string>();

  for (const m of topScored) {
    const content = String(m.content).toLowerCase();
    const memNs = String(m.namespace || 'global');
    affectedNamespaces.add(memNs);

    // Check for negative signals
    const negativePatterns = ['don\'t', 'avoid', 'problem', 'failed', 'deprecated', 'mistake',
      'yapma', 'kaçın', 'sorun', 'hata', 'başarısız', 'terk', 'riskli', 'bug', 'error', 'broke'];
    const hasNegative = negativePatterns.some(p => content.includes(p));
    const isLowConfidence = Number(m.confidence) < 0.5;

    if (hasNegative || isLowConfidence) {
      risks.push({
        level: isLowConfidence && hasNegative ? 'high' : hasNegative ? 'medium' : 'low',
        description: truncateContent(String(m.content), 200),
        source_memory: `${String(m.id).slice(0, 8)} (${m.type}, ${memNs})`,
      });
    }

    // Check for supporting signals
    const positivePatterns = ['should', 'prefer', 'good', 'success', 'recommended', 'best',
      'kullan', 'tercih', 'iyi', 'başarılı', 'önerilen', 'en iyi', 'approved'];
    const hasPositive = positivePatterns.some(p => content.includes(p));
    if (hasPositive && Number(m.confidence) >= 0.6) {
      supports.push({
        description: truncateContent(String(m.content), 200),
        source_memory: `${String(m.id).slice(0, 8)} (${m.type}, ${memNs})`,
        confidence: Number(m.confidence),
      });
    }
  }

  // 7. Check for direct contradictions with the proposed decision
  const contradictions: { existing: string; memory_id: string; type: string }[] = [];
  for (const m of topScored) {
    if (!['decision', 'rule'].includes(String(m.type))) continue;
    const overlap = keywords.filter(kw => String(m.content).toLowerCase().includes(kw)).length;
    if (overlap >= 2) {
      // This is a past decision on a similar topic — flag as potential override
      contradictions.push({
        existing: truncateContent(String(m.content), 200),
        memory_id: String(m.id).slice(0, 8),
        type: String(m.type),
      });
    }
  }

  // 8. Calculate overall risk score
  const highRisks = risks.filter(r => r.level === 'high').length;
  const medRisks = risks.filter(r => r.level === 'medium').length;
  const riskScore = Math.min(1.0, (highRisks * 0.4 + medRisks * 0.2 + contradictions.length * 0.15) / Math.max(topScored.length, 1));
  const confidenceScore = supports.length > 0
    ? Math.round(supports.reduce((s, x) => s + x.confidence, 0) / supports.length * 100) / 100
    : 0;

  let verdict: string;
  if (riskScore > 0.6) {
    verdict = '🔴 HIGH RISK — Multiple historical warnings and contradictions detected. Strongly recommend reviewing flagged memories before proceeding.';
  } else if (riskScore > 0.3) {
    verdict = '🟡 MODERATE RISK — Some historical concerns found. Proceed with awareness of flagged patterns.';
  } else if (contradictions.length > 0) {
    verdict = '🟠 CAUTION — This would override existing decisions. Ensure the change is intentional.';
  } else if (supports.length >= 2) {
    verdict = '🟢 LOW RISK — Historical evidence supports this direction. Past experiences align positively.';
  } else {
    verdict = '⚪ UNCHARTED — Limited historical data on this topic. This is a novel decision area.';
  }

  const simulation = {
    decision_preview: decision.slice(0, 200),
    namespace: namespace || 'global',
    cross_namespace_scan: crossNs,
    semantic_search: vectorHits.length > 0,

    historical_context: {
      memories_analyzed: topScored.length,
      past_decisions_found: topScored.filter(m => m.type === 'decision').length,
      rules_found: topScored.filter(m => m.type === 'rule').length,
      insights_found: topScored.filter(m => m.type === 'insight').length,
    },

    risk_assessment: {
      overall_risk_score: Math.round(riskScore * 100) / 100,
      confidence_score: confidenceScore,
      risks: risks.slice(0, 5),
      supports: supports.slice(0, 5),
    },

    decision_conflicts: contradictions,
    affected_namespaces: [...affectedNamespaces],

    verdict,

    top_relevant_memories: truncateMemoryResults(topScored.slice(0, 8)),
  };

  log(LOG_LEVEL.INFO, 'brain', 'Simulation completed', {
    decision: decision.slice(0, 100), risk_score: riskScore, risks: risks.length, supports: supports.length,
  });

  return { content: [{ type: 'text', text: JSON.stringify(simulation, null, 2) }] };
}

// ============================================================
// 21. brain_dream — Cross-Namespace Ideation Engine
// ============================================================
async function brainDream(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const focus = String(params.focus || '');
  const userId = String(params.user_id || 'default');
  const maxIdeas = Math.min(10, Number(params.max_ideas) || 5);
  const targetNamespaces = Array.isArray(params.namespaces) ? params.namespaces.map(String) : null;

  // 1. Get all active namespaces for this user
  const nsResult = await env.DB.prepare(
    `SELECT namespace, COUNT(*) as count FROM memories
     WHERE user_id = ? AND deleted_at IS NULL AND namespace != 'global'
     GROUP BY namespace HAVING count >= 3 ORDER BY count DESC LIMIT 20`
  ).bind(userId).all();
  const namespaces = nsResult.results as Record<string, unknown>[];

  if (namespaces.length < 2 && !focus) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: 'Need at least 2 namespaces with 3+ memories each for cross-pollination. Try adding a focus topic instead.',
          namespaces_found: namespaces.length,
          tip: 'Store memories with different namespace values to enable cross-namespace dreaming.',
        }, null, 2),
      }],
    };
  }

  // Filter to requested namespaces if specified
  const activeNs = targetNamespaces
    ? namespaces.filter(n => targetNamespaces.includes(String(n.namespace)))
    : namespaces;

  // 2. Gather high-value memories from each namespace
  type NsMemory = Record<string, unknown> & { _ns: string };
  const nsPools: Map<string, NsMemory[]> = new Map();

  for (const nsObj of activeNs.slice(0, 10)) {
    const nsName = String(nsObj.namespace);
    const focusFilter = focus
      ? ` AND content LIKE ?`
      : '';
    const bindParams: (string | number)[] = [userId, nsName];
    if (focus) bindParams.push(`%${focus}%`);
    bindParams.push(30);

    const pool = await env.DB.prepare(
      `SELECT id, content, type, confidence, namespace, created_at, importance_score, tags
       FROM memories WHERE user_id = ? AND namespace = ? AND deleted_at IS NULL${focusFilter}
       ORDER BY importance_score DESC, confidence DESC LIMIT ?`
    ).bind(...bindParams).all();

    nsPools.set(nsName, (pool.results as Record<string, unknown>[]).map(m => ({ ...m, _ns: nsName })));
  }

  // Also include 'global' namespace if it has content
  const globalPool = await env.DB.prepare(
    `SELECT id, content, type, confidence, namespace, created_at, importance_score, tags
     FROM memories WHERE user_id = ? AND namespace = 'global' AND deleted_at IS NULL
     ORDER BY importance_score DESC LIMIT 20`
  ).bind(userId).all();
  if (globalPool.results.length > 0) {
    nsPools.set('global', (globalPool.results as Record<string, unknown>[]).map(m => ({ ...m, _ns: 'global' })));
  }

  // 3. Extract keyword signatures per namespace
  type NsSignature = { namespace: string; keywords: Map<string, number>; memories: NsMemory[] };
  const signatures: NsSignature[] = [];

  for (const [nsName, memories] of nsPools) {
    const kwMap = new Map<string, number>();
    for (const m of memories) {
      const words = String(m.content).toLowerCase()
        .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOP_WORDS.has(w));
      for (const w of words) kwMap.set(w, (kwMap.get(w) || 0) + 1);

      // Include tags
      try {
        const tags = typeof m.tags === 'string' ? JSON.parse(String(m.tags)) : m.tags;
        if (Array.isArray(tags)) for (const t of tags) kwMap.set(String(t).toLowerCase(), (kwMap.get(String(t).toLowerCase()) || 0) + 2);
      } catch { /* ignore */ }
    }
    signatures.push({ namespace: nsName, keywords: kwMap, memories });
  }

  // 4. Find cross-namespace keyword bridges (unexpected overlaps)
  type DreamConnection = {
    type: string;
    ns_a: string;
    ns_b: string;
    bridge_keywords: string[];
    bridge_strength: number;
    memory_a: { id: string; content: string; type: string };
    memory_b: { id: string; content: string; type: string };
    insight: string;
  };
  const connections: DreamConnection[] = [];

  for (let i = 0; i < signatures.length; i++) {
    for (let j = i + 1; j < signatures.length; j++) {
      const sigA = signatures[i], sigB = signatures[j];

      // Find shared keywords between namespaces (excluding very common ones)
      const shared: string[] = [];
      for (const [kw, countA] of sigA.keywords) {
        const countB = sigB.keywords.get(kw);
        if (countB && countA >= 2 && countB >= 2) shared.push(kw);
      }

      if (shared.length < 2) continue;

      // Find the most relevant memory from each namespace for the bridge
      const bridgeWords = shared.slice(0, 5);
      const bestA = sigA.memories
        .map(m => ({ m, score: bridgeWords.filter(w => String(m.content).toLowerCase().includes(w)).length }))
        .sort((a, b) => b.score - a.score)[0];
      const bestB = sigB.memories
        .map(m => ({ m, score: bridgeWords.filter(w => String(m.content).toLowerCase().includes(w)).length }))
        .sort((a, b) => b.score - a.score)[0];

      if (!bestA || !bestB || bestA.score < 1 || bestB.score < 1) continue;

      const strength = Math.round((shared.length / Math.min(sigA.keywords.size, sigB.keywords.size)) * 100) / 100;

      connections.push({
        type: 'cross_pollination',
        ns_a: sigA.namespace,
        ns_b: sigB.namespace,
        bridge_keywords: bridgeWords,
        bridge_strength: strength,
        memory_a: {
          id: String(bestA.m.id).slice(0, 8),
          content: truncateContent(String(bestA.m.content), 150),
          type: String(bestA.m.type),
        },
        memory_b: {
          id: String(bestB.m.id).slice(0, 8),
          content: truncateContent(String(bestB.m.content), 150),
          type: String(bestB.m.type),
        },
        insight: `💡 "${sigA.namespace}" and "${sigB.namespace}" share concepts: [${bridgeWords.join(', ')}]. ` +
          `Knowledge from one may transfer to the other.`,
      });
    }
  }

  // Sort by bridge strength and take top ideas
  connections.sort((a, b) => b.bridge_strength - a.bridge_strength);
  const topConnections = connections.slice(0, maxIdeas);

  // 5. Find isolated patterns (concepts in one namespace that have NO presence elsewhere)
  const uniquePatterns: { namespace: string; unique_keywords: string[]; suggestion: string }[] = [];
  for (const sig of signatures) {
    const unique: string[] = [];
    for (const [kw, count] of sig.keywords) {
      if (count < 3) continue;
      const existsElsewhere = signatures.some(s => s.namespace !== sig.namespace && s.keywords.has(kw));
      if (!existsElsewhere) unique.push(kw);
    }
    if (unique.length >= 3) {
      uniquePatterns.push({
        namespace: sig.namespace,
        unique_keywords: unique.slice(0, 8),
        suggestion: `🔮 "${sig.namespace}" has unique expertise in [${unique.slice(0, 4).join(', ')}]. ` +
          `Consider applying these patterns to other projects.`,
      });
    }
  }

  const dreamResult = {
    focus: focus || 'free association',
    namespaces_scanned: signatures.map(s => ({ namespace: s.namespace, memory_count: s.memories.length, keyword_count: s.keywords.size })),
    total_memories_analyzed: [...nsPools.values()].reduce((s, p) => s + p.length, 0),

    dream_connections: topConnections,
    connections_found: connections.length,

    unique_patterns: uniquePatterns.slice(0, 5),

    dream_summary: topConnections.length > 0
      ? `🧠 Found ${connections.length} cross-namespace connection(s). ` +
        `Top bridge: "${topConnections[0].ns_a}" ↔ "${topConnections[0].ns_b}" via [${topConnections[0].bridge_keywords.join(', ')}]. ` +
        (uniquePatterns.length > 0 ? `${uniquePatterns.length} namespace(s) have unique expertise worth sharing.` : '')
      : namespaces.length < 2
        ? '💭 Not enough namespaces for cross-pollination. Store memories across different projects to enable dreaming.'
        : '💭 No strong cross-namespace patterns found yet. Keep building knowledge in each namespace.',
  };

  log(LOG_LEVEL.INFO, 'brain', 'Dream completed', {
    focus: focus.slice(0, 50), namespaces: signatures.length, connections: connections.length,
  });

  return { content: [{ type: 'text', text: JSON.stringify(dreamResult, null, 2) }] };
}

// ============================================================
// Tool Call Router
// ============================================================
async function handleToolCall(name: string, args: Record<string, unknown>, env: Env): Promise<unknown> {
  switch (name) {
    case 'search_memories': return await searchMemories(args, env);
    case 'store_memory': return await storeMemory(args, env);
    case 'update_memory': return await updateMemory(args, env);
    case 'delete_memory': return await deleteMemory(args, env);
    case 'query_memories': return await queryMemories(args, env);
    case 'list_memories': return await listMemories(args, env);
    case 'get_memory_graph': return await getMemoryGraph(args, env);
    case 'link_memories': return await linkMemories(args, env);
    case 'sm_time_query': return await timeQuery(args, env);
    case 'sm_memory_summary': return await memorySummary(args, env);
    case 'sm_batch_operations': return await batchOperations(args, env);
    case 'sm_export_memories': return await exportMemories(args, env);
    case 'sm_concept_cluster': return await conceptCluster(args, env);
    case 'sm_import_memories': return await importMemories(args, env);
    case 'sm_prefetch': return await prefetchMemories(args, env);
    // Ulu-Brain: Cognitive Layer
    case 'brain_think': return await brainThink(args, env);
    case 'brain_adapt': return await brainAdapt(args, env);
    case 'brain_consolidate': return await brainConsolidate(args, env);
    case 'brain_status': return await brainStatus(args, env);
    // Ulu-Brain v2: Simulation & Imagination
    case 'brain_simulate': return await brainSimulate(args, env);
    case 'brain_dream': return await brainDream(args, env);
    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
}

// ============================================================
// Main Worker Entry
// ============================================================
let dbInitialized = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Initialize database on first request
    if (!dbInitialized) {
      try {
        await initDatabase(env.DB);
        dbInitialized = true;
      } catch (e) {
        // May already be initialized
        dbInitialized = true;
      }
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health check / root
    if (url.pathname === '/' || url.pathname === '') {
      return corsResponse(JSON.stringify({
        name: 'stackmemory-mcp',
        version: '2.0.0',
        protocol: 'MCP 2025-03-26',
        transport: 'streamable-http',
        endpoints: {
          mcp: '/mcp',
          health: '/',
        },
        tools_count: 14,
      }), 200, { 'Content-Type': 'application/json' });
    }

    // MCP endpoint
    if (url.pathname === '/mcp') {
      // GET: SSE stream for server-initiated messages
      if (request.method === 'GET') {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('event: connected\ndata: {"jsonrpc":"2.0","method":"notifications/initialized"}\n\n'));

            // Send periodic keepalive
            let intervalId: ReturnType<typeof setInterval>;
            intervalId = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(': keepalive\n\n'));
              } catch {
                clearInterval(intervalId);
              }
            }, 30000);

            // Clean up on close
            setTimeout(() => {
              clearInterval(intervalId);
              try { controller.close(); } catch { /* already closed */ }
            }, 300000); // 5 minute max
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...CORS_HEADERS,
          },
        });
      }

      // POST: JSON-RPC request
      if (request.method === 'POST') {
        const accept = request.headers.get('Accept') || '';
        // Lenient Accept header: default to SSE if no Accept or wildcard
        const wantsJson = accept.includes('application/json');
        const wantsSSE = accept.includes('text/event-stream');
        const isWildcard = accept === '' || accept === '*/*' || accept.includes('*/*');
        if (!wantsJson && !wantsSSE && !isWildcard) {
          return corsResponse(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32000, message: 'Not Acceptable: Client must accept application/json and/or text/event-stream' },
              id: null,
            }),
            406,
            { 'Content-Type': 'application/json' }
          );
        }

        let body: { method?: string; params?: Record<string, unknown>; id?: string | number | null };
        try {
          body = await request.json() as { method?: string; params?: Record<string, unknown>; id?: string | number | null };
        } catch {
          return corsResponse(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32700, message: 'Parse error: Invalid JSON' },
              id: null,
            }),
            400,
            { 'Content-Type': 'application/json' }
          );
        }

        const { method, params, id } = body;

        try {
          let result: unknown;

          switch (method) {
            case 'initialize':
              result = {
                protocolVersion: '2025-03-26',
                capabilities: {
                  tools: { listChanged: true },
                  resources: { listChanged: true },
                  prompts: { listChanged: true },
                },
                serverInfo: {
                  name: 'stackmemory-mcp',
                  version: '2.0.0',
                },
              };
              break;

            case 'notifications/initialized':
              // Client acknowledges initialization - no response needed
              return new Response(null, { status: 204, headers: CORS_HEADERS });

            case 'ping':
              result = {};
              break;

            case 'tools/list':
              result = { tools: TOOLS };
              break;

            case 'tools/call': {
              const toolName = (params as Record<string, unknown>)?.name as string;
              const toolArgs = ((params as Record<string, unknown>)?.arguments || {}) as Record<string, unknown>;

              if (!toolName) {
                return corsResponse(
                  JSON.stringify({
                    jsonrpc: '2.0',
                    error: { code: -32602, message: 'Missing tool name in params' },
                    id,
                  }),
                  400,
                  { 'Content-Type': 'application/json' }
                );
              }

              result = await handleToolCall(toolName, toolArgs, env);
              break;
            }

            case 'resources/list':
              result = { resources: RESOURCES };
              break;

            case 'resources/read': {
              const resourceUri = (params as Record<string, unknown>)?.uri as string;
              if (!resourceUri) {
                return corsResponse(
                  JSON.stringify({
                    jsonrpc: '2.0',
                    error: { code: -32602, message: 'Missing uri in params' },
                    id,
                  }),
                  400,
                  { 'Content-Type': 'application/json' }
                );
              }
              result = await handleResourceRead(resourceUri, env);
              break;
            }

            case 'prompts/list':
              result = { prompts: PROMPTS };
              break;

            case 'prompts/get': {
              const promptName = (params as Record<string, unknown>)?.name as string;
              const promptArgs = ((params as Record<string, unknown>)?.arguments || {}) as Record<string, string>;
              if (!promptName) {
                return corsResponse(
                  JSON.stringify({
                    jsonrpc: '2.0',
                    error: { code: -32602, message: 'Missing name in params' },
                    id,
                  }),
                  400,
                  { 'Content-Type': 'application/json' }
                );
              }
              result = handlePromptGet(promptName, promptArgs);
              break;
            }

            default:
              return corsResponse(
                JSON.stringify({
                  jsonrpc: '2.0',
                  error: { code: -32601, message: `Method not found: ${method}` },
                  id,
                }),
                400,
                { 'Content-Type': 'application/json' }
              );
          }

          // Return response based on Accept header - default to SSE for broad compatibility
          const isSSE = accept.includes('text/event-stream') || (!accept.includes('application/json') || isWildcard);
          if (isSSE) {
            return corsResponse(
              `event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id, result })}\n\n`,
              200,
              { 'Content-Type': 'text/event-stream' }
            );
          }

          return corsResponse(
            JSON.stringify({ jsonrpc: '2.0', id, result }),
            200,
            { 'Content-Type': 'application/json' }
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return corsResponse(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32603, message: `Internal error: ${errorMessage}` },
              id,
            }),
            500,
            { 'Content-Type': 'application/json' }
          );
        }
      }
    }

    // /sse endpoint - alias for /mcp (some clients use /sse)
    if (url.pathname === '/sse') {
      if (request.method === 'GET') {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('event: connected\ndata: {"jsonrpc":"2.0","method":"notifications/initialized"}\n\n'));
            let intervalId: ReturnType<typeof setInterval>;
            intervalId = setInterval(() => {
              try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch { clearInterval(intervalId); }
            }, 30000);
            setTimeout(() => { clearInterval(intervalId); try { controller.close(); } catch {} }, 300000);
          },
        });
        return new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', ...CORS_HEADERS },
        });
      }
      // POST to /sse - treat same as /mcp
      const mcpUrl = new URL(request.url);
      mcpUrl.pathname = '/mcp';
      const newRequest = new Request(mcpUrl.toString(), request);
      return this.fetch!(newRequest, env);
    }

    // 404 for unknown paths
    return corsResponse(
      JSON.stringify({ error: 'Not found', hint: 'Use /mcp endpoint for MCP protocol' }),
      404,
      { 'Content-Type': 'application/json' }
    );
  },
};
