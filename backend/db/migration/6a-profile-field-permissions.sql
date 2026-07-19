-- Migration: Profile field-group permissions
-- Ported from seed-profile-field-permissions.ts
-- Also grants student_default VIEW_OWN and supervisor_default STAFF_VIEW_OWN.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher.view_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.edit_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.view_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.view_other';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.edit_own';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.edit_other';

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
    'teacher.view_profile'::app_permission,
    'teacher',
    'view_profile',
    '{"ar": "عرض ملفات المعلمين (مستخدمون آخرون)", "en": "View teacher profiles (other users)"}'::jsonb,
    '{"ar": "الملف الشخصي", "en": "Profile"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.view_own'::app_permission,
    'profile',
    'core_identity.view_own',
    '{"ar": "عرض core identity الخاص", "en": "View own core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.view_other'::app_permission,
    'profile',
    'core_identity.view_other',
    '{"ar": "عرض core identity للآخرين", "en": "View other users core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.edit_own'::app_permission,
    'profile',
    'core_identity.edit_own',
    '{"ar": "تعديل core identity الخاص", "en": "Edit own core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.edit_other'::app_permission,
    'profile',
    'core_identity.edit_other',
    '{"ar": "تعديل core identity للآخرين", "en": "Edit other users core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.view_own'::app_permission,
    'profile',
    'core_contact.view_own',
    '{"ar": "عرض core contact الخاص", "en": "View own core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.view_other'::app_permission,
    'profile',
    'core_contact.view_other',
    '{"ar": "عرض core contact للآخرين", "en": "View other users core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.edit_own'::app_permission,
    'profile',
    'core_contact.edit_own',
    '{"ar": "تعديل core contact الخاص", "en": "Edit own core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.edit_other'::app_permission,
    'profile',
    'core_contact.edit_other',
    '{"ar": "تعديل core contact للآخرين", "en": "Edit other users core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.view_own'::app_permission,
    'profile',
    'teacher_professional.view_own',
    '{"ar": "عرض teacher professional الخاص", "en": "View own teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.view_other'::app_permission,
    'profile',
    'teacher_professional.view_other',
    '{"ar": "عرض teacher professional للآخرين", "en": "View other users teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.edit_own'::app_permission,
    'profile',
    'teacher_professional.edit_own',
    '{"ar": "تعديل teacher professional الخاص", "en": "Edit own teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.edit_other'::app_permission,
    'profile',
    'teacher_professional.edit_other',
    '{"ar": "تعديل teacher professional للآخرين", "en": "Edit other users teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.view_own'::app_permission,
    'profile',
    'teacher_identity.view_own',
    '{"ar": "عرض teacher identity الخاص", "en": "View own teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.view_other'::app_permission,
    'profile',
    'teacher_identity.view_other',
    '{"ar": "عرض teacher identity للآخرين", "en": "View other users teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.edit_own'::app_permission,
    'profile',
    'teacher_identity.edit_own',
    '{"ar": "تعديل teacher identity الخاص", "en": "Edit own teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.edit_other'::app_permission,
    'profile',
    'teacher_identity.edit_other',
    '{"ar": "تعديل teacher identity للآخرين", "en": "Edit other users teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.view_own'::app_permission,
    'profile',
    'parent_social.view_own',
    '{"ar": "عرض parent social الخاص", "en": "View own parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.view_other'::app_permission,
    'profile',
    'parent_social.view_other',
    '{"ar": "عرض parent social للآخرين", "en": "View other users parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.edit_own'::app_permission,
    'profile',
    'parent_social.edit_own',
    '{"ar": "تعديل parent social الخاص", "en": "Edit own parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.edit_other'::app_permission,
    'profile',
    'parent_social.edit_other',
    '{"ar": "تعديل parent social للآخرين", "en": "Edit other users parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.view_own'::app_permission,
    'profile',
    'parent_identity.view_own',
    '{"ar": "عرض parent identity الخاص", "en": "View own parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.view_other'::app_permission,
    'profile',
    'parent_identity.view_other',
    '{"ar": "عرض parent identity للآخرين", "en": "View other users parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.edit_own'::app_permission,
    'profile',
    'parent_identity.edit_own',
    '{"ar": "تعديل parent identity الخاص", "en": "Edit own parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.edit_other'::app_permission,
    'profile',
    'parent_identity.edit_other',
    '{"ar": "تعديل parent identity للآخرين", "en": "Edit other users parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.view_own'::app_permission,
    'profile',
    'parent_billing.view_own',
    '{"ar": "عرض parent billing الخاص", "en": "View own parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.view_other'::app_permission,
    'profile',
    'parent_billing.view_other',
    '{"ar": "عرض parent billing للآخرين", "en": "View other users parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.edit_own'::app_permission,
    'profile',
    'parent_billing.edit_own',
    '{"ar": "تعديل parent billing الخاص", "en": "Edit own parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.edit_other'::app_permission,
    'profile',
    'parent_billing.edit_other',
    '{"ar": "تعديل parent billing للآخرين", "en": "Edit other users parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.view_own'::app_permission,
    'profile',
    'parent_account.view_own',
    '{"ar": "عرض parent account الخاص", "en": "View own parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.view_other'::app_permission,
    'profile',
    'parent_account.view_other',
    '{"ar": "عرض parent account للآخرين", "en": "View other users parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.edit_own'::app_permission,
    'profile',
    'parent_account.edit_own',
    '{"ar": "تعديل parent account الخاص", "en": "Edit own parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.edit_other'::app_permission,
    'profile',
    'parent_account.edit_other',
    '{"ar": "تعديل parent account للآخرين", "en": "Edit other users parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.view_own'::app_permission,
    'profile',
    'parent_students.view_own',
    '{"ar": "عرض parent students الخاص", "en": "View own parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.view_other'::app_permission,
    'profile',
    'parent_students.view_other',
    '{"ar": "عرض parent students للآخرين", "en": "View other users parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.edit_own'::app_permission,
    'profile',
    'parent_students.edit_own',
    '{"ar": "تعديل parent students الخاص", "en": "Edit own parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.edit_other'::app_permission,
    'profile',
    'parent_students.edit_other',
    '{"ar": "تعديل parent students للآخرين", "en": "Edit other users parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.view_own'::app_permission,
    'profile',
    'teacher_students.view_own',
    '{"ar": "عرض teacher students الخاص", "en": "View own teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.view_other'::app_permission,
    'profile',
    'teacher_students.view_other',
    '{"ar": "عرض teacher students للآخرين", "en": "View other users teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.edit_own'::app_permission,
    'profile',
    'teacher_students.edit_own',
    '{"ar": "تعديل teacher students الخاص", "en": "Edit own teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.edit_other'::app_permission,
    'profile',
    'teacher_students.edit_other',
    '{"ar": "تعديل teacher students للآخرين", "en": "Edit other users teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.view_own'::app_permission,
    'profile',
    'staff_role.view_own',
    '{"ar": "عرض staff role الخاص", "en": "View own staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.view_other'::app_permission,
    'profile',
    'staff_role.view_other',
    '{"ar": "عرض staff role للآخرين", "en": "View other users staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.edit_own'::app_permission,
    'profile',
    'staff_role.edit_own',
    '{"ar": "تعديل staff role الخاص", "en": "Edit own staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.edit_other'::app_permission,
    'profile',
    'staff_role.edit_other',
    '{"ar": "تعديل staff role للآخرين", "en": "Edit other users staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.view_own'::app_permission,
    'profile',
    'staff_permissions.view_own',
    '{"ar": "عرض staff permissions الخاص", "en": "View own staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.view_other'::app_permission,
    'profile',
    'staff_permissions.view_other',
    '{"ar": "عرض staff permissions للآخرين", "en": "View other users staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.edit_own'::app_permission,
    'profile',
    'staff_permissions.edit_own',
    '{"ar": "تعديل staff permissions الخاص", "en": "Edit own staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.edit_other'::app_permission,
    'profile',
    'staff_permissions.edit_other',
    '{"ar": "تعديل staff permissions للآخرين", "en": "Edit other users staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.view_own'::app_permission,
    'profile',
    'payment_methods.view_own',
    '{"ar": "عرض payment methods الخاص", "en": "View own payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.view_other'::app_permission,
    'profile',
    'payment_methods.view_other',
    '{"ar": "عرض payment methods للآخرين", "en": "View other users payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.edit_own'::app_permission,
    'profile',
    'payment_methods.edit_own',
    '{"ar": "تعديل payment methods الخاص", "en": "Edit own payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.edit_other'::app_permission,
    'profile',
    'payment_methods.edit_other',
    '{"ar": "تعديل payment methods للآخرين", "en": "Edit other users payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.view_own'::app_permission,
    'profile',
    'meeting_configs.view_own',
    '{"ar": "عرض meeting configs الخاص", "en": "View own meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.view_other'::app_permission,
    'profile',
    'meeting_configs.view_other',
    '{"ar": "عرض meeting configs للآخرين", "en": "View other users meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.edit_own'::app_permission,
    'profile',
    'meeting_configs.edit_own',
    '{"ar": "تعديل meeting configs الخاص", "en": "Edit own meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.edit_other'::app_permission,
    'profile',
    'meeting_configs.edit_other',
    '{"ar": "تعديل meeting configs للآخرين", "en": "Edit other users meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.view_own'::app_permission,
    'student',
    'student_identity.view_own',
    '{"ar": "عرض student identity للطالب المرتبط", "en": "View own student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.view_other'::app_permission,
    'student',
    'student_identity.view_other',
    '{"ar": "عرض student identity لأي طالب", "en": "View any student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.edit_own'::app_permission,
    'student',
    'student_identity.edit_own',
    '{"ar": "تعديل student identity للطالب المرتبط", "en": "Edit own student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.edit_other'::app_permission,
    'student',
    'student_identity.edit_other',
    '{"ar": "تعديل student identity لأي طالب", "en": "Edit any student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.view_own'::app_permission,
    'student',
    'student_academic.view_own',
    '{"ar": "عرض student academic للطالب المرتبط", "en": "View own student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.view_other'::app_permission,
    'student',
    'student_academic.view_other',
    '{"ar": "عرض student academic لأي طالب", "en": "View any student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.edit_own'::app_permission,
    'student',
    'student_academic.edit_own',
    '{"ar": "تعديل student academic للطالب المرتبط", "en": "Edit own student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.edit_other'::app_permission,
    'student',
    'student_academic.edit_other',
    '{"ar": "تعديل student academic لأي طالب", "en": "Edit any student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.view_own'::app_permission,
    'student',
    'student_teacher.view_own',
    '{"ar": "عرض student teacher للطالب المرتبط", "en": "View own student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.view_other'::app_permission,
    'student',
    'student_teacher.view_other',
    '{"ar": "عرض student teacher لأي طالب", "en": "View any student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.edit_own'::app_permission,
    'student',
    'student_teacher.edit_own',
    '{"ar": "تعديل student teacher للطالب المرتبط", "en": "Edit own student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.edit_other'::app_permission,
    'student',
    'student_teacher.edit_other',
    '{"ar": "تعديل student teacher لأي طالب", "en": "Edit any student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.view_own'::app_permission,
    'student',
    'student_parent.view_own',
    '{"ar": "عرض student parent للطالب المرتبط", "en": "View own student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.view_other'::app_permission,
    'student',
    'student_parent.view_other',
    '{"ar": "عرض student parent لأي طالب", "en": "View any student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.edit_own'::app_permission,
    'student',
    'student_parent.edit_own',
    '{"ar": "تعديل student parent للطالب المرتبط", "en": "Edit own student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.edit_other'::app_permission,
    'student',
    'student_parent.edit_other',
    '{"ar": "تعديل student parent لأي طالب", "en": "Edit any student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.view_own'::app_permission,
    'student',
    'student_schedule.view_own',
    '{"ar": "عرض student schedule للطالب المرتبط", "en": "View own student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.view_other'::app_permission,
    'student',
    'student_schedule.view_other',
    '{"ar": "عرض student schedule لأي طالب", "en": "View any student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.edit_own'::app_permission,
    'student',
    'student_schedule.edit_own',
    '{"ar": "تعديل student schedule للطالب المرتبط", "en": "Edit own student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.edit_other'::app_permission,
    'student',
    'student_schedule.edit_other',
    '{"ar": "تعديل student schedule لأي طالب", "en": "Edit any student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.view_own'::app_permission,
    'student',
    'student_history.view_own',
    '{"ar": "عرض student history للطالب المرتبط", "en": "View own student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.view_other'::app_permission,
    'student',
    'student_history.view_other',
    '{"ar": "عرض student history لأي طالب", "en": "View any student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.edit_own'::app_permission,
    'student',
    'student_history.edit_own',
    '{"ar": "تعديل student history للطالب المرتبط", "en": "Edit own student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.edit_other'::app_permission,
    'student',
    'student_history.edit_other',
    '{"ar": "تعديل student history لأي طالب", "en": "Edit any student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.view_own'::app_permission,
    'student',
    'student_quota_edit.view_own',
    '{"ar": "عرض student quota edit للطالب المرتبط", "en": "View own student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.view_other'::app_permission,
    'student',
    'student_quota_edit.view_other',
    '{"ar": "عرض student quota edit لأي طالب", "en": "View any student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.edit_own'::app_permission,
    'student',
    'student_quota_edit.edit_own',
    '{"ar": "تعديل student quota edit للطالب المرتبط", "en": "Edit own student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.edit_other'::app_permission,
    'student',
    'student_quota_edit.edit_other',
    '{"ar": "تعديل student quota edit لأي طالب", "en": "Edit any student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
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
    'teacher.view_profile',
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
ON CONFLICT DO NOTHING;

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
    'teacher.view_profile',
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
    'student.student_quota_edit.edit_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'profile.payment_methods.edit_other',
    'profile.meeting_configs.edit_other'
  )
ON CONFLICT DO NOTHING;

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
    'teacher.view_profile',
    'student.student_identity.view_own',
    'student.student_academic.view_own',
    'student.student_teacher.view_own',
    'student.student_schedule.view_own',
    'student.student_history.view_own'
  )
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'staff_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.staff_role.view_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.staff_role.view_other',
    'profile.staff_permissions.view_other',
    'profile.staff_role.edit_other',
    'profile.staff_permissions.edit_other'
  )
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'supervisor_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.staff_role.view_own',
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
ON CONFLICT DO NOTHING;

-- LMS portal also grants identity/parent edit_own (permission rows created above)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'student_default'
  AND p.key IN (
    'student.student_identity.edit_own',
    'student.student_parent.edit_own'
  )
ON CONFLICT DO NOTHING;
