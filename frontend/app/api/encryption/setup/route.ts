import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/encryption/setup
 * Setup encryption for user (generate keys, encrypt with password)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { encryptedKeyPair } = body

    if (!encryptedKeyPair) {
      return NextResponse.json({ error: 'Encrypted key pair required' }, { status: 400 })
    }

    // Store encrypted key pair in user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        encrypted_key_pair: encryptedKeyPair
      }
    })

    if (updateError) {
      console.error('Store key pair error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Enable encryption in settings
    await supabase
      .from('memory_settings')
      .upsert(
        { user_id: user.id, encryption_enabled: true },
        { onConflict: 'user_id' }
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Encryption setup error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
