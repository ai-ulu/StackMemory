export type MemorySettings = {
  id?: string;
  userId?: string;
  enabled: boolean;
  privacyMode: boolean;
  safeMode: boolean;
  autoSave: boolean;
  showResonance: boolean;
  showHeatmap: boolean;
  crossLanguageMemory: boolean;
  preferredLanguage: string;
  enableDecay: boolean;
  decayHalfLifeDays: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateMemorySettingsInput = Partial<Omit<MemorySettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export const defaultMemorySettings: MemorySettings = {
  enabled: true,
  privacyMode: false,
  safeMode: false,
  autoSave: true,
  showResonance: true,
  showHeatmap: true,
  crossLanguageMemory: true,
  preferredLanguage: 'en',
  enableDecay: true,
  decayHalfLifeDays: 90,
};
