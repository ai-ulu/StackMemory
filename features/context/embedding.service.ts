import { OpenAI } from 'openai';

/**
 * Embedding Servisi
 * 
 * Metinleri vektöre çevirir.
 * OpenAI API kullanır (text-embedding-3-small).
 */

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });
};

/**
 * Metin için embedding üretir
 * @param text - Vektöre çevrilecek metin
 * @returns number[] - 1536 boyutlu vektör (text-embedding-3-small için)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const client = getOpenAIClient();
    
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

/**
 * Çoklu metin için batch embedding üretir
 * @param texts - Vektöre çevrilecek metin dizisi
 * @returns number[][] - Vektör dizisi
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][] | null> {
  try {
    const client = getOpenAIClient();
    
    // OpenAI batch limiti (genelde 2048, ama güvenli olması için 100'de bölüyoruz)
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
        dimensions: 1536,
      });

      allEmbeddings.push(...response.data.map(d => d.embedding));
    }

    return allEmbeddings;
  } catch (error) {
    console.error('Batch embedding generation failed:', error);
    return null;
  }
}
