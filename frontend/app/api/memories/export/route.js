import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Memory Export API
 * 
 * GET /api/memories/export?format=json|csv
 * 
 * Exports all user memories in specified format.
 * Supports JSON (default) and CSV formats.
 */

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const includeVersions = searchParams.get('includeVersions') === 'true';

    // Get all memories
    const { data: memories, error: memError } = await supabase
      .from('memories')
      .select('id, content, type, importance, access_count, created_at, updated_at, last_accessed_at, is_active, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (memError) {
      return NextResponse.json({ error: memError.message }, { status: 500 });
    }

    // Optionally get versions
    let versions = [];
    if (includeVersions && memories.length > 0) {
      const memoryIds = memories.map(m => m.id);
      const { data: versionData } = await supabase
        .from('memory_versions')
        .select('memory_id, content, status, created_at')
        .in('memory_id', memoryIds);
      versions = versionData || [];
    }

    // Format response
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      totalMemories: memories.length,
      memories: memories.map(m => ({
        id: m.id,
        content: m.content,
        type: m.type,
        importance: m.importance,
        accessCount: m.access_count,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        lastAccessedAt: m.last_accessed_at,
        isActive: m.is_active,
        metadata: m.metadata,
        versions: includeVersions 
          ? versions.filter(v => v.memory_id === m.id)
          : undefined,
      })),
    };

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['id', 'content', 'type', 'importance', 'accessCount', 'createdAt', 'isActive'];
      const rows = memories.map(m => [
        m.id,
        `"${(m.content || '').replace(/"/g, '""')}"`,
        m.type,
        m.importance,
        m.access_count,
        m.created_at,
        m.is_active,
      ].join(','));
      
      const csv = [headers.join(','), ...rows].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ai-ulu-memories-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="ai-ulu-memories-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
