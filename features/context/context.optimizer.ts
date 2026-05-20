import { getWeightsFromEnv, calculateHScore, type HScoreWeights } from './hscore';
import { generateEmbedding } from './embedding.service';
import { memoryRepository } from '../memory/memory.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Memory } from '../memory/memory.types';
import { telemetry } from './context.telemetry';

export interface ContextCompileInput {
  userRequest: string;
  agentId: string;
  userId: string;
  maxTokens?: number;
  strategy?: 'recent' | 'relevant' | 'balanced';
  emotionalContext?: string;
}

export interface CompiledContext {
  messages: Array<{ role: string; content: string }>;
  metrics: {
    totalMemories: number;
    selectedMemories: number;
    estimatedBaselineTokens: number;
    finalContextTokens: number;
    estimatedSavingsTokens: number;
    savingsPercentage: number;
  };
  usedMemoryIds: string[];
}

/**
 * Faz 2 Core: H(x,ψ) Bağlam Motoru
 * 
 * Bu fonksiyon:
 * 1. Kullanıcı isteğini vektöre çevirir
 * 2. Tüm hafızaları çeker
 * 3. H-Score algoritması ile sıralar (Benzerlik + Zaman + Önem + Duygu)
 * 4. Token bütçesine göre en değerli hafızaları seçer
 * 5. Telemetri kaydını otomatik yapar (Token tasarrufu hesaplaması için)
 */
export async function compileContextWithHScore(
  input: ContextCompileInput,
  supabase: SupabaseClient
): Promise<CompiledContext> {
  const startTime = Date.now();
  
  // 1. Embedding üret
  const embedding = await generateEmbedding(input.userRequest);
  if (!embedding) {
    throw new Error('Embedding generation failed');
  }

  // 2. Tüm hafızaları çek (Limitli başlangıç, sonra optimize edilebilir)
  // Production'da bu sayfa sayfa yapılmalı veya RLS ile filtrelenmeli
  const allMemoriesResult = await memoryRepository.list(supabase, input.userId, { 
    limit: 500 // İlk faz için sabit limit
  });

  if (!allMemoriesResult.success || !allMemoriesResult.data) {
    throw new Error('Failed to fetch memories');
  }

  const allMemories = allMemoriesResult.data;

  // 3. H(x,ψ) ile sırala
  const weights = getWeightsFromEnv();
  const rankedMemories = rankMemoriesByHScore(
    allMemories,
    embedding,
    weights,
    input.emotionalContext
  );

  // 4. Token bütçesine göre kes
  const maxTokens = input.maxTokens || 6000;
  const selectedMemories: Memory[] = [];
  let currentTokens = 0;
  
  // Basit token tahmini (1 token ≈ 4 karakter ortalama)
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  for (const memory of rankedMemories) {
    const memoryTokens = estimateTokens(memory.content);
    
    if (currentTokens + memoryTokens <= maxTokens) {
      selectedMemories.push(memory);
      currentTokens += memoryTokens;
    } else {
      break; // Bütçe doldu
    }
  }

  // 5. Metrikleri hesapla
  const baselineTokens = allMemories.reduce((acc, m) => acc + estimateTokens(m.content), 0);
  const finalTokens = currentTokens;
  const savedTokens = Math.max(0, baselineTokens - finalTokens);
  const savingsPercentage = baselineTokens > 0 ? (savedTokens / baselineTokens) * 100 : 0;

  // 6. Context mesajlarını oluştur
  const contextMessages = selectedMemories.map(m => ({
    role: 'system' as const,
    content: `[MEMORY] (${m.type}) ${m.content}`
  }));

  const result: CompiledContext = {
    messages: contextMessages,
    metrics: {
      totalMemories: allMemories.length,
      selectedMemories: selectedMemories.length,
      estimatedBaselineTokens: baselineTokens,
      finalContextTokens: finalTokens,
      estimatedSavingsTokens: savedTokens,
      savingsPercentage: parseFloat(savingsPercentage.toFixed(2))
    },
    usedMemoryIds: selectedMemories.map(m => m.id)
  };

  // 7. Telemetri kaydı (Faz 2 gereksinimi)
  try {
    await telemetry.recordContextBuild({
      userId: input.userId,
      agentId: input.agentId,
      inputTokens: baselineTokens,
      finalContextTokens: finalTokens,
      savedTokens: savedTokens,
      strategy: input.strategy || 'relevant',
      durationMs: Date.now() - startTime,
      memoryCount: selectedMemories.length
    }, supabase);
  } catch (error) {
    console.error('Telemetry recording failed:', error);
    // Telemetri hatası ana akışı bozmamalı
  }

  return result;
}

/**
 * Hafızaları H-Score'a göre sıralar (Yüksekten düşüğe)
 */
function rankMemoriesByHScore(
  memories: Memory[],
  queryEmbedding: number[],
  weights: HScoreWeights,
  emotionalContext?: string
): Memory[] {
  const scoredMemories = memories.map(memory => {
    // Vektör benzerliğini hesapla (Basit kosinüs benzerliği simülasyonu)
    // Gerçek implementasyonda Supabase pgvector kullanılır
    const similarity = calculateCosineSimilarity(queryEmbedding, memory.embedding);
    
    const hScore = calculateHScore(memory, similarity, emotionalContext, weights);
    
    return { ...memory, hScore };
  });

  // H-Score'a göre azalan sırala
  return scoredMemories.sort((a, b) => b.hScore - a.hScore);
}

/**
 * Basit Kosinüs Benzerliği Hesaplama
 * Not: Production'da Supabase pgvector operatörleri kullanılmalıdır.
 * Bu fonksiyon sadece yerel hesaplama için geçici çözümdür.
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
