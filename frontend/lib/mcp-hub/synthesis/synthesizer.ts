/**
 * StackMemory MCP Hub - Synthesis Engine
 * 
 * Combines and synthesizes results from multiple MCP servers.
 * Deduplicates, prioritizes, and creates coherent responses.
 */

import { AggregatedResult, ExecutionResult } from '../orchestrator/executor';

export interface SynthesizedResponse {
  answer: string;
  sources: SourceAttribution[];
  confidence: number;
  relevanceScores: Record<string, number>;
  metadata: {
    processingTime: number;
    sourcesUsed: number;
    tokensEstimate: number;
  };
}

export interface SourceAttribution {
  serverId: string;
  serverName: string;
  relevance: number;
  excerpt: string;
  timestamp: Date;
}

/**
 * Synthesis Engine - Combine MCP results
 */
export class SynthesisEngine {
  
  /**
   * Synthesize results from multiple MCP sources
   */
  async synthesize(
    query: string,
    aggregatedResult: AggregatedResult
  ): Promise<SynthesizedResponse> {
    const startTime = Date.now();
    
    // Filter successful results
    const successfulResults = aggregatedResult.results.filter(r => r.success && r.data);
    
    if (successfulResults.length === 0) {
      return this.createEmptyResponse(query);
    }
    
    // Extract and normalize content from each source
    const normalizedSources = successfulResults.map(result => ({
      result,
      content: this.extractContent(result),
      relevance: this.calculateRelevance(query, result),
    }));
    
    // Sort by relevance
    normalizedSources.sort((a, b) => b.relevance - a.relevance);
    
    // Deduplicate similar content
    const deduped = this.deduplicateContent(normalizedSources);
    
    // Build synthesized answer
    const answer = this.buildAnswer(query, deduped);
    
    // Create source attributions
    const sources: SourceAttribution[] = deduped.map(s => ({
      serverId: s.result.serverId,
      serverName: s.result.serverName,
      relevance: s.relevance,
      excerpt: s.content.slice(0, 200),
      timestamp: s.result.timestamp,
    }));
    
    // Calculate overall confidence
    const confidence = this.calculateConfidence(deduped);
    
    // Relevance scores per source
    const relevanceScores: Record<string, number> = {};
    deduped.forEach(s => {
      relevanceScores[s.result.serverId] = s.relevance;
    });
    
    return {
      answer,
      sources,
      confidence,
      relevanceScores,
      metadata: {
        processingTime: Date.now() - startTime,
        sourcesUsed: deduped.length,
        tokensEstimate: Math.ceil(answer.length / 4),
      },
    };
  }

  /**
   * Extract text content from result data
   */
  private extractContent(result: ExecutionResult): string {
    const data = result.data;
    
    if (typeof data === 'string') {
      return data;
    }
    
    if (Array.isArray(data)) {
      // Handle array of memories or search results
      return data.map(item => {
        if (typeof item === 'string') return item;
        if (item.content) return item.content;
        if (item.text) return item.text;
        if (item.body) return item.body;
        if (item.description) return item.description;
        return JSON.stringify(item);
      }).join('\n\n');
    }
    
    if (typeof data === 'object') {
      // Handle object responses
      if (data.content) return data.content;
      if (data.text) return data.text;
      if (data.answer) return data.answer;
      if (data.memories) return this.extractContent({ ...result, data: data.memories });
      if (data.results) return this.extractContent({ ...result, data: data.results });
      if (data.message) return data.message;
      return JSON.stringify(data, null, 2);
    }
    
    return String(data);
  }

  /**
   * Calculate relevance of result to query
   */
  private calculateRelevance(query: string, result: ExecutionResult): number {
    const content = this.extractContent(result).toLowerCase();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    if (queryTerms.length === 0) return 0.5;
    
    let matchCount = 0;
    for (const term of queryTerms) {
      if (content.includes(term)) {
        matchCount++;
      }
    }
    
    const termRelevance = matchCount / queryTerms.length;
    
    // Boost for specific sources
    let sourceBoost = 1.0;
    if (result.serverId === 'ai-ulu-memory') sourceBoost = 1.2; // Prefer memory
    if (result.cached) sourceBoost *= 0.9; // Slight penalty for cached
    
    // Boost for faster responses (more likely to be accurate/focused)
    const latencyBoost = result.latency < 500 ? 1.1 : result.latency < 1000 ? 1.0 : 0.9;
    
    return Math.min(termRelevance * sourceBoost * latencyBoost, 1.0);
  }

  /**
   * Deduplicate similar content using simple similarity
   */
  private deduplicateContent(
    sources: { result: ExecutionResult; content: string; relevance: number }[]
  ): typeof sources {
    const seen = new Set<string>();
    const deduped: typeof sources = [];
    
    for (const source of sources) {
      // Create fingerprint from first 100 chars
      const fingerprint = source.content.slice(0, 100).toLowerCase().replace(/\s+/g, ' ');
      
      // Check if too similar to existing
      let isDuplicate = false;
      for (const seenFp of seen) {
        if (this.similarity(fingerprint, seenFp) > 0.8) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        seen.add(fingerprint);
        deduped.push(source);
      }
    }
    
    return deduped;
  }

  /**
   * Simple string similarity (Jaccard-like)
   */
  private similarity(a: string, b: string): number {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    
    let intersection = 0;
    for (const word of setA) {
      if (setB.has(word)) intersection++;
    }
    
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Build synthesized answer
   */
  private buildAnswer(
    query: string,
    sources: { result: ExecutionResult; content: string; relevance: number }[]
  ): string {
    if (sources.length === 0) {
      return "Bu konuda bilgi bulunamadı.";
    }
    
    if (sources.length === 1) {
      return this.formatSingleSource(sources[0]);
    }
    
    // Multiple sources - create structured response
    const parts: string[] = [];
    
    // Add main answer from highest relevance source
    const primary = sources[0];
    parts.push(primary.content);
    
    // Add supplementary info from other sources
    if (sources.length > 1) {
      const supplementary = sources.slice(1, 3);
      
      if (supplementary.length > 0) {
        parts.push('\n\n**Ek Bilgiler:**');
        
        for (const source of supplementary) {
          // Only add if provides new info
          if (source.content.length > 50 && source.relevance > 0.3) {
            const excerpt = source.content.slice(0, 300);
            parts.push(`\n- *${source.result.serverName}:* ${excerpt}${source.content.length > 300 ? '...' : ''}`);
          }
        }
      }
    }
    
    return parts.join('');
  }

  /**
   * Format single source response
   */
  private formatSingleSource(source: { result: ExecutionResult; content: string; relevance: number }): string {
    let content = source.content;
    
    // Limit length
    if (content.length > 2000) {
      content = content.slice(0, 2000) + '...';
    }
    
    return content;
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    sources: { result: ExecutionResult; content: string; relevance: number }[]
  ): number {
    if (sources.length === 0) return 0;
    
    // Average relevance
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
    
    // Boost for multiple sources
    const sourceBoost = Math.min(sources.length / 3, 1);
    
    // Boost for memory being present
    const memoryBoost = sources.some(s => s.result.serverId === 'ai-ulu-memory') ? 1.1 : 1.0;
    
    return Math.min(avgRelevance * (1 + sourceBoost * 0.2) * memoryBoost, 0.95);
  }

  /**
   * Create empty response for no results
   */
  private createEmptyResponse(query: string): SynthesizedResponse {
    return {
      answer: `"${query}" için sonuç bulunamadı. Lütfen farklı bir şekilde sormayı deneyin.`,
      sources: [],
      confidence: 0,
      relevanceScores: {},
      metadata: {
        processingTime: 0,
        sourcesUsed: 0,
        tokensEstimate: 0,
      },
    };
  }

  /**
   * Merge memory context with external results
   */
  async mergeWithMemory(
    synthesized: SynthesizedResponse,
    memoryContext: any[]
  ): Promise<SynthesizedResponse> {
    if (!memoryContext || memoryContext.length === 0) {
      return synthesized;
    }
    
    // Prepend memory context
    const memorySection = memoryContext
      .slice(0, 3)
      .map(m => `- ${m.content}`)
      .join('\n');
    
    const enhancedAnswer = `**Hafızamdan:**\n${memorySection}\n\n**Güncel bilgi:**\n${synthesized.answer}`;
    
    return {
      ...synthesized,
      answer: enhancedAnswer,
      sources: [
        {
          serverId: 'ai-ulu-memory',
          serverName: 'StackMemory Hafızası',
          relevance: 1.0,
          excerpt: memorySection.slice(0, 200),
          timestamp: new Date(),
        },
        ...synthesized.sources,
      ],
      confidence: Math.min(synthesized.confidence * 1.1, 0.95),
    };
  }
}

// Singleton
export const synthesizer = new SynthesisEngine();

export default synthesizer;
