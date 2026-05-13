// StackMemory MCP App Adapter
// Thin MCP-compatible proxy that forwards tools to the app-first API layer.
// The legacy D1/Vectorize MCP server remains in src/index.ts.

interface Env {
  STACKMEMORY_APP_URL: string;
  STACKMEMORY_APP_TOKEN?: string;
}

type JsonRpcRequest = {
  jsonrpc?: '2.0';
  id?: string | number | null;
  method?: string;
  params?: any;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
};

const TOOLS = [
  {
    name: 'list_memories',
    description: 'List memories from the StackMemory app-first memory API.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string' },
        type: { type: 'string' },
        status: { type: 'string' },
        scope: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'search_memories',
    description: 'Search memories through the StackMemory app-first memory API.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string' },
        limit: { type: 'number' },
        type: { type: 'string' },
        status: { type: 'string' },
        scope: { type: 'string' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'store_memory',
    description: 'Store a memory through the StackMemory app-first memory API.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        type: { type: 'string' },
        confidence: { type: 'number' },
        scope: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_memory',
    description: 'Update a memory through the StackMemory app-first memory API.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string' },
        confidence: { type: 'number' },
        scope: { type: 'string' },
        status: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_memory',
    description: 'Deprecate a memory through the StackMemory app-first memory API.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'brain_status',
    description: 'Return brain status from the StackMemory app-first brain API.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'brain_simulate',
    description: 'Run decision simulation through the StackMemory app-first brain API.',
    inputSchema: {
      type: 'object',
      properties: { decision: { type: 'string' } },
      required: ['decision'],
    },
  },
  {
    name: 'get_memory_graph',
    description: 'Return memory graph from the StackMemory app-first graph API.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        status: { type: 'string' },
        scope: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function rpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return json({ jsonrpc: '2.0', id: id ?? null, result });
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string) {
  return json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, code === -32601 ? 404 : 200);
}

function appHeaders(request: Request, env: Env): HeadersInit {
  const incomingAuth = request.headers.get('Authorization');
  const auth = incomingAuth || (env.STACKMEMORY_APP_TOKEN ? `Bearer ${env.STACKMEMORY_APP_TOKEN}` : '');
  return {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };
}

function appUrl(env: Env, path: string, query?: URLSearchParams) {
  const base = env.STACKMEMORY_APP_URL?.replace(/\/$/, '');
  if (!base) throw new Error('STACKMEMORY_APP_URL is required');
  const suffix = query?.toString() ? `${path}?${query.toString()}` : path;
  return `${base}${suffix}`;
}

async function callApp(request: Request, env: Env, path: string, init?: RequestInit) {
  const response = await fetch(appUrl(env, path), {
    ...init,
    headers: { ...appHeaders(request, env), ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `App API failed: ${response.status}`);
  return body;
}

async function callAppWithQuery(request: Request, env: Env, path: string, query: URLSearchParams) {
  const response = await fetch(appUrl(env, path, query), {
    method: 'GET',
    headers: appHeaders(request, env),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `App API failed: ${response.status}`);
  return body;
}

function contentResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function callTool(name: string, args: any, request: Request, env: Env) {
  switch (name) {
    case 'list_memories': {
      const query = new URLSearchParams();
      if (args?.q) query.set('q', args.q);
      if (args?.type) query.set('type', args.type);
      if (args?.status) query.set('status', args.status);
      if (args?.scope) query.set('scope', args.scope);
      if (args?.limit) query.set('limit', String(args.limit));
      return contentResult(await callAppWithQuery(request, env, '/api/memories', query));
    }
    case 'search_memories': {
      const query = new URLSearchParams();
      query.set('q', args.keyword || '');
      if (args?.limit) query.set('limit', String(args.limit));
      if (args?.type) query.set('type', args.type);
      if (args?.status) query.set('status', args.status);
      if (args?.scope) query.set('scope', args.scope);
      return contentResult(await callAppWithQuery(request, env, '/api/memories', query));
    }
    case 'store_memory':
      return contentResult(await callApp(request, env, '/api/memories', {
        method: 'POST',
        body: JSON.stringify(args),
      }));
    case 'update_memory':
      return contentResult(await callApp(request, env, `/api/memories/${args.id}`, {
        method: 'PATCH',
        body: JSON.stringify(args),
      }));
    case 'delete_memory':
      return contentResult(await callApp(request, env, `/api/memories/${args.id}`, { method: 'DELETE' }));
    case 'brain_status':
      return contentResult(await callApp(request, env, '/api/brain/status', { method: 'GET' }));
    case 'brain_simulate':
      return contentResult(await callApp(request, env, '/api/brain/simulate', {
        method: 'POST',
        body: JSON.stringify({ decision: args.decision }),
      }));
    case 'get_memory_graph': {
      const query = new URLSearchParams();
      if (args?.type) query.set('type', args.type);
      if (args?.status) query.set('status', args.status);
      if (args?.scope) query.set('scope', args.scope);
      if (args?.limit) query.set('limit', String(args.limit));
      return contentResult(await callAppWithQuery(request, env, '/api/graph', query));
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleRpc(request: Request, env: Env): Promise<Response> {
  const payload = await request.json() as JsonRpcRequest;
  const id = payload.id ?? null;

  try {
    if (payload.method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: 'stackmemory-app-adapter', version: '0.1.0' },
      });
    }

    if (payload.method === 'tools/list') {
      return rpcResult(id, { tools: TOOLS });
    }

    if (payload.method === 'tools/call') {
      const name = payload.params?.name;
      const args = payload.params?.arguments || {};
      const result = await callTool(name, args, request, env);
      return rpcResult(id, result);
    }

    return rpcError(id, -32601, `Method not found: ${payload.method}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected adapter error';
    return rpcError(id, -32000, message);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, adapter: 'app-first', appUrlConfigured: Boolean(env.STACKMEMORY_APP_URL) });
    }

    if (request.method === 'POST') {
      return handleRpc(request, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};
