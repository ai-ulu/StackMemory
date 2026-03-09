import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLocalFeatureMode, getLocalFeatureUnavailableResponse } from '@/lib/dev/local-feature-guards';

/**
 * Webhooks API
 * 
 * Allows users to register webhooks for memory events:
 * - memory.created
 * - memory.updated
 * - memory.deleted
 * - conflict.detected
 * - query.executed
 * 
 * Use cases:
 * - Sync with external systems (Notion, Obsidian)
 * - Trigger automations (Zapier, n8n)
 * - Analytics and monitoring
 */

const VALID_EVENTS = [
  'memory.created',
  'memory.updated', 
  'memory.deleted',
  'conflict.detected',
  'query.executed',
];

// GET - List user webhooks
export async function GET(request) {
  try {
    if (isLocalFeatureMode()) {
      return getLocalFeatureUnavailableResponse('webhooks');
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if webhooks table exists, create if not
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error && error.code === '42P01') {
      // Table doesn't exist - return empty
      return NextResponse.json({ webhooks: [], message: 'Webhooks feature not yet enabled' });
    }

    return NextResponse.json({ webhooks: webhooks || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Register new webhook
export async function POST(request) {
  try {
    if (isLocalFeatureMode()) {
      return getLocalFeatureUnavailableResponse('webhooks');
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, events, secret, name, enabled = true } = body;

    // Validate URL
    if (!url || !url.startsWith('https://')) {
      return NextResponse.json({ error: 'Valid HTTPS URL required' }, { status: 400 });
    }

    // Validate events
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'At least one event required' }, { status: 400 });
    }

    const invalidEvents = events.filter(e => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        error: `Invalid events: ${invalidEvents.join(', ')}`,
        validEvents: VALID_EVENTS,
      }, { status: 400 });
    }

    // Generate webhook secret if not provided
    const webhookSecret = secret || crypto.randomUUID().replace(/-/g, '');

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: user.id,
        name: name || 'Unnamed Webhook',
        url,
        events,
        secret: webhookSecret,
        enabled,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Webhooks table not configured. Please run migration.',
          migration: WEBHOOKS_MIGRATION,
        }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json({ 
      webhook: { ...webhook, secret: webhookSecret },
      message: 'Webhook registered successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove webhook
export async function DELETE(request) {
  try {
    if (isLocalFeatureMode()) {
      return getLocalFeatureUnavailableResponse('webhooks');
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update webhook
export async function PATCH(request) {
  try {
    if (isLocalFeatureMode()) {
      return getLocalFeatureUnavailableResponse('webhooks');
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, enabled, events, url, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
    }

    const updates = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (events) updates.events = events;
    if (url) updates.url = url;
    if (name) updates.name = name;
    updates.updated_at = new Date().toISOString();

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ webhook });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Webhook table migration SQL
const WEBHOOKS_MIGRATION = `
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Unnamed Webhook',
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhooks_user_id_idx ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS webhooks_enabled_idx ON webhooks(enabled);

-- RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks" ON webhooks
  FOR ALL USING (auth.uid() = user_id);
`;

// Helper function to trigger webhooks (call from other APIs)
