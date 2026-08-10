-- Migration: Add USER_ADMIN_RESET_PASSWORD permission for super admin — data (Phase 2)
-- Inserts the `user.admin_reset_password` permission row + grants it to `super_admin` group.
-- MUST run AFTER `31-user-admin-reset-password.sql` has been committed so the enum
-- value already exists when these INSERTs cast it to `::app_permission`.

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
    'user.admin_reset_password',
    'user',
    'admin_reset_password',
    '{"ar": "إعادة تعيين كلمة مرور المستخدم من قبل المشرف", "en": "Admin reset user password"}'::jsonb,
    '{"ar": "إدارة المستخدمين", "en": "User Management"}'::jsonb,
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
  RAISE NOTICE 'Could not enable trigger: %', SQLERRM;
END $$;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'super_admin'
  AND p.key = 'user.admin_reset_password'
ON CONFLICT DO NOTHING;