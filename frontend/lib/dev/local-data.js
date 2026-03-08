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
