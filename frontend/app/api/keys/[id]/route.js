import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { revokeApiKey, deleteApiKey } from '@/lib/api-keys';
import {
  deleteLocalApiKey,
  getLocalApiKey,
  listLocalApiKeyLogs,
  updateLocalApiKey,
} from '@/lib/dev/local-data';

/**
 * Single API Key Management
 * 
 * GET    /api/keys/[id] - Get key details and usage logs
 * PATCH  /api/keys/[id] - Update key (name, revoke)
 * DELETE /api/keys/[id] - Permanently delete key
 */

// GET - Get key details and logs
export async function GET(request, { params }) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id } = params;
      const key = await getLocalApiKey(user.id, id);
      if (!key) {
        return NextResponse.json({ error: 'Key not found' }, { status: 404 });
      }

      const logs = await listLocalApiKeyLogs(user.id, id);
      return NextResponse.json({
        key: {
          id: key.id,
          name: key.name,
          keyPrefix: key.key_prefix,
          scope: key.scope,
          clientType: key.client_type,
          isActive: key.is_active,
          expiresAt: key.expires_at,
          revokedAt: key.revoked_at,
          lastUsedAt: key.last_used_at,
          usageCount: key.usage_count,
          lastIp: key.last_ip,
          createdAt: key.created_at,
          metadata: key.metadata,
        },
        logs,
        stats: {
          totalRequests: key.usage_count || 0,
          last7Days: 0,
          usageByDay: {},
        },
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get key details
    const { data: key, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    // Get recent usage logs
    const { data: logs } = await supabase
      .from('api_key_logs')
      .select('*')
      .eq('key_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get usage stats
    const { data: dailyStats } = await supabase
      .from('api_key_logs')
      .select('created_at')
      .eq('key_id', id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Group by day
    const usageByDay = {};
    (dailyStats || []).forEach(log => {
      const day = log.created_at.split('T')[0];
      usageByDay[day] = (usageByDay[day] || 0) + 1;
    });

    return NextResponse.json({
      key: {
        id: key.id,
        name: key.name,
        keyPrefix: key.key_prefix,
        scope: key.scope,
        clientType: key.client_type,
        isActive: key.is_active,
        expiresAt: key.expires_at,
        revokedAt: key.revoked_at,
        lastUsedAt: key.last_used_at,
        usageCount: key.usage_count,
        lastIp: key.last_ip,
        createdAt: key.created_at,
        metadata: key.metadata,
      },
      logs: logs || [],
      stats: {
        totalRequests: key.usage_count,
        last7Days: Object.values(usageByDay).reduce((a, b) => a + b, 0),
        usageByDay,
      },
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update key
export async function PATCH(request, { params }) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id } = params;
      const body = await request.json();
      const { name, revoke } = body;

      if (revoke === true) {
        const revokedKey = await updateLocalApiKey(user.id, id, {
          is_active: false,
          revoked_at: new Date().toISOString(),
        });
        if (!revokedKey) {
          return NextResponse.json({ error: 'Key not found' }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          message: 'Key revoked successfully',
          key: revokedKey,
        });
      }

      if (name) {
        const updatedKey = await updateLocalApiKey(user.id, id, { name });
        if (!updatedKey) {
          return NextResponse.json({ error: 'Key not found' }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          key: updatedKey,
        });
      }

      return NextResponse.json({ error: 'No update provided' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, revoke } = body;

    // Revoke key
    if (revoke === true) {
      const revokedKey = await revokeApiKey(supabase, user.id, id);
      return NextResponse.json({
        success: true,
        message: 'Key revoked successfully',
        key: revokedKey,
      });
    }

    // Update name
    if (name) {
      const { data: updatedKey, error } = await supabase
        .from('api_keys')
        .update({ name })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        key: updatedKey,
      });
    }

    return NextResponse.json({ error: 'No update provided' }, { status: 400 });
  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Permanently delete key
export async function DELETE(request, { params }) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id } = params;
      const deleted = await deleteLocalApiKey(user.id, id);
      if (!deleted) {
        return NextResponse.json({ error: 'Key not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Key deleted permanently',
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await deleteApiKey(supabase, user.id, id);

    return NextResponse.json({
      success: true,
      message: 'Key deleted permanently',
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
