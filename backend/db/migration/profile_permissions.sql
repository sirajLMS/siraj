-- Profile module permissions

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'auth.edit_own_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher.edit_own_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'parent.edit_own_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'user.edit_profile';

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
SELECT gen_random_uuid(), v.key, v.resource, v.action, v.description, v.category, true
FROM (VALUES
    ('auth.edit_own_profile', 'auth', 'edit_own_profile', 'Edit own core profile fields', 'Authentication'),
    ('teacher.edit_own_profile', 'teacher', 'edit_own_profile', 'Edit own teacher profile fields', 'Teacher Management'),
    ('parent.edit_own_profile', 'parent', 'edit_own_profile', 'Edit own parent profile fields', 'Parent Management'),
    ('user.edit_profile', 'user', 'edit_profile', 'Edit another user core profile fields', 'Staff Management')
) AS v(key, resource, action, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.key = v.key::app_permission);

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
  );

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
  );

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
  );

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
  );

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
  );
