/**
 * Webhook trigger utility with exponential backoff retry
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      // 4xx hataları retry etme
      if (res.status >= 400 && res.status < 500) throw new Error(`Client error: ${res.status}`);
      throw new Error(`Server error: ${res.status}`);
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 100;
      await sleep(delay);
    }
  }
}

export async function triggerWebhooks(supabase, userId, event, payload) {
  try {
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('id, url, secret, events, enabled, failure_count')
      .eq('user_id', userId)
      .eq('enabled', true)
      .contains('events', [event]);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      try {
        const signature = await generateSignature(webhook.secret, payload);

        await fetchWithRetry(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StackMemory-Event': event,
            'X-StackMemory-Signature': signature,
            'X-StackMemory-Timestamp': Date.now().toString(),
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
        const newFailCount = (webhook.failure_count || 0) + 1;
        await supabase
          .from('webhooks')
          .update({ failure_count: newFailCount, last_error: err.message })
          .eq('id', webhook.id);
        console.error(`Webhook ${webhook.id} failed after retries:`, err.message);
      }
    }
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}
