-- Accounting Expenses permissions (expense ledger: manual operational
-- expenses + auto-generated salary payouts from carryover settlements).
-- Adds the `accounting.expenses_view` + `accounting.expenses_manage`
-- AppPermission values and grants them to super_admin + academy_admin —
-- mirroring the `accounting.carryover_view` / `accounting.carryover_manage`
-- grants. The view permission stays separate from manage so read-only
-- auditors can be granted view-only access without create/edit/delete/
-- bulk-delete/export capability.
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.expenses_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.expenses_manage';

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
    'accounting.expenses_view',
    'accounting',
    'expenses_view',
    '{"ar": "عرض سجل المصروفات", "en": "View the expense ledger"}'::jsonb,
    '{"ar": "المحاسبة", "en": "Accounting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'accounting.expenses_manage',
    'accounting',
    'expenses_manage',
    '{"ar": "إدارة سجل المصروفات (إنشاء، تعديل، حذف، حذف جماعي، تصدير)", "en": "Manage the expense ledger (create, edit, delete, bulk delete, export)"}'::jsonb,
    '{"ar": "المحاسبة", "en": "Accounting"}'::jsonb,
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
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.expenses_view'
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.expenses_manage'
ON CONFLICT DO NOTHING;
