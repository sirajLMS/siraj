DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'user.admin_reset_password'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'user.admin_reset_password';
    END IF;
END $$;--> statement-breakpoint
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
  is_system = EXCLUDED.is_system;--> statement-breakpoint
-- 3. Grant to super_admin group
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'super_admin'
  AND p.key = 'user.admin_reset_password'
ON CONFLICT DO NOTHING;--> statement-breakpoint

