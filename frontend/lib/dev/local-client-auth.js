const STORAGE_KEY = 'ai-ulu-local-user';

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export function createLocalAuthClient() {
  return {
    auth: {
      async signUp({ email, password }) {
        const data = await postJson('/api/dev-auth/signup', { email, password });
        storeUser(data.user);
        return { data: { user: data.user }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const data = await postJson('/api/dev-auth/login', { email, password });
        storeUser(data.user);
        return { data: { user: data.user }, error: null };
      },
      async getUser() {
        const user = getStoredUser();
        return { data: { user }, error: null };
      },
      async signOut() {
        await postJson('/api/dev-auth/logout');
        storeUser(null);
        return { error: null };
      },
      async updateUser({ password }) {
        const user = getStoredUser();
        if (!user) {
          return { data: { user: null }, error: new Error('Unauthorized') };
        }
        return { data: { user }, error: null };
      },
      async resetPasswordForEmail() {
        return { data: {}, error: null };
      },
    },
  };
}
