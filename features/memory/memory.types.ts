/**
 * Memory Types
 * 
 * Hafıza sistemi için tip tanımları.
 */

export type MemoryType = 
  | 'note'
  | 'decision'
  | 'preference'
  | 'fact'
  | 'goal'
  | 'task'
  | 'insight'
  | 'conversation';

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  type: MemoryType;
  tags?: string[];
  metadata?: Record<string, any>;
  importance?: number; // 0-10 arası önem skoru
  emotionalValence?: number; // -1 (negatif) ile +1 (pozitif) arası
  accessCount?: number; // Erişim sayısı (frequency)
  lastAccessedAt?: string; // ISO date
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  embedding?: number[]; // Vektör embedding
}

export interface CreateMemoryInput {
  content: string;
  type: MemoryType;
  tags?: string[];
  metadata?: Record<string, any>;
  importance?: number;
  emotionalValence?: number;
}

export interface UpdateMemoryInput {
  content?: string;
  type?: MemoryType;
  tags?: string[];
  metadata?: Record<string, any>;
  importance?: number;
  emotionalValence?: number;
}

export interface MemoryListOptions {
  limit?: number;
  offset?: number;
  type?: MemoryType;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'importance' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

export interface MemoryWithScore extends Memory {
  hScore: number;
}
