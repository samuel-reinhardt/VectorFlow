/**
 * Cloudflare D1 client for VectorFlow project storage.
 *
 * In production (Cloudflare Pages) the `DB` binding is provided by the
 * runtime via `getRequestContext()` from `@cloudflare/next-on-pages`.
 *
 * During local `next dev` the binding is unavailable, so all methods fall
 * back to an **in-memory Map** that persists for the lifetime of the dev
 * server process. This allows full local development without wrangler.
 *
 * For a D1-backed local environment, use:
 *   pnpm pages:dev
 *
 * Required wrangler.toml binding:
 *   [[d1_databases]]
 *   binding = "DB"
 *   database_name = "vectorflow"
 *   database_id = "<id from wrangler d1 create vectorflow>"
 */

import { getRequestContext } from '@cloudflare/next-on-pages';
import type { ExportData } from '@/lib/export-import';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  data: string; // serialised ExportData
  is_discoverable: number; // 0 | 1
  domain_restriction: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMeta {
  id: string;
  userId: string;
  name: string;
  isDiscoverable: boolean;
  domainRestriction: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFull extends ProjectMeta {
  data: ExportData;
}

// ---------------------------------------------------------------------------
// Local-dev fallback — in-memory store
// ---------------------------------------------------------------------------

const localProjects = new Map<string, ProjectRow>();

// ---------------------------------------------------------------------------
// D1 access
// ---------------------------------------------------------------------------

type D1Database = {
  prepare(query: string): D1PreparedStatement;
};
type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
};

function getDb(): D1Database | null {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as Record<string, unknown>)['DB'] as D1Database | undefined;
    return db ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToMeta(row: ProjectRow): ProjectMeta {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDiscoverable: row.is_discoverable === 1,
    domainRestriction: row.domain_restriction,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToFull(row: ProjectRow): ProjectFull {
  return {
    ...rowToMeta(row),
    data: JSON.parse(row.data) as ExportData,
  };
}

// ---------------------------------------------------------------------------
// Public DB API
// ---------------------------------------------------------------------------

/**
 * Lists all projects belonging to `userId` (metadata only, no data blob).
 * Ordered newest-first.
 */
export async function listProjects(userId: string): Promise<ProjectMeta[]> {
  const db = getDb();

  if (db) {
    const { results } = await db
      .prepare(
        'SELECT id, user_id, name, is_discoverable, domain_restriction, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
      )
      .bind(userId)
      .all<ProjectRow>();
    return results.map(rowToMeta);
  }

  // Local fallback
  return [...localProjects.values()]
    .filter((r) => r.user_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map(rowToMeta);
}

/**
 * Returns a single project (including data blob) for the given owner.
 * Returns null if not found or if the project belongs to another user.
 */
export async function getProject(id: string, userId: string): Promise<ProjectFull | null> {
  const db = getDb();

  if (db) {
    const row = await db
      .prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first<ProjectRow>();
    return row ? rowToFull(row) : null;
  }

  const row = localProjects.get(id);
  if (!row || row.user_id !== userId) return null;
  return rowToFull(row);
}

/**
 * Creates a new project. Throws if a project with this id already exists.
 */
export async function createProject(params: {
  id: string;
  userId: string;
  name: string;
  data: ExportData;
}): Promise<ProjectMeta> {
  const now = new Date().toISOString();
  const row: ProjectRow = {
    id: params.id,
    user_id: params.userId,
    name: params.name,
    data: JSON.stringify(params.data),
    is_discoverable: 0,
    domain_restriction: null,
    created_at: now,
    updated_at: now,
  };

  const db = getDb();

  if (db) {
    await db
      .prepare(
        'INSERT INTO projects (id, user_id, name, data, is_discoverable, domain_restriction, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NULL, ?, ?)',
      )
      .bind(row.id, row.user_id, row.name, row.data, now, now)
      .run();
    return rowToMeta(row);
  }

  localProjects.set(row.id, row);
  return rowToMeta(row);
}

/**
 * Updates a project's data and/or name. Only the owner can update.
 * Returns null if the project does not exist or belongs to another user.
 */
export async function updateProject(
  id: string,
  userId: string,
  patch: { name?: string; data?: ExportData },
): Promise<ProjectMeta | null> {
  const now = new Date().toISOString();
  const db = getDb();

  if (db) {
    // Check ownership first
    const existing = await db
      .prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first<{ id: string }>();
    if (!existing) return null;

    if (patch.name !== undefined && patch.data !== undefined) {
      await db
        .prepare('UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?')
        .bind(patch.name, JSON.stringify(patch.data), now, id, userId)
        .run();
    } else if (patch.name !== undefined) {
      await db
        .prepare('UPDATE projects SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?')
        .bind(patch.name, now, id, userId)
        .run();
    } else if (patch.data !== undefined) {
      await db
        .prepare('UPDATE projects SET data = ?, updated_at = ? WHERE id = ? AND user_id = ?')
        .bind(JSON.stringify(patch.data), now, id, userId)
        .run();
    }

    const updated = await db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .bind(id)
      .first<ProjectRow>();
    return updated ? rowToMeta(updated) : null;
  }

  // Local fallback
  const row = localProjects.get(id);
  if (!row || row.user_id !== userId) return null;

  if (patch.name !== undefined) row.name = patch.name;
  if (patch.data !== undefined) row.data = JSON.stringify(patch.data);
  row.updated_at = now;
  localProjects.set(id, row);
  return rowToMeta(row);
}

/**
 * Deletes a project. Only the owner can delete.
 * Returns true on success, false if not found or access denied.
 */
export async function deleteProject(id: string, userId: string): Promise<boolean> {
  const db = getDb();

  if (db) {
    const result = await db
      .prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();
    return result.meta.changes > 0;
  }

  const row = localProjects.get(id);
  if (!row || row.user_id !== userId) return false;
  localProjects.delete(id);
  return true;
}

/**
 * Updates a project's discovery settings. Only the owner can change this.
 */
export async function updateDiscovery(
  id: string,
  userId: string,
  isDiscoverable: boolean,
  domainRestriction: string | null,
): Promise<ProjectMeta | null> {
  const now = new Date().toISOString();
  const db = getDb();

  if (db) {
    const result = await db
      .prepare(
        'UPDATE projects SET is_discoverable = ?, domain_restriction = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      )
      .bind(isDiscoverable ? 1 : 0, domainRestriction, now, id, userId)
      .run();
    if (result.meta.changes === 0) return null;
    const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<ProjectRow>();
    return updated ? rowToMeta(updated) : null;
  }

  const row = localProjects.get(id);
  if (!row || row.user_id !== userId) return null;
  row.is_discoverable = isDiscoverable ? 1 : 0;
  row.domain_restriction = domainRestriction;
  row.updated_at = now;
  localProjects.set(id, row);
  return rowToMeta(row);
}

/**
 * Lists all discoverable projects visible to a caller with `callerEmail`.
 * Domain restriction is enforced at the query level.
 */
export async function listDiscoverableProjects(callerEmail: string): Promise<ProjectMeta[]> {
  const callerDomain = callerEmail.split('@')[1]?.toLowerCase() ?? '';
  const db = getDb();

  if (db) {
    // Return projects where: discoverable=1 AND (no domain restriction OR domain matches caller)
    const { results } = await db
      .prepare(
        `SELECT id, user_id, name, is_discoverable, domain_restriction, created_at, updated_at
         FROM projects
         WHERE is_discoverable = 1
           AND (domain_restriction IS NULL OR lower(domain_restriction) = ?)
         ORDER BY updated_at DESC`,
      )
      .bind(callerDomain)
      .all<ProjectRow>();
    return results.map(rowToMeta);
  }

  // Local fallback
  return [...localProjects.values()]
    .filter((r) => {
      if (!r.is_discoverable) return false;
      if (!r.domain_restriction) return true;
      return r.domain_restriction.toLowerCase() === callerDomain;
    })
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map(rowToMeta);
}

/**
 * Fetches a discoverable project's data for a non-owner reader.
 * Enforces domain restriction. Returns null if not found, not discoverable,
 * or domain doesn't match.
 */
export async function getDiscoverableProject(
  id: string,
  callerEmail: string,
): Promise<ProjectFull | null> {
  const callerDomain = callerEmail.split('@')[1]?.toLowerCase() ?? '';
  const db = getDb();

  if (db) {
    const row = await db
      .prepare(
        `SELECT * FROM projects WHERE id = ? AND is_discoverable = 1
         AND (domain_restriction IS NULL OR lower(domain_restriction) = ?)`,
      )
      .bind(id, callerDomain)
      .first<ProjectRow>();
    return row ? rowToFull(row) : null;
  }

  const row = localProjects.get(id);
  if (!row || !row.is_discoverable) return null;
  if (row.domain_restriction && row.domain_restriction.toLowerCase() !== callerDomain) return null;
  return rowToFull(row);
}
