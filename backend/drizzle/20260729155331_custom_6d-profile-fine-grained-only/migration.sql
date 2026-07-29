-- Source: 6d-profile-fine-grained-only.sql
-- Migration: Remove legacy profile permission grants; ensure fine-grained profile/student grants
-- Repairs partial 6a application by re-inserting missing fine-grained group_permissions.

-- Disable protection trigger temporarily to delete obsolete legacy system permissions
DO $$ BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;--> statement-breakpoint
-- 2a. DELETE legacy profile keys from all target groups and permissions table
DELETE FROM group_permissions gp
USING permissions p
WHERE gp.permission_id = p.id
  AND p.key::text IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'user.view_profile',
    'user.edit_profile',
    'teacher.view_own_profile',
    'teacher.edit_own_profile',
    'teacher.view_profile',
    'parent.view_own_profile',
    'parent.edit_own_profile',
    'parent.view_profile',
    'staff.edit_profile'
  );--> statement-breakpoint
DELETE FROM permissions
WHERE key::text IN (
  'auth.view_own_profile',
  'auth.edit_own_profile',
  'user.view_profile',
  'user.edit_profile',
  'teacher.view_own_profile',
  'teacher.edit_own_profile',
  'teacher.view_profile',
  'parent.view_own_profile',
  'parent.edit_own_profile',
  'parent.view_profile',
  'staff.edit_profile'
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;--> statement-breakpoint
-- Convert permissions.key to app_permission enum if it is still varchar
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permissions' AND column_name = 'key' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE permissions ALTER COLUMN key TYPE app_permission USING key::app_permission;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;--> statement-breakpoint
-- 2b. Re-INSERT missing fine-grained grants (6a pattern, without teacher.view_profile)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_identity.view_other',
    'profile.core_identity.edit_own',
    'profile.core_identity.edit_other',
    'profile.core_contact.view_own',
    'profile.core_contact.view_other',
    'profile.core_contact.edit_own',
    'profile.core_contact.edit_other',
    'profile.teacher_professional.view_own',
    'profile.teacher_professional.view_other',
    'profile.teacher_professional.edit_own',
    'profile.teacher_professional.edit_other',
    'profile.teacher_identity.view_own',
    'profile.teacher_identity.view_other',
    'profile.teacher_identity.edit_own',
    'profile.teacher_identity.edit_other',
    'profile.parent_social.view_own',
    'profile.parent_social.view_other',
    'profile.parent_social.edit_own',
    'profile.parent_social.edit_other',
    'profile.parent_identity.view_own',
    'profile.parent_identity.view_other',
    'profile.parent_identity.edit_own',
    'profile.parent_identity.edit_other',
    'profile.parent_billing.view_own',
    'profile.parent_billing.view_other',
    'profile.parent_billing.edit_own',
    'profile.parent_billing.edit_other',
    'profile.parent_account.view_own',
    'profile.parent_account.view_other',
    'profile.parent_account.edit_own',
    'profile.parent_account.edit_other',
    'profile.parent_students.view_own',
    'profile.parent_students.view_other',
    'profile.parent_students.edit_own',
    'profile.parent_students.edit_other',
    'profile.teacher_students.view_own',
    'profile.teacher_students.view_other',
    'profile.teacher_students.edit_own',
    'profile.teacher_students.edit_other',
    'profile.staff_role.view_own',
    'profile.staff_role.view_other',
    'profile.staff_role.edit_own',
    'profile.staff_role.edit_other',
    'profile.staff_permissions.view_own',
    'profile.staff_permissions.view_other',
    'profile.staff_permissions.edit_own',
    'profile.staff_permissions.edit_other',
    'profile.payment_methods.view_own',
    'profile.payment_methods.view_other',
    'profile.payment_methods.edit_own',
    'profile.payment_methods.edit_other',
    'profile.meeting_configs.view_own',
    'profile.meeting_configs.view_other',
    'profile.meeting_configs.edit_own',
    'profile.meeting_configs.edit_other',
    'student.student_identity.view_own',
    'student.student_identity.view_other',
    'student.student_identity.edit_own',
    'student.student_identity.edit_other',
    'student.student_academic.view_own',
    'student.student_academic.view_other',
    'student.student_academic.edit_own',
    'student.student_academic.edit_other',
    'student.student_teacher.view_own',
    'student.student_teacher.view_other',
    'student.student_teacher.edit_own',
    'student.student_teacher.edit_other',
    'student.student_parent.view_own',
    'student.student_parent.view_other',
    'student.student_parent.edit_own',
    'student.student_parent.edit_other',
    'student.student_schedule.view_own',
    'student.student_schedule.view_other',
    'student.student_schedule.edit_own',
    'student.student_schedule.edit_other',
    'student.student_history.view_own',
    'student.student_history.view_other',
    'student.student_history.edit_own',
    'student.student_history.edit_other',
    'student.student_quota_edit.view_own',
    'student.student_quota_edit.view_other',
    'student.student_quota_edit.edit_own',
    'student.student_quota_edit.edit_other'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.teacher_professional.view_other',
    'profile.teacher_identity.view_other',
    'profile.parent_social.view_other',
    'profile.parent_identity.view_other',
    'profile.parent_billing.view_other',
    'profile.parent_account.view_other',
    'profile.parent_students.view_other',
    'profile.teacher_students.view_other',
    'profile.staff_role.view_other',
    'profile.staff_permissions.view_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'profile.core_identity.edit_other',
    'profile.core_contact.edit_other',
    'profile.teacher_professional.edit_other',
    'profile.teacher_identity.edit_other',
    'profile.parent_social.edit_other',
    'profile.parent_identity.edit_other',
    'profile.parent_billing.edit_other',
    'profile.parent_account.edit_other',
    'profile.parent_students.edit_other',
    'profile.teacher_students.edit_other',
    'profile.staff_role.edit_other',
    'profile.staff_permissions.edit_other',
    'profile.payment_methods.edit_other',
    'profile.meeting_configs.edit_other',
    'student.student_identity.view_other',
    'student.student_academic.view_other',
    'student.student_teacher.view_other',
    'student.student_parent.view_other',
    'student.student_schedule.view_other',
    'student.student_history.view_other',
    'student.student_quota_edit.view_other',
    'student.student_identity.edit_other',
    'student.student_academic.edit_other',
    'student.student_teacher.edit_other',
    'student.student_parent.edit_other',
    'student.student_schedule.edit_other',
    'student.student_history.edit_other',
    'student.student_quota_edit.edit_other'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.teacher_professional.view_own',
    'profile.teacher_students.view_own',
    'profile.payment_methods.view_own',
    'profile.meeting_configs.view_own',
    'profile.core_identity.edit_own',
    'profile.core_contact.edit_own',
    'profile.teacher_professional.edit_own',
    'profile.payment_methods.edit_own',
    'profile.meeting_configs.edit_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.teacher_professional.view_other',
    'profile.teacher_identity.view_other',
    'profile.teacher_students.view_other',
    'student.student_identity.view_own',
    'student.student_academic.view_own',
    'student.student_teacher.view_own',
    'student.student_schedule.view_own',
    'student.student_history.view_own'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'parent_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.parent_social.view_own',
    'profile.parent_students.view_own',
    'profile.payment_methods.view_own',
    'profile.meeting_configs.view_own',
    'profile.core_identity.edit_own',
    'profile.core_contact.edit_own',
    'profile.parent_social.edit_own',
    'profile.payment_methods.edit_own',
    'profile.meeting_configs.edit_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.parent_social.view_other',
    'profile.parent_identity.view_other',
    'profile.parent_billing.view_other',
    'profile.parent_account.view_other',
    'profile.parent_students.view_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'student.student_identity.view_own',
    'student.student_academic.view_own',
    'student.student_teacher.view_own',
    'student.student_schedule.view_own',
    'student.student_history.view_own',
    'student.student_quota_edit.edit_own'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'staff_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.staff_role.view_own',
    'profile.core_identity.edit_own',
    'profile.core_contact.edit_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.staff_role.view_other',
    'profile.staff_permissions.view_other',
    'profile.staff_role.edit_other',
    'profile.staff_permissions.edit_other'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'student_default'
  AND p.key IN (
    'student.student_identity.view_own',
    'student.student_academic.view_own',
    'student.student_teacher.view_own',
    'student.student_schedule.view_own',
    'student.student_history.view_own'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'supervisor_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.staff_role.view_own',
    'profile.core_identity.edit_own',
    'profile.core_contact.edit_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.teacher_professional.view_other',
    'profile.teacher_identity.view_other',
    'profile.parent_social.view_other',
    'profile.parent_identity.view_other',
    'profile.parent_billing.view_other',
    'profile.parent_account.view_other',
    'profile.parent_students.view_other',
    'profile.teacher_students.view_other',
    'profile.staff_role.view_other',
    'profile.staff_permissions.view_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'student.student_identity.view_other',
    'student.student_academic.view_other',
    'student.student_teacher.view_other',
    'student.student_parent.view_other',
    'student.student_schedule.view_other',
    'student.student_history.view_other',
    'student.student_quota_edit.view_other'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'student_default'
  AND p.key IN (
    'student.student_identity.edit_own',
    'student.student_parent.edit_own'
  )
ON CONFLICT DO NOTHING;--> statement-breakpoint

