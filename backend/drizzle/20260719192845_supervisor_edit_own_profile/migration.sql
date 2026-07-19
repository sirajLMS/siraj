-- Grant supervisors own-profile edit (page gate + field-level edit_own).
-- supervisor_default already has auth.view_own_profile and matching view_own field perms.

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'supervisor_default'
  AND p.key IN (
    'auth.edit_own_profile',
    'profile.core_identity.edit_own',
    'profile.core_contact.edit_own',
    'profile.staff_role.edit_own'
  )
ON CONFLICT DO NOTHING;
