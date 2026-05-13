import type { Memory } from '@/features/memory/memory.types';

export type MemoryGraphNode = {
  id: string;
  label: string;
  type: string;
  confidence: number;
  status: string;
};

export type MemoryGraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
};

export type MemoryGraph = {
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
  source: 'persisted' | 'inferred';
};

function getSharedTags(a: Memory, b: Memory): string[] {
  const aTags = new Set(a.tags || []);
  return (b.tags || []).filter((tag) => aTags.has(tag));
}

export function buildMemoryNodes(memories: Memory[]): MemoryGraphNode[] {
  return memories.map((memory) => ({
    id: memory.id,
    label: memory.content.length > 80 ? `${memory.content.slice(0, 80)}...` : memory.content,
    type: memory.type,
    confidence: memory.confidence,
    status: memory.status,
  }));
}

export function inferMemoryEdges(memories: Memory[]): MemoryGraphEdge[] {
  const edges: MemoryGraphEdge[] = [];

  for (let i = 0; i < memories.length; i += 1) {
    for (let j = i + 1; j < memories.length; j += 1) {
      const a = memories[i];
      const b = memories[j];
      const sharedTags = getSharedTags(a, b);
      const sameType = a.type === b.type;
      const sameScope = a.scope === b.scope;

      if (!sharedTags.length && !sameType) continue;

      edges.push({
        id: `${a.id}-${b.id}`,
        source: a.id,
        target: b.id,
        label: sharedTags.length ? sharedTags.join(', ') : sameType ? `same type: ${a.type}` : sameScope ? `same scope: ${a.scope}` : 'related',
        weight: Math.min(1, sharedTags.length * 0.25 + (sameType ? 0.3 : 0) + (sameScope ? 0.1 : 0)),
      });
    }
  }

  return edges.slice(0, 80);
}

export function buildMemoryGraph(memories: Memory[], persistedEdges: MemoryGraphEdge[] = []): MemoryGraph {
  const nodes = buildMemoryNodes(memories);

  if (persistedEdges.length) {
    return { nodes, edges: persistedEdges.slice(0, 200), source: 'persisted' };
  }

  return { nodes, edges: inferMemoryEdges(memories), source: 'inferred' };
}
