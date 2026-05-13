import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultMemorySettings, type MemorySettings, type UpdateMemorySettingsInput } from './settings.types';

const SETTINGS_COLUMNS = 'id, user_id, enabled, privacy_mode, safe_mode, auto_save, show_resonance, show_heatmap, cross_language_memory, preferred_language, enable_decay, decay_half_life_days, created_at, updated_at';

type MemorySettingsRow = {
  id: string;
  user_id: string;
  enabled: boolean | null;
  privacy_mode: boolean | null;
  safe_mode: boolean | null;
  auto_save: boolean | null;
  show_resonance: boolean | null;
  show_heatmap: boolean | null;
  cross_language_memory: boolean | null;
  preferred_language: string | null;
  enable_decay: boolean | null;
  decay_half_life_days: number | null;
  created_at: string;
  updated_at: string;
};

function mapSettingsRow(row: MemorySettingsRow): MemorySettings {
  return {
    id: row.id,
    userId: row.user_id,
    enabled: row.enabled ?? defaultMemorySettings.enabled,
    privacyMode: row.privacy_mode ?? defaultMemorySettings.privacyMode,
    safeMode: row.safe_mode ?? defaultMemorySettings.safeMode,
    autoSave: row.auto_save ?? defaultMemorySettings.autoSave,
    showResonance: row.show_resonance ?? defaultMemorySettings.showResonance,
    showHeatmap: row.show_heatmap ?? defaultMemorySettings.showHeatmap,
    crossLanguageMemory: row.cross_language_memory ?? defaultMemorySettings.crossLanguageMemory,
    preferredLanguage: row.preferred_language ?? defaultMemorySettings.preferredLanguage,
    enableDecay: row.enable_decay ?? defaultMemorySettings.enableDecay,
    decayHalfLifeDays: row.decay_half_life_days ?? defaultMemorySettings.decayHalfLifeDays,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDatabasePatch(userId: string, input: UpdateMemorySettingsInput) {
  const patch: Record<string, unknown> = { user_id: userId };

  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.privacyMode !== undefined) patch.privacy_mode = input.privacyMode;
  if (input.safeMode !== undefined) patch.safe_mode = input.safeMode;
  if (input.autoSave !== undefined) patch.auto_save = input.autoSave;
  if (input.showResonance !== undefined) patch.show_resonance = input.showResonance;
  if (input.showHeatmap !== undefined) patch.show_heatmap = input.showHeatmap;
  if (input.crossLanguageMemory !== undefined) patch.cross_language_memory = input.crossLanguageMemory;
  if (input.preferredLanguage !== undefined) patch.preferred_language = input.preferredLanguage;
  if (input.enableDecay !== undefined) patch.enable_decay = input.enableDecay;
  if (input.decayHalfLifeDays !== undefined) {
    patch.decay_half_life_days = Math.max(1, Math.min(365, Number(input.decayHalfLifeDays)));
  }

  patch.updated_at = new Date().toISOString();
  return patch;
}

export class SupabaseMemorySettingsRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string
  ) {}

  async get(): Promise<MemorySettings> {
    const { data, error } = await this.supabase
      .from('memory_settings')
      .select(SETTINGS_COLUMNS)
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return { ...defaultMemorySettings, userId: this.userId };
    }

    return mapSettingsRow(data as MemorySettingsRow);
  }

  async save(input: UpdateMemorySettingsInput): Promise<MemorySettings> {
    const { data, error } = await this.supabase
      .from('memory_settings')
      .upsert(toDatabasePatch(this.userId, input), { onConflict: 'user_id' })
      .select(SETTINGS_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapSettingsRow(data as MemorySettingsRow);
  }
}
