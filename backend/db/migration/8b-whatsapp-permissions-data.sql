-- Migration: WhatsApp permissions — data (Phase 2)
-- Inserts the 3 `whatsapp.*` permission rows + grants them to the `super_admin` group.
-- MUST run AFTER `8a-whatsapp-permissions-enum.sql` has been committed so the enum
-- values already exist when these INSERTs cast them to `::app_permission`.
--
-- Ordering constraint: This migration MUST run BEFORE drizzle migration
-- `20260801025328_old_network` and AFTER drizzle migration
-- `20260731224523_custom_8a-whatsapp-permissions-enum`. The drizzle migration
-- subsystem and manual SQL migrations run independently — this ordering is not
-- enforced by the tooling and must be respected by the deployment process.
--
-- Keys: whatsapp.view, whatsapp.config_manage, whatsapp.templates_manage
-- Note: whatsapp.dispatch intentionally omitted — no send-mutation exists in v1 (BL2)

-- Temporarily disable the system-permission trigger to allow INSERT with is_system = true.
-- Fail-hard: if the trigger cannot be disabled, the migration must abort so we don't
-- insert system rows without the guard in place.
ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'whatsapp.view',
    'whatsapp',
    'view',
    '{"ar": "عرض إعدادات واتساب", "en": "View WhatsApp settings"}'::jsonb,
    '{"ar": "واتساب", "en": "WhatsApp"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'whatsapp.config_manage',
    'whatsapp',
    'config_manage',
    '{"ar": "إدارة تكوين حسابات واتساب", "en": "Manage WhatsApp account configuration"}'::jsonb,
    '{"ar": "واتساب", "en": "WhatsApp"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'whatsapp.templates_manage',
    'whatsapp',
    'templates_manage',
    '{"ar": "إدارة قوالب واتساب", "en": "Manage WhatsApp templates"}'::jsonb,
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
  g.slug = 'super_admin'
  AND p.key IN (
    'whatsapp.view',
    'whatsapp.config_manage',
    'whatsapp.templates_manage'
  )
ON CONFLICT DO NOTHING;
