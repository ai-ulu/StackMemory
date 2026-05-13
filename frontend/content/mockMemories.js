export const mockMemories = [
  {
    id: 'later-phase-work',
    type: 'rule',
    content: 'Keep MCP, billing and OAuth for later phases.',
    confidence: 0.92,
    importance: 0.88,
    decay: 0.12,
    source: 'Planning session',
  },
  {
    id: 'skeleton-before-polish',
    type: 'preference',
    content: 'Prefer product skeleton first, polish later.',
    confidence: 0.96,
    importance: 0.94,
    decay: 0.08,
    source: 'Product direction',
  },
  {
    id: 'shared-agent-memory',
    type: 'decision',
    content: 'Use StackMemory as a shared memory layer for LLM agents.',
    confidence: 0.95,
    importance: 0.98,
    decay: 0.04,
    source: 'Core positioning',
  },
  {
    id: 'build-product-screens',
    type: 'task',
    content: 'Build dashboard, memories, brain, agents and workflows screens.',
    confidence: 0.89,
    importance: 0.82,
    decay: 0.18,
    source: 'MVP roadmap',
  },
];

export function getMemoryById(id) {
  return mockMemories.find((memory) => memory.id === id) || null;
}

export function getContextPreviewMemories(limit = 3) {
  return [...mockMemories]
    .sort((a, b) => b.importance + b.confidence - (a.importance + a.confidence))
    .slice(0, limit);
}
