-- Migration: WhatsApp inbox permissions — data (Phase 2)
-- Inserts the 2 `whatsapp.inbox_*` permission rows and grants them:
--   whatsapp.inbox_view   -> super_admin, academy_admin, staff_default, supervisor_default
--   whatsapp.inbox_manage -> super_admin, academy_admin (reserved for the reply composer)
-- MUST run AFTER `41a-whatsapp-inbox-permissions-enum.sql` has been committed so the
-- enum values already exist when these INSERTs cast them to `::app_permission`.
-- Idempotent: safe to re-run.

-- Temporarily disable the system-permission trigger to allow INSERT with is_system = true.
-- Fail-hard: if the trigger cannot be disabled, the migration must abort so we don't
-- insert system rows without the guard in place.
ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'whatsapp.inbox_view',
    'whatsapp',
    'inbox_view',
    '{"ar": "عرض صندوق وارد واتساب", "en": "View WhatsApp inbox"}'::jsonb,
    '{"ar": "واتساب", "en": "WhatsApp"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'whatsapp.inbox_manage',
    'whatsapp',
    'inbox_manage',
    '{"ar": "إدارة صندوق وارد واتساب (الرد على المحادثات)", "en": "Manage WhatsApp inbox (reply composer)"}'::jsonb,
    '{"ar": "واتساب", "en": "WhatsApp"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;

-- Re-enable the system-permission trigger. Fail-hard: if this fails the trigger stays
-- disabled (a security regression) — better to surface the error than silently leave
-- the guard off.
ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin', 'staff_default', 'supervisor_default')
  AND p.key = 'whatsapp.inbox_view'
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'whatsapp.inbox_manage'
ON CONFLICT DO NOTHING;
