/**
 * Edge-compatible Cloudflare KV client for the VectorFlow discovery registry.
 *
 * In production (Cloudflare Pages / Workers) the `VF_DISCOVERY` binding is
 * provided automatically by the runtime via `process.env` interop or the
 * `getRequestContext()` helper from `@cloudflare/next-on-pages`.
 *
 * During local Next.js development (`next dev`) no KV binding is available,
 * so the module falls back to an **in-memory Map** that persists for the
 * lifetime of the dev-server process. This is sufficient for local testing.
 *
 * Required Cloudflare environment binding:
 *   VF_DISCOVERY — KV namespace bound in wrangler.toml
 */

import { getRequestContext } from '@cloudflare/next-on-pages';

// ---------------------------------------------------------------------------
// Local-dev fallback — in-memory KV store
// ---------------------------------------------------------------------------

const localKv = new Map<string, string>();

// ---------------------------------------------------------------------------
// KV abstraction
// ---------------------------------------------------------------------------

/** Minimal interface that mirrors the subset of KVNamespace we actually use. */
interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
}

/**
 * Resolves the `VF_DISCOVERY` KV namespace from the Cloudflare runtime
 * context. Falls back to the in-memory store when running under `next dev`.
 */
function getKvNamespace(): KvNamespace {
  try {
    const ctx = getRequestContext();
    const ns = (ctx.env as Record<string, unknown>)['VF_DISCOVERY'] as KvNamespace | undefined;
    if (ns) return ns;
  } catch {
    // getRequestContext() throws outside of a Cloudflare Pages request —
    // e.g., during `next dev`. Fall through to the in-memory fallback.
  }

  // ── In-memory fallback for local development ───────────────────────────
  return {
    async get(key) {
      return localKv.get(key) ?? null;
    },
    async put(key, value) {
      localKv.set(key, value);
    },
    async delete(key) {
      localKv.delete(key);
    },
    async list({ prefix } = {}) {
      const keys = [...localKv.keys()]
        .filter((k) => (prefix ? k.startsWith(prefix) : true))
        .map((name) => ({ name }));
      return { keys };
    },
  };
}

// ---------------------------------------------------------------------------
// Public KV store API
// ---------------------------------------------------------------------------

export interface KvStore {
  /** Returns the deserialized value for `key`, or `null` if absent. */
  get<T>(key: string): Promise<T | null>;
  /** Serializes and stores `value` under `key`. */
  set<T>(key: string, value: T): Promise<void>;
  /** Removes a key. No-op if the key does not exist. */
  del(key: string): Promise<void>;
  /**
   * Returns all values whose keys start with `prefix`.
   * Order is implementation-defined (KV does not guarantee sorted output).
   */
  list<T>(prefix?: string): Promise<T[]>;
}

/**
 * Returns a typed KV store client backed by the Cloudflare `VF_DISCOVERY`
 * namespace (or the in-memory fallback during local development).
 */
export function createKvStore(): KvStore {
  const ns = getKvNamespace();

  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = await ns.get(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, value: T): Promise<void> {
      await ns.put(key, JSON.stringify(value));
    },

    async del(key: string): Promise<void> {
      await ns.delete(key);
    },

    async list<T>(prefix?: string): Promise<T[]> {
      const { keys } = await ns.list(prefix ? { prefix } : undefined);
      const values = await Promise.all(
        keys.map(async ({ name }) => {
          const raw = await ns.get(name);
          if (raw === null) return null;
          try {
            return JSON.parse(raw) as unknown;
          } catch {
            return null;
          }
        }),
      );
      return values.filter((v): v is NonNullable<typeof v> => v !== null) as T[];
    },
  };
}
