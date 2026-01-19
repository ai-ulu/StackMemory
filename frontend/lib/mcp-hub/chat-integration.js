/**
 * MCP Hub - Chat Integration
 * 
 * Integrates MCP Hub with the chat API for external context fetching.
 */

/**
 * Keywords that trigger external search
 */
const EXTERNAL_TRIGGERS = [
  /\b(latest|son|guncel|yeni|2024|2025|bugun|simdi)\b/i,
  /\b(search|ara|bul|google)\b/i,
  /\b(news|haber|what is|nedir|kimdir)\b/i,
  /\b(how to|nasil|tutorial|rehber)\b/i,
  /\b(best practices|en iyi|onerilen)\b/i,
  /\b(github|repo|code|kod)\b/i,
];

/**
 * Check if message needs external context
 */
export function needsExternalContext(message, localMemoryCount = 0) {
  // Always fetch if no local memories
  if (localMemoryCount === 0) {
    return true;
  }
  
  // Check for trigger keywords
  return EXTERNAL_TRIGGERS.some(pattern => pattern.test(message));
}

/**
 * Fetch external context via MCP Hub Orchestrator
 */
export async function fetchExternalContext(message, options = {}) {
  const {
    timeout = 5000,
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}/api/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: message,
        options: { timeout: timeout - 1000 }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    
    const result = await response.json();
    
    if (result.success && result.synthesized?.answer) {
      return {
        content: result.synthesized.answer,
        sources: result.synthesized.sources || [],
        confidence: result.synthesized.confidence || 0,
        fromHub: true,
      };
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.log('External context fetch failed:', error.message);
    }
  }

  return null;
}

/**
 * Format external context for system prompt
 */
export function formatExternalContext(externalContext) {
  if (!externalContext?.content) return '';

  let formatted = '\n\n🌐 DIŞ KAYNAKLARDAN:\n';
  formatted += externalContext.content;
  
  if (externalContext.sources?.length > 0) {
    formatted += '\n\n📚 Kaynaklar: ';
    formatted += externalContext.sources.map(s => s.name || s.type).join(', ');
  }

  return formatted;
}

/**
 * Merge local memories with external context
 */
export function mergeContexts(localMemories, externalContext) {
  const result = {
    memories: localMemories || [],
    external: null,
    hasLocal: (localMemories?.length || 0) > 0,
    hasExternal: false,
  };

  if (externalContext?.content) {
    result.external = externalContext;
    result.hasExternal = true;
  }

  return result;
}

export default {
  needsExternalContext,
  fetchExternalContext,
  formatExternalContext,
  mergeContexts,
};
