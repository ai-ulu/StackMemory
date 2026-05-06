// Ulu-Brain shared helpers for frontend API routes
// Mirrors MCP server logic but uses Supabase instead of D1

export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'can', 'need', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
  'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'some', 'no', 'not', 'only', 'very', 'just',
  'bir', 've', 'ile', 'için', 'bu', 'şu', 'o', 'ben', 'sen', 'biz', 'siz',
  'de', 'da', 'den', 'dan', 'mi', 'mu', 'mı', 'var', 'yok', 'olan', 'gibi',
]);

export const NEGATIVE_PATTERNS = [
  "don't", 'avoid', 'problem', 'failed', 'deprecated', 'mistake',
  'yapma', 'kaçın', 'sorun', 'hata', 'başarısız', 'terk', 'riskli', 'bug', 'error', 'broke',
];

export const POSITIVE_PATTERNS = [
  'should', 'prefer', 'good', 'success', 'recommended', 'best',
  'kullan', 'tercih', 'iyi', 'başarılı', 'önerilen', 'en iyi', 'approved',
];

export const LEARNING_RATE = 0.02;
export const WEIGHT_FLOOR = 0.05;
export const WEIGHT_CEIL = 0.60;

export function extractKeywords(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

export function truncate(text: string, maxLen: number = 200): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

export function scoreKeywordRelevance(content: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const lower = content.toLowerCase();
  const hits = keywords.filter(kw => lower.includes(kw)).length;
  return hits / keywords.length;
}

export function normalizeWeights(w: Record<string, number>): Record<string, number> {
  const keys = Object.keys(w);
  for (const k of keys) w[k] = Math.max(WEIGHT_FLOOR, Math.min(WEIGHT_CEIL, w[k]));
  const sum = keys.reduce((s, k) => s + w[k], 0);
  for (const k of keys) w[k] = Math.round((w[k] / sum) * 1000) / 1000;
  const diff = 1.0 - keys.reduce((s, k) => s + w[k], 0);
  w[keys[0]] = Math.round((w[keys[0]] + diff) * 1000) / 1000;
  return w;
}

// Auth helper — returns user or null. Works in both local-dev and Supabase mode.
import { createClient } from '@/lib/supabase/server';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';

export async function getAuthUser(request: Request) {
  if (isLocalAuthMode()) {
    const user = await getLocalRequestUser(request);
    return user ? { id: user.id } : null;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSupabase() {
  return createClient();
}
