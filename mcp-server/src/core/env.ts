export interface Env {
  DB: D1Database;
  AI?: {
    run(model: string, input: unknown): Promise<unknown>;
  };
  VECTORIZE?: {
    upsert(items: Array<{ id: string; values: number[]; metadata?: Record<string, string> }>): Promise<unknown>;
    query(values: number[], options: { topK: number; filter?: Record<string, string> }): Promise<{ matches?: Array<{ id: string; score: number }> }>;
    deleteByIds(ids: string[]): Promise<unknown>;
  };
}
