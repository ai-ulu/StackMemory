/**
 * MCP Hub - Base Connector
 * 
 * Base class for MCP server connectors.
 * Provides common functionality for all MCP integrations.
 */

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  latency: number;
}

export interface ConnectorConfig {
  id: string;
  name: string;
  enabled: boolean;
  timeout?: number;
  retries?: number;
  apiKey?: string;
  baseUrl?: string;
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected lastCallTime: number = 0;
  protected callCount: number = 0;

  constructor(config: ConnectorConfig) {
    this.config = {
      timeout: 10000,
      retries: 2,
      ...config,
    };
  }

  /**
   * Execute a query on this connector
   */
  abstract query(input: string): Promise<MCPResponse>;

  /**
   * Check if connector is available
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get connector capabilities
   */
  abstract getCapabilities(): string[];

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.retries || 2
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          await this.sleep(Math.pow(2, attempt) * 100);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Execute with timeout
   */
  protected async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number = this.config.timeout || 10000
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  }

  /**
   * Track call metrics
   */
  protected trackCall(): void {
    this.lastCallTime = Date.now();
    this.callCount++;
  }

  /**
   * Get connector stats
   */
  getStats(): { callCount: number; lastCallTime: number } {
    return {
      callCount: this.callCount,
      lastCallTime: this.lastCallTime,
    };
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if connector is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get connector ID
   */
  getId(): string {
    return this.config.id;
  }

  /**
   * Get connector name
   */
  getName(): string {
    return this.config.name;
  }
}

export default BaseConnector;
