DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'payments.ledger_view'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'payments.ledger_view';
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
INSERT INTO permissions (id, key, resource, action, description, category, is_system)
SELECT gen_random_uuid(), v.key::app_permission, v.resource, v.action, v.description::jsonb, v.category::jsonb, true
FROM (VALUES
    (
      'payments.ledger_view',
      'payments',
      'ledger_view',
      '{"ar": "عرض سجل المدفوعات", "en": "View payments ledger"}',
      '{"ar": "المدفوعات", "en": "Payments"}'
    )
) AS v(key, resource, action, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.key = v.key::app_permission);--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
-- super_admin + academy_admin + supervisor_default + parent_default
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key = 'payments.ledger_view'
WHERE g.slug IN ('super_admin', 'academy_admin', 'supervisor_default', 'parent_default')
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id) ON CONFLICT DO NOTHING;--> statement-breakpoint

