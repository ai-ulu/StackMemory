import type { Env } from '../core/env';
import { LOG_LEVEL, log } from '../core/logger';

export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
export const EMBEDDING_DIM = 768;

interface WorkersAIEmbeddingResult {
  data?: number[][];
}

interface VectorMatch {
  id: string;
  score: number;
}

export async function generateEmbedding(text: string, env: Env): Promise<number[] | null> {
  if (!env.AI) return null;

  try {
    const truncated = text.slice(0, 512);
    const result = await env.AI.run(EMBEDDING_MODEL, { text: [truncated] }) as WorkersAIEmbeddingResult;

    if (result?.data?.[0]) return result.data[0];

    return null;
  } catch (error) {
    log(LOG_LEVEL.ERROR, 'vectorize', 'Embedding generation failed', { error: String(error) });
    return null;
  }
}

export async function vectorUpsert(
  id: string,
  embedding: number[],
  metadata: Record<string, string>,
  env: Env,
): Promise<boolean> {
  if (!env.VECTORIZE) return false;

  try {
    await env.VECTORIZE.upsert([{ id, values: embedding, metadata }]);
    return true;
  } catch (error) {
    log(LOG_LEVEL.ERROR, 'vectorize', 'Upsert failed', { error: String(error) });
    return false;
  }
}

export async function vectorQuery(
  embedding: number[],
  topK: number,
  filter: Record<string, string>,
  env: Env,
): Promise<VectorMatch[]> {
  if (!env.VECTORIZE) return [];

  try {
    const results = await env.VECTORIZE.query(embedding, { topK, filter });
    return (results.matches || []).map(match => ({ id: match.id, score: match.score }));
  } catch (error) {
    log(LOG_LEVEL.ERROR, 'vectorize', 'Query failed', { error: String(error) });
    return [];
  }
}

export async function vectorDelete(ids: string[], env: Env): Promise<void> {
  if (!env.VECTORIZE) return;

  try {
    await env.VECTORIZE.deleteByIds(ids);
  } catch {
    // best-effort cleanup
  }
}
