/**
 * AI-ULU Client-Side Embedding
 * 
 * Browser-based vector generation using Transformers.js
 * Implements Client-Side Compute strategy from Blueprint v2.0
 * 
 * Benefits:
 * - Zero server embedding costs
 * - Lower latency
 * - Privacy (data never leaves browser for embedding)
 */

// Embedding model state
let embeddingPipeline: any = null;
let isLoading = false;
let loadError: Error | null = null;

// Model configuration
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'; // 384-dimensional embeddings
const EMBEDDING_DIM = 384;

/**
 * Check if client-side embedding is available
 */
export function isClientEmbeddingAvailable(): boolean {
  return typeof window !== 'undefined' && 'Worker' in window;
}

/**
 * Initialize the embedding pipeline
 * Lazy loads the model on first use
 */
export async function initEmbeddingPipeline(): Promise<boolean> {
  if (embeddingPipeline) return true;
  if (isLoading) {
    // Wait for existing load
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return embeddingPipeline !== null;
  }
  if (loadError) return false;

  isLoading = true;

  try {
    // Dynamic import to avoid SSR issues
    const { pipeline } = await import('@xenova/transformers');
    
    console.log('[ClientEmbed] Loading model:', MODEL_NAME);
    
    embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true, // Use quantized model for faster loading
    });
    
    console.log('[ClientEmbed] Model loaded successfully');
    isLoading = false;
    return true;
  } catch (error) {
    console.error('[ClientEmbed] Failed to load model:', error);
    loadError = error as Error;
    isLoading = false;
    return false;
  }
}

/**
 * Generate embedding for text using client-side model
 */
export async function generateClientEmbedding(text: string): Promise<number[] | null> {
  if (!isClientEmbeddingAvailable()) {
    console.warn('[ClientEmbed] Not available in this environment');
    return null;
  }

  try {
    const initialized = await initEmbeddingPipeline();
    if (!initialized || !embeddingPipeline) {
      console.warn('[ClientEmbed] Pipeline not initialized');
      return null;
    }

    // Truncate text if too long
    const truncatedText = text.slice(0, 512);
    
    // Generate embedding
    const output = await embeddingPipeline(truncatedText, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Convert to regular array
    const embedding = Array.from(output.data as Float32Array);
    
    return embedding;
  } catch (error) {
    console.error('[ClientEmbed] Embedding generation failed:', error);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateClientEmbeddingsBatch(
  texts: string[]
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = [];
  
  for (const text of texts) {
    const embedding = await generateClientEmbedding(text);
    results.push(embedding);
  }
  
  return results;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar items from a list
 */
export function findMostSimilar(
  queryEmbedding: number[],
  items: { id: string; embedding: number[] }[],
  topK: number = 5,
  minSimilarity: number = 0.5
): { id: string; similarity: number }[] {
  const scored = items
    .map(item => ({
      id: item.id,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .filter(item => item.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
  
  return scored;
}

/**
 * Get embedding dimension
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIM;
}

/**
 * Get model loading status
 */
export function getModelStatus(): {
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  modelName: string;
} {
  return {
    loaded: embeddingPipeline !== null,
    loading: isLoading,
    error: loadError,
    modelName: MODEL_NAME,
  };
}

/**
 * Preload the model (call early for better UX)
 */
export function preloadModel(): void {
  if (isClientEmbeddingAvailable() && !embeddingPipeline && !isLoading) {
    initEmbeddingPipeline().catch(console.error);
  }
}

/**
 * Hybrid embedding strategy
 * Uses client-side if available, falls back to server API
 */
export async function generateEmbeddingHybrid(
  text: string,
  preferClient: boolean = true
): Promise<{ embedding: number[] | null; source: 'client' | 'server' }> {
  // Try client-side first if preferred
  if (preferClient && isClientEmbeddingAvailable()) {
    const clientEmbedding = await generateClientEmbedding(text);
    if (clientEmbedding) {
      return { embedding: clientEmbedding, source: 'client' };
    }
  }
  
  // Fall back to server API
  try {
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return { embedding: data.embedding, source: 'server' };
    }
  } catch (error) {
    console.error('[Embed] Server fallback failed:', error);
  }
  
  return { embedding: null, source: 'server' };
}
