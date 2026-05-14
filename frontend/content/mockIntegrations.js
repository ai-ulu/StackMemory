export const mockIntegrations = [
  {
    id: 'mcp',
    name: 'MCP',
    description: 'Connect compatible agent clients to shared memory.',
    docsHref: '/docs?section=mcp',
    status: 'core',
  },
  {
    id: 'rest-api',
    name: 'REST API',
    description: 'Write, search and query memories from custom apps.',
    docsHref: '/docs?section=api',
    status: 'builder',
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Use StackMemory inside automation workflows.',
    docsHref: '/docs?section=n8n',
    status: 'planned',
  },
  {
    id: 'sdk',
    name: 'SDK',
    description: 'Embed durable memory into developer tools and internal copilots.',
    docsHref: '/docs?section=sdk',
    status: 'builder',
  },
];

export function getIntegrationById(id) {
  return mockIntegrations.find((integration) => integration.id === id) || null;
}
