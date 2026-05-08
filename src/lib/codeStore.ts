// Server-side in-memory store shared across API routes (single instance)
const globalStore = globalThis as typeof globalThis & {
  __codeStore?: Map<string, { code: string; expiresAt: number }>;
};

if (!globalStore.__codeStore) {
  globalStore.__codeStore = new Map();
}

const store = globalStore.__codeStore;

export const codeStore = {
  set(email: string, code: string) {
    store.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
    });
  },

  verify(email: string, code: string): boolean {
    const entry = store.get(email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      store.delete(email.toLowerCase());
      return false;
    }
    if (entry.code !== code) return false;
    store.delete(email.toLowerCase()); // single use
    return true;
  },

  has(email: string): boolean {
    const entry = store.get(email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      store.delete(email.toLowerCase());
      return false;
    }
    return true;
  },
};
