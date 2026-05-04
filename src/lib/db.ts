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
  permissionLevel?: 'owner' | 'read' | 'edit';
}

export interface ProjectPermission {
  projectId: string;
  entityType: 'email' | 'domain' | 'public';
  entityValue: string;
  permissionLevel: 'read' | 'edit';
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

let _db: D1Database | null = null;

function getDb(): D1Database | null {
  if (_db) return _db;
  if (process.env.NODE_ENV === 'development') {
    return null; // Fallback to memory in local dev
  }

  try {
    const ctx = getRequestContext();
    const env = ctx.env as Record<string, unknown>;
    _db = ((env['vectorflow'] || env['DB']) as D1Database | undefined) ?? null;
  } catch {
    // If getRequestContext fails, we still want to throw if in production
  }

  if (!_db) {
    throw new Error('CRITICAL FATAL: D1 Database binding "DB" is missing in production environment. Application cannot safely persist data.');
  }

  return _db;
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
  user: { userId: string; email: string },
  patch: { name?: string; data?: ExportData },
): Promise<ProjectMeta | null> {
  const now = new Date().toISOString();
  const db = getDb();
  const callerDomain = user.email.split('@')[1]?.toLowerCase() ?? '';

  if (db) {
    // Check ownership OR edit permissions
    const existing = await db
      .prepare(`
        SELECT p.id, p.user_id 
        FROM projects p
        LEFT JOIN project_permissions pp ON p.id = pp.project_id
        WHERE p.id = ? 
          AND (
            p.user_id = ?
            OR (
              pp.permission_level = 'edit'
              AND (
                (pp.entity_type = 'public' AND pp.entity_value = '*') OR
                (pp.entity_type = 'domain' AND pp.entity_value = ?) OR
                (pp.entity_type = 'email' AND pp.entity_value = ?)
              )
            )
          )
      `)
      .bind(id, user.userId, callerDomain, user.email)
      .first<{ id: string }>();
    if (!existing) return null;

    if (patch.name !== undefined && patch.data !== undefined) {
      await db
        .prepare('UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ?')
        .bind(patch.name, JSON.stringify(patch.data), now, id)
        .run();
    } else if (patch.name !== undefined) {
      await db
        .prepare('UPDATE projects SET name = ?, updated_at = ? WHERE id = ?')
        .bind(patch.name, now, id)
        .run();
    } else if (patch.data !== undefined) {
      await db
        .prepare('UPDATE projects SET data = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(patch.data), now, id)
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
  // local fallback doesn't support granular permissions yet, just checks ownership
  if (!row || row.user_id !== user.userId) return null;

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
 * Lists all discoverable projects visible to a caller with `callerEmail`.
 * Domain restriction is enforced at the query level.
 */
export async function listDiscoverableProjects(callerEmail: string): Promise<ProjectMeta[]> {
  const callerDomain = callerEmail.split('@')[1]?.toLowerCase() ?? '';
  const db = getDb();

  if (db) {
    const { results } = await db
      .prepare(
        `SELECT p.id, p.user_id, p.name, p.is_discoverable, p.domain_restriction, p.created_at, p.updated_at,
           MAX(CASE WHEN pp.permission_level = 'edit' THEN 2 ELSE 1 END) as max_perm
         FROM projects p
         JOIN project_permissions pp ON p.id = pp.project_id
         WHERE (
           (pp.entity_type = 'public' AND pp.entity_value = '*') OR
           (pp.entity_type = 'domain' AND pp.entity_value = ?) OR
           (pp.entity_type = 'email' AND pp.entity_value = ?)
         )
         GROUP BY p.id
         ORDER BY p.updated_at DESC`
      )
      .bind(callerDomain, callerEmail)
      .all<ProjectRow & { max_perm: number }>();
    return results.map((r) => ({
      ...rowToMeta(r),
      permissionLevel: r.max_perm === 2 ? 'edit' : 'read'
    }));
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
        `SELECT p.*,
           MAX(CASE WHEN pp.permission_level = 'edit' THEN 2 ELSE 1 END) as max_perm
         FROM projects p
         JOIN project_permissions pp ON p.id = pp.project_id
         WHERE p.id = ? 
           AND (
             (pp.entity_type = 'public' AND pp.entity_value = '*') OR
             (pp.entity_type = 'domain' AND pp.entity_value = ?) OR
             (pp.entity_type = 'email' AND pp.entity_value = ?)
           )
         GROUP BY p.id`
      )
      .bind(id, callerDomain, callerEmail)
      .first<ProjectRow & { max_perm: number }>();
    if (!row) return null;
    const full = rowToFull(row);
    full.permissionLevel = row.max_perm === 2 ? 'edit' : 'read';
    return full;
  }

  const row = localProjects.get(id);
  if (!row || !row.is_discoverable) return null;
  if (row.domain_restriction && row.domain_restriction.toLowerCase() !== callerDomain) return null;
  return rowToFull(row);
}

/**
 * Fetches the explicit granular permissions for a project.
 */
export async function getProjectPermissions(projectId: string): Promise<ProjectPermission[]> {
  const db = getDb();
  if (db) {
    const { results } = await db
      .prepare('SELECT project_id, entity_type, entity_value, permission_level FROM project_permissions WHERE project_id = ?')
      .bind(projectId)
      .all<any>();
    return results.map(row => ({
      projectId: row.project_id,
      entityType: row.entity_type,
      entityValue: row.entity_value,
      permissionLevel: row.permission_level
    }));
  }
  return [];
}

/**
 * Replaces all explicit granular permissions for a project.
 * Only the owner can do this.
 */
export async function setProjectPermissions(
  projectId: string, 
  userId: string, 
  permissions: Omit<ProjectPermission, 'projectId'>[]
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  // Verify ownership
  const ownerCheck = await db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first();
  if (!ownerCheck) return false;

  // We must execute these sequentially as D1 batching might be complex to type here,
  // or we can just delete and insert.
  await db.prepare('DELETE FROM project_permissions WHERE project_id = ?').bind(projectId).run();

  // Re-insert
  for (const p of permissions) {
    await db
      .prepare('INSERT INTO project_permissions (project_id, entity_type, entity_value, permission_level) VALUES (?, ?, ?, ?)')
      .bind(projectId, p.entityType, p.entityValue, p.permissionLevel)
      .run();
  }
  
  return true;
}
