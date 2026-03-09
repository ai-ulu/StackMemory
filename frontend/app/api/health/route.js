import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

export async function GET() {
  try {
    const config = getSupabaseConfig();
    if (config.isUnsafeProductionLocalMode) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'local_store',
        mode: 'local',
        error: 'Local auth mode is enabled in production. Disable STACKMEMORY_LOCAL_MODE and configure Supabase.',
      }, { status: 500 });
    }

    if (config.isLocalMode) {
      return NextResponse.json({
        status: 'healthy',
        database: 'local_store',
        mode: 'local',
        timestamp: new Date().toISOString(),
      });
    }

    if (!config.isConfigured) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'missing_config',
        error: 'Supabase environment variables are not configured',
      }, { status: 500 });
    }

    const response = await fetch(`${config.url}/rest/v1/conversations?select=count&limit=1`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || config.anonKey,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || config.anonKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok && response.status !== 404) {
      const body = await response.text();
      return NextResponse.json({ 
        status: 'unhealthy',
        database: 'error',
        error: body || `Supabase REST health check failed with ${response.status}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'healthy',
      database: response.status === 404 ? 'reachable_schema_pending' : 'connected',
      mode: 'supabase',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 500 });
  }
}
