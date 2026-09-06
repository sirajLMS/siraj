-- Accounting Carryover permissions (carryover balance settlements: sessions
-- rolled forward across billing periods into payable balances).
-- Adds the `accounting.carryover_view` + `accounting.carryover_manage`
-- AppPermission values and grants them to super_admin + academy_admin —
-- mirroring the `accounting.reports_view` / `accounting.reports_manage`
-- grants. The view permission stays separate from manage so read-only
-- auditors can be granted view-only access without bulk-create/edit/delete/
-- to-expense capability.
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.carryover_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.carryover_manage';

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
    'accounting.carryover_view',
    'accounting',
    'carryover_view',
    '{"ar": "عرض أرصدة الحصص المرحّلة للمعلمين", "en": "View teacher carryover balance settlements"}'::jsonb,
    '{"ar": "المحاسبة", "en": "Accounting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'accounting.carryover_manage',
    'accounting',
    'carryover_manage',
    '{"ar": "إدارة أرصدة الحصص المرحّلة (إنشاء مجمع، تعديل، حذف، تحويل إلى مصروف)", "en": "Manage carryover balances (bulk create, edit, delete, convert to expense)"}'::jsonb,
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
  AND p.key = 'accounting.carryover_view'
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.carryover_manage'
ON CONFLICT DO NOTHING;
