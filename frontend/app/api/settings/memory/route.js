import { NextResponse } from 'next/server';
import { requireUser } from '@/features/auth/require-user';
import { makeMemorySettingsLogic } from '@/features/settings/settings.logic';
import { apiError } from '@/lib/api/responses';

async function getLogic() {
  const { supabase, user } = await requireUser();
  return makeMemorySettingsLogic(supabase, user.id);
}

export async function GET() {
  try {
    const logic = await getLogic();
    const settings = await logic.getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request) {
  try {
    const logic = await getLogic();
    const body = await request.json();
    const settings = await logic.updateSettings({
      enabled: body.enabled,
      privacyMode: body.privacyMode,
      safeMode: body.safeMode,
      autoSave: body.autoSave,
      showResonance: body.showResonance,
      showHeatmap: body.showHeatmap,
      crossLanguageMemory: body.crossLanguageMemory,
      preferredLanguage: body.preferredLanguage,
      enableDecay: body.enableDecay,
      decayHalfLifeDays: body.decayHalfLifeDays,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return apiError(error);
  }
}
