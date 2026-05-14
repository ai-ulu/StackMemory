import { mcp } from '@/lib/mcp/client';
import { mockMemories } from '@/content/mockMemories';

const DEFAULT_NAMESPACE =
  process.env.STACKMEMORY_NAMESPACE ||
  process.env.NEXT_PUBLIC_STACKMEMORY_NAMESPACE ||
  'demo:stackmemory';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeScore(value, fallback) {
  const parsed = toNumber(value, fallback);
  return parsed > 1 ? parsed / 100 : parsed;
}

function slugFromContent(content, fallback = 'memory') {
  const slug = String(content || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72);
  return slug || fallback;
}

export function normalizeMemory(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const content = raw.content || raw.text || raw.memory || raw.value || '';
  const id = raw.id || raw.memory_id || raw.uuid || slugFromContent(content, `memory-${index + 1}`);

  return {
    id: String(id),
    type: raw.type || raw.memory_type || raw.kind || 'note',
    content: String(content),
    confidence: normalizeScore(raw.confidence ?? raw.confidence_score, 0.85),
    importance: normalizeScore(raw.importance ?? raw.importance_score, 0.75),
    decay: normalizeScore(raw.decay ?? raw.decay_score, 0.1),
    source: raw.source || raw.namespace || raw.created_by || 'MCP',
    createdAt: raw.created_at || raw.createdAt || null,
    updatedAt: raw.updated_at || raw.updatedAt || null,
    raw,
  };
}

export function normalizeMemoryList(payload) {
  const records = Array.isArray(payload)
    ? payload
    : payload?.memories || payload?.results || payload?.records || payload?.items || payload?.data || [];

  if (!Array.isArray(records)) return [];
  return records.map(normalizeMemory).filter(Boolean);
}

export function mockMemoryFallback() {
  return mockMemories.map((memory) => ({
    ...memory,
    source: memory.source || 'Mock fallback',
    raw: memory,
  }));
}

export async function listMemories({ limit = 50, offset = 0, type } = {}) {
  try {
    const payload = await mcp.list({ namespace: DEFAULT_NAMESPACE, limit, offset, type });
    const memories = normalizeMemoryList(payload);
    return memories.length ? memories : mockMemoryFallback();
  } catch (error) {
    console.warn('listMemories fallback:', error?.message || error);
    return mockMemoryFallback();
  }
}

export async function getMemory(id) {
  const memories = await listMemories({ limit: 100 });
  return memories.find((memory) => memory.id === id) || null;
}

export async function createMemory(input) {
  const content = String(input?.content || '').trim();
  if (!content) throw new Error('Memory content is required');

  const type = input?.type || 'note';
  const source = String(input?.source || 'Dashboard').trim();
  const confidence = normalizeScore(input?.confidence, 0.85);
  const importance_score = normalizeScore(input?.importance ?? input?.importance_score, 0.75);

  const payload = await mcp.store({
    content,
    type,
    confidence,
    importance_score,
    namespace: DEFAULT_NAMESPACE,
    tags: source ? [`source:${source}`] : [],
  });

  const normalized = normalizeMemory(payload, 0);
  return normalized || {
    id: slugFromContent(content),
    type,
    content,
    confidence,
    importance: importance_score,
    decay: 0,
    source,
    raw: payload,
  };
}

export async function getContextPreviewMemories(limit = 3) {
  const memories = await listMemories({ limit: Math.max(limit, 10) });
  return [...memories]
    .sort((a, b) => {
      const scoreA = a.importance + a.confidence - a.decay;
      const scoreB = b.importance + b.confidence - b.decay;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export function getMemoryNamespace() {
  return DEFAULT_NAMESPACE;
}
