import type { CreateMemoryInput, MemoryListFilters, MemorySummary, MemoryType, UpdateMemoryInput } from './memory.types';
import { mockMemoryRepository, type MemoryRepository } from './memory.repository';

const memoryTypes: MemoryType[] = [
  'identity',
  'preference',
  'fact',
  'project',
  'rule',
  'decision',
  'task',
  'insight',
];

export class MemoryService {
  constructor(private readonly repository: MemoryRepository) {}

  async listMemories(filters?: MemoryListFilters) {
    return this.repository.list(filters);
  }

  async getMemory(id: string) {
    return this.repository.get(id);
  }

  async createMemory(input: CreateMemoryInput) {
    if (!input.content.trim()) {
      throw new Error('Memory content is required.');
    }

    return this.repository.create({
      ...input,
      content: input.content.trim(),
      confidence: input.confidence ?? 0.8,
      scope: input.scope ?? 'private',
      tags: input.tags ?? [],
    });
  }

  async updateMemory(input: UpdateMemoryInput) {
    return this.repository.update(input);
  }

  async deprecateMemory(id: string) {
    return this.repository.remove(id);
  }

  async getSummary(filters?: MemoryListFilters): Promise<MemorySummary> {
    const memories = await this.repository.list({ ...filters, limit: 500 });
    const byType = memoryTypes.reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<MemoryType, number>);

    for (const memory of memories) {
      byType[memory.type] += 1;
    }

    const total = memories.length;
    const confidenceTotal = memories.reduce((sum, memory) => sum + memory.confidence, 0);

    return {
      total,
      active: memories.filter((memory) => memory.status === 'active').length,
      pending: memories.filter((memory) => memory.status === 'pending').length,
      deprecated: memories.filter((memory) => memory.status === 'deprecated').length,
      avgConfidence: total ? confidenceTotal / total : 0,
      byType,
    };
  }
}

export const memoryService = new MemoryService(mockMemoryRepository);
