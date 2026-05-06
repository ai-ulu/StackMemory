// StackMemory MCP Server v2.0.0 - Cloudflare Pages Worker
// MCP Protocol 2025-03-26 with Streamable HTTP Transport

interface Env {
  DB: D1Database;
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
  // --- 8 Existing Tools ---
  {
    name: 'search_memories',
    description: 'Search memories by keyword. Uses SQL LIKE query on content field to find matching memories.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search keyword to find in memory content' },
        limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
        user_id: { type: 'string', description: 'Filter by user ID (default: "default")' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'store_memory',
    description: 'Store a new memory with type classification and confidence score. Types: identity, preference, fact.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The memory content to store' },
        type: { type: 'string', description: 'Memory type: identity, preference, or fact (default: "fact")', enum: ['identity', 'preference', 'fact'] },
        confidence: { type: 'number', description: 'Confidence score from 0.0 to 1.0 (default: 0.8)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        user_id: { type: 'string', description: 'User ID (default: "default")' },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_memory',
    description: 'Update an existing memory\'s content by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Memory ID to update' },
        content: { type: 'string', description: 'New content for the memory' },
        type: { type: 'string', description: 'New type (identity/preference/fact)', enum: ['identity', 'preference', 'fact'] },
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
    description: 'Natural language query for memories. Extracts keywords and performs intelligent search across content, type, and tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query string' },
        limit: { type: 'number', description: 'Maximum results (default: 10)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_memories',
    description: 'List memories filtered by type, with pagination support.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by type: identity, preference, fact', enum: ['identity', 'preference', 'fact'] },
        limit: { type: 'number', description: 'Maximum results (default: 20)' },
        offset: { type: 'number', description: 'Offset for pagination (default: 0)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
        include_deleted: { type: 'boolean', description: 'Include soft-deleted memories (default: false)' },
      },
    },
  },
  {
    name: 'get_memory_graph',
    description: 'Retrieve the memory graph with nodes (memories) and edges (links). Returns graph data with statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum nodes to return (default: 50)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
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
  // --- 6 New Tools ---
  {
    name: 'sm_time_query',
    description: 'Time-based memory query. Find memories within a specific time period or date range.',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Predefined period: last_day, last_week, last_month, last_year, custom', enum: ['last_day', 'last_week', 'last_month', 'last_year', 'custom'] },
        from_date: { type: 'string', description: 'Start date for custom period (ISO 8601 format, e.g., 2024-01-01)' },
        to_date: { type: 'string', description: 'End date for custom period (ISO 8601 format)' },
        type: { type: 'string', description: 'Optional type filter: identity, preference, fact', enum: ['identity', 'preference', 'fact'] },
        limit: { type: 'number', description: 'Maximum results (default: 50)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
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
      },
      required: ['operation'],
    },
  },
  {
    name: 'sm_export_memories',
    description: 'Export memories to JSON or CSV format with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', description: 'Export format: json or csv', enum: ['json', 'csv'] },
        type: { type: 'string', description: 'Filter by type: identity, preference, fact', enum: ['identity', 'preference', 'fact'] },
        include_deleted: { type: 'boolean', description: 'Include soft-deleted memories (default: false)' },
        include_links: { type: 'boolean', description: 'Include memory links in export (default: false)' },
        from_date: { type: 'string', description: 'Start date filter (ISO 8601)' },
        to_date: { type: 'string', description: 'End date filter (ISO 8601)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
      },
      required: ['format'],
    },
  },
  {
    name: 'sm_concept_cluster',
    description: 'Concept clustering of memories. Groups memories by shared keywords and tags into semantic clusters.',
    inputSchema: {
      type: 'object',
      properties: {
        min_cluster_size: { type: 'number', description: 'Minimum memories per cluster (default: 2)' },
        max_clusters: { type: 'number', description: 'Maximum number of clusters (default: 10)' },
        user_id: { type: 'string', description: 'User ID filter (default: "default")' },
      },
    },
  },
  {
    name: 'sm_import_memories',
    description: 'Import memories from a JSON string. Supports duplicate handling strategies.',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'JSON string containing array of memory objects with: content, type, confidence, tags' },
        duplicate_handling: { type: 'string', description: 'How to handle duplicates: skip, update, or create_new', enum: ['skip', 'update', 'create_new'] },
        user_id: { type: 'string', description: 'User ID for imported memories (default: "default")' },
      },
      required: ['data', 'duplicate_handling'],
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
  // D1 .exec() supports multiple statements but each must be separated properly
  // Use individual prepared statements for reliability
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'fact',
        confidence REAL NOT NULL DEFAULT 0.8,
        user_id TEXT NOT NULL DEFAULT 'default',
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
      CREATE INDEX IF NOT EXISTS idx_memory_links_source ON memory_links(source_id);
      CREATE INDEX IF NOT EXISTS idx_memory_links_target ON memory_links(target_id);
    `);
  } catch (e) {
    // Tables may already exist - that's fine
    console.error('DB init (may be ok):', e);
  }
}

// ============================================================
// Tool Handlers
// ============================================================

// 1. search_memories
async function searchMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const keyword = String(params.keyword || '');
  const limit = Number(params.limit) || 10;
  const userId = String(params.user_id || 'default');

  if (!keyword.trim()) {
    return { content: [{ type: 'text', text: 'Error: keyword parameter is required' }], isError: true };
  }

  const results = await env.DB.prepare(
    `SELECT id, content, type, confidence, user_id, created_at, updated_at, tags
     FROM memories 
     WHERE content LIKE ? AND user_id = ? AND deleted_at IS NULL 
     ORDER BY confidence DESC, created_at DESC 
     LIMIT ?`
  )
    .bind(`%${keyword}%`, userId, limit)
    .all();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        keyword,
        total: results.results.length,
        memories: results.results,
      }, null, 2),
    }],
  };
}

// 2. store_memory
async function storeMemory(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const content = String(params.content || '');
  const type = String(params.type || 'fact');
  const confidence = Number(params.confidence) || 0.8;
  const tags = Array.isArray(params.tags) ? params.tags : [];
  const userId = String(params.user_id || 'default');

  if (!content.trim()) {
    return { content: [{ type: 'text', text: 'Error: content parameter is required' }], isError: true };
  }

  if (!['identity', 'preference', 'fact'].includes(type)) {
    return { content: [{ type: 'text', text: 'Error: type must be identity, preference, or fact' }], isError: true };
  }

  const id = crypto.randomUUID();
  const tagsJson = JSON.stringify(tags);

  await env.DB.prepare(
    `INSERT INTO memories (id, content, type, confidence, user_id, tags) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, content, type, Math.min(1, Math.max(0, confidence)), userId, tagsJson)
    .run();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        memory: { id, content, type, confidence, user_id: userId, tags },
      }, null, 2),
    }],
  };
}

// 3. update_memory
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

  const content = params.content !== undefined ? String(params.content) : String(existing.content);
  const type = params.type !== undefined ? String(params.type) : String(existing.type);
  const confidence = params.confidence !== undefined ? Number(params.confidence) : Number(existing.confidence);
  const tags = params.tags !== undefined ? JSON.stringify(params.tags) : String(existing.tags);

  await env.DB.prepare(
    `UPDATE memories SET content = ?, type = ?, confidence = ?, tags = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(content, type, Math.min(1, Math.max(0, confidence)), tags, id)
    .run();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        memory: { id, content, type, confidence, tags: JSON.parse(tags) },
      }, null, 2),
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

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ success: true, id, deleted_at: new Date().toISOString() }, null, 2),
    }],
  };
}

// 5. query_memories
async function queryMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const query = String(params.query || '');
  const limit = Number(params.limit) || 10;
  const userId = String(params.user_id || 'default');

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
    // Fall back to the full query
    keywords.push(query.toLowerCase().trim());
  }

  // Build OR conditions for each keyword
  const conditions = keywords.map(() => `(content LIKE ? OR tags LIKE ?)`).join(' OR ');
  const bindParams: string[] = [];
  for (const kw of keywords) {
    bindParams.push(`%${kw}%`, `%"${kw}"%`);
  }
  bindParams.push(userId, String(limit));

  const sql = `
    SELECT id, content, type, confidence, user_id, created_at, updated_at, tags
    FROM memories 
    WHERE (${conditions}) AND user_id = ? AND deleted_at IS NULL 
    ORDER BY confidence DESC, created_at DESC 
    LIMIT ?
  `;

  const results = await env.DB.prepare(sql).bind(...bindParams).all();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        query,
        extracted_keywords: keywords,
        total: results.results.length,
        memories: results.results,
      }, null, 2),
    }],
  };
}

// 6. list_memories
async function listMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const type = params.type as string | undefined;
  const limit = Number(params.limit) || 20;
  const offset = Number(params.offset) || 0;
  const userId = String(params.user_id || 'default');
  const includeDeleted = params.include_deleted === true;

  let sql = `
    SELECT id, content, type, confidence, user_id, created_at, updated_at, tags, deleted_at
    FROM memories 
    WHERE user_id = ?
  `;
  const bindParams: (string | number | boolean)[] = [userId];

  if (!includeDeleted) {
    sql += ` AND deleted_at IS NULL`;
  }

  if (type && ['identity', 'preference', 'fact'].includes(type)) {
    sql += ` AND type = ?`;
    bindParams.push(type);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindParams.push(limit, offset);

  const results = await env.DB.prepare(sql).bind(...bindParams).all();

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM memories WHERE user_id = ?`;
  const countParams: (string | boolean)[] = [userId];
  if (!includeDeleted) {
    countSql += ` AND deleted_at IS NULL`;
  }
  if (type && ['identity', 'preference', 'fact'].includes(type)) {
    countSql += ` AND type = ?`;
    countParams.push(type);
  }
  const countResult = await env.DB.prepare(countSql).bind(...countParams).first();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: (countResult as Record<string, unknown>)?.total || 0,
        offset,
        limit,
        memories: results.results,
      }, null, 2),
    }],
  };
}

// 7. get_memory_graph
async function getMemoryGraph(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const limit = Number(params.limit) || 50;
  const userId = String(params.user_id || 'default');

  const memories = await env.DB.prepare(
    `SELECT id, content, type, confidence, created_at FROM memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?`
  )
    .bind(userId, limit)
    .all();

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
  const avgConfidence = memories.results.length > 0
    ? memories.results.reduce((sum: number, m: Record<string, unknown>) => sum + Number(m.confidence), 0) / memories.results.length
    : 0;

  const typeDistribution: Record<string, number> = {};
  for (const m of memories.results as Record<string, unknown>[]) {
    const t = String(m.type);
    typeDistribution[t] = (typeDistribution[t] || 0) + 1;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        stats: { node_count: nodeCount, edge_count: edgeCount, avg_confidence: Math.round(avgConfidence * 100) / 100, type_distribution: typeDistribution },
        nodes: memories.results,
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

// 9. sm_time_query
async function timeQuery(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const period = String(params.period || 'last_week');
  const type = params.type as string | undefined;
  const limit = Number(params.limit) || 50;
  const userId = String(params.user_id || 'default');

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
    SELECT id, content, type, confidence, created_at, updated_at, tags
    FROM memories 
    WHERE user_id = ? AND deleted_at IS NULL AND created_at >= ? AND created_at <= ?
  `;
  const bindParams: (string | number)[] = [userId, fromDate, toDate];

  if (type && ['identity', 'preference', 'fact'].includes(type)) {
    sql += ` AND type = ?`;
    bindParams.push(type);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  bindParams.push(limit);

  const results = await env.DB.prepare(sql).bind(...bindParams).all();

  // Group by day
  const grouped: Record<string, Record<string, unknown>[]> = {};
  for (const mem of results.results as Record<string, unknown>[]) {
    const day = String(mem.created_at).slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(mem);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period,
        from_date: fromDate,
        to_date: toDate,
        total: results.results.length,
        grouped_by_day: grouped,
      }, null, 2),
    }],
  };
}

// 10. sm_memory_summary
async function memorySummary(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const userId = String(params.user_id || 'default');

  // Total count
  const totalResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM memories WHERE user_id = ? AND deleted_at IS NULL`
  ).bind(userId).first();

  // Type distribution
  const typeDist = await env.DB.prepare(
    `SELECT type, COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NULL GROUP BY type`
  ).bind(userId).all();

  // Average confidence
  const confResult = await env.DB.prepare(
    `SELECT AVG(confidence) as avg_confidence FROM memories WHERE user_id = ? AND deleted_at IS NULL`
  ).bind(userId).first();

  // Most active day
  const activeDayResult = await env.DB.prepare(
    `SELECT DATE(created_at) as day, COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NULL GROUP BY DATE(created_at) ORDER BY count DESC LIMIT 1`
  ).bind(userId).first();

  // Most active week
  const activeWeekResult = await env.DB.prepare(
    `SELECT STRFTIME('%Y-W%W', created_at) as week, COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NULL GROUP BY week ORDER BY count DESC LIMIT 1`
  ).bind(userId).first();

  // Top linked memories
  const topLinked = await env.DB.prepare(
    `SELECT m.id, m.content, COUNT(ml.id) as link_count 
     FROM memories m 
     LEFT JOIN memory_links ml ON (ml.source_id = m.id OR ml.target_id = m.id) 
     WHERE m.user_id = ? AND m.deleted_at IS NULL 
     GROUP BY m.id 
     ORDER BY link_count DESC 
     LIMIT 5`
  ).bind(userId).all();

  // Confidence trend (last 10 memories)
  const confTrend = await env.DB.prepare(
    `SELECT created_at, confidence FROM memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 10`
  ).bind(userId).all();

  // Deleted count
  const deletedResult = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM memories WHERE user_id = ? AND deleted_at IS NOT NULL`
  ).bind(userId).first();

  const typeDistribution: Record<string, number> = {};
  for (const row of typeDist.results as Record<string, unknown>[]) {
    typeDistribution[String(row.type)] = Number(row.count);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total_memories: Number((totalResult as Record<string, unknown>)?.total || 0),
        deleted_memories: Number((deletedResult as Record<string, unknown>)?.count || 0),
        type_distribution: typeDistribution,
        average_confidence: Math.round(Number((confResult as Record<string, unknown>)?.avg_confidence || 0) * 100) / 100,
        most_active_day: activeDayResult ? { day: (activeDayResult as Record<string, unknown>).day, count: (activeDayResult as Record<string, unknown>).count } : null,
        most_active_week: activeWeekResult ? { week: (activeWeekResult as Record<string, unknown>).week, count: (activeWeekResult as Record<string, unknown>).count } : null,
        top_linked_memories: topLinked.results,
        confidence_trend: confTrend.results,
      }, null, 2),
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

// 12. sm_export_memories
async function exportMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const format = String(params.format || 'json');
  const type = params.type as string | undefined;
  const includeDeleted = params.include_deleted === true;
  const includeLinks = params.include_links === true;
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;
  const userId = String(params.user_id || 'default');

  let sql = `SELECT * FROM memories WHERE user_id = ?`;
  const bindParams: (string | boolean)[] = [userId];

  if (!includeDeleted) {
    sql += ` AND deleted_at IS NULL`;
  }
  if (type && ['identity', 'preference', 'fact'].includes(type)) {
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

  sql += ` ORDER BY created_at ASC`;
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

// 13. sm_concept_cluster
async function conceptCluster(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const minClusterSize = Number(params.min_cluster_size) || 2;
  const maxClusters = Number(params.max_clusters) || 10;
  const userId = String(params.user_id || 'default');

  // Fetch all non-deleted memories
  const memories = await env.DB.prepare(
    `SELECT id, content, type, tags FROM memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`
  ).bind(userId).all();

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
        if (keywordSets.every(ks => ks.has(kw))) sharedKws.add(kw);
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

// 14. sm_import_memories
async function importMemories(params: Record<string, unknown>, env: Env): Promise<unknown> {
  const dataStr = String(params.data || '');
  const duplicateHandling = String(params.duplicate_handling || 'skip');
  const userId = String(params.user_id || 'default');

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
  const newIds: string[] = [];

  for (const item of data) {
    const content = String(item.content || '').trim();
    if (!content) continue;

    const type = ['identity', 'preference', 'fact'].includes(String(item.type)) ? String(item.type) : 'fact';
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
      // create_new: fall through to create
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO memories (id, content, type, confidence, user_id, tags) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, content, type, Math.min(1, Math.max(0, confidence)), userId, JSON.stringify(tags)).run();

    imported++;
    newIds.push(id);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        total_items: data.length,
        imported,
        skipped,
        updated,
        new_ids: newIds,
      }, null, 2),
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
        if (!accept.includes('application/json') && !accept.includes('text/event-stream') && accept !== '*/*') {
          return corsResponse(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32000, message: 'Not Acceptable: Client must accept application/json and/or text/event-stream' },
              id: null,
            }),
            400,
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

          // Return response based on Accept header
          const isSSE = accept.includes('text/event-stream');
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

    // 404 for unknown paths
    return corsResponse(
      JSON.stringify({ error: 'Not found', hint: 'Use /mcp endpoint for MCP protocol' }),
      404,
      { 'Content-Type': 'application/json' }
    );
  },
};
