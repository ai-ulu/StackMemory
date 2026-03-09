import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    const supabase = await createClient();
    
    // Test database connection
    const { error } = await supabase.from('conversations').select('count').limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      return NextResponse.json({ 
        status: 'unhealthy',
        database: 'error',
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
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
