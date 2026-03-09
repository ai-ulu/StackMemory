import crypto from 'crypto';
import { getLocalStore, saveLocalStore } from '@/lib/dev/local-mode';
import { CLIENT_TYPES, KEY_SCOPES, generateApiKey, getKeyPrefix } from '@/lib/api-keys';

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

function buildLocalApiKey(userId, payload = {}) {
  const now = new Date().toISOString();
  const plainKey = generateApiKey(payload.scope || 'read');

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    name: payload.name || `${CLIENT_TYPES[payload.clientType || 'api']?.name || 'API'} Key`,
    plain_key: plainKey,
    key_prefix: getKeyPrefix(plainKey),
    scope: payload.scope || 'read',
    client_type: payload.clientType || 'api',
    is_active: true,
    expires_at: payload.expiresAt || null,
    revoked_at: null,
    last_used_at: null,
    usage_count: 0,
    last_ip: null,
    metadata: payload.metadata || {},
    created_at: now,
  };
}

export async function listLocalApiKeys(userId) {
  const store = await getLocalStore();
  return (store.apiKeys || [])
    .filter((item) => item.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function createLocalApiKey(userId, payload = {}) {
  const store = await getLocalStore();
  const apiKey = buildLocalApiKey(userId, payload);
  store.apiKeys = store.apiKeys || [];
  store.apiKeys.unshift(apiKey);
  await saveLocalStore(store);
  return apiKey;
}

export async function getLocalApiKey(userId, keyId) {
  const store = await getLocalStore();
  return (store.apiKeys || []).find((item) => item.id === keyId && item.user_id === userId) || null;
}

export async function updateLocalApiKey(userId, keyId, updates = {}) {
  const store = await getLocalStore();
  const index = (store.apiKeys || []).findIndex((item) => item.id === keyId && item.user_id === userId);
  if (index === -1) return null;

  store.apiKeys[index] = {
    ...store.apiKeys[index],
    ...updates,
  };
  await saveLocalStore(store);
  return store.apiKeys[index];
}

export async function deleteLocalApiKey(userId, keyId) {
  const store = await getLocalStore();
  const before = (store.apiKeys || []).length;
  store.apiKeys = (store.apiKeys || []).filter((item) => !(item.id === keyId && item.user_id === userId));
  store.apiKeyLogs = (store.apiKeyLogs || []).filter((item) => item.key_id !== keyId);
  await saveLocalStore(store);
  return (store.apiKeys || []).length !== before;
}

export async function listLocalApiKeyLogs(userId, keyId) {
  const key = await getLocalApiKey(userId, keyId);
  if (!key) return [];
  const store = await getLocalStore();
  return (store.apiKeyLogs || [])
    .filter((item) => item.key_id === keyId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function summarizeLocalApiKeyStats(keys = []) {
  return {
    total_keys: keys.length,
    active_keys: keys.filter((key) => key.is_active).length,
    total_requests: keys.reduce((sum, key) => sum + (key.usage_count || 0), 0),
    requests_today: 0,
  };
}

export { KEY_SCOPES };

export async function createLocalShareLink(userId, payload = {}) {
  const store = await getLocalStore();
  const now = new Date().toISOString();
  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = payload.expiresAt || null;

  const link = {
    id: crypto.randomUUID(),
    token,
    conversation_id: payload.conversationId,
    created_by: userId,
    expires_at: expiresAt,
    max_views: payload.maxViews || null,
    permissions: payload.permissions || { canCopy: true, canExport: false },
    view_count: 0,
    created_at: now,
  };

  store.sharedLinks = store.sharedLinks || [];
  store.sharedLinks.unshift(link);

  const conversationIndex = (store.conversations || []).findIndex(
    (item) => item.id === payload.conversationId && item.user_id === userId
  );

  if (conversationIndex !== -1) {
    store.conversations[conversationIndex] = {
      ...store.conversations[conversationIndex],
      is_shared: true,
      share_token: token,
      share_expires_at: expiresAt,
      updated_at: now,
    };
  }

  await saveLocalStore(store);
  return link;
}

export async function deleteLocalShareLink(userId, token) {
  const store = await getLocalStore();
  const link = (store.sharedLinks || []).find((item) => item.token === token && item.created_by === userId);
  if (!link) return false;

  store.sharedLinks = (store.sharedLinks || []).filter((item) => !(item.token === token && item.created_by === userId));

  const conversationIndex = (store.conversations || []).findIndex((item) => item.id === link.conversation_id);
  if (conversationIndex !== -1) {
    store.conversations[conversationIndex] = {
      ...store.conversations[conversationIndex],
      is_shared: false,
      share_token: null,
      share_expires_at: null,
      updated_at: new Date().toISOString(),
    };
  }

  await saveLocalStore(store);
  return true;
}

export async function getLocalShareView(token) {
  const store = await getLocalStore();
  const linkIndex = (store.sharedLinks || []).findIndex((item) => item.token === token);
  if (linkIndex === -1) return null;

  const link = store.sharedLinks[linkIndex];

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { expired: true };
  }

  if (link.max_views && link.view_count >= link.max_views) {
    return { exhausted: true };
  }

  const conversation = (store.conversations || []).find((item) => item.id === link.conversation_id);
  if (!conversation) return null;

  const messages = (store.messages || [])
    .filter((item) => item.conversation_id === link.conversation_id)
    .map(({ id, role, content, created_at }) => ({ id, role, content, created_at }));

  store.sharedLinks[linkIndex] = {
    ...link,
    view_count: (link.view_count || 0) + 1,
  };
  await saveLocalStore(store);

  return {
    conversation: {
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      created_at: conversation.created_at,
    },
    messages,
    permissions: link.permissions,
    view_count: (link.view_count || 0) + 1,
  };
}

export async function listLocalTeams(userId) {
  const store = await getLocalStore();
  const memberships = (store.teamMembers || []).filter((item) => item.user_id === userId);
  return memberships
    .map((membership) => {
      const team = (store.teams || []).find((item) => item.id === membership.team_id);
      if (!team) return null;
      return {
        ...team,
        role: membership.role,
        joined_at: membership.joined_at,
        isOwner: team.owner_id === userId,
      };
    })
    .filter(Boolean);
}

export async function createLocalTeam(user, payload = {}) {
  const store = await getLocalStore();
  const now = new Date().toISOString();
  const team = {
    id: crypto.randomUUID(),
    name: payload.name,
    description: payload.description || '',
    avatar_url: null,
    owner_id: user.id,
    created_at: now,
    updated_at: now,
  };

  const membership = {
    id: crypto.randomUUID(),
    team_id: team.id,
    user_id: user.id,
    user_email: user.email,
    role: 'admin',
    joined_at: now,
  };

  store.teams = store.teams || [];
  store.teamMembers = store.teamMembers || [];
  store.teams.unshift(team);
  store.teamMembers.push(membership);
  await saveLocalStore(store);

  return {
    ...team,
    role: 'admin',
    isOwner: true,
  };
}

export async function deleteLocalTeam(userId, teamId) {
  const store = await getLocalStore();
  const team = (store.teams || []).find((item) => item.id === teamId);
  if (!team || team.owner_id !== userId) return false;

  store.teams = (store.teams || []).filter((item) => item.id !== teamId);
  store.teamMembers = (store.teamMembers || []).filter((item) => item.team_id !== teamId);
  store.teamInvitations = (store.teamInvitations || []).filter((item) => item.team_id !== teamId);
  store.memories = (store.memories || []).map((memory) =>
    memory.team_id === teamId ? { ...memory, team_id: null, scope: memory.scope === 'team' ? 'private' : memory.scope } : memory
  );
  await saveLocalStore(store);
  return true;
}

export async function getLocalTeamMembership(userId, teamId) {
  const store = await getLocalStore();
  return (store.teamMembers || []).find((item) => item.team_id === teamId && item.user_id === userId) || null;
}

export async function listLocalTeamMembers(teamId) {
  const store = await getLocalStore();
  return (store.teamMembers || [])
    .filter((item) => item.team_id === teamId)
    .map((member) => ({
      id: member.id,
      role: member.role,
      joined_at: member.joined_at,
      user: {
        id: member.user_id,
        email: member.user_email,
        raw_user_meta_data: {},
      },
    }));
}

export async function inviteLocalTeamMember(teamId, invitedBy, payload = {}) {
  const store = await getLocalStore();
  const invitation = {
    id: crypto.randomUUID(),
    team_id: teamId,
    email: payload.email,
    role: payload.role || 'member',
    token: crypto.randomBytes(32).toString('hex'),
    invited_by: invitedBy,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: new Date().toISOString(),
  };

  store.teamInvitations = store.teamInvitations || [];
  store.teamInvitations.push(invitation);
  await saveLocalStore(store);
  return invitation;
}

export async function listLocalTeamInvitations(teamId) {
  const store = await getLocalStore();
  const now = new Date();
  return (store.teamInvitations || []).filter(
    (item) => item.team_id === teamId && !item.accepted_at && new Date(item.expires_at) > now
  );
}

export async function updateLocalTeamMemberRole(teamId, memberId, role) {
  const store = await getLocalStore();
  const index = (store.teamMembers || []).findIndex((item) => item.team_id === teamId && item.id === memberId);
  if (index === -1) return false;
  store.teamMembers[index] = { ...store.teamMembers[index], role };
  await saveLocalStore(store);
  return true;
}

export async function removeLocalTeamMember(teamId, memberId) {
  const store = await getLocalStore();
  const before = (store.teamMembers || []).length;
  store.teamMembers = (store.teamMembers || []).filter((item) => !(item.team_id === teamId && item.id === memberId));
  await saveLocalStore(store);
  return (store.teamMembers || []).length !== before;
}

export async function listLocalTeamMemories(teamId, filters = {}) {
  const store = await getLocalStore();
  return (store.memories || [])
    .filter((item) => item.team_id === teamId && item.status === 'active')
    .filter((item) => (filters.type ? item.type === filters.type : true))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, filters.limit || 50);
}

export async function createLocalTeamMemory(user, teamId, payload = {}) {
  const store = await getLocalStore();
  const memory = buildLocalMemory(user.id, {
    ...payload,
    scope: 'team',
    write_source: payload.write_source || 'team',
    write_reason: payload.write_reason || `Created for team by ${user.email}`,
  });
  memory.team_id = teamId;
  store.memories = store.memories || [];
  store.memories.unshift(memory);
  await saveLocalStore(store);
  return memory;
}

export async function removeLocalTeamMemory(teamId, memoryId) {
  const store = await getLocalStore();
  const index = (store.memories || []).findIndex((item) => item.id === memoryId && item.team_id === teamId);
  if (index === -1) return null;
  store.memories[index] = { ...store.memories[index], status: 'deleted' };
  await saveLocalStore(store);
  return store.memories[index];
}
