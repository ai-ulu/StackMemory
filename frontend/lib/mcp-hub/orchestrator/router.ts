/**
 * AI-ULU MCP Hub - Smart Router
 * 
 * Intelligent routing of queries to appropriate MCP servers.
 * Uses semantic analysis and ML-based routing decisions.
 */

import { mcpRegistry, MCPServerConfig, MCPCapability } from './registry';

export interface RouteDecision {
  servers: MCPServerConfig[];
  reasoning: string;
  confidence: number;
  fallbacks: MCPServerConfig[];
  estimatedLatency: number;
  estimatedCost: number;
}

export interface QueryAnalysis {
  intent: QueryIntent;
  entities: string[];
  keywords: string[];
  requiresRealtime: boolean;
  requiresLocal: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

export type QueryIntent = 
  | 'search_web'
  | 'search_code'
  | 'search_memory'
  | 'read_file'
  | 'write_file'
  | 'query_database'
  | 'search_docs'
  | 'send_message'
  | 'general_knowledge'
  | 'personal_context'
  | 'unknown';

// Intent detection patterns
const INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
  search_web: [
    /\b(search|find|look up|google|latest|news|what is|who is)\b/i,
    /\b(internet|web|online)\b/i,
    /\b(2024|2025|recent|current|today)\b/i,
  ],
  search_code: [
    /\b(code|function|class|method|implement|programming|syntax)\b/i,
    /\b(github|repo|repository|commit|branch)\b/i,
    /\b(python|javascript|typescript|java|rust|go)\b/i,
  ],
  search_memory: [
    /\b(remember|recall|told you|mentioned|said before|my|I am|I like)\b/i,
    /\b(preference|favorite|history|past)\b/i,
    /\b(about me|who am I|what do I)\b/i,
  ],
  read_file: [
    /\b(read|open|show|view|cat|contents of)\b/i,
    /\b(file|document|\.txt|\.md|\.json|\.py|\.js)\b/i,
  ],
  write_file: [
    /\b(write|save|create|update|modify|edit)\b/i,
    /\b(file|document)\b/i,
  ],
  query_database: [
    /\b(database|sql|query|table|schema|records)\b/i,
    /\b(postgres|mysql|sqlite|mongodb)\b/i,
  ],
  search_docs: [
    /\b(documentation|docs|wiki|confluence|notion)\b/i,
    /\b(team|company|internal|policy)\b/i,
  ],
  send_message: [
    /\b(send|post|message|slack|email|notify)\b/i,
    /\b(team|channel|user)\b/i,
  ],
  general_knowledge: [
    /\b(what|why|how|when|where|explain|describe)\b/i,
  ],
  personal_context: [
    /\b(my|mine|I|me|prefer|like|work|live)\b/i,
  ],
  unknown: [],
};

// Keyword to MCP server mapping
const KEYWORD_MCP_MAP: Record<string, string[]> = {
  // Web search
  'search': ['brave-search', 'fetch'],
  'web': ['brave-search', 'fetch'],
  'internet': ['brave-search'],
  'latest': ['brave-search'],
  'news': ['brave-search'],
  
  // Code/GitHub
  'github': ['github'],
  'repo': ['github'],
  'code': ['github', 'filesystem'],
  'commit': ['github'],
  'issue': ['github'],
  'pr': ['github'],
  'pull request': ['github'],
  
  // Files
  'file': ['filesystem'],
  'directory': ['filesystem'],
  'folder': ['filesystem'],
  'read': ['filesystem'],
  'write': ['filesystem'],
  
  // Memory
  'remember': ['ai-ulu-memory'],
  'recall': ['ai-ulu-memory'],
  'memory': ['ai-ulu-memory'],
  'history': ['ai-ulu-memory'],
  'preference': ['ai-ulu-memory'],
  'about me': ['ai-ulu-memory'],
  
  // Database
  'database': ['postgres'],
  'sql': ['postgres'],
  'table': ['postgres'],
  'query': ['postgres'],
  
  // Docs
  'notion': ['notion'],
  'wiki': ['notion'],
  'documentation': ['notion', 'github'],
  
  // Communication
  'slack': ['slack'],
  'message': ['slack'],
  'channel': ['slack'],
};

/**
 * MCP Router - Smart query routing
 */
export class MCPRouter {
  
  /**
   * Analyze query to determine intent and extract entities
   */
  analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Detect intent
    let detectedIntent: QueryIntent = 'unknown';
    let maxMatches = 0;
    
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      const matches = patterns.filter(p => p.test(lowerQuery)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedIntent = intent as QueryIntent;
      }
    }
    
    // Extract keywords
    const keywords: string[] = [];
    for (const keyword of Object.keys(KEYWORD_MCP_MAP)) {
      if (lowerQuery.includes(keyword)) {
        keywords.push(keyword);
      }
    }
    
    // Extract entities (simplified - could use NER)
    const entities: string[] = [];
    const urlMatch = query.match(/https?:\/\/[^\s]+/g);
    if (urlMatch) entities.push(...urlMatch);
    
    const fileMatch = query.match(/[\/\w-]+\.\w{2,4}/g);
    if (fileMatch) entities.push(...fileMatch);
    
    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (keywords.length > 3 || query.length > 200) complexity = 'complex';
    else if (keywords.length > 1 || query.length > 100) complexity = 'moderate';
    
    // Check if realtime needed
    const requiresRealtime = /\b(latest|current|now|today|live|real-?time)\b/i.test(query);
    
    // Check if local context needed
    const requiresLocal = /\b(my|I|me|prefer|remember|told|said)\b/i.test(query);
    
    return {
      intent: detectedIntent,
      entities,
      keywords,
      requiresRealtime,
      requiresLocal,
      complexity,
    };
  }

  /**
   * Route query to appropriate MCP servers
   */
  route(query: string): RouteDecision {
    const analysis = this.analyzeQuery(query);
    const selectedServers: MCPServerConfig[] = [];
    const fallbackServers: MCPServerConfig[] = [];
    let reasoning = '';
    
    // Step 1: Always check local memory first if personal context detected
    if (analysis.requiresLocal || analysis.intent === 'search_memory' || analysis.intent === 'personal_context') {
      const memoryServer = mcpRegistry.get('ai-ulu-memory');
      if (memoryServer?.enabled) {
        selectedServers.push(memoryServer);
        reasoning += 'Checking local memory first. ';
      }
    }
    
    // Step 2: Add servers based on keywords
    const keywordServers = new Set<string>();
    for (const keyword of analysis.keywords) {
      const serverIds = KEYWORD_MCP_MAP[keyword] || [];
      serverIds.forEach(id => keywordServers.add(id));
    }
    
    for (const serverId of keywordServers) {
      const server = mcpRegistry.get(serverId);
      if (server?.enabled && !selectedServers.find(s => s.id === serverId)) {
        selectedServers.push(server);
      }
    }
    
    // Step 3: Add servers based on intent
    switch (analysis.intent) {
      case 'search_web':
        this.addIfEnabled(selectedServers, 'brave-search');
        this.addIfEnabled(fallbackServers, 'fetch');
        reasoning += 'Web search intent detected. ';
        break;
        
      case 'search_code':
        this.addIfEnabled(selectedServers, 'github');
        this.addIfEnabled(fallbackServers, 'filesystem');
        reasoning += 'Code search intent detected. ';
        break;
        
      case 'read_file':
      case 'write_file':
        this.addIfEnabled(selectedServers, 'filesystem');
        reasoning += 'File operation intent detected. ';
        break;
        
      case 'query_database':
        this.addIfEnabled(selectedServers, 'postgres');
        reasoning += 'Database query intent detected. ';
        break;
        
      case 'search_docs':
        this.addIfEnabled(selectedServers, 'notion');
        this.addIfEnabled(fallbackServers, 'github');
        reasoning += 'Documentation search intent detected. ';
        break;
        
      case 'send_message':
        this.addIfEnabled(selectedServers, 'slack');
        reasoning += 'Messaging intent detected. ';
        break;
    }
    
    // Step 4: If no servers selected, use defaults
    if (selectedServers.length === 0) {
      // Check memory, then web search
      this.addIfEnabled(selectedServers, 'ai-ulu-memory');
      this.addIfEnabled(selectedServers, 'brave-search');
      reasoning += 'No specific intent matched, using defaults. ';
    }
    
    // Sort by priority
    selectedServers.sort((a, b) => b.priority - a.priority);
    fallbackServers.sort((a, b) => b.priority - a.priority);
    
    // Calculate estimates
    const estimatedLatency = this.estimateLatency(selectedServers, analysis.complexity);
    const estimatedCost = this.estimateCost(selectedServers);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(analysis, selectedServers);
    
    return {
      servers: selectedServers,
      reasoning: reasoning.trim(),
      confidence,
      fallbacks: fallbackServers,
      estimatedLatency,
      estimatedCost,
    };
  }

  /**
   * Add server to list if enabled
   */
  private addIfEnabled(list: MCPServerConfig[], serverId: string): void {
    const server = mcpRegistry.get(serverId);
    if (server?.enabled && !list.find(s => s.id === serverId)) {
      list.push(server);
    }
  }

  /**
   * Estimate latency based on servers and complexity
   */
  private estimateLatency(servers: MCPServerConfig[], complexity: string): number {
    const baseLatency: Record<string, number> = {
      'ai-ulu-memory': 100,
      'filesystem': 50,
      'github': 500,
      'brave-search': 800,
      'fetch': 1000,
      'notion': 600,
      'slack': 400,
      'postgres': 200,
    };
    
    const complexityMultiplier = {
      simple: 1,
      moderate: 1.5,
      complex: 2,
    };
    
    let total = 0;
    for (const server of servers) {
      total += baseLatency[server.id] || 500;
    }
    
    return Math.round(total * complexityMultiplier[complexity as keyof typeof complexityMultiplier]);
  }

  /**
   * Estimate cost based on servers
   */
  private estimateCost(servers: MCPServerConfig[]): number {
    let total = 0;
    for (const server of servers) {
      if (server.cost) {
        total += server.cost.perRequest;
      }
    }
    return total;
  }

  /**
   * Calculate routing confidence
   */
  private calculateConfidence(analysis: QueryAnalysis, servers: MCPServerConfig[]): number {
    let confidence = 0.5; // Base confidence
    
    // More keywords = higher confidence
    confidence += Math.min(analysis.keywords.length * 0.1, 0.3);
    
    // Known intent = higher confidence
    if (analysis.intent !== 'unknown') {
      confidence += 0.2;
    }
    
    // Matching servers found = higher confidence
    if (servers.length > 0) {
      confidence += 0.1;
    }
    
    // Cap at 0.95
    return Math.min(confidence, 0.95);
  }

  /**
   * Get routing statistics
   */
  getStats(): Record<string, any> {
    return {
      totalServers: mcpRegistry.getAll().length,
      enabledServers: mcpRegistry.getEnabled().length,
      supportedIntents: Object.keys(INTENT_PATTERNS).length,
      supportedKeywords: Object.keys(KEYWORD_MCP_MAP).length,
    };
  }
}

// Singleton
export const mcpRouter = new MCPRouter();

export default mcpRouter;
