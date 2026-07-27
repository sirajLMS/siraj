-- Source: 5a-billing_manage_currencies_permission.sql
-- Migration: Billing Manage Currencies Permission (incremental)
-- Adds billing.manage_currencies — activate/deactivate supported currencies in the catalog.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.manage_currencies';--> statement-breakpoint
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
    'billing.manage_currencies'::app_permission,
    'billing',
    'manage_currencies',
    '{"ar": "تفعيل وإلغاء تفعيل العملات المدعومة في الكتالوج", "en": "Activate and deactivate supported currencies in the catalog"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key = 'billing.manage_currencies'
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key = 'billing.manage_currencies'
ON CONFLICT DO NOTHING;--> statement-breakpoint

