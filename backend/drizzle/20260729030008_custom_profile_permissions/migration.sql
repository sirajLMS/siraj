-- Source: profile_permissions.sql
-- Profile module permissions

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
INSERT INTO permissions (id, key, resource, action, description, category, is_system)
SELECT gen_random_uuid(), v.key::app_permission, v.resource, v.action, v.description::jsonb, v.category::jsonb, true
FROM (VALUES
    (
      'auth.edit_own_profile',
      'auth',
      'edit_own_profile',
      '{"ar": "تعديل حقول الملف الشخصي الأساسية", "en": "Edit own core profile fields"}',
      '{"ar": "المصادقة", "en": "Authentication"}'
    ),
    (
      'teacher.edit_own_profile',
      'teacher',
      'edit_own_profile',
      '{"ar": "تعديل حقول ملف المعلم الشخصي", "en": "Edit own teacher profile fields"}',
      '{"ar": "إدارة المعلمين", "en": "Teacher Management"}'
    ),
    (
      'parent.edit_own_profile',
      'parent',
      'edit_own_profile',
      '{"ar": "تعديل حقول ملف ولي الأمر الشخصي", "en": "Edit own parent profile fields"}',
      '{"ar": "إدارة أولياء الأمور", "en": "Parent Management"}'
    ),
    (
      'user.edit_profile',
      'user',
      'edit_profile',
      '{"ar": "تعديل حقول ملف مستخدم آخر", "en": "Edit another user core profile fields"}',
      '{"ar": "إدارة الموظفين", "en": "Staff Management"}'
    )
) AS v(key, resource, action, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.key = v.key::app_permission);--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'teacher.edit_own_profile',
    'parent.edit_own_profile',
    'user.view_profile',
    'user.edit_profile'
)
WHERE g.slug = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'user.view_profile',
    'user.edit_profile'
)
WHERE g.slug = 'academy_admin'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'teacher.edit_own_profile'
)
WHERE g.slug = 'teacher_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'parent.edit_own_profile'
)
WHERE g.slug = 'parent_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile'
)
WHERE g.slug = 'staff_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint

