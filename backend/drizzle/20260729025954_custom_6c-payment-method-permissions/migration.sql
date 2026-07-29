DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'payment_methods.manage_catalogs'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'payment_methods.manage_catalogs';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'payment_methods.verify_bank_transfer'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'payment_methods.verify_bank_transfer';
    END IF;
END $$;--> statement-breakpoint
-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
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
    'payment_methods.manage_catalogs'::app_permission,
    'payment_methods',
    'manage_catalogs',
    '{"ar": "إدارة كتالوج طرق الدفع (المحافظ، الروابط، الحسابات الإلكترونية)", "en": "Manage payment method catalog entries (wallets, links, online accounts)"}'::jsonb,
    '{"ar": "طرق الدفع", "en": "Payment Methods"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'payment_methods.verify_bank_transfer'::app_permission,
    'payment_methods',
    'verify_bank_transfer',
    '{"ar": "التحقق من طرق التحويل البنكي بعد المراجعة اليدوية", "en": "Verify bank transfer payment methods after manual review"}'::jsonb,
    '{"ar": "طرق الدفع", "en": "Payment Methods"}'::jsonb,
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
  AND p.key IN (
    'payment_methods.manage_catalogs',
    'payment_methods.verify_bank_transfer'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'payment_methods.manage_catalogs',
    'payment_methods.verify_bank_transfer'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint

