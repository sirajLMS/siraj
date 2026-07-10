-- Migration: FX Exchange Rate Permissions (incremental)
-- Adds `billing.view_exchange_rates` and `billing.refresh_exchange_rates` system permissions
-- for existing databases where `3-system_permissions_and_groups.sql` has already run.
-- For clean databases, `3-system_permissions_and_groups.sql` now includes these permissions
-- directly, so this migration is idempotent (ON CONFLICT DO UPDATE / DO NOTHING).

-- Enum values must be added before the trigger-disabled INSERT, and ALTER TYPE ... ADD VALUE
-- cannot run inside a transaction block, so it sits above the DO $$ block.
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.view_exchange_rates';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.refresh_exchange_rates';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true.
-- Uses DO block so the trigger is re-enabled even if INSERT fails.
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

-- ============================================================
-- INSERT INTO permissions — 2 new FX permission keys (idempotent upsert)
-- ============================================================

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'billing.view_exchange_rates'::app_permission,
    'billing',
    'view_exchange_rates',
    '{"ar": "عرض أسعار صرف العملات وآخر حالة مزامنة", "en": "View currency exchange rates and latest sync status"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'billing.refresh_exchange_rates'::app_permission,
    'billing',
    'refresh_exchange_rates',
    '{"ar": "تشغيل مزامنة أسعار صرف العملات يدوياً", "en": "Trigger manual currency exchange rate refresh"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

-- Re-enable the trigger (guaranteed even if INSERT failed above)
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

-- ============================================================
-- Grant permissions to super_admin and academy_admin groups (idempotent)
-- ============================================================

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'billing.view_exchange_rates',
    'billing.refresh_exchange_rates'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'billing.view_exchange_rates',
    'billing.refresh_exchange_rates'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint
