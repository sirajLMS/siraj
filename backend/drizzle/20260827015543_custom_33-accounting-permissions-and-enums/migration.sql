DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.payments_view'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'accounting.payments_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.payments_manage'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'accounting.payments_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE payment_gateway AS ENUM ('NONE', 'PAYPAL', 'WESTERN_UNION', 'BANK', 'OTHER');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type payment_gateway already exists';
END $$;--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE billed_unit AS ENUM ('CLASS_CREDIT', 'HOUR_CREDIT');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type billed_unit already exists';
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'invoice_type' AND e.enumlabel = 'CREDIT_HOURS_PACKAGE'
    ) THEN
        ALTER TYPE invoice_type ADD VALUE 'CREDIT_HOURS_PACKAGE';
    END IF;
END $$;--> statement-breakpoint
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
  is_system = EXCLUDED.is_system;--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
END $$;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin', 'staff_default')
  AND p.key = 'accounting.payments_view'
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'accounting.payments_manage'
ON CONFLICT DO NOTHING;--> statement-breakpoint

