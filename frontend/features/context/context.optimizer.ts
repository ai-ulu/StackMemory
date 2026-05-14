import type { Memory } from '@/features/memory/memory.types';

export type ContextStrategy = 'aggressive' | 'balanced' | 'quality';

export type ContextCompileInput = {
  agentId?: string;
  workspaceId?: string;
  userRequest: string;
  maxContextTokens?: number;
  strategy?: ContextStrategy;
  filters?: {
    tag?: string;
    type?: string;
    scope?: string;
    status?: string;
  };
};

export type CompiledContext = {
  context: string;
  selectedMemories: Memory[];
  omittedMemories: Memory[];
  metrics: {
    strategy: ContextStrategy;
    maxContextTokens: number;
    userRequestTokens: number;
    selectedMemoryCount: number;
    selectedMemoryTokens: number;
    omittedMemoryCount: number;
    omittedMemoryTokens: number;
    finalContextTokens: number;
    estimatedBaselineTokens: number;
    estimatedSavingsTokens: number;
    estimatedSavingsPercent: number;
  };
};

export function estimateTokens(text = ''): number {
  if (!text.trim()) return 0;
  return Math.ceil(text.length / 4);
}

function getMemoryScore(memory: Memory, strategy: ContextStrategy): number {
  const confidence = memory.confidence ?? 0.8;
  const accessBoost = Math.min(0.2, (memory.accessCount ?? 0) / 100);
  const freshnessPenalty = memory.status === 'deprecated' ? -1 : 0;
  const typeBoost = memory.type === 'decision' || memory.type === 'rule' ? 0.15 : memory.type === 'project' ? 0.1 : 0;
  const scopeBoost = memory.scope === 'private' ? 0.05 : 0;
  const decay = memory.decayFactor ?? 1;

  if (strategy === 'aggressive') {
    return confidence * 0.45 + decay * 0.35 + typeBoost + accessBoost + freshnessPenalty;
  }

  if (strategy === 'quality') {
    return confidence * 0.5 + decay * 0.2 + typeBoost + scopeBoost + accessBoost + freshnessPenalty;
  }

  return confidence * 0.45 + decay * 0.25 + typeBoost + scopeBoost + accessBoost + freshnessPenalty;
}

function getMemoryBudget(maxContextTokens: number, strategy: ContextStrategy): number {
  if (strategy === 'aggressive') return Math.floor(maxContextTokens * 0.35);
  if (strategy === 'quality') return Math.floor(maxContextTokens * 0.65);
  return Math.floor(maxContextTokens * 0.5);
}

function formatMemory(memory: Memory): string {
  const tags = memory.tags?.length ? ` tags=${memory.tags.join(',')}` : '';
  return `- [${memory.type}/${memory.scope}/conf:${Math.round(memory.confidence * 100)}%${tags}] ${memory.content}`;
}

export function compileContext(input: ContextCompileInput, memories: Memory[]): CompiledContext {
  const strategy = input.strategy ?? 'balanced';
  const maxContextTokens = input.maxContextTokens ?? 6000;
  const userRequestTokens = estimateTokens(input.userRequest);
  const memoryBudget = Math.max(0, getMemoryBudget(maxContextTokens, strategy));

  const candidateMemories = memories
    .filter((memory) => memory.status !== 'deprecated')
    .map((memory) => ({
      memory,
      score: getMemoryScore(memory, strategy),
      tokens: estimateTokens(formatMemory(memory)),
    }))
    .sort((a, b) => b.score - a.score);

  const selected: typeof candidateMemories = [];
  const omitted: typeof candidateMemories = [];
  let selectedMemoryTokens = 0;

  for (const candidate of candidateMemories) {
    if (selectedMemoryTokens + candidate.tokens <= memoryBudget) {
      selected.push(candidate);
      selectedMemoryTokens += candidate.tokens;
    } else {
      omitted.push(candidate);
    }
  }

  const stableBlock = [
    'You are connected to StackMemory context control plane.',
    'Use only the relevant memory facts below. Ignore deprecated or omitted memories.',
    `Strategy: ${strategy}. Max context tokens: ${maxContextTokens}.`,
  ].join('\n');

  const memoryBlock = selected.length
    ? selected.map((item) => formatMemory(item.memory)).join('\n')
    : '- No relevant memory selected within budget.';

  const context = [
    '<stable_system_context>',
    stableBlock,
    '</stable_system_context>',
    '<retrieved_memory_context>',
    memoryBlock,
    '</retrieved_memory_context>',
    '<current_request>',
    input.userRequest,
    '</current_request>',
  ].join('\n');

  const finalContextTokens = estimateTokens(context);
  const omittedMemoryTokens = omitted.reduce((sum, item) => sum + item.tokens, 0);
  const estimatedBaselineTokens = candidateMemories.reduce((sum, item) => sum + item.tokens, 0) + userRequestTokens;
  const estimatedSavingsTokens = Math.max(0, estimatedBaselineTokens - finalContextTokens);
  const estimatedSavingsPercent = estimatedBaselineTokens
    ? Math.round((estimatedSavingsTokens / estimatedBaselineTokens) * 100)
    : 0;

  return {
    context,
    selectedMemories: selected.map((item) => item.memory),
    omittedMemories: omitted.map((item) => item.memory),
    metrics: {
      strategy,
      maxContextTokens,
      userRequestTokens,
      selectedMemoryCount: selected.length,
      selectedMemoryTokens,
      omittedMemoryCount: omitted.length,
      omittedMemoryTokens,
      finalContextTokens,
      estimatedBaselineTokens,
      estimatedSavingsTokens,
      estimatedSavingsPercent,
    },
  };
}
