/**
 * Webhook trigger utility
 * Call this from other APIs when memory events occur
 */

async function generateSignature(secret, payload) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function triggerWebhooks(supabase, userId, event, payload) {
  try {
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
      .contains('events', [event]);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      try {
        const signature = await generateSignature(webhook.secret, payload);
        
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AI-ULU-Event': event,
            'X-AI-ULU-Signature': signature,
            'X-AI-ULU-Timestamp': Date.now().toString(),
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data: payload,
          }),
        });

        await supabase
          .from('webhooks')
          .update({ last_triggered_at: new Date().toISOString(), failure_count: 0 })
          .eq('id', webhook.id);
      } catch (err) {
        await supabase
          .from('webhooks')
          .update({ failure_count: (webhook.failure_count || 0) + 1 })
          .eq('id', webhook.id);
      }
    }
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}
