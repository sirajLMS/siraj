-- Source: 39-accounting-reports-permissions.sql
-- Accounting Reports permissions (session-event audit read model).
-- Adds the `accounting.reports_view` + `accounting.reports_manage`
-- AppPermission values and grants them to super_admin + academy_admin —
-- mirroring the `accounting.payroll_view` / `accounting.payroll_manage`
-- grants. The view permission stays separate from manage so read-only
-- auditors can be granted view-only access. Note: in the session-audit
-- report surface, `reports_manage` only gates the "open audit page"
-- deep-link shortcut; the payroll override mutation itself stays gated by
-- `accounting.payroll_manage`.
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.reports_view';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.reports_manage';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'accounting.reports_view',
    'accounting',
    'reports_view',
    '{"ar": "عرض تقارير تدقيق جلسات الحصص", "en": "View session-event audit reports"}'::jsonb,
    '{"ar": "المحاسبة", "en": "Accounting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'accounting.reports_manage',
    'accounting',
    'reports_manage',
    '{"ar": "إدارة تقارير تدقيق الجلسات (فتح صفحة التدقيق من الشبكة)", "en": "Manage session audit reports (open audit page from the grid)"}'::jsonb,
    '{"ar": "المحاسبة", "en": "Accounting"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.reports_view'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.reports_manage'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

