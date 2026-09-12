-- Migration: WhatsApp groups permissions — data (Phase 2)
-- Inserts the 2 `whatsapp.groups_*` permission rows and grants them:
--   whatsapp.groups_view   -> super_admin, academy_admin, staff_default, supervisor_default
--   whatsapp.groups_manage -> super_admin, academy_admin (creation / invite links / join requests / messages)
-- MUST run AFTER `47a-whatsapp-groups-permissions-enum.sql` has been committed so the
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
    'whatsapp.groups_view',
    'whatsapp',
    'groups_view',
    '{"ar": "عرض مجموعات واتساب", "en": "View WhatsApp groups"}'::jsonb,
    '{"ar": "واتساب", "en": "WhatsApp"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'whatsapp.groups_manage',
    'whatsapp',
    'groups_manage',
    '{"ar": "إدارة مجموعات واتساب (الإنشاء، روابط الدعوة، طلبات الانضمام، الرسائل)", "en": "Manage WhatsApp groups (creation, invite links, join requests, messages)"}'::jsonb,
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
  AND p.key = 'whatsapp.groups_view'
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'whatsapp.groups_manage'
ON CONFLICT DO NOTHING;
