import { createClient } from '@/lib/supabase/client';
import {
  Memory,
  MemoryMatch,
  MemorySettings,
  MEMORY_STATUS,
  MEMORY_SCOPE,
  TRUTH_TYPES,
  classifyMessage,
  detectMemoryType,
  calculateRecencyScore,
  checkContradiction,
  CLASSIFICATION,
} from './types';

const DEFAULT_SETTINGS: MemorySettings = {
  enabled: true,
  privacy_mode: false,
  auto_save: true,
  show_resonance: true,
};

// Get memory settings from localStorage
export function getMemorySettings(): MemorySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem('ai-ulu-memory-settings');
  return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
}

// Save memory settings to localStorage
export function setMemorySettings(settings: Partial<MemorySettings>): void {
  if (typeof window === 'undefined') return;
  const current = getMemorySettings();
  const updated = { ...current, ...settings };
  localStorage.setItem('ai-ulu-memory-settings', JSON.stringify(updated));
}

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.embedding;
  } catch {
    return null;
  }
}

// Store a memory
export async function storeMemory(
  userId: string,
  content: string,
  embedding: number[] | null,
  options: {
    confidence?: number;
    scope?: string;
    truthType?: string;
  } = {}
): Promise<Memory | null> {
  const settings = getMemorySettings();
  
  // Privacy mode check
  if (settings.privacy_mode) {
    console.log('[Memory] Privacy mode active - no write');
    return null;
  }
  
  // Classify message
  const classification = classifyMessage(content);
  if (classification !== CLASSIFICATION.MEMORY_CANDIDATE) {
    console.log('[Memory] Not a memory candidate:', classification);
    return null;
  }
  
  const supabase = createClient();
  
  // Check for contradictions
  const { data: existingMemories } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('status', MEMORY_STATUS.ACTIVE)
    .limit(50);
  
  if (existingMemories) {
    const contradiction = checkContradiction(content, existingMemories as Memory[]);
    if (contradiction.hasContradiction) {
      console.log('[Memory] Contradiction detected with:', contradiction.conflictingMemory?.content);
      // Mark as pending instead of overwriting
      const { data, error } = await supabase
        .from('memories')
        .insert({
          user_id: userId,
          content,
          type: detectMemoryType(content),
          confidence: options.confidence ?? 0.7,
          status: MEMORY_STATUS.PENDING, // Pending due to contradiction
          truth_type: options.truthType ?? TRUTH_TYPES.USER_CLAIM,
          scope: options.scope ?? MEMORY_SCOPE.GLOBAL,
          embedding,
          conflict_with: contradiction.conflictingMemory?.id,
        })
        .select()
        .single();
      
      return data as Memory;
    }
  }
  
  // Store memory
  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      content,
      type: detectMemoryType(content),
      confidence: options.confidence ?? 0.8,
      status: MEMORY_STATUS.ACTIVE,
      truth_type: options.truthType ?? TRUTH_TYPES.USER_CLAIM,
      scope: options.scope ?? MEMORY_SCOPE.GLOBAL,
      embedding,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[Memory] Store error:', error);
    return null;
  }
  
  return data as Memory;
}

// Search memories by semantic similarity
export async function searchMemories(
  userId: string,
  queryEmbedding: number[],
  limit: number = 5,
  minConfidence: number = 0.5
): Promise<MemoryMatch[]> {
  const settings = getMemorySettings();
  
  // Privacy mode check
  if (settings.privacy_mode) {
    console.log('[Memory] Privacy mode active - no read');
    return [];
  }
  
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit * 2, // Get more, then filter by confidence
    user_id_filter: userId,
  });
  
  if (error || !data) {
    console.error('[Memory] Search error:', error);
    return [];
  }
  
  // Filter by confidence and calculate final scores
  const results: MemoryMatch[] = data
    .filter((m: any) => m.confidence >= minConfidence)
    .map((m: any) => {
      const recency = calculateRecencyScore(m.created_at);
      const finalScore = m.similarity * m.confidence * recency;
      return {
        id: m.id,
        content: m.content,
        similarity: m.similarity,
        confidence: m.confidence,
        type: m.type,
        influence_percentage: Math.round(finalScore * 100),
      };
    })
    .sort((a: MemoryMatch, b: MemoryMatch) => 
      (b.influence_percentage || 0) - (a.influence_percentage || 0)
    )
    .slice(0, limit);
  
  return results;
}

// Get all user memories
export async function getUserMemories(
  userId: string,
  includeDeprecated: boolean = false
): Promise<Memory[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_shadow', false);
  
  if (!includeDeprecated) {
    query = query.neq('status', MEMORY_STATUS.DEPRECATED);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('[Memory] Get memories error:', error);
    return [];
  }
  
  return data as Memory[];
}

// Delete memory (move to shadow)
export async function deleteMemory(memoryId: string): Promise<boolean> {
  const supabase = createClient();
  
  // Shadow delete - mark as shadow instead of hard delete
  const { error } = await supabase
    .from('memories')
    .update({ 
      is_shadow: true,
      status: MEMORY_STATUS.DEPRECATED,
    })
    .eq('id', memoryId);
  
  return !error;
}

// Update memory status
export async function updateMemoryStatus(
  memoryId: string,
  status: typeof MEMORY_STATUS[keyof typeof MEMORY_STATUS]
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('memories')
    .update({ status })
    .eq('id', memoryId);
  
  return !error;
}

// Update memory confidence
export async function updateMemoryConfidence(
  memoryId: string,
  confidence: number
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('memories')
    .update({ confidence: Math.max(0, Math.min(1, confidence)) })
    .eq('id', memoryId);
  
  return !error;
}