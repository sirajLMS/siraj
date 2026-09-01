-- Accounting Payroll permissions (teacher payroll calculation & overrides).
-- Adds the `accounting.payroll_view` + `accounting.payroll_manage` AppPermission
-- values and grants them to super_admin + academy_admin — mirroring the
-- `accounting.credits_manage` / `accounting.payments_manage` grants. The view
-- permission stays separate from manage so read-only auditors can be granted
-- view-only access without override capability.
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.payroll_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.payroll_manage';

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
    'accounting.payroll_view',
    'accounting',
    'payroll_view',
    '{"ar": "عرض تقارير وحسابات رواتب المعلمين", "en": "View teacher payroll reports and calculations"}'::jsonb,
    '{"ar": "المحاسبة", "en": "Accounting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'accounting.payroll_manage',
    'accounting',
    'payroll_manage',
    '{"ar": "إدارة رواتب المعلمين (إعادة الحساب، التجاوز، تحديد المدفوع)", "en": "Manage teacher payroll (recalculate, override, mark paid)"}'::jsonb,
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
  AND p.key = 'accounting.payroll_view'
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.payroll_manage'
ON CONFLICT DO NOTHING;
