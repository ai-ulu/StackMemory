import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import {
  createApiKey,
  listApiKeys,
  KEY_SCOPES,
  CLIENT_TYPES,
} from '@/lib/api-keys';
import {
  createLocalApiKey,
  listLocalApiKeys,
  summarizeLocalApiKeyStats,
} from '@/lib/dev/local-data';

/**
 * API Keys Management Endpoint
 * 
 * GET  /api/keys - List all keys for current user
 * POST /api/keys - Create a new API key
 */

// GET - List all API keys
export async function GET(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const keys = await listLocalApiKeys(user.id);
      return NextResponse.json({
        keys: keys.map(key => ({
          id: key.id,
          name: key.name,
          keyPrefix: key.key_prefix,
          scope: key.scope,
          scopeInfo: KEY_SCOPES[key.scope],
          clientType: key.client_type,
          clientInfo: CLIENT_TYPES[key.client_type],
          isActive: key.is_active,
          expiresAt: key.expires_at,
          lastUsedAt: key.last_used_at,
          usageCount: key.usage_count,
          createdAt: key.created_at,
        })),
        stats: summarizeLocalApiKeyStats(keys),
        scopes: KEY_SCOPES,
        clientTypes: CLIENT_TYPES,
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await listApiKeys(supabase, user.id);

    // Get usage stats
    const { data: stats } = await supabase
      .rpc('get_api_key_stats', { p_user_id: user.id })
      .single();

    return NextResponse.json({
      keys: keys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.key_prefix,
        scope: key.scope,
        scopeInfo: KEY_SCOPES[key.scope],
        clientType: key.client_type,
        clientInfo: CLIENT_TYPES[key.client_type],
        isActive: key.is_active,
        expiresAt: key.expires_at,
        lastUsedAt: key.last_used_at,
        usageCount: key.usage_count,
        createdAt: key.created_at,
      })),
      stats: stats || {
        total_keys: keys.length,
        active_keys: keys.filter(k => k.is_active).length,
        total_requests: keys.reduce((sum, k) => sum + (k.usage_count || 0), 0),
      },
      scopes: KEY_SCOPES,
      clientTypes: CLIENT_TYPES,
    });
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new API key
export async function POST(request) {
  try {
    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { name, scope, clientType, expiresIn } = body;

      if (scope && !KEY_SCOPES[scope]) {
        return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
      }

      let expiresAt = null;
      if (expiresIn) {
        const now = new Date();
        switch (expiresIn) {
          case '7d':
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '30d':
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '90d':
            expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '1y':
            expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
      }

      const existingKeys = await listLocalApiKeys(user.id);
      if (existingKeys.length >= 10) {
        return NextResponse.json({
          error: 'Local mode key limit reached. Remove an old key before creating another.',
        }, { status: 403 });
      }

      const newKey = await createLocalApiKey(user.id, {
        name: name || `${CLIENT_TYPES[clientType]?.name || 'API'} Key`,
        scope: scope || CLIENT_TYPES[clientType]?.defaultScope || 'read',
        clientType: clientType || 'api',
        expiresAt,
      });

      return NextResponse.json({
        success: true,
        key: newKey.plain_key,
        keyInfo: {
          id: newKey.id,
          name: newKey.name,
          keyPrefix: newKey.key_prefix,
          scope: newKey.scope,
          clientType: newKey.client_type,
          expiresAt: newKey.expires_at,
          createdAt: newKey.created_at,
        },
        warning: 'Save this key now! It will not be shown again.',
      });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scope, clientType, expiresIn } = body;

    // Validate scope
    if (scope && !KEY_SCOPES[scope]) {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case '7d':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
        // 'never' = null
      }
    }

    // Check key limit (free: 3, pro: 10, enterprise: unlimited)
    const existingKeys = await listApiKeys(supabase, user.id);
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.plan || 'free';
    const limits = { free: 3, pro: 10, enterprise: 100 };
    const maxKeys = limits[plan] || 3;

    if (existingKeys.length >= maxKeys) {
      return NextResponse.json({
        error: `Key limit reached. ${plan} plan allows ${maxKeys} keys. Upgrade to create more.`,
      }, { status: 403 });
    }

    // Create the key
    const newKey = await createApiKey(supabase, user.id, {
      name: name || `${CLIENT_TYPES[clientType]?.name || 'API'} Key`,
      scope: scope || CLIENT_TYPES[clientType]?.defaultScope || 'read',
      clientType: clientType || 'api',
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      key: newKey.key, // Plain key - ONLY returned once!
      keyInfo: {
        id: newKey.id,
        name: newKey.name,
        keyPrefix: newKey.key_prefix,
        scope: newKey.scope,
        clientType: newKey.client_type,
        expiresAt: newKey.expires_at,
        createdAt: newKey.created_at,
      },
      warning: 'Save this key now! It will not be shown again.',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
