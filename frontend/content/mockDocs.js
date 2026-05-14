export const setupDocs = {
  mcp: {
    title: 'MCP setup',
    description: 'Connect compatible MCP clients to shared StackMemory context.',
    steps: ['Create a StackMemory workspace', 'Generate an MCP endpoint or token', 'Register the server in your client', 'Test memory search and context preview'],
  },
  api: {
    title: 'REST API setup',
    description: 'Use HTTP endpoints to write, search and retrieve memory context from custom apps.',
    steps: ['Create an API key', 'Write a memory record', 'Search memories by query and namespace', 'Send selected context to your agent'],
  },
  n8n: {
    title: 'n8n setup',
    description: 'Use StackMemory in automation workflows for durable agent memory.',
    steps: ['Create a webhook workflow', 'Add memory write step', 'Add memory search step', 'Pass retrieved context into an AI node'],
  },
  sdk: {
    title: 'SDK setup',
    description: 'Embed durable memory into developer tools, internal copilots and product backends.',
    steps: ['Install the SDK', 'Initialize workspace context', 'Write memories during user workflows', 'Compile context before agent calls'],
  },
};

export const quickStartGuides = [
  ['1. Create workspace', 'Set a default namespace and choose your primary workflow.', '/settings'],
  ['2. Add memories', 'Store project rules, preferences, decisions and active tasks.', '/memories'],
  ['3. Preview context', 'Use Brain to see which memories would be sent to an agent.', '/brain'],
  ['4. Connect tools', 'Use integrations to wire MCP, API, n8n or SDK surfaces.', '/integrations'],
];

export function getSetupDoc(section) {
  return setupDocs[section] || setupDocs.mcp;
}
