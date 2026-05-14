import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompiledContext, ContextCompileInput } from './context.optimizer';

export class ContextTelemetryRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string
  ) {}

  async recordContextBuild(input: ContextCompileInput, compiled: CompiledContext): Promise<{ id: string | null }> {
    const { data, error } = await this.supabase
      .from('context_builds')
      .insert({
        user_id: this.userId,
        workspace_id: input.workspaceId,
        agent_id: input.agentId,
        strategy: compiled.metrics.strategy,
        max_context_tokens: compiled.metrics.maxContextTokens,
        user_request_tokens: compiled.metrics.userRequestTokens,
        selected_memory_count: compiled.metrics.selectedMemoryCount,
        selected_memory_tokens: compiled.metrics.selectedMemoryTokens,
        omitted_memory_count: compiled.metrics.omittedMemoryCount,
        omitted_memory_tokens: compiled.metrics.omittedMemoryTokens,
        final_context_tokens: compiled.metrics.finalContextTokens,
        estimated_saved_tokens: compiled.metrics.estimatedSavingsTokens,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Could not record context build:', error.message);
      return { id: null };
    }

    const buildId = data?.id ?? null;

    if (buildId) {
      await this.recordRetrievalEvents(buildId, compiled);
    }

    return { id: buildId };
  }

  private async recordRetrievalEvents(contextBuildId: string, compiled: CompiledContext) {
    const includedRows = compiled.selectedMemories.map((memory, index) => ({
      user_id: this.userId,
      context_build_id: contextBuildId,
      memory_id: memory.id,
      rank: index + 1,
      reason: 'selected_by_context_budget',
      estimated_tokens: Math.ceil(memory.content.length / 4),
      included: true,
    }));

    const omittedRows = compiled.omittedMemories.slice(0, 50).map((memory, index) => ({
      user_id: this.userId,
      context_build_id: contextBuildId,
      memory_id: memory.id,
      rank: includedRows.length + index + 1,
      reason: 'omitted_by_context_budget',
      estimated_tokens: Math.ceil(memory.content.length / 4),
      included: false,
    }));

    const rows = [...includedRows, ...omittedRows];
    if (!rows.length) return;

    const { error } = await this.supabase
      .from('memory_retrieval_events')
      .insert(rows);

    if (error) {
      console.warn('Could not record memory retrieval events:', error.message);
    }
  }
}
