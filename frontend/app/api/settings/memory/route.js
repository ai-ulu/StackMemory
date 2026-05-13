import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { makeMemorySettingsLogic } from '@/features/settings/settings.logic';

async function getLogic() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return makeMemorySettingsLogic(supabase, data.user.id);
}

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const logic = await getLogic();
    const settings = await logic.getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return errorResponse(error);
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
    return errorResponse(error);
  }
}
