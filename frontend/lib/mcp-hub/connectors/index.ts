/**
 * MCP Hub - Connectors Index
 * 
 * Export all available connectors.
 */

export { BaseConnector } from './base-connector';
export type { MCPResponse, ConnectorConfig } from './base-connector';

export { BraveSearchConnector } from './brave-search';
export { GitHubConnector } from './github';

// Connector factory
import { BaseConnector } from './base-connector';
import { BraveSearchConnector } from './brave-search';
import { GitHubConnector } from './github';

const connectorRegistry: Map<string, BaseConnector> = new Map();

/**
 * Get or create a connector instance
 */
export function getConnector(id: string): BaseConnector | undefined {
  if (connectorRegistry.has(id)) {
    return connectorRegistry.get(id);
  }

  let connector: BaseConnector | undefined;

  switch (id) {
    case 'brave-search':
      connector = new BraveSearchConnector();
      break;
    case 'github':
      connector = new GitHubConnector();
      break;
    // Add more connectors here
  }

  if (connector) {
    connectorRegistry.set(id, connector);
  }

  return connector;
}

/**
 * Get all available connectors
 */
export function getAllConnectors(): BaseConnector[] {
  // Initialize all connectors
  const connectorIds = ['brave-search', 'github'];
  
  return connectorIds
    .map(id => getConnector(id))
    .filter((c): c is BaseConnector => c !== undefined);
}

/**
 * Get enabled connectors
 */
export function getEnabledConnectors(): BaseConnector[] {
  return getAllConnectors().filter(c => c.isEnabled());
}

/**
 * Health check all connectors
 */
export async function healthCheckAll(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const connector of getAllConnectors()) {
    try {
      results[connector.getId()] = await connector.healthCheck();
    } catch {
      results[connector.getId()] = false;
    }
  }
  
  return results;
}

export default {
  getConnector,
  getAllConnectors,
  getEnabledConnectors,
  healthCheckAll,
};
