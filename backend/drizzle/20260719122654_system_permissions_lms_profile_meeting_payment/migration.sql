-- Source: 6-lms-permissions-and-groups.sql
-- Migration: LMS permissions + supervisor_default / student_default groups
-- Ported from seed-lms-permissions.ts — system permissions must live in migrations, not seeds.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.submit';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.review';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.approve';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.reject';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'supervisor.view_dashboard';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.view_own_dashboard';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'credits.manage';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher_dues.view';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher_dues.mark_paid';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'monthly_reports.view';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'lesson_reports.submit'::app_permission,
    'lesson_reports',
    'submit',
    '{"ar": "إرسال تقرير حصة لحصة مكتملة", "en": "Submit a lesson report for a completed class instance"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'lesson_reports.review'::app_permission,
    'lesson_reports',
    'review',
    '{"ar": "مراجعة تقارير الحصص المعلقة", "en": "Review pending lesson reports"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'lesson_reports.approve'::app_permission,
    'lesson_reports',
    'approve',
    '{"ar": "الموافقة على تقرير حصة معلق", "en": "Approve a pending lesson report"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'lesson_reports.reject'::app_permission,
    'lesson_reports',
    'reject',
    '{"ar": "رفض تقرير حصة معلق مع ذكر السبب", "en": "Reject a pending lesson report with a reason"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'supervisor.view_dashboard'::app_permission,
    'supervisor',
    'view_dashboard',
    '{"ar": "الوصول إلى لوحة المشرف", "en": "Access the supervisor dashboard"}'::jsonb,
    '{"ar": "المشرف", "en": "Supervisor"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.view_own_dashboard'::app_permission,
    'student',
    'view_own_dashboard',
    '{"ar": "عرض لوحة الطالب الخاصة", "en": "View the students own dashboard"}'::jsonb,
    '{"ar": "الطالب", "en": "Student"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'credits.manage'::app_permission,
    'credits',
    'manage',
    '{"ar": "إدارة رصيد ساعات الطالب (مشتريات / تعديلات)", "en": "Manage student credit ledger entries (purchases / adjustments)"}'::jsonb,
    '{"ar": "الرصيد", "en": "Credits"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'teacher_dues.view'::app_permission,
    'teacher_dues',
    'view',
    '{"ar": "عرض مستحقات المعلم والتقارير الشهرية", "en": "View teacher dues ledger and monthly reports"}'::jsonb,
    '{"ar": "مستحقات المعلمين", "en": "Teacher Dues"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'teacher_dues.mark_paid'::app_permission,
    'teacher_dues',
    'mark_paid',
    '{"ar": "تعليم مستحقات المعلمين كمدفوعة (مفردة أو دفعة)", "en": "Mark teacher dues entries as paid (single or bulk)"}'::jsonb,
    '{"ar": "مستحقات المعلمين", "en": "Teacher Dues"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'monthly_reports.view'::app_permission,
    'monthly_reports',
    'view',
    '{"ar": "عرض التقارير التشغيلية والمالية الشهرية", "en": "View monthly operational and financial reports"}'::jsonb,
    '{"ar": "التقارير", "en": "Reports"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


INSERT INTO permission_groups (id, name, description, is_system, slug, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '{"ar": "مشرف", "en": "Supervisor"}'::jsonb,
    '{"ar": "صلاحيات افتراضية لحسابات المشرفين (سير العمل LMS)", "en": "Default permissions for supervisor accounts (LMS workflow)"}'::jsonb,
    true,
    'supervisor_default',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '{"ar": "طالب", "en": "Student"}'::jsonb,
    '{"ar": "صلاحيات افتراضية لحسابات الطلاب (سير العمل LMS)", "en": "Default permissions for student accounts (LMS workflow)"}'::jsonb,
    true,
    'student_default',
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  updated_at = NOW();
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'lesson_reports.submit',
    'lesson_reports.review',
    'lesson_reports.approve',
    'lesson_reports.reject',
    'supervisor.view_dashboard',
    'student.view_own_dashboard',
    'credits.manage',
    'teacher_dues.view',
    'teacher_dues.mark_paid',
    'monthly_reports.view'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'lesson_reports.submit',
    'lesson_reports.review',
    'lesson_reports.approve',
    'lesson_reports.reject',
    'supervisor.view_dashboard',
    'student.view_own_dashboard',
    'credits.manage',
    'teacher_dues.view',
    'teacher_dues.mark_paid',
    'monthly_reports.view'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint


-- Ensure dashboard.view_metrics is never on supervisor_default (portal routing)
DELETE FROM group_permissions
WHERE group_id = (SELECT id FROM permission_groups WHERE slug = 'supervisor_default')
  AND permission_id = (SELECT id FROM permissions WHERE key = 'dashboard.view_metrics'::app_permission);
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'supervisor_default'
  AND p.key IN (
    'lesson_reports.review',
    'lesson_reports.approve',
    'lesson_reports.reject',
    'supervisor.view_dashboard',
    'monthly_reports.view',
    'teacher_dues.view',
    'teacher_dues.mark_paid',
    'auth.view_own_profile',
    'dashboard.view',
    'schedule.view_list',
    'schedule.view_assigned',
    'session.view_details',
    'history.view_calendar',
    'history.view_details',
    'teachers.list',
    'students.list',
    'complaints.list',
    'complaints.respond',
    'notification.view_alerts',
    'user.view_profile',
    'teacher.view_profile'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'lesson_reports.submit'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'student_default'
  AND p.key IN (
    'student.view_own_dashboard',
    'auth.view_own_profile',
    'schedule.view_assigned',
    'session.view_details',
    'history.view_calendar',
    'history.view_details',
    'student.student_identity.edit_own',
    'student.student_parent.edit_own',
    'notification.view_alerts'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint



-- Source: 6a-profile-field-permissions.sql
-- Migration: Profile field-group permissions
-- Ported from seed-profile-field-permissions.ts
-- Also grants student_default VIEW_OWN and supervisor_default STAFF_VIEW_OWN.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher.view_profile';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.edit_other';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

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
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


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
--> statement-breakpoint

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
--> statement-breakpoint

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
--> statement-breakpoint

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
--> statement-breakpoint

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
--> statement-breakpoint

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
--> statement-breakpoint

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
--> statement-breakpoint

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
--> statement-breakpoint


-- Source: 6b-meeting-permissions.sql
-- Migration: Meeting permissions
-- Ported from seed-meeting-permissions.ts

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_providers.manage_catalog';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_class';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'meeting_providers.manage_catalog'::app_permission,
    'meeting_providers',
    'manage_catalog',
    '{"ar": "إدارة كتالوج مزودي الاجتماعات", "en": "Manage meeting provider catalog entries"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_own'::app_permission,
    'meeting_configs',
    'manage_own',
    '{"ar": "إدارة إعدادات الاجتماعات الخاصة", "en": "Manage own online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_other'::app_permission,
    'meeting_configs',
    'manage_other',
    '{"ar": "إدارة إعدادات اجتماعات المستخدمين الآخرين", "en": "Manage other users online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_class'::app_permission,
    'meeting_configs',
    'manage_class',
    '{"ar": "إدارة إعدادات الاجتماعات على مستوى الحصة", "en": "Manage class-scoped online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'meeting_providers.manage_catalog',
    'meeting_configs.manage_own',
    'meeting_configs.manage_other',
    'meeting_configs.manage_class'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'meeting_providers.manage_catalog',
    'meeting_configs.manage_own',
    'meeting_configs.manage_other',
    'meeting_configs.manage_class'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'meeting_configs.manage_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'parent_default'
  AND p.key IN (
    'meeting_configs.manage_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint



-- Source: 6c-payment-method-permissions.sql
-- Migration: Payment method permissions
-- Ported from seed-payment-method-permissions.ts

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'payment_methods.manage_catalogs';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'payment_methods.verify_bank_transfer';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

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
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


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
--> statement-breakpoint

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
--> statement-breakpoint



