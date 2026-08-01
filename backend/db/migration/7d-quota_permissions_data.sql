-- Migration: Quota permissions data
-- Inserts quotas.view and quotas.manage into permissions table and grants to super_admin, staff, and supervisor.

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
    'quotas.view',
    'quotas',
    'view',
    '{"ar": "عرض خطص ومحفظات الحصص", "en": "View quotas and balance breakdown"}'::jsonb,
    '{"ar": "الفواتير والحصص", "en": "Billing & Quotas"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'quotas.manage',
    'quotas',
    'manage',
    '{"ar": "إنشاء وتحديث وإلغاء الحصص", "en": "Create, update, and delete quotas"}'::jsonb,
    '{"ar": "الفواتير والحصص", "en": "Billing & Quotas"}'::jsonb,
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
  RAISE NOTICE 'Could not re-enable trigger trg_protect_system_permissions on permissions table: %', SQLERRM;
END $$;

-- Grant quotas.view to all groups that need read access.
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'staff', 'supervisor', 'admin', 'manager')
  AND p.key = 'quotas.view'
ON CONFLICT DO NOTHING;

-- Grant quotas.manage only to groups that should have full create/update/delete
-- capability (super_admin, admin, manager). Staff and supervisor are intentionally
-- excluded from quotas.manage to prevent privilege expansion of delete capability.
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'admin', 'manager')
  AND p.key = 'quotas.manage'
ON CONFLICT DO NOTHING;
