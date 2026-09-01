-- Accounting Credits permission (student credit-hour adjustments).
-- Adds the `accounting.credits_manage` AppPermission value and grants it to
-- super_admin + academy_admin — mirroring the `accounting.payments_manage` grants.
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.credits_manage';

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
    'accounting.credits_manage',
    'accounting',
    'credits_manage',
    '{"ar": "إدارة تعديلات رصيد ساعات الطلاب", "en": "Manage student credit-hour adjustments (add / subtract / carryover)"}'::jsonb,
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
  AND p.key = 'accounting.credits_manage'
ON CONFLICT DO NOTHING;
