import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Memory Import API
 * 
 * POST /api/memories/import
 * 
 * Imports memories from JSON format.
 * Supports merging or replacing existing memories.
 */

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memories, mode = 'merge' } = body;
    // mode: 'merge' (add new, skip existing) or 'replace' (clear and import)

    if (!memories || !Array.isArray(memories)) {
      return NextResponse.json({ 
        error: 'Invalid format. Expected { memories: [...] }' 
      }, { status: 400 });
    }

    // Validate memory structure
    const validTypes = ['identity', 'preference', 'fact'];
    const validMemories = memories.filter(m => {
      if (!m.content || typeof m.content !== 'string') return false;
      if (m.type && !validTypes.includes(m.type)) return false;
      return true;
    });

    if (validMemories.length === 0) {
      return NextResponse.json({ 
        error: 'No valid memories to import' 
      }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let errors = [];

    // If replace mode, delete existing memories first
    if (mode === 'replace') {
      const { error: deleteError } = await supabase
        .from('memories')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        return NextResponse.json({ 
          error: `Failed to clear existing memories: ${deleteError.message}` 
        }, { status: 500 });
      }
    }

    // Import memories
    for (const memory of validMemories) {
      try {
        // Check for duplicates in merge mode
        if (mode === 'merge') {
          const { data: existing } = await supabase
            .from('memories')
            .select('id')
            .eq('user_id', user.id)
            .eq('content', memory.content)
            .limit(1);
          
          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }
        }

        // Insert memory
        const { error: insertError } = await supabase
          .from('memories')
          .insert({
            user_id: user.id,
            content: memory.content,
            type: memory.type || 'fact',
            importance: memory.importance || getDefaultImportance(memory.type),
            access_count: memory.accessCount || 0,
            is_active: memory.isActive !== false,
            metadata: memory.metadata || {},
            // Don't import timestamps - let DB set them
          });

        if (insertError) {
          errors.push({ content: memory.content.substring(0, 50), error: insertError.message });
        } else {
          imported++;
        }
      } catch (err) {
        errors.push({ content: memory.content.substring(0, 50), error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: memories.length,
        valid: validMemories.length,
        imported,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit error details
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDefaultImportance(type) {
  const importanceMap = {
    identity: 1.0,
    preference: 0.7,
    fact: 0.4,
  };
  return importanceMap[type] || 0.4;
}
