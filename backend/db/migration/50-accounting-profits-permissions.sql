-- Accounting Profits permissions (profit & loss dashboard: read-only
-- executive reporting across payments income, expenses, teacher payroll,
-- and carryover settlements).
-- Adds the `accounting.profits_view` AppPermission value and grants it to
-- super_admin + academy_admin — mirroring the `accounting.expenses_view`
-- grants. No manage variant is defined: the dashboard is read-only, so no
-- create/edit/delete capability exists to gate.
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.profits_view';

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
    'accounting.profits_view',
    'accounting',
    'profits_view',
    '{"ar": "عرض لوحة الأرباح والخسائر", "en": "View the profit & loss dashboard"}'::jsonb,
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
  AND p.key = 'accounting.profits_view'
ON CONFLICT DO NOTHING;
