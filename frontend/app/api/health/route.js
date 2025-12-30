import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 500 });
  }
}