export const mockAgents = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    category: 'coding',
    description: 'Pull project rules and session memory into coding runs.',
    setupHref: '/integrations?agent=claude-code',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'ide',
    description: 'Reuse decisions and preferences across IDE sessions.',
    setupHref: '/integrations?agent=cursor',
  },
  {
    id: 'codex-style-agent',
    name: 'Codex-style agent',
    category: 'coding',
    description: 'Give code agents stable project context before tasks.',
    setupHref: '/integrations?agent=codex-style-agent',
  },
  {
    id: 'replit',
    name: 'Replit',
    category: 'cloud-ide',
    description: 'Carry memory into cloud IDE workflows.',
    setupHref: '/integrations?agent=replit',
  },
  {
    id: 'builder-tools',
    name: 'Bolt / Lovable',
    category: 'builder',
    description: 'Reuse product requirements in builder tools.',
    setupHref: '/integrations?agent=builder-tools',
  },
  {
    id: 'custom-app-n8n',
    name: 'Custom App / n8n',
    category: 'automation',
    description: 'Embed StackMemory into your own automation stack.',
    setupHref: '/integrations?agent=custom-app-n8n',
  },
];

export function getAgentById(id) {
  return mockAgents.find((agent) => agent.id === id) || null;
}
