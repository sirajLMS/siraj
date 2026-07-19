-- Migration: Payment method permissions
-- Ported from seed-payment-method-permissions.ts

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'payment_methods.manage_catalogs';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'payment_methods.verify_bank_transfer';

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
  g.slug = 'super_admin'
  AND p.key IN (
    'payment_methods.manage_catalogs',
    'payment_methods.verify_bank_transfer'
  )
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'payment_methods.manage_catalogs',
    'payment_methods.verify_bank_transfer'
  )
ON CONFLICT DO NOTHING;

