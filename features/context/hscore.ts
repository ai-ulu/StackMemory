// StackMemory H(x,ψ) Bağlam Motoru
// Quantum-Inspired Heuristic Scoring v2.1
// H(x,ψ,E) = α·S + β·D + γ·I + δ·F + ε·E

export interface HScoreWeights {
  alpha: number;   // similarity weight
  beta: number;    // decay weight
  gamma: number;   // importance weight
  delta: number;   // frequency weight
  epsilon: number; // emotional resonance weight
  lambda: number;  // decay rate
}

export interface Memory {
  type: string;
  created_at: string;
  last_accessed_at?: string | null;
  access_count?: number;
  confidence?: number;
  [key: string]: any;
}

export interface HScoreResult {
  H: number;
  decayFactor: number;
  importance: number;
  frequency: number;
  emotionalResonance: number;
}

const DEFAULT_WEIGHTS: HScoreWeights = {
  alpha: 0.35,
  beta: 0.15,
  gamma: 0.25,
  delta: 0.10,
  epsilon: 0.15,
  lambda: 0.02,
};

export function getWeightsFromEnv(): HScoreWeights {
  return {
    alpha: parseFloat(process.env.HSCORE_ALPHA || String(DEFAULT_WEIGHTS.alpha)),
    beta: parseFloat(process.env.HSCORE_BETA || String(DEFAULT_WEIGHTS.beta)),
    gamma: parseFloat(process.env.HSCORE_GAMMA || String(DEFAULT_WEIGHTS.gamma)),
    delta: parseFloat(process.env.HSCORE_DELTA || String(DEFAULT_WEIGHTS.delta)),
    epsilon: parseFloat(process.env.HSCORE_EPSILON || String(DEFAULT_WEIGHTS.epsilon)),
    lambda: parseFloat(process.env.HSCORE_DECAY_RATE || String(DEFAULT_WEIGHTS.lambda)),
  };
}

export function calculateHScore(
  memory: Memory,
  similarity: number,
  emotionalContext?: string | null
): HScoreResult {
  const weights = getWeightsFromEnv();
  const { alpha, beta, gamma, delta, epsilon, lambda } = weights;

  // Age decay (decoherence): D(x) = e^(-λ·Δt)
  const daysSinceAccess = memory.last_accessed_at
    ? (Date.now() - new Date(memory.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
    : (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
  
  const decayFactor = Math.exp(-lambda * daysSinceAccess);

  // Importance based on type
  const importanceMap: Record<string, number> = { identity: 1.0, preference: 0.7, fact: 0.4 };
  const importance = importanceMap[memory.type] || 0.4;

  // Frequency: F(x) = min(1, log(frequency) / log(F_max))
  const F_max = 100;
  const rawFrequency = memory.access_count || 1;
  const frequency = Math.min(1, Math.log(rawFrequency + 1) / Math.log(F_max));

  // Emotional Resonance: E(x, mood)
  let emotionalResonance = 0.5; // neutral default
  if (emotionalContext) {
    const moodTypeMap: Record<string, Record<string, number>> = {
      happy: { preference: 1.0, identity: 0.7, fact: 0.5 },
      stressed: { identity: 1.0, preference: 0.5, fact: 0.7 },
      focused: { fact: 1.0, identity: 0.6, preference: 0.4 },
      curious: { fact: 0.9, preference: 0.8, identity: 0.6 },
      nostalgic: { identity: 0.9, preference: 0.9, fact: 0.5 },
      neutral: { identity: 0.7, preference: 0.7, fact: 0.7 },
    };
    const moodMap = moodTypeMap[emotionalContext] || moodTypeMap.neutral;
    emotionalResonance = moodMap[memory.type] || 0.5;
  }

  // Calculate H score (lower is better for retrieval priority)
  const H = alpha * (1 - similarity)
          + beta * (1 - decayFactor)
          + gamma * (1 - importance)
          + delta * (1 - frequency)
          + epsilon * (1 - emotionalResonance);

  return { H, decayFactor, importance, frequency, emotionalResonance };
}

export function rankMemoriesByHScore(
  memories: Memory[],
  embedding: number[],
  emotionalContext?: string | null
): Memory[] {
  // Basit implementasyon - similarity hesaplama embedding service'den gelecek
  const scored = memories.map(mem => ({
    memory: mem,
    score: calculateHScore(mem, mem.confidence || 0.8, emotionalContext).H,
  }));
  
  return scored.sort((a, b) => a.score - b.score).map(item => item.memory);
}
