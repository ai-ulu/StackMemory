import { NextResponse } from 'next/server';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export function getLocalFeatureUnavailableResponse(feature, options = {}) {
  const status = options.status || 503;

  return NextResponse.json(
    {
      error: `${feature} is not available in local development mode.`,
      feature,
      mode: 'local',
      available_in: 'supabase',
    },
    { status }
  );
}

export function isLocalFeatureMode() {
  return isLocalAuthMode();
}
