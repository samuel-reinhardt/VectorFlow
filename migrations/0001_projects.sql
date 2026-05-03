-- VectorFlow D1 Schema
-- Migration: 0001_projects
-- Run with: wrangler d1 execute vectorflow --file=migrations/0001_projects.sql

CREATE TABLE IF NOT EXISTS projects (
  id               TEXT PRIMARY KEY,        -- UUID matching ExportData.projectId
  user_id          TEXT NOT NULL,           -- Firebase UID of the owner
  name             TEXT NOT NULL,           -- Human-readable project name
  data             TEXT NOT NULL,           -- JSON-serialised ExportData
  is_discoverable  INTEGER NOT NULL DEFAULT 0,
  domain_restriction TEXT,                  -- e.g. "bytes.co" or NULL (open)
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_user
  ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_discovery
  ON projects(is_discoverable, domain_restriction);
