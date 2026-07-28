-- Migration: Settings page permissions — data (Phase 2)
-- Inserts the 7 `settings.*` permission rows + grants them to the `super_admin` group.
-- MUST run AFTER `7a-settings-permissions-enum.sql` has been committed so the enum
-- values already exist when these INSERTs cast them to `::app_permission`.
--
-- Keys: settings.view, settings.edit_general, settings.edit_env, settings.edit_session,
--       settings.audit_view, settings.site_content_manage, settings.timezones_view

-- Temporarily disable the system-permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'settings.view'::app_permission,
    'settings',
    'view',
    '{"ar": "عرض صفحة الإعدادات", "en": "View the settings page"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'settings.edit_general'::app_permission,
    'settings',
    'edit_general',
    '{"ar": "تعديل إعدادات النظام العامة", "en": "Edit general system settings"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'settings.edit_env'::app_permission,
    'settings',
    'edit_env',
    '{"ar": "تعديل تجاوزات متغيرات البيئة", "en": "Edit environment variable overrides"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'settings.edit_session'::app_permission,
    'settings',
    'edit_session',
    '{"ar": "تعديل إعدادات الجلسة لكل دور", "en": "Edit per-role session configuration"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'settings.audit_view'::app_permission,
    'settings',
    'audit_view',
    '{"ar": "عرض سجلات المراجعة", "en": "View audit logs"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'settings.site_content_manage'::app_permission,
    'settings',
    'site_content_manage',
    '{"ar": "إدارة محتوى الموقع", "en": "Manage site content"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'settings.timezones_view'::app_permission,
    'settings',
    'timezones_view',
    '{"ar": "عرض كتالوج المناطق الزمنية", "en": "View timezone catalog"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'settings.view',
    'settings.edit_general',
    'settings.edit_env',
    'settings.edit_session',
    'settings.audit_view',
    'settings.site_content_manage',
    'settings.timezones_view'
  )
ON CONFLICT DO NOTHING;
