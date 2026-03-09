import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

export async function GET() {
  try {
    const config = getSupabaseConfig();
    if (!config.isLocalMode && !config.isConfigured) {
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
      mode: config.isLocalMode ? 'local' : 'supabase',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 500 });
  }
}
