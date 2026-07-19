-- Migration: Meeting permissions
-- Ported from seed-meeting-permissions.ts

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_providers.manage_catalog';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_class';

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
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
    'meeting_providers.manage_catalog'::app_permission,
    'meeting_providers',
    'manage_catalog',
    '{"ar": "إدارة كتالوج مزودي الاجتماعات", "en": "Manage meeting provider catalog entries"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_own'::app_permission,
    'meeting_configs',
    'manage_own',
    '{"ar": "إدارة إعدادات الاجتماعات الخاصة", "en": "Manage own online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_other'::app_permission,
    'meeting_configs',
    'manage_other',
    '{"ar": "إدارة إعدادات اجتماعات المستخدمين الآخرين", "en": "Manage other users online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_class'::app_permission,
    'meeting_configs',
    'manage_class',
    '{"ar": "إدارة إعدادات الاجتماعات على مستوى الحصة", "en": "Manage class-scoped online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
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
    'meeting_providers.manage_catalog',
    'meeting_configs.manage_own',
    'meeting_configs.manage_other',
    'meeting_configs.manage_class'
  )
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'meeting_providers.manage_catalog',
    'meeting_configs.manage_own',
    'meeting_configs.manage_other',
    'meeting_configs.manage_class'
  )
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'meeting_configs.manage_own'
  )
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'parent_default'
  AND p.key IN (
    'meeting_configs.manage_own'
  )
ON CONFLICT DO NOTHING;

