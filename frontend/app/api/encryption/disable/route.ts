import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/encryption/disable
 * Disable encryption (requires password verification)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove encrypted key pair
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        encrypted_key_pair: null
      }
    })

    if (updateError) {
      console.error('Remove key pair error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Disable encryption in settings
    await supabase
      .from('memory_settings')
      .upsert(
        { user_id: user.id, encryption_enabled: false },
        { onConflict: 'user_id' }
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Encryption disable error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
