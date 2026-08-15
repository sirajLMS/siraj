-- Migration: LMS permissions + supervisor_default / student_default groups
-- Ported from seed-lms-permissions.ts — system permissions must live in migrations, not seeds.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.submit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.review';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.approve';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.reject';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'supervisor.view_dashboard';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.view_own_dashboard';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'credits.manage';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher_dues.view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher_dues.mark_paid';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'monthly_reports.view';

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

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;


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


-- Ensure dashboard.view_metrics is never on supervisor_default (portal routing)
DELETE FROM group_permissions
WHERE group_id = (SELECT id FROM permission_groups WHERE slug = 'supervisor_default')
  AND permission_id = (SELECT id FROM permissions WHERE key = 'dashboard.view_metrics'::app_permission);

-- IMPORTANT: Supervisors are granted ALL current and future teacher/student/parent management permissions.
-- Any new teacher/student/parent management permission MUST be added to this group.
-- Staff permissions are NEVER granted to supervisors.
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
    'teacher.view_profile',
    'teachers.create',
    'teachers.edit',
    'teachers.manage_schedule',
    'schedule.view_weekly',
    'schedule.view_workload',
    'schedule.create_class',
    'schedule.delete_class',
    'schedule.clear_weekly',
    'students.create',
    'students.edit',
    'student.reassign_teacher',
    'student.manage_status',
    'parents.list',
    'parents.create',
    'parents.edit',
    'parent.view_directory',
    'parent.manage_status'
  )
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'lesson_reports.submit'
  )
ON CONFLICT DO NOTHING;

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

