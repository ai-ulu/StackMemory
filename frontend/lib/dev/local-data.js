import crypto from 'crypto';
import { getLocalStore, saveLocalStore } from '@/lib/dev/local-mode';

function defaultSettings(userId) {
  return {
    user_id: userId,
    enabled: true,
    privacy_mode: false,
    safe_mode: false,
    auto_save: true,
    show_resonance: true,
    show_heatmap: true,
    cross_language_memory: true,
    preferred_language: 'en',
    enable_decay: true,
    decay_half_life_days: 90,
    encryption_enabled: false,
  };
}

function buildLocalMemory(userId, payload = {}) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    content: payload.content || '',
    type: payload.type || 'fact',
    confidence: payload.confidence ?? 0.8,
    status: 'active',
    truth_type: 'user_claim',
    scope: payload.scope || 'private',
    language: payload.language || 'en',
    version: 1,
    decay_factor: 1,
    last_accessed_at: now,
    access_count: 0,
    write_reason: payload.write_reason || 'Manual memory creation',
    write_intent: payload.write_intent || 'user_explicit',
    write_source: payload.write_source || 'manual',
    is_shadow: false,
    conflict_with: null,
    requires_approval: false,
    created_at: now,
    updated_at: now,
  };
}

export async function listConversations(userId) {
  const store = await getLocalStore();
  return store.conversations
    .filter((item) => item.user_id === userId)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

export async function createConversation(userId, title, model) {
  const store = await getLocalStore();
  const now = new Date().toISOString();
  const conversation = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    model,
    created_at: now,
    updated_at: now,
  };
  store.conversations.unshift(conversation);
  await saveLocalStore(store);
  return conversation;
}

export async function getConversation(userId, conversationId) {
  const store = await getLocalStore();
  const conversation = store.conversations.find((item) => item.id === conversationId && item.user_id === userId);
  if (!conversation) return null;
  const messages = store.messages.filter((item) => item.conversation_id === conversationId);
  return {
    ...conversation,
    messages,
  };
}

export async function updateConversation(userId, conversationId, updates) {
  const store = await getLocalStore();
  const index = store.conversations.findIndex((item) => item.id === conversationId && item.user_id === userId);
  if (index === -1) return null;
  store.conversations[index] = {
    ...store.conversations[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await saveLocalStore(store);
  return store.conversations[index];
}

export async function deleteConversation(userId, conversationId) {
  const store = await getLocalStore();
  const before = store.conversations.length;
  store.conversations = store.conversations.filter((item) => !(item.id === conversationId && item.user_id === userId));
  store.messages = store.messages.filter((item) => item.conversation_id !== conversationId);
  await saveLocalStore(store);
  return store.conversations.length !== before;
}

export async function appendMessage(conversationId, role, content, extra = {}) {
  const store = await getLocalStore();
  const message = {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    role,
    content,
    created_at: new Date().toISOString(),
    ...extra,
  };
  store.messages.push(message);

  const conversation = store.conversations.find((item) => item.id === conversationId);
  if (conversation) {
    conversation.updated_at = new Date().toISOString();
  }

  await saveLocalStore(store);
  return message;
}

export async function getMemorySettings(userId) {
  const store = await getLocalStore();
  return store.memorySettings[userId] || defaultSettings(userId);
}

export async function listMemories(userId, filters = {}) {
  const store = await getLocalStore();
  const includeDeprecated = filters.includeDeprecated === true;
  const includeShadow = filters.includeShadow === true;

  return (store.memories || [])
    .filter((item) => item.user_id === userId)
    .filter((item) => (includeShadow ? true : !item.is_shadow))
    .filter((item) => (includeDeprecated ? true : item.status !== 'deprecated'))
    .filter((item) => (filters.type ? item.type === filters.type : true))
    .filter((item) => (filters.scope ? item.scope === filters.scope : true))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function createMemory(userId, payload) {
  const store = await getLocalStore();
  const memory = buildLocalMemory(userId, payload);
  store.memories = store.memories || [];
  store.memories.unshift(memory);
  await saveLocalStore(store);
  return memory;
}

export async function saveMemorySettingsForUser(userId, updates) {
  const store = await getLocalStore();
  const nextSettings = {
    ...defaultSettings(userId),
    ...(store.memorySettings[userId] || {}),
    ...updates,
    user_id: userId,
  };
  store.memorySettings[userId] = nextSettings;
  await saveLocalStore(store);
  return nextSettings;
}
