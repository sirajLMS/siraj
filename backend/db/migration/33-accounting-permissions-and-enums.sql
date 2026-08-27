-- Migration: Accounting credit-hours module — enums & permissions (Phase 1)
-- Adds app_permission enum values + permission rows + group grants for the
-- credit-hours payments module, and (idempotently) creates the payment_gateway
-- / billed_unit Postgres types plus the invoice_type value used by the module.
-- NOTE: `db push` normally creates these types/values from the Drizzle schema;
-- every statement below is idempotent so orderings remain safe on fresh deploys.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.payments_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.payments_manage';

DO $$
BEGIN
  CREATE TYPE payment_gateway AS ENUM ('NONE', 'PAYPAL', 'WESTERN_UNION', 'BANK', 'OTHER');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type payment_gateway already exists';
END $$;

DO $$
BEGIN
  CREATE TYPE billed_unit AS ENUM ('CLASS_CREDIT', 'HOUR_CREDIT');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type billed_unit already exists';
END $$;

ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'CREDIT_HOURS_PACKAGE';

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
    'accounting.payments_view',
    'accounting',
    'payments_view',
    '{"ar": "عرض مدفوعات الساعات المعتمدة", "en": "View accounting payments"}'::jsonb,
    '{"ar": "المحاسبة", "en": "Accounting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'accounting.payments_manage',
    'accounting',
    'payments_manage',
    '{"ar": "إدارة مدفوعات الساعات المعتمدة", "en": "Manage accounting payments"}'::jsonb,
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
END $$;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin', 'staff_default')
  AND p.key = 'accounting.payments_view'
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.payments_manage'
ON CONFLICT DO NOTHING;
