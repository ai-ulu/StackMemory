/**
 * MCP Hub - GitHub Connector
 * 
 * Real integration with GitHub API.
 */

import { BaseConnector, MCPResponse, ConnectorConfig } from './base-connector';

interface GitHubSearchResult {
  name: string;
  path: string;
  repository: {
    full_name: string;
    html_url: string;
  };
  html_url: string;
  sha: string;
}

export class GitHubConnector extends BaseConnector {
  private token: string;

  constructor(config?: Partial<ConnectorConfig>) {
    super({
      id: 'github',
      name: 'GitHub',
      enabled: !!process.env.GITHUB_TOKEN,
      timeout: 10000,
      ...config,
    });
    this.token = process.env.GITHUB_TOKEN || config?.apiKey || '';
  }

  async query(input: string): Promise<MCPResponse> {
    if (!this.token) {
      return {
        success: false,
        error: 'GitHub token not configured',
        latency: 0,
      };
    }

    const startTime = Date.now();
    this.trackCall();

    try {
      // Detect query type
      const queryType = this.detectQueryType(input);
      
      let result;
      switch (queryType) {
        case 'code':
          result = await this.searchCode(input);
          break;
        case 'repo':
          result = await this.searchRepos(input);
          break;
        case 'issues':
          result = await this.searchIssues(input);
          break;
        default:
          result = await this.searchCode(input);
      }

      return {
        success: true,
        data: result,
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

  private detectQueryType(input: string): 'code' | 'repo' | 'issues' {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('issue') || lowerInput.includes('bug')) {
      return 'issues';
    }
    if (lowerInput.includes('repo') || lowerInput.includes('repository')) {
      return 'repo';
    }
    return 'code';
  }

  private async searchCode(query: string): Promise<any[]> {
    const response = await fetch(
      `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.items || []).map((item: GitHubSearchResult) => ({
      name: item.name,
      path: item.path,
      repo: item.repository.full_name,
      url: item.html_url,
    }));
  }

  private async searchRepos(query: string): Promise<any[]> {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      name: item.full_name,
      description: item.description,
      url: item.html_url,
      stars: item.stargazers_count,
      language: item.language,
    }));
  }

  private async searchIssues(query: string): Promise<any[]> {
    const response = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      title: item.title,
      state: item.state,
      url: item.html_url,
      repo: item.repository_url.split('/').slice(-2).join('/'),
    }));
  }

  async healthCheck(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.token}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getCapabilities(): string[] {
    return ['code_search', 'repo_search', 'issue_search', 'file_read'];
  }
}

export default GitHubConnector;
