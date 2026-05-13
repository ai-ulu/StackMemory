import { mockMemories } from './memory.mock';
import type { CreateMemoryInput, Memory, MemoryListFilters, UpdateMemoryInput } from './memory.types';

export interface MemoryRepository {
  list(filters?: MemoryListFilters): Promise<Memory[]>;
  get(id: string): Promise<Memory | null>;
  create(input: CreateMemoryInput): Promise<Memory>;
  update(input: UpdateMemoryInput): Promise<Memory>;
  remove(id: string): Promise<{ id: string }>;
}

function matchesFilter(memory: Memory, filters?: MemoryListFilters): boolean {
  if (!filters) return true;

  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const haystack = `${memory.content} ${memory.type} ${memory.tags.join(' ')}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filters.type && filters.type !== 'all' && memory.type !== filters.type) return false;
  if (filters.status && filters.status !== 'all' && memory.status !== filters.status) return false;
  if (filters.scope && filters.scope !== 'all' && memory.scope !== filters.scope) return false;

  return true;
}

export class MockMemoryRepository implements MemoryRepository {
  private memories: Memory[] = [...mockMemories];

  async list(filters?: MemoryListFilters): Promise<Memory[]> {
    const limit = filters?.limit ?? 50;

    return this.memories
      .filter((memory) => matchesFilter(memory, filters))
      .slice(0, limit);
  }

  async get(id: string): Promise<Memory | null> {
    return this.memories.find((memory) => memory.id === id) ?? null;
  }

  async create(input: CreateMemoryInput): Promise<Memory> {
    const now = new Date().toISOString();
    const memory: Memory = {
      id: `mock-${crypto.randomUUID()}`,
      content: input.content,
      type: input.type,
      confidence: input.confidence ?? 0.8,
      status: 'active',
      scope: input.scope ?? 'private',
      tags: input.tags ?? [],
      accessCount: 0,
      decayFactor: 1,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    this.memories = [memory, ...this.memories];
    return memory;
  }

  async update(input: UpdateMemoryInput): Promise<Memory> {
    const index = this.memories.findIndex((memory) => memory.id === input.id);

    if (index === -1) {
      throw new Error(`Memory not found: ${input.id}`);
    }

    const current = this.memories[index];
    const updated: Memory = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    this.memories[index] = updated;
    return updated;
  }

  async remove(id: string): Promise<{ id: string }> {
    this.memories = this.memories.map((memory) =>
      memory.id === id
        ? { ...memory, status: 'deprecated', updatedAt: new Date().toISOString() }
        : memory
    );

    return { id };
  }
}

export const mockMemoryRepository = new MockMemoryRepository();
