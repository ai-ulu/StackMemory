/**
 * StackMemory MCP Client
 *
 * Single source of truth: Cloudflare D1 + Vectorize via MCP server.
 * Replaces the legacy Supabase `memories` table writes from `/api/memories/*`
 * and `/api/brain/*` routes.
 *
 * The MCP server speaks JSON-RPC 2.0 over HTTP (`POST /mcp`). Each tool call
 * is wrapped via `mcp.callTool('store_memory', { ... })`.
 *
 * Auth model:
 *   - Supabase still owns user identity, billing and team domains.
 *   - User memories are isolated per-user via the MCP `namespace` field.
 *     We derive `namespace = "user:<userId>"` from the authenticated session.
 *   - Optional team/project sub-namespaces use `user:<id>:<scope>`.
 *
 * Configuration (frontend/.env):
 *   - MCP_SERVER_URL          → server-side base URL (default: live endpoint)
 *   - MCP_SERVER_TOKEN        → optional bearer token for self-hosted setups
 *   - NEXT_PUBLIC_MCP_SERVER_URL → exposed for client-side admin tools
 */

const DEFAULT_MCP_URL = 'https://stackmemory-mcp.pages.dev/mcp';

export type McpToolName =
  // Core
  | 'search_memories'
  | 'store_memory'
  | 'update_memory'
  | 'delete_memory'
  | 'query_memories'
  | 'list_memories'
  // Graph
  | 'get_memory_graph'
  | 'link_memories'
  // Advanced
  | 'sm_time_query'
  | 'sm_memory_summary'
  | 'sm_batch_operations'
  | 'sm_export_memories'
  | 'sm_concept_cluster'
  | 'sm_import_memories'
  | 'sm_prefetch'
  // Ulu-Brain
  | 'brain_think'
  | 'brain_adapt'
  | 'brain_consolidate'
  | 'brain_status'
  | 'brain_simulate'
  | 'brain_dream';

export interface McpCallOptions {
  /** Override MCP endpoint per-call (multi-tenant / self-host scenarios). */
  endpoint?: string;
  /** Override bearer token per-call. */
  token?: string;
  /** Abort signal forwarded to fetch. */
  signal?: AbortSignal;
}

export class McpError extends Error {
  code: number;
  data?: unknown;
  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.data = data;
  }
}

function getEndpoint(override?: string): string {
  return (
    override ||
    process.env.MCP_SERVER_URL ||
    process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
    DEFAULT_MCP_URL
  );
}

function getToken(override?: string): string | undefined {
  return override || process.env.MCP_SERVER_TOKEN || undefined;
}

let requestCounter = 0;
function nextId(): string {
  requestCounter = (requestCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now()}-${requestCounter}`;
}

/**
 * Generic JSON-RPC tools/call wrapper.
 * Throws McpError on protocol-level failures.
 */
export async function callTool<T = unknown>(
  name: McpToolName,
  args: Record<string, unknown> = {},
  opts: McpCallOptions = {}
): Promise<T> {
  const endpoint = getEndpoint(opts.endpoint);
  const token = getToken(opts.token);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: { name, arguments: args },
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
    signal: opts.signal,
  });

  if (!res.ok) {
    throw new McpError(
      `MCP HTTP ${res.status}: ${res.statusText}`,
      res.status
    );
  }

  const json = await res.json();
  if (json.error) {
    throw new McpError(
      json.error.message || 'MCP RPC error',
      json.error.code ?? -32000,
      json.error.data
    );
  }

  // MCP servers return tool output under result.content[].text (JSON-encoded)
  // or result directly for simpler shapes — normalize both.
  const result = json.result;
  if (result && Array.isArray(result.content) && result.content.length) {
    const first = result.content[0];
    if (first?.type === 'text' && typeof first.text === 'string') {
      try {
        return JSON.parse(first.text) as T;
      } catch {
        return first.text as unknown as T;
      }
    }
  }
  return result as T;
}

/**
 * Build a per-user namespace string. Memory isolation is enforced server-side
 * by the MCP `namespace` parameter — never trust client-provided namespaces.
 */
export function userNamespace(userId: string, scope?: string): string {
  if (!userId) throw new Error('userNamespace: userId is required');
  return scope ? `user:${userId}:${scope}` : `user:${userId}`;
}

/** Convenience helpers — thin typed wrappers around callTool. */
export const mcp = {
  store: (args: {
    content: string;
    type?: string;
    confidence?: number;
    namespace: string;
    tags?: string[];
    importance_score?: number;
  }) => callTool('store_memory', args),

  list: (args: {
    namespace?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) => callTool('list_memories', args),

  get: (args: { id: string; namespace?: string }) =>
    callTool('list_memories', { ...args, limit: 1 }),

  update: (args: {
    id: string;
    content?: string;
    type?: string;
    confidence?: number;
    tags?: string[];
    namespace?: string;
  }) => callTool('update_memory', args),

  delete: (args: { id: string; namespace?: string }) =>
    callTool('delete_memory', args),

  search: (args: {
    query: string;
    namespace?: string;
    limit?: number;
    type?: string;
  }) => callTool('search_memories', args),

  query: (args: { query: string; namespace?: string; limit?: number }) =>
    callTool('query_memories', args),

  graph: (args: { namespace?: string; filter_keyword?: string; limit?: number }) =>
    callTool('get_memory_graph', args),

  link: (args: {
    source_id: string;
    target_id: string;
    relation: string;
    namespace?: string;
  }) => callTool('link_memories', args),

  export: (args: { namespace?: string; format?: 'json' | 'csv' }) =>
    callTool('sm_export_memories', args),

  import: (args: {
    memories: unknown[];
    namespace?: string;
    on_duplicate?: 'skip' | 'overwrite';
  }) => callTool('sm_import_memories', args),

  summary: (args: { namespace?: string }) =>
    callTool('sm_memory_summary', args),

  // Brain
  think: (args: { context: string; namespace?: string; depth?: 'shallow' | 'deep' }) =>
    callTool('brain_think', args),

  adapt: (args: {
    memory_id: string;
    feedback: 'useful' | 'not_useful' | 'critical';
    namespace?: string;
  }) => callTool('brain_adapt', args),

  consolidate: (args: {
    namespace?: string;
    min_cluster_size?: number;
    dry_run?: boolean;
  }) => callTool('brain_consolidate', args),

  status: (args: { namespace?: string }) => callTool('brain_status', args),

  simulate: (args: {
    decision: string;
    namespace?: string;
    include_cross_namespace?: boolean;
  }) => callTool('brain_simulate', args),

  dream: (args: { focus?: string; max_ideas?: number; namespaces?: string[] }) =>
    callTool('brain_dream', args),
};
