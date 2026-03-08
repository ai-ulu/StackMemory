/**
 * StackMemory A/B Testing Framework
 * 
 * Allows testing different H(x,ψ) weights and configurations
 * to optimize memory retrieval quality.
 */

// Default algorithm weights (v3.0 - Spec Aligned)
// Reference: StackMemory teknik blueprint - algoritmik detaylandırma
export const DEFAULT_WEIGHTS = {
  alpha: 0.40,  // similarity (spec: α=0.4)
  beta: 0.20,   // decay (spec: β=0.2)
  gamma: 0.30,  // importance (spec: γ=0.3)
  delta: 0.10,  // frequency (spec: δ=0.1)
  epsilon: 0.00 // emotional resonance (bonus - disabled by default for spec compliance)
};

// Active experiments
export const EXPERIMENTS = {
  // Experiment: Higher importance for identity memories
  'identity-boost': {
    name: 'Identity Memory Boost',
    description: 'Test if boosting identity memories improves user satisfaction',
    weights: { ...DEFAULT_WEIGHTS, gamma: 0.35, alpha: 0.25 },
    importanceMap: { identity: 1.0, preference: 0.6, fact: 0.3 },
    active: true,
    traffic: 0.2, // 20% of users
  },

  // Experiment: Emotional resonance (v2.x legacy feature)
  'emotional-heavy': {
    name: 'Emotional Resonance',
    description: 'Test emotional context influence (v2.x feature)',
    weights: { alpha: 0.30, beta: 0.15, gamma: 0.25, delta: 0.10, epsilon: 0.20 },
    active: true,
    traffic: 0.10,
  },

  // Experiment: Recency bias
  'recency-boost': {
    name: 'Recency Boost',
    description: 'Test if recent memories should be prioritized more',
    weights: { alpha: 0.35, beta: 0.30, gamma: 0.25, delta: 0.10, epsilon: 0.00 },
    active: true,
    traffic: 0.10,
  },

  // Control group (Spec Aligned v3.0)
  'control': {
    name: 'Control (Spec v3.0)',
    description: 'Default weights aligned with the StackMemory blueprint',
    weights: DEFAULT_WEIGHTS,
    active: true,
    traffic: 0.60,
  },
};

/**
 * Assign user to experiment group
 * Uses consistent hashing based on user ID
 */
export function assignExperiment(userId) {
  if (!userId) return 'control';

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Normalize to 0-1
  const normalizedHash = Math.abs(hash) / 2147483647;
  
  // Assign based on traffic allocation
  let cumulative = 0;
  for (const [expId, exp] of Object.entries(EXPERIMENTS)) {
    if (!exp.active) continue;
    cumulative += exp.traffic;
    if (normalizedHash < cumulative) {
      return expId;
    }
  }
  
  return 'control';
}

/**
 * Get experiment config for user
 */
export function getExperimentConfig(userId) {
  const experimentId = assignExperiment(userId);
  const experiment = EXPERIMENTS[experimentId] || EXPERIMENTS['control'];
  
  return {
    experimentId,
    experimentName: experiment.name,
    weights: experiment.weights,
    importanceMap: experiment.importanceMap || {
      identity: 1.0,
      preference: 0.7,
      fact: 0.4,
    },
  };
}

/**
 * Log experiment event for analysis
 */
export async function logExperimentEvent(supabase, userId, event, data) {
  try {
    const { experimentId } = getExperimentConfig(userId);
    
    await supabase.from('access_logs').insert({
      user_id: userId,
      resource_type: 'ab_experiment',
      action: event,
      metadata: {
        experiment_id: experimentId,
        experiment_name: EXPERIMENTS[experimentId]?.name,
        ...data,
      },
    });
  } catch (error) {
    console.error('Failed to log experiment event:', error);
  }
}

/**
 * Track memory retrieval quality
 */
export async function trackRetrievalQuality(supabase, userId, query, memories, userFeedback = null) {
  const config = getExperimentConfig(userId);
  
  await logExperimentEvent(supabase, userId, 'retrieval', {
    query_length: query.length,
    memories_count: memories.length,
    avg_similarity: memories.reduce((sum, m) => sum + (m.similarity || 0), 0) / (memories.length || 1),
    avg_h_score: memories.reduce((sum, m) => sum + (m.H || 0), 0) / (memories.length || 1),
    memory_types: memories.map(m => m.type),
    user_feedback: userFeedback,
    weights_used: config.weights,
  });
}

/**
 * Get experiment analytics
 */
export async function getExperimentAnalytics(supabase, experimentId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('access_logs')
    .select('metadata, created_at')
    .eq('resource_type', 'ab_experiment')
    .gte('created_at', startDate.toISOString())
    .contains('metadata', { experiment_id: experimentId });

  if (error || !data) return null;

  // Calculate metrics
  const metrics = {
    total_events: data.length,
    avg_memories_count: 0,
    avg_similarity: 0,
    avg_h_score: 0,
    positive_feedback: 0,
    negative_feedback: 0,
  };

  let retrievalCount = 0;
  
  for (const row of data) {
    const meta = row.metadata;
    if (meta.memories_count !== undefined) {
      metrics.avg_memories_count += meta.memories_count;
      metrics.avg_similarity += meta.avg_similarity || 0;
      metrics.avg_h_score += meta.avg_h_score || 0;
      retrievalCount++;
    }
    if (meta.user_feedback === 'positive') metrics.positive_feedback++;
    if (meta.user_feedback === 'negative') metrics.negative_feedback++;
  }

  if (retrievalCount > 0) {
    metrics.avg_memories_count /= retrievalCount;
    metrics.avg_similarity /= retrievalCount;
    metrics.avg_h_score /= retrievalCount;
  }

  return metrics;
}

/**
 * Calculate H score with experiment weights
 */
export function calculateHScoreWithExperiment(memory, similarity, emotionalContext, userId) {
  const config = getExperimentConfig(userId);
  const { alpha, beta, gamma, delta, epsilon } = config.weights;
  const importanceMap = config.importanceMap;

  // Decay
  const daysSinceAccess = memory.last_accessed_at 
    ? (Date.now() - new Date(memory.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
    : (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.exp(-0.02 * daysSinceAccess);

  // Importance
  const importance = importanceMap[memory.type] || 0.4;

  // Frequency
  const frequency = Math.min(1, Math.log((memory.access_count || 1) + 1) / Math.log(100));

  // Emotional resonance
  let emotionalResonance = 0.5;
  if (emotionalContext) {
    const moodTypeMap = {
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

  // Calculate H score
  const H = alpha * (1 - similarity) 
          + beta * (1 - decayFactor) 
          + gamma * (1 - importance) 
          + delta * (1 - frequency)
          + epsilon * (1 - emotionalResonance);

  return { 
    H, 
    decayFactor, 
    importance, 
    frequency, 
    emotionalResonance,
    experimentId: config.experimentId,
  };
}
