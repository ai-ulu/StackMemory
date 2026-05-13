import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseMemorySettingsRepository } from './settings.repository';
import type { UpdateMemorySettingsInput } from './settings.types';

export class MemorySettingsLogic {
  constructor(private readonly repository: SupabaseMemorySettingsRepository) {}

  async getSettings() {
    return this.repository.get();
  }

  async updateSettings(input: UpdateMemorySettingsInput) {
    return this.repository.save(input);
  }
}

export function makeMemorySettingsLogic(supabase: SupabaseClient, userId: string) {
  return new MemorySettingsLogic(new SupabaseMemorySettingsRepository(supabase, userId));
}
