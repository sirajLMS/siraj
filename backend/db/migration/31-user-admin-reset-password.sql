-- Migration: Add USER_ADMIN_RESET_PASSWORD permission for super admin
-- Allows super admins to reset passwords of other users via admin panel

-- 1. Add the new enum value to app_permission type
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'user.admin_reset_password';

-- 2. Add the new permission
INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES (
  gen_random_uuid(),
  'user.admin_reset_password'::app_permission,
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

-- 3. Grant to super_admin group
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'super_admin'
  AND p.key = 'user.admin_reset_password'
ON CONFLICT DO NOTHING;