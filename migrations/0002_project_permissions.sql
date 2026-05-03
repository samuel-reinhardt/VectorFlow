-- Migration: 0002_project_permissions
-- Run with: wrangler d1 execute vectorflow --file=migrations/0002_project_permissions.sql

CREATE TABLE IF NOT EXISTS project_permissions (
  project_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'email', 'domain', 'public'
  entity_value TEXT NOT NULL, -- e.g. 'john@example.com', 'bytes.co', '*'
  permission_level TEXT NOT NULL, -- 'read', 'edit'
  PRIMARY KEY (project_id, entity_type, entity_value)
);

CREATE INDEX IF NOT EXISTS idx_project_permissions_entity
  ON project_permissions(entity_type, entity_value);

-- Migrate existing data
INSERT INTO project_permissions (project_id, entity_type, entity_value, permission_level)
SELECT id, 'domain', domain_restriction, 'read'
FROM projects
WHERE is_discoverable = 1 AND domain_restriction IS NOT NULL;

INSERT INTO project_permissions (project_id, entity_type, entity_value, permission_level)
SELECT id, 'public', '*', 'read'
FROM projects
WHERE is_discoverable = 1 AND domain_restriction IS NULL;
