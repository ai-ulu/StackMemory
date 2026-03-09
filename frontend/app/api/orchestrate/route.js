import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppApiUrl } from '@/lib/app-url';

/**
 * MCP Orchestration API
 * 
 * Central endpoint for StackMemory Hub queries.
 * Routes queries to appropriate MCP servers and synthesizes results.
 * 
 * POST /api/orchestrate
 * Body: { query: string, options?: { ... } }
 * 
 * Returns: Synthesized response from multiple MCP sources
 */

// Note: In production, import from compiled TS
// import { mcpHub } from '@/lib/mcp-hub';

// Simplified hub implementation for JS compatibility
class SimpleHub {
  async query(query, options = {}) {
    const startTime = Date.now();
    const results = [];
    
    // Step 1: Always check local memory first
    try {
      const memoryResult = await this.queryMemory(query);
      if (memoryResult) {
        results.push({
          source: 'ai-ulu-memory',
          data: memoryResult,
          success: true,
        });
      }
    } catch (e) {
      console.error('Memory query failed:', e);
    }
    
    // Step 2: Determine if web search needed
    const needsWebSearch = this.needsExternalSearch(query);
    if (needsWebSearch && process.env.BRAVE_API_KEY) {
      try {
        const webResult = await this.searchWeb(query);
        if (webResult) {
          results.push({
            source: 'brave-search',
            data: webResult,
            success: true,
          });
        }
      } catch (e) {
        console.error('Web search failed:', e);
      }
    }
    
    // Step 3: Synthesize results
    const synthesized = this.synthesize(query, results);
    
    return {
      query,
      results,
      synthesized,
      totalTime: Date.now() - startTime,
      success: results.some(r => r.success),
    };
  }

  needsExternalSearch(query) {
    const externalKeywords = [
      'latest', 'news', 'current', '2024', '2025',
      'search', 'find', 'what is', 'who is',
      'how to', 'best practices', 'tutorial',
    ];
    const lowerQuery = query.toLowerCase();
    return externalKeywords.some(kw => lowerQuery.includes(kw));
  }

  async queryMemory(query) {
    // Query local StackMemory memory
    const response = await fetch(getAppApiUrl(null, `/api/memories/search?q=${encodeURIComponent(query)}&limit=5`), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) return null;
    return response.json();
  }

  async searchWeb(query) {
    if (!process.env.BRAVE_API_KEY) return null;
    
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_API_KEY,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.web?.results || [];
  }

  synthesize(query, results) {
    if (results.length === 0) {
      return {
        answer: 'Bu konuda bilgi bulunamadı.',
        confidence: 0,
        sources: [],
      };
    }
    
    const parts = [];
    const sources = [];
    
    // Add memory results first
    const memoryResult = results.find(r => r.source === 'ai-ulu-memory');
    if (memoryResult?.data?.memories?.length > 0) {
      parts.push('**Hafızamdan:**');
      memoryResult.data.memories.slice(0, 3).forEach(m => {
        parts.push(`- ${m.content}`);
      });
      sources.push({ name: 'StackMemory Hafızası', type: 'memory' });
    }
    
    // Add web results
    const webResult = results.find(r => r.source === 'brave-search');
    if (webResult?.data?.length > 0) {
      if (parts.length > 0) parts.push('\n**Web\'den:**');
      else parts.push('**Web\'den:**');
      
      webResult.data.slice(0, 3).forEach(r => {
        parts.push(`- ${r.title}: ${r.description?.slice(0, 200) || ''}`);
      });
      sources.push({ name: 'Web Search', type: 'web' });
    }
    
    return {
      answer: parts.join('\n'),
      confidence: results.length > 1 ? 0.8 : 0.6,
      sources,
    };
  }
}

const hub = new SimpleHub();

// POST - Query the orchestrator
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Optional auth - allow unauthenticated for public queries
    const userId = user?.id;
    
    const body = await request.json();
    const { query, options = {} } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }
    
    // Execute orchestrated query
    const result = await hub.query(query, {
      ...options,
      userId,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false,
    }, { status: 500 });
  }
}

// GET - Get orchestrator status and capabilities
export async function GET(request) {
  try {
    const capabilities = [
      { name: 'search_memories', source: 'ai-ulu-memory', enabled: true },
      { name: 'search_web', source: 'brave-search', enabled: !!process.env.BRAVE_API_KEY },
      { name: 'search_github', source: 'github', enabled: !!process.env.GITHUB_TOKEN },
      { name: 'query_notion', source: 'notion', enabled: !!process.env.NOTION_API_KEY },
    ];
    
    const enabledSources = capabilities.filter(c => c.enabled);
    
    return NextResponse.json({
      status: 'healthy',
      version: '1.0.0',
      capabilities,
      enabledSources: enabledSources.length,
      totalSources: capabilities.length,
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
