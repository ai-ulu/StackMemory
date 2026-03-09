import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { LOCAL_AUTH_COOKIE } from '@/lib/dev/local-auth-shared';

const DEV_DATA_DIR = path.join(process.cwd(), '.local-dev');
const USERS_FILE = path.join(DEV_DATA_DIR, 'users.json');
const STORE_FILE = path.join(DEV_DATA_DIR, 'store.json');
async function ensureDir() {
  await fs.mkdir(DEV_DATA_DIR, { recursive: true });
}

async function readJson(file, fallback) {
  try {
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}

export async function getLocalUsers() {
  return readJson(USERS_FILE, []);
}

export async function saveLocalUsers(users) {
  await writeJson(USERS_FILE, users);
}

export async function createLocalUser(email, password) {
  const users = await getLocalUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    return { user: null, error: { message: 'User already registered' } };
  }

  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password,
    created_at: new Date().toISOString(),
  };
  users.push(user);
  await saveLocalUsers(users);
  return { user, error: null };
}

export async function authenticateLocalUser(email, password) {
  const users = await getLocalUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((item) => item.email === normalizedEmail && item.password === password);
  if (!user) {
    return { user: null, error: { message: 'Invalid login credentials' } };
  }
  return { user, error: null };
}

export async function updateLocalUserPassword(userId, password) {
  const users = await getLocalUsers();
  const index = users.findIndex((item) => item.id === userId);
  if (index === -1) {
    return { error: { message: 'User not found' } };
  }
  users[index] = { ...users[index], password };
  await saveLocalUsers(users);
  return { error: null };
}

export async function getLocalStore() {
  return readJson(STORE_FILE, {
    conversations: [],
    messages: [],
    memories: [],
    memorySettings: {},
    apiKeys: [],
    apiKeyLogs: [],
    sharedLinks: [],
    teams: [],
    teamMembers: [],
    teamInvitations: [],
  });
}

export async function saveLocalStore(store) {
  await writeJson(STORE_FILE, store);
}

export function sanitizeLocalUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
}

export function buildLocalAuthCookie(user) {
  return `${LOCAL_AUTH_COOKIE}=${encodeURIComponent(
    JSON.stringify(sanitizeLocalUser(user))
  )}; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearLocalAuthCookie() {
  return `${LOCAL_AUTH_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`;
}

export function getLocalAuthCookieName() {
  return LOCAL_AUTH_COOKIE;
}
