import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { LOCAL_AUTH_COOKIE } from '@/lib/dev/local-auth-shared';
import bcrypt from 'bcryptjs';

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

  // SECURITY: Hash password with bcrypt before storing
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: hashedPassword, // Store hash instead of plain text
    created_at: new Date().toISOString(),
  };
  users.push(user);
  await saveLocalUsers(users);
  return { user, error: null };
}

export async function authenticateLocalUser(email, password) {
  const users = await getLocalUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((item) => item.email === normalizedEmail);
  
  if (!user || !user.passwordHash) {
    return { user: null, error: { message: 'Invalid login credentials' } };
  }
  
  // SECURITY: Compare password with bcrypt hash
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { user: null, error: { message: 'Invalid login credentials' } };
  }
  
  return { user, error: null };
}

export async function findLocalUserByEmail(email) {
  if (!email) return null;
  const users = await getLocalUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((item) => item.email === normalizedEmail) || null;
}

export async function findLocalUserById(userId) {
  if (!userId) return null;
  const users = await getLocalUsers();
  return users.find((item) => item.id === userId) || null;
}

export async function updateLocalUserPassword(userId, password) {
  const users = await getLocalUsers();
  const index = users.findIndex((item) => item.id === userId);
  if (index === -1) {
    return { error: { message: 'User not found' } };
  }
  
  // SECURITY: Hash new password with bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  users[index] = { ...users[index], passwordHash: hashedPassword };
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
  const sanitized = {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
  // SECURITY: Never expose password hash to client
  return sanitized;
}

export function buildLocalAuthCookie(user) {
  // SECURITY: Add Secure flag for production, HttpOnly already set
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  return `${LOCAL_AUTH_COOKIE}=${encodeURIComponent(
    JSON.stringify(sanitizeLocalUser(user))
  )}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
}

export function clearLocalAuthCookie() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  return `${LOCAL_AUTH_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag}`;
}

export function getLocalAuthCookieName() {
  return LOCAL_AUTH_COOKIE;
}
