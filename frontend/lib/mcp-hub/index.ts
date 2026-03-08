/**
 * StackMemory MCP Hub - Main Orchestrator
 * 
 * THE OPERATING SYSTEM FOR AI
 * 
 * This is the central orchestration layer that:
 * - Remembers globally (StackMemory memory)
 * - Routes intelligently (smart MCP routing)
 * - Caches efficiently (dedup queries)
 * - Coordinates tools (multiple MCP servers)
 * - Learns from patterns (ML routing optimization)
 * 
 * Usage:
 *   import { mcpHub } from '@/lib/mcp-hub';
 *   const result = await mcpHub.query("What are Python best practices?");
 */

import { mcpRegistry, MCPServerConfig } from './orchestrator/registry';
import { mcpRouter, RouteDecision, QueryAnalysis } from './orchestrator/router';
import { mcpExecutor, AggregatedResult, ExecutionOptions } from './orchestrator/executor';
import { synthesizer, SynthesizedResponse } from './synthesis/synthesizer';

export interface HubQueryOptions extends ExecutionOptions {
  includeMemory?: boolean;
  synthesize?: boolean;
  returnRaw?: boolean;
}

export interface HubQueryResult {
  query: string;
  analysis: QueryAnalysis;
  routing: RouteDecision;
  execution: AggregatedResult;
  synthesized?: SynthesizedResponse;
  totalTime: number;
  success: boolean;
}

export interface HubStats {
  totalQueries: number;
  successRate: number;
  avgLatency: number;
  cacheHitRate: number;
  topServers: { id: string; count: number }[];
  recentQueries: { query: string; time: number }[];
}

/**
 * MCP Hub - Central AI Orchestrator
 */
class MCPHub {
  private stats: {
    queries: number;
    successes: number;
    totalLatency: number;
    cacheHits: number;
    serverUsage: Map<string, number>;
    recentQueries: { query: string; time: number }[];
  };

  constructor() {
    this.stats = {
      queries: 0,
      successes: 0,
      totalLatency: 0,
      cacheHits: 0,
      serverUsage: new Map(),
      recentQueries: [],
    };
  }

  /**
   * Main query method - orchestrates the entire flow
   */
  async query(
    query: string,
    options: HubQueryOptions = {}
  ): Promise<HubQueryResult> {
    const startTime = Date.now();
    const opts = {
      includeMemory: true,
      synthesize: true,
      returnRaw: false,
      ...options,
    };

    this.stats.queries++;

    try {
      // Step 1: Analyze the query
      const analysis = mcpRouter.analyzeQuery(query);
      
      // Step 2: Route to appropriate MCP servers
      const routing = mcpRouter.route(query);
      
      // Step 3: Execute on MCP servers
      const execution = await mcpExecutor.execute(query, routing, opts);
      
      // Update stats
      this.updateStats(execution, routing);
      
      // Step 4: Synthesize results (optional)
      let synthesized: SynthesizedResponse | undefined;
      if (opts.synthesize && !opts.returnRaw) {
        synthesized = await synthesizer.synthesize(query, execution);
        
        // Merge with memory if enabled
        if (opts.includeMemory) {
          const memoryResults = execution.results.find(r => r.serverId === 'ai-ulu-memory');
          if (memoryResults?.success && memoryResults.data) {
            synthesized = await synthesizer.mergeWithMemory(
              synthesized,
              Array.isArray(memoryResults.data) ? memoryResults.data : [memoryResults.data]
            );
          }
        }
      }
      
      const totalTime = Date.now() - startTime;
      this.stats.successes++;
      
      // Track recent query
      this.stats.recentQueries.unshift({ query, time: totalTime });
      if (this.stats.recentQueries.length > 100) {
        this.stats.recentQueries.pop();
      }

      return {
        query,
        analysis,
        routing,
        execution,
        synthesized,
        totalTime,
        success: true,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      return {
        query,
        analysis: mcpRouter.analyzeQuery(query),
        routing: { servers: [], reasoning: 'Error occurred', confidence: 0, fallbacks: [], estimatedLatency: 0, estimatedCost: 0 },
        execution: { query, results: [], totalLatency: totalTime, successRate: 0, fromCache: 0, timestamp: new Date() },
        totalTime,
        success: false,
      };
    }
  }

  /**
   * Quick query - returns just the answer
   */
  async ask(query: string): Promise<string> {
    const result = await this.query(query);
    return result.synthesized?.answer || 'Yanıt oluşturulamadı.';
  }

  /**
   * Search across all sources
   */
  async search(query: string, limit: number = 10): Promise<any[]> {
    const result = await this.query(query, { returnRaw: true, synthesize: false });
    
    // Collect all results
    const allResults: any[] = [];
    for (const execResult of result.execution.results) {
      if (execResult.success && execResult.data) {
        if (Array.isArray(execResult.data)) {
          allResults.push(...execResult.data.map(item => ({
            ...item,
            _source: execResult.serverId,
          })));
        } else {
          allResults.push({
            ...execResult.data,
            _source: execResult.serverId,
          });
        }
      }
    }
    
    return allResults.slice(0, limit);
  }

  /**
   * Store information (routes to memory)
   */
  async store(content: string, type: 'identity' | 'preference' | 'fact' = 'fact'): Promise<boolean> {
    try {
      const memoryServer = mcpRegistry.get('ai-ulu-memory');
      if (!memoryServer?.enabled) {
        throw new Error('Memory server not available');
      }
      
      // Call memory API directly
      const response = await fetch(`${memoryServer.endpoint}/api/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
          confidence: 0.9,
          write_source: 'mcp-hub',
          write_reason: 'Stored via MCP Hub',
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to store memory:', error);
      return false;
    }
  }

  /**
   * Get MCP registry
   */
  getRegistry() {
    return mcpRegistry;
  }

  /**
   * Get router
   */
  getRouter() {
    return mcpRouter;
  }

  /**
   * Enable/disable MCP server
   */
  setServerEnabled(serverId: string, enabled: boolean): boolean {
    return mcpRegistry.setEnabled(serverId, enabled);
  }

  /**
   * Register custom MCP server
   */
  registerServer(config: MCPServerConfig): void {
    mcpRegistry.register(config);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    mcpExecutor.clearCache();
  }

  /**
   * Get hub statistics
   */
  getStats(): HubStats {
    const avgLatency = this.stats.queries > 0 
      ? this.stats.totalLatency / this.stats.queries 
      : 0;
    
    const cacheHitRate = this.stats.queries > 0
      ? this.stats.cacheHits / this.stats.queries
      : 0;
    
    const topServers = Array.from(this.stats.serverUsage.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalQueries: this.stats.queries,
      successRate: this.stats.queries > 0 ? this.stats.successes / this.stats.queries : 0,
      avgLatency,
      cacheHitRate,
      topServers,
      recentQueries: this.stats.recentQueries.slice(0, 10),
    };
  }

  /**
   * Update internal stats
   */
  private updateStats(execution: AggregatedResult, routing: RouteDecision): void {
    this.stats.totalLatency += execution.totalLatency;
    this.stats.cacheHits += execution.fromCache;
    
    for (const result of execution.results) {
      if (result.success) {
        const current = this.stats.serverUsage.get(result.serverId) || 0;
        this.stats.serverUsage.set(result.serverId, current + 1);
      }
    }
  }

  /**
   * Health check all servers
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const server of mcpRegistry.getEnabled()) {
      try {
        if (server.transport === 'http') {
          const response = await fetch(`${server.endpoint}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          results[server.id] = response.ok;
          mcpRegistry.setStatus(server.id, response.ok ? 'connected' : 'error');
        } else {
          // For stdio servers, assume healthy if command exists
          results[server.id] = true;
          mcpRegistry.setStatus(server.id, 'connected');
        }
      } catch {
        results[server.id] = false;
        mcpRegistry.setStatus(server.id, 'error');
      }
    }
    
    return results;
  }

  /**
   * Get available capabilities
   */
  getCapabilities(): string[] {
    const caps = new Set<string>();
    
    for (const server of mcpRegistry.getEnabled()) {
      for (const cap of server.capabilities) {
        caps.add(cap.name);
      }
    }
    
    return Array.from(caps);
  }
}

// Singleton instance
export const mcpHub = new MCPHub();

// Re-export registry and router for advanced usage
export { mcpRegistry, mcpRouter, mcpExecutor, synthesizer };

export default mcpHub;
