/**
 * MCP Hub - Brave Search Connector
 * 
 * Real integration with Brave Search API.
 */

import { BaseConnector, MCPResponse, ConnectorConfig } from './base-connector';

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
  news?: {
    results: BraveSearchResult[];
  };
}

export class BraveSearchConnector extends BaseConnector {
  private apiKey: string;

  constructor(config?: Partial<ConnectorConfig>) {
    super({
      id: 'brave-search',
      name: 'Brave Search',
      enabled: !!process.env.BRAVE_API_KEY,
      timeout: 8000,
      ...config,
    });
    this.apiKey = process.env.BRAVE_API_KEY || config?.apiKey || '';
  }

  async query(input: string): Promise<MCPResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Brave API key not configured',
        latency: 0,
      };
    }

    const startTime = Date.now();
    this.trackCall();

    try {
      const result = await this.executeWithTimeout(async () => {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(input)}&count=5`,
          {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': this.apiKey,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Brave API error: ${response.status}`);
        }

        return response.json() as Promise<BraveSearchResponse>;
      });

      const webResults = result.web?.results || [];
      
      return {
        success: true,
        data: webResults.map(r => ({
          title: r.title,
          url: r.url,
          description: r.description,
          age: r.age,
        })),
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        latency: Date.now() - startTime,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(
        'https://api.search.brave.com/res/v1/web/search?q=test&count=1',
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': this.apiKey,
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  getCapabilities(): string[] {
    return ['web_search', 'news_search', 'local_search'];
  }
}

export default BraveSearchConnector;
