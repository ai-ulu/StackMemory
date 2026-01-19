/**
 * AI-ULU MCP Hub - Registry
 * 
 * Central registry of all known MCP servers.
 * Manages connection configs, capabilities, and health status.
 */

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  transport: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  capabilities: MCPCapability[];
  priority: number; // 1-10, higher = preferred
  enabled: boolean;
  healthCheck?: string;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  cost?: {
    perRequest: number;
    currency: string;
  };
  lastHealthCheck?: Date;
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
}

export interface MCPCapability {
  type: 'tool' | 'resource' | 'prompt';
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  keywords: string[]; // For smart routing
}

// Built-in MCP server configurations
export const BUILTIN_MCP_SERVERS: MCPServerConfig[] = [
  // GitHub MCP
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub repositories, issues, PRs, and code search',
    endpoint: 'github-mcp',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
    capabilities: [
      { type: 'tool', name: 'search_repositories', description: 'Search GitHub repos', keywords: ['github', 'repo', 'code', 'search'] },
      { type: 'tool', name: 'get_file_contents', description: 'Read file from repo', keywords: ['file', 'code', 'read'] },
      { type: 'tool', name: 'search_code', description: 'Search code in repos', keywords: ['code', 'search', 'find'] },
      { type: 'tool', name: 'list_issues', description: 'List repo issues', keywords: ['issues', 'bugs', 'tasks'] },
      { type: 'tool', name: 'create_issue', description: 'Create new issue', keywords: ['issue', 'create', 'bug'] },
    ],
    priority: 8,
    enabled: true,
    status: 'unknown',
  },

  // Filesystem MCP
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read and write local files',
    endpoint: 'filesystem-mcp',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
    capabilities: [
      { type: 'tool', name: 'read_file', description: 'Read file contents', keywords: ['file', 'read', 'local'] },
      { type: 'tool', name: 'write_file', description: 'Write to file', keywords: ['file', 'write', 'save'] },
      { type: 'tool', name: 'list_directory', description: 'List directory contents', keywords: ['directory', 'list', 'files'] },
      { type: 'tool', name: 'search_files', description: 'Search files by pattern', keywords: ['search', 'find', 'files'] },
    ],
    priority: 9,
    enabled: true,
    status: 'unknown',
  },

  // Brave Search MCP
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web search via Brave API',
    endpoint: 'brave-search-mcp',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '${BRAVE_API_KEY}' },
    capabilities: [
      { type: 'tool', name: 'brave_web_search', description: 'Search the web', keywords: ['search', 'web', 'internet', 'find', 'latest'] },
      { type: 'tool', name: 'brave_local_search', description: 'Search local businesses', keywords: ['local', 'business', 'nearby'] },
    ],
    priority: 7,
    enabled: true,
    status: 'unknown',
  },

  // Fetch/HTTP MCP
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'Fetch web content and APIs',
    endpoint: 'fetch-mcp',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    capabilities: [
      { type: 'tool', name: 'fetch', description: 'Fetch URL content', keywords: ['url', 'fetch', 'http', 'web', 'api'] },
    ],
    priority: 6,
    enabled: true,
    status: 'unknown',
  },

  // Memory/SQLite MCP (built-in AI-ULU)
  {
    id: 'ai-ulu-memory',
    name: 'AI-ULU Memory',
    description: 'Personal AI memory system',
    endpoint: 'http://localhost:3000',
    transport: 'http',
    capabilities: [
      { type: 'tool', name: 'search_memories', description: 'Search user memories', keywords: ['memory', 'remember', 'recall', 'history'] },
      { type: 'tool', name: 'store_memory', description: 'Store new memory', keywords: ['save', 'remember', 'store'] },
      { type: 'tool', name: 'query_memories', description: 'Natural language memory query', keywords: ['ask', 'question', 'about me'] },
    ],
    priority: 10, // Highest - always check local memory first
    enabled: true,
    status: 'connected',
  },

  // PostgreSQL MCP
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query PostgreSQL databases',
    endpoint: 'postgres-mcp',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    env: { DATABASE_URL: '${DATABASE_URL}' },
    capabilities: [
      { type: 'tool', name: 'query', description: 'Run SQL query', keywords: ['sql', 'database', 'query', 'data'] },
      { type: 'tool', name: 'list_tables', description: 'List database tables', keywords: ['tables', 'schema', 'database'] },
    ],
    priority: 5,
    enabled: false, // Disabled by default - needs config
    status: 'unknown',
  },

  // Slack MCP
  {
    id: 'slack',
    name: 'Slack',
    description: 'Access Slack messages and channels',
    endpoint: 'slack-mcp',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: { SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}' },
    capabilities: [
      { type: 'tool', name: 'search_messages', description: 'Search Slack messages', keywords: ['slack', 'messages', 'chat', 'team'] },
      { type: 'tool', name: 'post_message', description: 'Post message to channel', keywords: ['slack', 'send', 'message'] },
      { type: 'tool', name: 'list_channels', description: 'List Slack channels', keywords: ['slack', 'channels'] },
    ],
    priority: 4,
    enabled: false,
    status: 'unknown',
  },

  // Notion MCP
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access Notion pages and databases',
    endpoint: 'notion-mcp',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'notion-mcp-server'],
    env: { NOTION_API_KEY: '${NOTION_API_KEY}' },
    capabilities: [
      { type: 'tool', name: 'search_pages', description: 'Search Notion pages', keywords: ['notion', 'docs', 'wiki', 'documentation'] },
      { type: 'tool', name: 'read_page', description: 'Read Notion page content', keywords: ['notion', 'read', 'page'] },
      { type: 'tool', name: 'query_database', description: 'Query Notion database', keywords: ['notion', 'database', 'table'] },
    ],
    priority: 6,
    enabled: false,
    status: 'unknown',
  },
];

/**
 * MCP Registry - Manages all MCP server configurations
 */
export class MCPRegistry {
  private servers: Map<string, MCPServerConfig> = new Map();
  private customServers: MCPServerConfig[] = [];

  constructor() {
    // Load built-in servers
    BUILTIN_MCP_SERVERS.forEach(server => {
      this.servers.set(server.id, { ...server });
    });
  }

  /**
   * Get all registered servers
   */
  getAll(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get enabled servers sorted by priority
   */
  getEnabled(): MCPServerConfig[] {
    return this.getAll()
      .filter(s => s.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get server by ID
   */
  get(id: string): MCPServerConfig | undefined {
    return this.servers.get(id);
  }

  /**
   * Register custom MCP server
   */
  register(config: MCPServerConfig): void {
    this.servers.set(config.id, config);
    this.customServers.push(config);
  }

  /**
   * Update server config
   */
  update(id: string, updates: Partial<MCPServerConfig>): boolean {
    const server = this.servers.get(id);
    if (!server) return false;
    
    this.servers.set(id, { ...server, ...updates });
    return true;
  }

  /**
   * Enable/disable server
   */
  setEnabled(id: string, enabled: boolean): boolean {
    return this.update(id, { enabled });
  }

  /**
   * Update server status
   */
  setStatus(id: string, status: MCPServerConfig['status']): boolean {
    return this.update(id, { status, lastHealthCheck: new Date() });
  }

  /**
   * Find servers by capability keyword
   */
  findByKeyword(keyword: string): MCPServerConfig[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.getEnabled().filter(server =>
      server.capabilities.some(cap =>
        cap.keywords.some(kw => kw.includes(lowerKeyword) || lowerKeyword.includes(kw))
      )
    );
  }

  /**
   * Find servers by capability type
   */
  findByCapabilityType(type: 'tool' | 'resource' | 'prompt'): MCPServerConfig[] {
    return this.getEnabled().filter(server =>
      server.capabilities.some(cap => cap.type === type)
    );
  }

  /**
   * Find best server for a specific tool
   */
  findBestForTool(toolName: string): MCPServerConfig | undefined {
    const servers = this.getEnabled().filter(server =>
      server.capabilities.some(cap => cap.type === 'tool' && cap.name === toolName)
    );
    return servers[0]; // Already sorted by priority
  }

  /**
   * Export registry to JSON
   */
  toJSON(): Record<string, any> {
    return {
      servers: this.getAll(),
      enabledCount: this.getEnabled().length,
      customCount: this.customServers.length,
    };
  }

  /**
   * Load custom servers from storage
   */
  loadFromStorage(servers: MCPServerConfig[]): void {
    servers.forEach(server => {
      this.servers.set(server.id, server);
      if (!BUILTIN_MCP_SERVERS.find(s => s.id === server.id)) {
        this.customServers.push(server);
      }
    });
  }
}

// Singleton instance
export const mcpRegistry = new MCPRegistry();

export default mcpRegistry;
