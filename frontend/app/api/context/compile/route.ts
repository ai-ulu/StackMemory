import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { compileContextWithHScore } from '@/features/context/context.optimizer';

export interface ContextCompileRequest {
  userRequest: string;
  agentId: string;
  maxTokens?: number;
  strategy?: 'recent' | 'relevant' | 'balanced';
  emotionalContext?: string;
}

/**
 * POST /api/context/compile
 * 
 * H(x,ψ) algoritması ile context derler.
 * Token tasarrufu sağlar ve telemetry kaydını yapar.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Request body parse
    const body: ContextCompileRequest = await request.json();
    const { userRequest, agentId, maxTokens, strategy, emotionalContext } = body;

    // Validation
    if (!userRequest || !agentId) {
      return NextResponse.json(
        { error: 'userRequest and agentId are required' },
        { status: 400 }
      );
    }

    // Context compile et
    const result = await compileContextWithHScore(
      {
        userRequest,
        agentId,
        userId: user.id,
        maxTokens,
        strategy,
        emotionalContext,
      },
      supabase
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Context compile error:', error);
    return NextResponse.json(
      { error: 'Failed to compile context' },
      { status: 500 }
    );
  }
}
