/**
 * AI-ULU MCP Hub - Executor
 * 
 * Executes MCP calls and aggregates results.
 * Handles parallel execution, timeouts, retries, and error handling.
 */

import { MCPServerConfig } from './registry';
import { RouteDecision } from './router';

export interface ExecutionResult {
  serverId: string;
  serverName: string;
  success: boolean;
  data?: any;
  error?: string;
  latency: number;
  cached: boolean;
  timestamp: Date;
}

export interface AggregatedResult {
  query: string;
  results: ExecutionResult[];
  synthesizedAnswer?: string;
  totalLatency: number;
  successRate: number;
  fromCache: number;
  timestamp: Date;
}

export interface ExecutionOptions {
  timeout?: number;
  parallel?: boolean;
  maxRetries?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

const DEFAULT_OPTIONS: ExecutionOptions = {
  timeout: 10000,
  parallel: true,
  maxRetries: 2,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
};

// Simple in-memory cache (should be Redis in production)
const cache = new Map<string, { data: any; expires: number }>();

/**
 * MCP Executor - Execute MCP calls
 */
export class MCPExecutor {
  
  /**
   * Execute query across multiple MCP servers
   */
  async execute(
    query: string,
    decision: RouteDecision,
    options: ExecutionOptions = {}
  ): Promise<AggregatedResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    const results: ExecutionResult[] = [];
    
    // Check cache first
    const cacheKey = this.getCacheKey(query, decision.servers);
    if (opts.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          query,
          results: [{
            serverId: 'cache',
            serverName: 'Cache',
            success: true,
            data: cached,
            latency: 0,
            cached: true,
            timestamp: new Date(),
          }],
          totalLatency: Date.now() - startTime,
          successRate: 1,
          fromCache: 1,
          timestamp: new Date(),
        };
      }
    }
    
    // Execute on all servers
    if (opts.parallel) {
      // Parallel execution
      const promises = decision.servers.map(server =>
        this.executeOnServer(query, server, opts)
      );
      
      const settled = await Promise.allSettled(promises);
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            serverId: decision.servers[index].id,
            serverName: decision.servers[index].name,
            success: false,
            error: result.reason?.message || 'Unknown error',
            latency: 0,
            cached: false,
            timestamp: new Date(),
          });
        }
      });
    } else {
      // Sequential execution (stop on first success)
      for (const server of decision.servers) {
        const result = await this.executeOnServer(query, server, opts);
        results.push(result);
        
        if (result.success) {
          break;
        }
      }
    }
    
    // Try fallbacks if all failed
    if (results.every(r => !r.success) && decision.fallbacks.length > 0) {
      for (const fallback of decision.fallbacks) {
        const result = await this.executeOnServer(query, fallback, opts);
        results.push(result);
        
        if (result.success) {
          break;
        }
      }
    }
    
    // Calculate stats
    const successCount = results.filter(r => r.success).length;
    const cacheCount = results.filter(r => r.cached).length;
    const totalLatency = Date.now() - startTime;
    
    // Cache successful results
    if (opts.cacheEnabled && successCount > 0) {
      const successData = results.filter(r => r.success).map(r => r.data);
      this.setCache(cacheKey, successData, opts.cacheTTL!);
    }
    
    return {
      query,
      results,
      totalLatency,
      successRate: results.length > 0 ? successCount / results.length : 0,
      fromCache: cacheCount,
      timestamp: new Date(),
    };
  }

  /**
   * Execute on single server with retries
   */
  private async executeOnServer(
    query: string,
    server: MCPServerConfig,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= (options.maxRetries || 0); attempt++) {
      try {
        const data = await this.callMCP(query, server, options.timeout!);
        
        return {
          serverId: server.id,
          serverName: server.name,
          success: true,
          data,
          latency: Date.now() - startTime,
          cached: false,
          timestamp: new Date(),
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Wait before retry
        if (attempt < (options.maxRetries || 0)) {
          await this.sleep(Math.pow(2, attempt) * 100);
        }
      }
    }
    
    return {
      serverId: server.id,
      serverName: server.name,
      success: false,
      error: lastError?.message || 'Unknown error',
      latency: Date.now() - startTime,
      cached: false,
      timestamp: new Date(),
    };
  }

  /**
   * Call MCP server
   */
  private async callMCP(
    query: string,
    server: MCPServerConfig,
    timeout: number
  ): Promise<any> {
    // For HTTP transport
    if (server.transport === 'http') {
      return this.callHTTPMCP(query, server, timeout);
    }
    
    // For stdio transport, we would spawn the process
    // This is simplified - real implementation would use MCP SDK
    if (server.transport === 'stdio') {
      return this.callStdioMCP(query, server, timeout);
    }
    
    throw new Error(`Unsupported transport: ${server.transport}`);
  }

  /**
   * Call HTTP-based MCP server
   */
  private async callHTTPMCP(
    query: string,
    server: MCPServerConfig,
    timeout: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Determine the right endpoint based on query intent
      let endpoint = '/api/memories/search';
      let method = 'GET';
      let body: string | undefined;
      
      if (query.toLowerCase().includes('store') || query.toLowerCase().includes('save')) {
        endpoint = '/api/memories';
        method = 'POST';
        body = JSON.stringify({ content: query, type: 'fact' });
      }
      
      const url = `${server.endpoint}${endpoint}?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Add auth if available
          ...(process.env.AI_ULU_API_KEY && {
            'Authorization': `Bearer ${process.env.AI_ULU_API_KEY}`,
          }),
        },
        body,
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Call stdio-based MCP server
   * Note: This is a simplified mock. Real implementation would use MCP SDK.
   */
  private async callStdioMCP(
    query: string,
    server: MCPServerConfig,
    timeout: number
  ): Promise<any> {
    // In a real implementation, we would:
    // 1. Spawn the MCP server process
    // 2. Send the query via stdin
    // 3. Read response from stdout
    // 4. Handle the MCP protocol
    
    // For now, return a mock response
    return {
      server: server.id,
      query,
      message: `Mock response from ${server.name}. Real MCP integration pending.`,
      capabilities: server.capabilities.map(c => c.name),
    };
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: any): boolean {
    if (error?.name === 'AbortError') return true;
    if (error?.message?.includes('401')) return true;
    if (error?.message?.includes('403')) return true;
    if (error?.message?.includes('404')) return true;
    return false;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(query: string, servers: MCPServerConfig[]): string {
    const serverIds = servers.map(s => s.id).sort().join(',');
    return `${serverIds}:${query.toLowerCase().trim()}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any | null {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: any, ttl: number): void {
    cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
    
    // Clean old entries periodically
    if (cache.size > 1000) {
      this.cleanCache();
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expires) {
        cache.delete(key);
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): Record<string, any> {
    return {
      size: cache.size,
      entries: Array.from(cache.keys()),
    };
  }
}

// Singleton
export const mcpExecutor = new MCPExecutor();

export default mcpExecutor;
