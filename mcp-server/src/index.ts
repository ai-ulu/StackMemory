#!/usr/bin/env node

/**
 * StackMemory MCP Server
 * 
 * Model Context Protocol implementation for shared AI workflow memory.
 * Connects any MCP-compatible AI (Claude, Cursor, etc.) to the StackMemory system.
 * 
 * Usage:
 *   npx @ai-ulu/mcp-server --api-url https://your-ai-ulu-instance.com --api-key YOUR_KEY
 * 
 * Or in Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "ai-ulu": {
 *         "command": "npx",
 *         "args": ["@ai-ulu/mcp-server"],
 *         "env": {
 *           "AI_ULU_API_URL": "https://your-instance.com",
 *           "AI_ULU_API_KEY": "your-api-key"
 *         }
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Configuration
const config = {
  apiUrl: process.env.AI_ULU_API_URL || 'http://localhost:3000',
  apiKey: process.env.AI_ULU_API_KEY || '',
  userId: process.env.AI_ULU_USER_ID || '',
  userEmail: process.env.AI_ULU_USER_EMAIL || '',
};

// API client for the StackMemory backend
class AIUluClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...(config.userId ? { 'X-StackMemory-Local-User': config.userId } : {}),
        ...(config.userEmail ? { 'X-StackMemory-Local-Email': config.userEmail } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Memory operations
  async searchMemories(query: string, limit: number = 5) {
    return this.request(`/api/memories/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getMemories(type?: string, limit?: number) {
    let endpoint = '/api/memories?';
    if (type) endpoint += `type=${type}&`;
    if (limit) endpoint += `limit=${limit}`;
    return this.request(endpoint);
  }

  async storeMemory(content: string, type: string = 'fact', confidence: number = 0.8) {
    return this.request('/api/memories', {
      method: 'POST',
      body: JSON.stringify({
        content,
        type,
        confidence,
        write_intent: 'user_explicit',
        write_source: 'mcp',
        write_reason: 'Stored via MCP protocol',
      }),
    });
  }

  async updateMemory(id: string, content: string) {
    return this.request(`/api/memories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMemory(id: string) {
    return this.request(`/api/memories/${id}`, {
      method: 'DELETE',
    });
  }

  async getMemoryGraph(limit: number = 50): Promise<{
    nodes?: Array<unknown>;
    edges?: Array<unknown>;
    stats?: Record<string, unknown>;
  }> {
    return this.request(`/api/memories/graph?limit=${limit}`);
  }

  async queryNaturalLanguage(question: string) {
    return this.request('/api/memories/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getSettings() {
    return this.request('/api/memory-settings');
  }

  async healthCheck() {
    return this.request('/api/health');
  }
}

// Initialize client
const client = new AIUluClient(config.apiUrl, config.apiKey);

// Create MCP server
const server = new Server(
  {
    name: 'ai-ulu-memory',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ===================
// TOOLS IMPLEMENTATION
// ===================

// Tool schemas using Zod
const SearchMemoriesSchema = z.object({
  query: z.string().describe('Search query to find relevant memories'),
  limit: z.number().optional().default(5).describe('Maximum number of results'),
});

const StoreMemorySchema = z.object({
  content: z.string().describe('The memory content to store'),
  type: z.enum(['identity', 'preference', 'fact']).optional().default('fact')
    .describe('Memory type: identity (who user is), preference (what user likes), fact (general info)'),
  confidence: z.number().min(0).max(1).optional().default(0.8)
    .describe('Confidence score (0-1)'),
});

const UpdateMemorySchema = z.object({
  id: z.string().describe('Memory ID to update'),
  content: z.string().describe('New content'),
});

const DeleteMemorySchema = z.object({
  id: z.string().describe('Memory ID to delete'),
});

const QueryMemoriesSchema = z.object({
  question: z.string().describe('Natural language question about memories'),
});

const HealthCheckSchema = z.object({});
const ListMemoriesSchema = z.object({
  type: z.enum(['identity', 'preference', 'fact']).optional(),
  limit: z.number().int().positive().max(100).optional(),
});
const GetMemoryGraphSchema = z.object({
  limit: z.number().int().positive().max(200).optional(),
});
const BulkStoreMemoriesSchema = z.object({
  memories: z.array(
    z.object({
      content: z.string().min(1),
      type: z.enum(['identity', 'preference', 'fact']).optional().default('fact'),
      confidence: z.number().min(0).max(1).optional().default(0.8),
    })
  ).min(1).max(50),
});

function textResult(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
  };
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_memories',
        description: 'Search user memories by semantic similarity. Use this to find relevant past information.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Max results (default: 5)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'store_memory',
        description: 'Store new information in user memory. Use for important facts, preferences, or identity info.',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Memory content' },
            type: { 
              type: 'string', 
              enum: ['identity', 'preference', 'fact'],
              description: 'Memory type',
            },
            confidence: { type: 'number', description: 'Confidence 0-1' },
          },
          required: ['content'],
        },
      },
      {
        name: 'update_memory',
        description: 'Update an existing memory with new content.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Memory ID' },
            content: { type: 'string', description: 'New content' },
          },
          required: ['id', 'content'],
        },
      },
      {
        name: 'delete_memory',
        description: 'Delete a memory (moves to shadow/archive).',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Memory ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'query_memories',
        description: 'Ask a natural language question about user memories. E.g., "What does user prefer for lunch?"',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Natural language question' },
          },
          required: ['question'],
        },
      },
      {
        name: 'health_check',
        description: 'Check StackMemory API connectivity and health status.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'bulk_store_memories',
        description: 'Store multiple memories in one request (up to 50 items).',
        inputSchema: {
          type: 'object',
          properties: {
            memories: {
              type: 'array',
              description: 'Array of memories to store',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string', description: 'Memory content' },
                  type: {
                    type: 'string',
                    enum: ['identity', 'preference', 'fact'],
                    description: 'Memory type',
                  },
                  confidence: { type: 'number', description: 'Confidence 0-1' },
                },
                required: ['content'],
              },
            },
          },
          required: ['memories'],
        },
      },
      {
        name: 'list_memories',
        description: 'List all memories, optionally filtered by type.',
        inputSchema: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['identity', 'preference', 'fact'],
              description: 'Filter by type',
            },
            limit: { type: 'number', description: 'Max results' },
          },
        },
      },
      {
        name: 'get_memory_graph',
        description: 'Get memory relationship graph showing how memories connect.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max nodes' },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_memories': {
        const { query, limit } = SearchMemoriesSchema.parse(args);
        const results = await client.searchMemories(query, limit);
        return textResult(JSON.stringify(results, null, 2));
      }

      case 'store_memory': {
        const { content, type, confidence } = StoreMemorySchema.parse(args);
        const result = await client.storeMemory(content, type, confidence);
        return textResult(`Memory stored successfully:\n${JSON.stringify(result, null, 2)}`);
      }

      case 'update_memory': {
        const { id, content } = UpdateMemorySchema.parse(args);
        const result = await client.updateMemory(id, content);
        return textResult(`Memory updated:\n${JSON.stringify(result, null, 2)}`);
      }

      case 'delete_memory': {
        const { id } = DeleteMemorySchema.parse(args);
        await client.deleteMemory(id);
        return textResult(`Memory ${id} deleted (moved to shadow).`);
      }

      case 'query_memories': {
        const { question } = QueryMemoriesSchema.parse(args);
        const result = await client.queryNaturalLanguage(question);
        return textResult(JSON.stringify(result, null, 2));
      }

      case 'health_check': {
        HealthCheckSchema.parse(args ?? {});
        const result = await client.healthCheck();
        return textResult(`StackMemory health:\n${JSON.stringify(result, null, 2)}`);
      }

      case 'bulk_store_memories': {
        const { memories } = BulkStoreMemoriesSchema.parse(args ?? {});
        const results = await Promise.all(
          memories.map((memory) => client.storeMemory(memory.content, memory.type, memory.confidence))
        );
        return textResult(
          `Stored ${results.length} memories successfully.\n${JSON.stringify(results, null, 2)}`
        );
      }

      case 'list_memories': {
        const { type, limit } = ListMemoriesSchema.parse(args ?? {});
        const results = await client.getMemories(type, limit);
        return textResult(JSON.stringify(results, null, 2));
      }

      case 'get_memory_graph': {
        const { limit } = GetMemoryGraphSchema.parse(args ?? {});
        const graph = await client.getMemoryGraph(limit);
        return textResult(
          `Memory Graph:\n- Nodes: ${graph.nodes?.length || 0}\n- Edges: ${graph.edges?.length || 0}\n\n${JSON.stringify(graph.stats, null, 2)}`
        );
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// ======================
// RESOURCES IMPLEMENTATION
// ======================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'memories://all',
        name: 'All Memories',
        description: 'Complete list of user memories',
        mimeType: 'application/json',
      },
      {
        uri: 'memories://identity',
        name: 'Identity Memories',
        description: 'Who the user is (name, profession, etc.)',
        mimeType: 'application/json',
      },
      {
        uri: 'memories://preferences',
        name: 'Preference Memories',
        description: 'What the user likes/dislikes',
        mimeType: 'application/json',
      },
      {
        uri: 'memories://facts',
        name: 'Fact Memories',
        description: 'General information user shared',
        mimeType: 'application/json',
      },
      {
        uri: 'memories://graph',
        name: 'Memory Graph',
        description: 'Relationships between memories',
        mimeType: 'application/json',
      },
      {
        uri: 'settings://memory',
        name: 'Memory Settings',
        description: 'User memory configuration',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'memories://all': {
        const memories = await client.getMemories();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(memories, null, 2),
            },
          ],
        };
      }

      case 'memories://identity': {
        const memories = await client.getMemories('identity');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(memories, null, 2),
            },
          ],
        };
      }

      case 'memories://preferences': {
        const memories = await client.getMemories('preference');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(memories, null, 2),
            },
          ],
        };
      }

      case 'memories://facts': {
        const memories = await client.getMemories('fact');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(memories, null, 2),
            },
          ],
        };
      }

      case 'memories://graph': {
        const graph = await client.getMemoryGraph();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(graph, null, 2),
            },
          ],
        };
      }

      case 'settings://memory': {
        const settings = await client.getSettings();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(settings, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// =======================
// PROMPTS IMPLEMENTATION
// =======================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'remember_context',
        description: 'Load user context and memories before responding',
        arguments: [
          {
            name: 'topic',
            description: 'Optional topic to focus memories on',
            required: false,
          },
        ],
      },
      {
        name: 'memory_aware_response',
        description: 'Generate a response that incorporates user memories',
        arguments: [
          {
            name: 'user_message',
            description: 'The user message to respond to',
            required: true,
          },
        ],
      },
      {
        name: 'summarize_memories',
        description: 'Create a summary of user memories',
        arguments: [
          {
            name: 'type',
            description: 'Memory type to summarize (all, identity, preference, fact)',
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'remember_context': {
      const topic = args?.topic as string | undefined;
      let memories;
      
      if (topic) {
        memories = await client.searchMemories(topic, 10);
      } else {
        memories = await client.getMemories(undefined, 20);
      }

      return {
        description: 'User context loaded from StackMemory',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Here is what I know about you from StackMemory:\n\n${JSON.stringify(memories, null, 2)}\n\nPlease use this context to provide personalized responses.`,
            },
          },
        ],
      };
    }

    case 'memory_aware_response': {
      const userMessage = args?.user_message as string;
      if (!userMessage) {
        throw new Error('user_message is required');
      }

      const relevantMemories = await client.searchMemories(userMessage, 5);

      return {
        description: 'Memory-aware response prompt',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Based on these relevant memories:\n${JSON.stringify(relevantMemories, null, 2)}\n\nRespond to: "${userMessage}"`,
            },
          },
        ],
      };
    }

    case 'summarize_memories': {
      const type = args?.type as string | undefined;
      const memories = await client.getMemories(type === 'all' ? undefined : type);

      return {
        description: 'Memory summary request',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please summarize these user memories:\n\n${JSON.stringify(memories, null, 2)}`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Start the server
async function main() {
  console.error('StackMemory MCP Server starting...');
  console.error(`API URL: ${config.apiUrl}`);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('StackMemory MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
