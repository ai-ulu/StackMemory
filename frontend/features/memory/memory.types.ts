export type MemoryType =
  | 'identity'
  | 'preference'
  | 'fact'
  | 'project'
  | 'rule'
  | 'decision'
  | 'task'
  | 'insight';

export type MemoryStatus = 'active' | 'pending' | 'deprecated';
export type MemoryScope = 'private' | 'team' | 'org';

export type Memory = {
  id: string;
  content: string;
  type: MemoryType;
  confidence: number;
  status: MemoryStatus;
  scope: MemoryScope;
  tags: string[];
  accessCount: number;
  decayFactor: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
};

export type MemoryListFilters = {
  query?: string;
  type?: MemoryType | 'all';
  status?: MemoryStatus | 'all';
  scope?: MemoryScope | 'all';
  tag?: string;
  limit?: number;
};

export type CreateMemoryInput = {
  content: string;
  type: MemoryType;
  confidence?: number;
  scope?: MemoryScope;
  tags?: string[];
};

export type UpdateMemoryInput = Partial<CreateMemoryInput> & {
  id: string;
  status?: MemoryStatus;
};

export type MemorySummary = {
  total: number;
  active: number;
  pending: number;
  deprecated: number;
  avgConfidence: number;
  byType: Record<MemoryType, number>;
};
