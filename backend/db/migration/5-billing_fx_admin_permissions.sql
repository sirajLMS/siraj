-- Migration: Billing FX Admin Permissions (incremental)
-- Adds billing.manage_fx_provider, billing.override_exchange_rates, billing.manage_currency_hedges

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.manage_fx_provider';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.override_exchange_rates';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.manage_currency_hedges';
--> statement-breakpoint

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
    'billing.manage_fx_provider'::app_permission,
    'billing',
    'manage_fx_provider',
    '{"ar": "إدارة مزود أسعار صرف العملات", "en": "Manage FX rate provider configuration"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'billing.override_exchange_rates'::app_permission,
    'billing',
    'override_exchange_rates',
    '{"ar": "تجاوز أسعار صرف العملات يدوياً", "en": "Manually override currency exchange rates"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'billing.manage_currency_hedges'::app_permission,
    'billing',
    'manage_currency_hedges',
    '{"ar": "إدارة تحوطات العملات", "en": "Manage currency hedge positions"}'::jsonb,
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
  g.slug = 'super_admin'
  AND p.key IN (
    'billing.manage_fx_provider',
    'billing.override_exchange_rates',
    'billing.manage_currency_hedges'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'billing.manage_fx_provider',
    'billing.override_exchange_rates',
    'billing.manage_currency_hedges'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint
