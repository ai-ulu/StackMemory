import type { SupabaseClient } from '@supabase/supabase-js';

type ContextBuildRow = {
  id: string;
  agent_id: string | null;
  workspace_id: string | null;
  strategy: string;
  max_context_tokens: number;
  selected_memory_count: number;
  selected_memory_tokens: number;
  omitted_memory_count: number;
  omitted_memory_tokens: number;
  final_context_tokens: number;
  estimated_saved_tokens: number;
  created_at: string;
};

type UsageEventRow = {
  id: string;
  agent_id: string | null;
  workspace_id: string | null;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  estimated_cost_usd: number | string;
  latency_ms: number | null;
  created_at: string;
};

type AgentAccumulator = {
  agentId: string;
  builds: number;
  finalContextTokens: number;
  estimatedSavedTokens: number;
  selectedMemoryCount: number;
  omittedMemoryCount: number;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSavingsPercent(saved: number, finalTokens: number): number {
  const baseline = saved + finalTokens;
  if (!baseline) return 0;
  return Math.round((saved / baseline) * 100);
}

export class UsageSummaryRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string,
  ) {}

  async getSummary() {
    const [contextBuilds, usageEvents] = await Promise.all([
      this.getContextBuilds(),
      this.getUsageEvents(),
    ]);

    const totalFinalContextTokens = contextBuilds.reduce((sum, row) => sum + toNumber(row.final_context_tokens), 0);
    const totalEstimatedSavedTokens = contextBuilds.reduce((sum, row) => sum + toNumber(row.estimated_saved_tokens), 0);
    const totalSelectedMemories = contextBuilds.reduce((sum, row) => sum + toNumber(row.selected_memory_count), 0);
    const totalOmittedMemories = contextBuilds.reduce((sum, row) => sum + toNumber(row.omitted_memory_count), 0);
    const totalInputTokens = usageEvents.reduce((sum, row) => sum + toNumber(row.input_tokens), 0);
    const totalOutputTokens = usageEvents.reduce((sum, row) => sum + toNumber(row.output_tokens), 0);
    const totalCachedInputTokens = usageEvents.reduce((sum, row) => sum + toNumber(row.cached_input_tokens), 0);
    const totalEstimatedCostUsd = usageEvents.reduce((sum, row) => sum + toNumber(row.estimated_cost_usd), 0);

    const agentMap = new Map<string, AgentAccumulator>();

    for (const row of contextBuilds) {
      const agentId = row.agent_id || 'default-agent';
      const current = agentMap.get(agentId) || {
        agentId,
        builds: 0,
        finalContextTokens: 0,
        estimatedSavedTokens: 0,
        selectedMemoryCount: 0,
        omittedMemoryCount: 0,
      };

      current.builds += 1;
      current.finalContextTokens += toNumber(row.final_context_tokens);
      current.estimatedSavedTokens += toNumber(row.estimated_saved_tokens);
      current.selectedMemoryCount += toNumber(row.selected_memory_count);
      current.omittedMemoryCount += toNumber(row.omitted_memory_count);
      agentMap.set(agentId, current);
    }

    const agentBreakdown = Array.from(agentMap.values())
      .map((agent) => ({
        ...agent,
        savingsPercent: getSavingsPercent(agent.estimatedSavedTokens, agent.finalContextTokens),
      }))
      .sort((a, b) => b.estimatedSavedTokens - a.estimatedSavedTokens)
      .slice(0, 10);

    return {
      totals: {
        contextBuilds: contextBuilds.length,
        usageEvents: usageEvents.length,
        finalContextTokens: totalFinalContextTokens,
        estimatedSavedTokens: totalEstimatedSavedTokens,
        estimatedBaselineTokens: totalFinalContextTokens + totalEstimatedSavedTokens,
        savingsPercent: getSavingsPercent(totalEstimatedSavedTokens, totalFinalContextTokens),
        selectedMemoryCount: totalSelectedMemories,
        omittedMemoryCount: totalOmittedMemories,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cachedInputTokens: totalCachedInputTokens,
        estimatedCostUsd: Number(totalEstimatedCostUsd.toFixed(6)),
        avgFinalContextTokens: contextBuilds.length ? Math.round(totalFinalContextTokens / contextBuilds.length) : 0,
        avgSavedTokens: contextBuilds.length ? Math.round(totalEstimatedSavedTokens / contextBuilds.length) : 0,
      },
      agentBreakdown,
      recentBuilds: contextBuilds.slice(0, 8).map((row) => ({
        id: row.id,
        agentId: row.agent_id || 'default-agent',
        workspaceId: row.workspace_id || 'default-workspace',
        strategy: row.strategy,
        maxContextTokens: row.max_context_tokens,
        selectedMemoryCount: row.selected_memory_count,
        omittedMemoryCount: row.omitted_memory_count,
        finalContextTokens: row.final_context_tokens,
        estimatedSavedTokens: row.estimated_saved_tokens,
        savingsPercent: getSavingsPercent(row.estimated_saved_tokens, row.final_context_tokens),
        createdAt: row.created_at,
      })),
    };
  }

  private async getContextBuilds(): Promise<ContextBuildRow[]> {
    const { data, error } = await this.supabase
      .from('context_builds')
      .select('id, agent_id, workspace_id, strategy, max_context_tokens, selected_memory_count, selected_memory_tokens, omitted_memory_count, omitted_memory_tokens, final_context_tokens, estimated_saved_tokens, created_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(250);

    if (error) throw new Error(error.message);
    return (data ?? []) as ContextBuildRow[];
  }

  private async getUsageEvents(): Promise<UsageEventRow[]> {
    const { data, error } = await this.supabase
      .from('ai_usage_events')
      .select('id, agent_id, workspace_id, provider, model, input_tokens, output_tokens, cached_input_tokens, estimated_cost_usd, latency_ms, created_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(250);

    if (error) throw new Error(error.message);
    return (data ?? []) as UsageEventRow[];
  }
}
