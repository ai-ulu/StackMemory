// Memory Types and Classifications
export const MEMORY_TYPES = {
  IDENTITY: 'identity',
  PREFERENCE: 'preference',
  FACT: 'fact',
  PROJECT: 'project',
  RULE: 'rule',
  DECISION: 'decision',
  TASK: 'task',
} as const;

export const MEMORY_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DEPRECATED: 'deprecated',
} as const;

export const TRUTH_TYPES = {
  USER_CLAIM: 'user_claim',
  VERIFIED: 'verified',
  SYSTEM_INFERRED: 'system_inferred',
} as const;

export const MEMORY_SCOPE = {
  GLOBAL: 'global',
  SESSION: 'session',
  TEMP: 'temp',
} as const;

// Namespace for project isolation (aligned with MCP server v2.1)
export const MEMORY_NAMESPACE = {
  GLOBAL: 'global',
} as const;

export const CLASSIFICATION = {
  MEMORY_CANDIDATE: 'memory_candidate',
  NORMAL: 'normal',
  GARBAGE: 'garbage',
} as const;

// Memory Interface
export interface Memory {
  id: string;
  user_id: string;
  content: string;
  type: typeof MEMORY_TYPES[keyof typeof MEMORY_TYPES];
  confidence: number; // 0.0 - 1.0
  status: typeof MEMORY_STATUS[keyof typeof MEMORY_STATUS];
  truth_type: typeof TRUTH_TYPES[keyof typeof TRUTH_TYPES];
  scope: typeof MEMORY_SCOPE[keyof typeof MEMORY_SCOPE];
  namespace?: string;          // Project isolation (MCP v2.1)
  importance_score?: number;   // 0.0-1.0, memory decay weight (MCP v2.1)
  last_accessed?: string;      // ISO timestamp of last retrieval (MCP v2.1)
  access_count?: number;       // How many times retrieved (MCP v2.1)
  embedding?: number[];
  created_at: string;
  updated_at: string;
  is_shadow?: boolean; // Deleted but retained
}

// Memory Search Result
export interface MemoryMatch {
  id: string;
  content: string;
  similarity: number;
  confidence: number;
  type: string;
  influence_percentage?: number;
}

// Response Source Tracking
export interface ResponseSource {
  source: 'memory' | 'api' | 'mixed';
  memory_used: boolean;
  memory_ids: string[];
  memory_influences: {
    id: string;
    content: string;
    influence_percentage: number;
  }[];
}

// Memory Settings
export interface MemorySettings {
  enabled: boolean;
  privacy_mode: boolean; // Stealth mode - no read, no write
  auto_save: boolean;
  show_resonance: boolean; // Show which memories influenced response
}

// Classify message for memory storage
export function classifyMessage(content: string): typeof CLASSIFICATION[keyof typeof CLASSIFICATION] {
  const lowerContent = content.toLowerCase();
  
  // Garbage patterns
  const garbagePatterns = [
    /^(ok|tamam|evet|hayır|yes|no|hi|merhaba|selam)$/i,
    /^.{1,5}$/,
    /^(test|deneme|asdf|qwer)/i,
  ];
  
  if (garbagePatterns.some(p => p.test(content.trim()))) {
    return CLASSIFICATION.GARBAGE;
  }
  
  // Memory candidate patterns (identity, preferences, facts)
  const memoryCandidatePatterns = [
    /benim.*adım|my name is|i am called/i,
    /seviyorum|severim|tercih.*ederim|like|love|prefer/i,
    /çalışıyorum|work.*at|job.*is/i,
    /yaşıyorum|live.*in|from/i,
    /favori|favorite|en çok/i,
    /her zaman|always|usually|genellikle/i,
    /unutma|remember|hatırla/i,
  ];
  
  if (memoryCandidatePatterns.some(p => p.test(content))) {
    return CLASSIFICATION.MEMORY_CANDIDATE;
  }
  
  return CLASSIFICATION.NORMAL;
}

// Detect memory type from content
export function detectMemoryType(content: string): typeof MEMORY_TYPES[keyof typeof MEMORY_TYPES] {
  const lowerContent = content.toLowerCase();
  
  if (/project|repo|codebase|stack|architecture|tech stack|workflow|workspace/i.test(lowerContent)) {
    return MEMORY_TYPES.PROJECT;
  }
  
  if (/must|always|never|should|follow|rule|constraint|convention|standard/i.test(lowerContent)) {
    return MEMORY_TYPES.RULE;
  }
  
  if (/decided|decision|tradeoff|chosen|we will|we chose|karar/i.test(lowerContent)) {
    return MEMORY_TYPES.DECISION;
  }
  
  if (/todo|next step|next task|in progress|blocked/i.test(lowerContent)) {
    return MEMORY_TYPES.TASK;
  }
  
  // Identity patterns
  if (/adım|ismim|name|ben.*bir|i am a|profession|meslek/i.test(content)) {
    return MEMORY_TYPES.IDENTITY;
  }
  
  // Preference patterns
  if (/sev|tercih|favorite|like|love|hate|prefer|beğen/i.test(content)) {
    return MEMORY_TYPES.PREFERENCE;
  }
  
  // Default to fact
  return MEMORY_TYPES.FACT;
}

// Calculate final memory score for retrieval
export function calculateMemoryScore(
  semanticSimilarity: number,
  confidence: number,
  recency: number // 0-1, where 1 is most recent
): number {
  return semanticSimilarity * confidence * recency;
}

// Calculate recency score (exponential decay)
export function calculateRecencyScore(createdAt: string, halfLifeDays: number = 30): number {
  const now = new Date();
  const created = new Date(createdAt);
  const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-daysDiff / halfLifeDays);
}

// Check for contradictions
export function checkContradiction(
  newContent: string,
  existingMemories: Memory[]
): { hasContradiction: boolean; conflictingMemory?: Memory } {
  // Simple contradiction detection based on negation patterns
  const negationPairs = [
    ['seviyorum', 'sevmiyorum'],
    ['like', 'don\'t like'],
    ['love', 'hate'],
    ['prefer', 'avoid'],
    ['always', 'never'],
    ['evet', 'hayır'],
  ];
  
  const lowerNew = newContent.toLowerCase();
  
  for (const memory of existingMemories) {
    const lowerExisting = memory.content.toLowerCase();
    
    for (const [pos, neg] of negationPairs) {
      if (
        (lowerNew.includes(pos) && lowerExisting.includes(neg)) ||
        (lowerNew.includes(neg) && lowerExisting.includes(pos))
      ) {
        // Check if they're about the same topic
        const newWords = new Set(lowerNew.split(/\s+/));
        const existingWords = new Set(lowerExisting.split(/\s+/));
        const intersection = [...newWords].filter(w => existingWords.has(w) && w.length > 3);
        
        if (intersection.length >= 2) {
          return { hasContradiction: true, conflictingMemory: memory };
        }
      }
    }
  }
  
  return { hasContradiction: false };
}
