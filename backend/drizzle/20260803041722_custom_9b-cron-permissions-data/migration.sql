-- Source: 9b-cron-permissions-data.sql
-- Migration: Cron service permissions — data (Phase 2)
-- Inserts the `cron.manage` permission row + grants it to `super_admin` and `academy_admin` groups.
-- MUST run AFTER `9a-cron-permissions-enum.sql` has been committed so the enum
-- value already exists when these INSERTs cast it to `::app_permission`.

DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'cron.manage',
    'cron',
    'manage',
    '{"ar": "إدارة مهام الكرون", "en": "Manage cron jobs"}'::jsonb,
    '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
END $$;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'cron.manage'
ON CONFLICT DO NOTHING;--> statement-breakpoint

