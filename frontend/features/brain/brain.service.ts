import type { Memory, MemorySummary, MemoryType } from '@/features/memory/memory.types';

export type BrainSignal = {
  label: string;
  value: number;
  description: string;
};

export type BrainRisk = {
  level: 'low' | 'medium' | 'high';
  title: string;
  description: string;
};

export type BrainStatus = {
  healthScore: number;
  cognitiveLoad: number;
  freshnessScore: number;
  confidenceScore: number;
  signals: BrainSignal[];
  risks: BrainRisk[];
  dominantTypes: Array<{ type: MemoryType; count: number }>;
};

export type DecisionSimulation = {
  decision: string;
  score: number;
  supportingMemories: Memory[];
  risks: BrainRisk[];
  recommendation: string;
};

export function buildBrainStatus(memories: Memory[], summary: MemorySummary): BrainStatus {
  const now = Date.now();
  const activeRatio = summary.total ? summary.active / summary.total : 0;
  const freshnessScore = summary.total
    ? memories.reduce((sum, memory) => {
        const updated = new Date(memory.updatedAt).getTime();
        const ageDays = Math.max(0, (now - updated) / 86_400_000);
        return sum + Math.max(0, 1 - ageDays / 30);
      }, 0) / summary.total
    : 0;
  const confidenceScore = summary.avgConfidence || 0;
  const cognitiveLoad = Math.min(1, summary.total / 100);
  const healthScore = Math.round(((activeRatio * 0.35) + (freshnessScore * 0.3) + (confidenceScore * 0.35)) * 100);

  const dominantTypes = Object.entries(summary.byType)
    .map(([type, count]) => ({ type: type as MemoryType, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const risks: BrainRisk[] = [];

  if (summary.total < 10) {
    risks.push({
      level: 'medium',
      title: 'Low memory density',
      description: 'The brain layer needs more project rules, decisions and insights before strategic simulation becomes reliable.',
    });
  }

  if (summary.deprecated > summary.active) {
    risks.push({
      level: 'high',
      title: 'Deprecated memory overload',
      description: 'Deprecated memories outnumber active memories. Consolidation should run before heavy agent usage.',
    });
  }

  if (confidenceScore < 0.65) {
    risks.push({
      level: 'medium',
      title: 'Confidence is weak',
      description: 'Average confidence is below the recommended threshold for autonomous agent recall.',
    });
  }

  return {
    healthScore,
    cognitiveLoad: Math.round(cognitiveLoad * 100),
    freshnessScore: Math.round(freshnessScore * 100),
    confidenceScore: Math.round(confidenceScore * 100),
    signals: [
      { label: 'Active memory ratio', value: Math.round(activeRatio * 100), description: 'How much of the stored memory is currently usable.' },
      { label: 'Freshness', value: Math.round(freshnessScore * 100), description: 'How recently the memory layer has been updated.' },
      { label: 'Confidence', value: Math.round(confidenceScore * 100), description: 'Average reliability score across the current workspace.' },
      { label: 'Cognitive load', value: Math.round(cognitiveLoad * 100), description: 'How dense the working memory set is for this workspace.' },
    ],
    risks,
    dominantTypes,
  };
}

export function simulateDecision(decision: string, memories: Memory[]): DecisionSimulation {
  const query = decision.toLowerCase();
  const keywords = query.split(/\s+/).filter((word) => word.length > 3);
  const supportingMemories = memories
    .map((memory) => {
      const haystack = `${memory.content} ${memory.type} ${memory.tags.join(' ')}`.toLowerCase();
      const hits = keywords.filter((keyword) => haystack.includes(keyword)).length;
      return { memory, score: hits + memory.confidence };
    })
    .filter((item) => item.score > 0.7)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.memory);

  const supportScore = supportingMemories.length ? Math.min(100, Math.round((supportingMemories.length / 5) * 70 + 20)) : 35;
  const risks: BrainRisk[] = [];

  if (supportingMemories.length < 2) {
    risks.push({
      level: 'medium',
      title: 'Weak supporting memory',
      description: 'There are not enough related memories to make this decision confidently.',
    });
  }

  if (query.includes('mcp')) {
    risks.push({
      level: 'low',
      title: 'MCP is parked',
      description: 'Current architecture intentionally keeps MCP outside the critical app path.',
    });
  }

  return {
    decision,
    score: supportScore,
    supportingMemories,
    risks,
    recommendation: supportScore >= 70
      ? 'Proceed, but keep the change behind the service/repository boundary.'
      : 'Collect more project memories before turning this into an autonomous workflow.',
  };
}
