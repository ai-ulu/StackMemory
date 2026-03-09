/**
 * MCP Hub Integration for Chat API
 * Import this in chat/route.js to enable external context
 */
import { getAppBaseUrl } from '@/lib/app-url';

const EXTERNAL_TRIGGERS = [
  /\b(latest|son|guncel|yeni|2024|2025)\b/i,
  /\b(search|ara|bul)\b/i,
  /\b(news|haber|nedir|kimdir)\b/i,
  /\b(how to|nasil)\b/i,
  /\b(best practices|en iyi)\b/i,
];

export function needsExternalContext(message, localMemoryCount = 0) {
  if (localMemoryCount === 0) return true;
  return EXTERNAL_TRIGGERS.some(pattern => pattern.test(message));
}

export async function fetchExternalContext(message, baseUrl) {
  try {
    const url = baseUrl || getAppBaseUrl();
    const response = await fetch(url + '/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (result.success && result.synthesized?.answer) {
      return {
        content: result.synthesized.answer,
        sources: result.synthesized.sources || [],
      };
    }
  } catch (e) {
    console.log('MCP Hub skipped:', e.message);
  }
  return null;
}
