import type { SupabaseClient } from '@supabase/supabase-js';

export interface ContextBuildEvent {
  userId: string;
  agentId: string;
  inputTokens: number;
  finalContextTokens: number;
  savedTokens: number;
  strategy: string;
  durationMs: number;
  memoryCount: number;
}

/**
 * Telemetri Servisi
 * 
 * Token tasarrufu ve context oluşturma metriklerini kaydeder.
 * ai_usage_events tablosuna yazar.
 */

/**
 * Context build işlemini kaydet
 */
export async function recordContextBuild(
  event: ContextBuildEvent,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('ai_usage_events')
      .insert({
        user_id: event.userId,
        agent_id: event.agentId,
        event_type: 'context_build',
        input_tokens: event.inputTokens,
        output_tokens: event.finalContextTokens, // Bu bağlamda output = final context
        total_tokens: event.inputTokens, // Toplam input olarak kabul
        duration_ms: event.durationMs,
        metadata: {
          strategy: event.strategy,
          savedTokens: event.savedTokens,
          memoryCount: event.memoryCount,
          savingsPercentage: event.inputTokens > 0 
            ? ((event.savedTokens / event.inputTokens) * 100).toFixed(2) 
            : '0',
        },
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to record context build event:', error);
    }
  } catch (error) {
    console.error('Telemetry recording error:', error);
  }
}

/**
 * Genel kullanım metriği kaydet
 */
export async function recordUsageEvent(
  userId: string,
  agentId: string,
  eventType: string,
  metrics: Record<string, any>,
  supabase: SupabaseClient
): Promise<void> {
  try {
    await supabase
      .from('ai_usage_events')
      .insert({
        user_id: userId,
        agent_id: agentId,
        event_type: eventType,
        input_tokens: metrics.inputTokens || 0,
        output_tokens: metrics.outputTokens || 0,
        total_tokens: metrics.totalTokens || 0,
        duration_ms: metrics.durationMs || 0,
        metadata: metrics,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to record usage event:', error);
  }
}
