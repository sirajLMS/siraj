-- Source: 48-storage-and-meeting-integrations-permissions.sql
-- Migration: Storage + meeting-integrations permissions — data
-- Seeds the `storage.manage` and `settings.edit_meeting_integrations` permission
-- rows and grants both to super_admin + academy_admin.
-- The `app_permission` enum already contains both values (derived from the TS
-- enum in backend/enum/permissions/permission.enum.ts), so no ALTER TYPE is
-- needed here — only the permissions rows and the group grants were missing.
-- Idempotent: safe to re-run.

-- Temporarily disable the system-permission trigger to allow INSERT with is_system = true.
-- Fail-hard: if the trigger cannot be disabled, the migration must abort so we don't
-- insert system rows without the guard in place.
ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;--> statement-breakpoint
INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'storage.manage',
    'storage',
    'manage',
    '{"ar": "إدارة التخزين", "en": "Manage storage"}'::jsonb,
    '{"ar": "التخزين", "en": "Storage"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'settings.edit_meeting_integrations',
    'settings',
    'edit_meeting_integrations',
    '{"ar": "إدارة تكاملات الاجتماعات", "en": "Manage meeting integrations"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;--> statement-breakpoint
-- Re-enable the system-permission trigger. Fail-hard: if this fails the trigger stays
-- disabled (a security regression) — better to surface the error than silently leave
-- the guard off.
ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'storage.manage'
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'settings.edit_meeting_integrations'
ON CONFLICT DO NOTHING;--> statement-breakpoint

