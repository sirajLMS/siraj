-- Migration: Seed System Permissions and Groups
-- Auto-generated

-- Story 15: Suggestion Review Workflow — New enum type
DO $$ BEGIN
  CREATE TYPE suggestion_status AS ENUM ('PENDING', 'REVIEWED', 'DUPLICATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- FX Rate Ingestion: Add new app_permission enum values
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.view_exchange_rates';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.refresh_exchange_rates';

-- Restore enum values dropped by the `parched_mister_fear` migration, which
-- recreated `app_permission` without these entries. The INSERT statements below
-- cast to these enum values, so they must exist by the time the INSERT runs.
-- Declared as `ADD VALUE IF NOT EXISTS` so they are idempotent.
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'auth.view_own_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher.view_own_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'parent.view_own_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'parent.view_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.edit_profile';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'user.view_profile';

-- Story 15: Add ON_APP notification channel
ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'ON_APP';

-- Story 15: Add new notification event types for suggestions and complaints
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_COMPLAINT';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_SUGGESTION';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_ACKNOWLEDGED';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_DUPLICATE_MARKED';

-- Story 15: Add new columns to suggestions table
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status suggestion_status NOT NULL DEFAULT 'PENDING';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS duplicate_of_id uuid REFERENCES suggestions(id) ON DELETE SET NULL;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS admin_response text;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Story 15: Add indexes for new suggestions columns
CREATE INDEX IF NOT EXISTS suggestions_status_idx ON suggestions (status);
CREATE INDEX IF NOT EXISTS suggestions_duplicate_of_id_idx ON suggestions (duplicate_of_id);
CREATE INDEX IF NOT EXISTS suggestions_reviewed_by_user_id_idx ON suggestions (reviewed_by_user_id);
CREATE INDEX IF NOT EXISTS suggestions_deleted_at_idx ON suggestions (deleted_at);
DO $$
BEGIN
  BEGIN
    ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

INSERT INTO
    permissions (
        id,
        key,
        resource,
        action,
        description,
        category,
        is_system
    )
VALUES (
        gen_random_uuid (),
        'auth.login'::app_permission,
        'auth',
        'login',
        '{"ar": "تسجيل الدخول إلى النظام", "en": "Login to system"}'::jsonb,
        '{"ar": "تسجيل الدخول إلى النظام", "en": "Authentication"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'auth.view_own_profile'::app_permission,
        'auth',
        'view_own_profile',
        '{"ar": "عرض الملف الشخصي الخاص", "en": "View own profile"}'::jsonb,
        '{"ar": "عرض الملف الشخصي الخاص", "en": "Authentication"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.view'::app_permission,
        'dashboard',
        'view',
        '{"ar": "عرض لوحة التحكم", "en": "View dashboard"}'::jsonb,
        '{"ar": "عرض لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.view_metrics'::app_permission,
        'dashboard',
        'view_metrics',
        '{"ar": "عرض مؤشرات لوحة التحكم", "en": "View dashboard metrics"}'::jsonb,
        '{"ar": "عرض مؤشرات لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.filter_metrics'::app_permission,
        'dashboard',
        'filter_metrics',
        '{"ar": "فلترة مؤشرات لوحة التحكم", "en": "Filter dashboard metrics"}'::jsonb,
        '{"ar": "فلترة مؤشرات لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.metrics.view_all'::app_permission,
        'dashboard',
        'metrics.view_all',
        '{"ar": "عرض جميع مؤشرات لوحة التحكم", "en": "View all dashboard metrics"}'::jsonb,
        '{"ar": "عرض جميع مؤشرات لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.search'::app_permission,
        'dashboard',
        'search',
        '{"ar": "البحث الشامل في جدول المواعيد للإدارة", "en": "Global search on admin schedule table"}'::jsonb,
        '{"ar": "البحث الشامل في جدول المواعيد للإدارة", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_list'::app_permission,
        'schedule',
        'view_list',
        '{"ar": "عرض قائمة الجدول اليومي", "en": "View daily schedule list"}'::jsonb,
        '{"ar": "عرض قائمة الجدول اليومي", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.filter_advanced'::app_permission,
        'schedule',
        'filter_advanced',
        '{"ar": "الفلترة المتقدمة للجدول", "en": "Advanced filtering of schedule"}'::jsonb,
        '{"ar": "الفلترة المتقدمة للجدول", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_all'::app_permission,
        'schedule',
        'view_all',
        '{"ar": "عرض جميع الجداول", "en": "View all schedules"}'::jsonb,
        '{"ar": "عرض جميع الجداول", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_assigned'::app_permission,
        'schedule',
        'view_assigned',
        '{"ar": "عرض جدول المعلم المحدد", "en": "View assigned teacher schedule"}'::jsonb,
        '{"ar": "عرض جدول المعلم المحدد", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_family'::app_permission,
        'schedule',
        'view_family',
        '{"ar": "عرض جدول طلاب العائلة", "en": "View family student schedule"}'::jsonb,
        '{"ar": "عرض جدول طلاب العائلة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.search_availability'::app_permission,
        'schedule',
        'search_availability',
        '{"ar": "البحث عن أوقات توفر المعلمين", "en": "Search teacher availability"}'::jsonb,
        '{"ar": "البحث عن أوقات توفر المعلمين", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.manage_recurring'::app_permission,
        'schedule',
        'manage_recurring',
        '{"ar": "إدارة الجداول التكرارية", "en": "Manage recurring schedules"}'::jsonb,
        '{"ar": "إدارة الجداول التكرارية", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.dst_migrate'::app_permission,
        'schedule',
        'dst_migrate',
        '{"ar": "تشغيل ترحيل التوقيت الصيفي", "en": "Run DST migration"}'::jsonb,
        '{"ar": "تشغيل ترحيل التوقيت الصيفي", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_timezones'::app_permission,
        'schedule',
        'view_timezones',
        '{"ar": "عرض أعمدة الجداول متعددة المناطق الزمنية", "en": "View multi-timezone schedule columns"}'::jsonb,
        '{"ar": "عرض أعمدة الجداول متعددة المناطق الزمنية", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.view_details'::app_permission,
        'session',
        'view_details',
        '{"ar": "عرض تفاصيل الحصة", "en": "View class details"}'::jsonb,
        '{"ar": "عرض تفاصيل الحصة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.activate_class'::app_permission,
        'session',
        'activate_class',
        '{"ar": "تفعيل الحصة خلال النافذة الزمنية", "en": "Activate a class within time window"}'::jsonb,
        '{"ar": "تفعيل الحصة خلال النافذة الزمنية", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.activate_override'::app_permission,
        'session',
        'activate_override',
        '{"ar": "تجاوز النافذة الزمنية لتفعيل الحصة يدويًا", "en": "Bypass time window enforcement to manually activate a class session"}'::jsonb,
        '{"ar": "تجاوز النافذة الزمنية لتفعيل الحصة يدويًا", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.start'::app_permission,
        'session',
        'update_status.start',
        '{"ar": "تحويل الحصة المفعلة إلى حالة قيد التشغيل عند وصول الطالب", "en": "Transition an activated session to RUNNING state upon student arrival"}'::jsonb,
        '{"ar": "تحويل الحصة المفعلة إلى حالة قيد التشغيل عند وصول الطالب", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.absent'::app_permission,
        'session',
        'update_status.absent',
        '{"ar": "تسجيل الطالب غائبًا بعد انتهاء فترة الانتظار واحتساب مستحقات المعلم", "en": "Mark student as absent after waiting period and credit teacher payroll"}'::jsonb,
        '{"ar": "تسجيل الطالب غائبًا بعد انتهاء فترة الانتظار واحتساب مستحقات المعلم", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.leave'::app_permission,
        'session',
        'update_status.leave',
        '{"ar": "معالجة إلغاء الحصة بعذر وبدء إجراءات إعادة الجدولة", "en": "Process excused cancellation and trigger reschedule workflow"}'::jsonb,
        '{"ar": "معالجة إلغاء الحصة بعذر وبدء إجراءات إعادة الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.reschedule'::app_permission,
        'session',
        'reschedule',
        '{"ar": "إعادة جدولة الحصة", "en": "Reschedule a class"}'::jsonb,
        '{"ar": "إعادة جدولة الحصة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.reset'::app_permission,
        'session',
        'reset',
        '{"ar": "إعادة تصفير بيانات الجلسة وإرجاعها إلى حالة غير مفعلة", "en": "Destructively clear session data and revert to NOT_ACTIVATED state"}'::jsonb,
        '{"ar": "إعادة تصفير بيانات الجلسة وإرجاعها إلى حالة غير مفعلة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.override_actions'::app_permission,
        'session',
        'override_actions',
        '{"ar": "شريط أدوات التجاوز الإداري في صفحة تفاصيل الحصة", "en": "Admin override toolbar on class details page"}'::jsonb,
        '{"ar": "شريط أدوات التجاوز الإداري في صفحة تفاصيل الحصة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'history.view_calendar'::app_permission,
        'history',
        'view_calendar',
        '{"ar": "عرض تقويم السجل", "en": "View student class history calendar"}'::jsonb,
        '{"ar": "عرض تقويم السجل", "en": "History"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'history.view_details'::app_permission,
        'history',
        'view_details',
        '{"ar": "عرض البيانات الوصفية للجلسة في نافذة تفاصيل السجل", "en": "View session metadata in history modal drill-down"}'::jsonb,
        '{"ar": "عرض البيانات الوصفية للجلسة في نافذة تفاصيل السجل", "en": "History"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_dashboard'::app_permission,
        'teacher',
        'view_dashboard',
        '{"ar": "الوصول إلى لوحة تحكم المعلم", "en": "Access teacher dashboard"}'::jsonb,
        '{"ar": "الوصول إلى لوحة تحكم المعلم", "en": "Teacher"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_students'::app_permission,
        'teacher',
        'view_students',
        '{"ar": "عرض الطلاب التابعين للمعلم المسجل", "en": "View students assigned to the logged-in teacher"}'::jsonb,
        '{"ar": "عرض الطلاب التابعين للمعلم المسجل", "en": "Teacher"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_own_profile'::app_permission,
        'teacher',
        'view_own_profile',
        '{"ar": "عرض الملف الشخصي والراتب للمعلم (قراءة فقط)", "en": "View own teacher profile and salary (read-only)"}'::jsonb,
        '{"ar": "عرض الملف الشخصي والراتب للمعلم (قراءة فقط)", "en": "Teacher"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.enforce_time_window'::app_permission,
        'system',
        'enforce_time_window',
        '{"ar": "التحقق من النافذة الزمنية للتفعيل", "en": "Validate activation time window"}'::jsonb,
        '{"ar": "التحقق من النافذة الزمنية للتفعيل", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.enforce_leave_limit'::app_permission,
        'system',
        'enforce_leave_limit',
        '{"ar": "التحقق على مستوى النظام لقيود رصيد إجازات المعلم شهريًا", "en": "System-level validation gate that enforces teacher leave quota limits per calendar month"}'::jsonb,
        '{"ar": "التحقق على مستوى النظام لقيود رصيد إجازات المعلم شهريًا", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.list'::app_permission,
        'teachers',
        'list',
        '{"ar": "عرض قائمة المعلمين", "en": "List teachers"}'::jsonb,
        '{"ar": "عرض قائمة المعلمين", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.create'::app_permission,
        'teachers',
        'create',
        '{"ar": "إنشاء حسابات المعلمين", "en": "Create teacher accounts"}'::jsonb,
        '{"ar": "إنشاء حسابات المعلمين", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.edit'::app_permission,
        'teachers',
        'edit',
        '{"ar": "تعديل ملفات المعلمين", "en": "Edit teacher profiles"}'::jsonb,
        '{"ar": "تعديل ملفات المعلمين", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.manage_schedule'::app_permission,
        'teachers',
        'manage_schedule',
        '{"ar": "إدارة جداول المعلمين", "en": "Manage teacher schedules"}'::jsonb,
        '{"ar": "إدارة جداول المعلمين", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parents.list'::app_permission,
        'parents',
        'list',
        '{"ar": "عرض قائمة أولياء الأمور", "en": "List parents"}'::jsonb,
        '{"ar": "عرض قائمة أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parents.create'::app_permission,
        'parents',
        'create',
        '{"ar": "إنشاء حسابات أولياء الأمور", "en": "Create parent accounts"}'::jsonb,
        '{"ar": "إنشاء حسابات أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parents.edit'::app_permission,
        'parents',
        'edit',
        '{"ar": "تعديل ملفات أولياء الأمور", "en": "Edit parent profiles"}'::jsonb,
        '{"ar": "تعديل ملفات أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.list'::app_permission,
        'students',
        'list',
        '{"ar": "عرض قائمة الطلاب", "en": "List students"}'::jsonb,
        '{"ar": "عرض قائمة الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.create'::app_permission,
        'students',
        'create',
        '{"ar": "إنشاء ملفات الطلاب", "en": "Create student profiles"}'::jsonb,
        '{"ar": "إنشاء ملفات الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.edit'::app_permission,
        'students',
        'edit',
        '{"ar": "تعديل ملفات الطلاب", "en": "Edit student profiles"}'::jsonb,
        '{"ar": "تعديل ملفات الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.change_teacher'::app_permission,
        'students',
        'change_teacher',
        '{"ar": "إعادة تعيين معلم الطالب", "en": "Reassign student teacher"}'::jsonb,
        '{"ar": "إعادة تعيين معلم الطالب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.change_status'::app_permission,
        'students',
        'change_status',
        '{"ar": "تغيير حالة الطالب", "en": "Change student status"}'::jsonb,
        '{"ar": "تغيير حالة الطالب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.override_quota'::app_permission,
        'students',
        'override_quota',
        '{"ar": "تجاوز حصة حصص الطالب", "en": "Override student class quota"}'::jsonb,
        '{"ar": "تجاوز حصة حصص الطالب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.list'::app_permission,
        'invoices',
        'list',
        '{"ar": "عرض قائمة الفواتير", "en": "List invoices"}'::jsonb,
        '{"ar": "عرض قائمة الفواتير", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.delete'::app_permission,
        'invoices',
        'delete',
        '{"ar": "حذف الفواتير", "en": "Delete invoices"}'::jsonb,
        '{"ar": "حذف الفواتير", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.create'::app_permission,
        'invoices',
        'create',
        '{"ar": "إنشاء الفواتير", "en": "Create invoices"}'::jsonb,
        '{"ar": "إنشاء الفواتير", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.mark_paid'::app_permission,
        'invoices',
        'mark_paid',
        '{"ar": "تحديد الفاتورة كمدفوعة", "en": "Mark invoice as paid"}'::jsonb,
        '{"ar": "تحديد الفاتورة كمدفوعة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.edit'::app_permission,
        'invoices',
        'edit',
        '{"ar": "تعديل الفواتير", "en": "Edit invoices"}'::jsonb,
        '{"ar": "تعديل الفواتير", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'resources.list'::app_permission,
        'resources',
        'list',
        '{"ar": "عرض قائمة الموارد التعليمية", "en": "List learning resources"}'::jsonb,
        '{"ar": "عرض قائمة الموارد التعليمية", "en": "Resources"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'resources.delete'::app_permission,
        'resources',
        'delete',
        '{"ar": "حذف الموارد التعليمية", "en": "Delete learning resources"}'::jsonb,
        '{"ar": "حذف الموارد التعليمية", "en": "Resources"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'resources.upload'::app_permission,
        'resources',
        'upload',
        '{"ar": "رفع الموارد التعليمية", "en": "Upload learning resources"}'::jsonb,
        '{"ar": "رفع الموارد التعليمية", "en": "Resources"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'reports.generate'::app_permission,
        'reports',
        'generate',
        '{"ar": "إنشاء التقارير", "en": "Generate reports"}'::jsonb,
        '{"ar": "إنشاء التقارير", "en": "Reports"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'complaints.list'::app_permission,
        'complaints',
        'list',
        '{"ar": "عرض قائمة الشكاوى", "en": "List complaints"}'::jsonb,
        '{"ar": "عرض قائمة الشكاوى", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'complaints.delete'::app_permission,
        'complaints',
        'delete',
        '{"ar": "حذف الشكاوى", "en": "Delete complaints"}'::jsonb,
        '{"ar": "حذف الشكاوى", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'complaints.respond'::app_permission,
        'complaints',
        'respond',
        '{"ar": "الرد على الشكاوى", "en": "Respond to complaints"}'::jsonb,
        '{"ar": "الرد على الشكاوى", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.list'::app_permission,
        'staff',
        'list',
        '{"ar": "عرض قائمة حسابات الموظفين", "en": "List staff accounts"}'::jsonb,
        '{"ar": "عرض قائمة حسابات الموظفين", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.create'::app_permission,
        'staff',
        'create',
        '{"ar": "إنشاء حسابات الموظفين", "en": "Create staff accounts"}'::jsonb,
        '{"ar": "إنشاء حسابات الموظفين", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.edit'::app_permission,
        'staff',
        'edit',
        '{"ar": "تعديل حسابات الموظفين", "en": "Edit staff accounts"}'::jsonb,
        '{"ar": "تعديل حسابات الموظفين", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'permission_groups.manage'::app_permission,
        'permission_groups',
        'manage',
        '{"ar": "إدارة مجموعات الصلاحيات", "en": "Manage permission groups"}'::jsonb,
        '{"ar": "إدارة مجموعات الصلاحيات", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'permission_groups.assign'::app_permission,
        'permission_groups',
        'assign',
        '{"ar": "تعيين مجموعات الصلاحيات للمستخدمين", "en": "Assign permission groups to users"}'::jsonb,
        '{"ar": "تعيين مجموعات الصلاحيات للمستخدمين", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'notification.view_alerts'::app_permission,
        'notification',
        'view_alerts',
        '{"ar": "عرض واجهة الإشعارات العامة مع تنبيهات النظام", "en": "Access global notifications UI with system alerts"}'::jsonb,
        '{"ar": "عرض واجهة الإشعارات العامة مع تنبيهات النظام", "en": "Notifications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_unpaid_invoices'::app_permission,
        'billing',
        'view_unpaid_invoices',
        '{"ar": "عرض الحسابات ذات الأرصدة المالية المعلقة أو المتأخرة", "en": "View accounts with pending or overdue financial balances"}'::jsonb,
        '{"ar": "عرض الحسابات ذات الأرصدة المالية المعلقة أو المتأخرة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'user.view_profile'::app_permission,
        'user',
        'view_profile',
        '{"ar": "عرض التفاصيل الشاملة لحساب المستخدم والفوترة", "en": "View specific user comprehensive account and billing details"}'::jsonb,
        '{"ar": "عرض التفاصيل الشاملة لحساب المستخدم والفوترة", "en": "Users"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.view_directory'::app_permission,
        'staff',
        'view_directory',
        '{"ar": "الوصول إلى دليل المعلمين العام مع المؤشرات والجدول", "en": "Access the global Teachers Directory with summary metrics and data table"}'::jsonb,
        '{"ar": "الوصول إلى دليل المعلمين العام مع المؤشرات والجدول", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_weekly'::app_permission,
        'schedule',
        'view_weekly',
        '{"ar": "عرض الجدول الأسبوعي للمعلم كشبكة زمنية ملونة", "en": "View a specific teacher weekly calendar grid with colored time-blocks"}'::jsonb,
        '{"ar": "عرض الجدول الأسبوعي للمعلم كشبكة زمنية ملونة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_workload'::app_permission,
        'schedule',
        'view_workload',
        '{"ar": "عرض مؤشرات عبء العمل الأسبوعي وساعات العمل", "en": "View aggregated weekly capacity metrics (Weekly hours worked)"}'::jsonb,
        '{"ar": "عرض مؤشرات عبء العمل الأسبوعي وساعات العمل", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.create_class'::app_permission,
        'schedule',
        'create_class',
        '{"ar": "إنشاء حصص جديدة وإضافتها لجدول المواعيد التكراري", "en": "Access the Add Class workflow and create new recurring scheduled sessions"}'::jsonb,
        '{"ar": "إنشاء حصص جديدة وإضافتها لجدول المواعيد التكراري", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.delete_class'::app_permission,
        'schedule',
        'delete_class',
        '{"ar": "حذف حصة تكرارية معينة من جدول المعلم", "en": "Delete a specific recurring class block from a teacher schedule"}'::jsonb,
        '{"ar": "حذف حصة تكرارية معينة من جدول المعلم", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.clear_weekly'::app_permission,
        'schedule',
        'clear_weekly',
        '{"ar": "مسح الجدول الأسبوعي للمعلم بالكامل دفعة واحدة", "en": "Bulk erase a teacher entire weekly schedule in a single action"}'::jsonb,
        '{"ar": "مسح الجدول الأسبوعي للمعلم بالكامل دفعة واحدة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.edit_profile'::app_permission,
        'staff',
        'edit_profile',
        '{"ar": "تعديل ملف المعلم شاملاً البيانات الشخصية والراتب", "en": "Edit teacher profile including PII, salary, and official details"}'::jsonb,
        '{"ar": "تعديل ملف المعلم شاملاً البيانات الشخصية والراتب", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.bulk_update_dst'::app_permission,
        'system',
        'bulk_update_dst',
        '{"ar": "تنفيذ خوارزمية تعديل التوقيت الصيفي الشاملة في قاعدة البيانات", "en": "Execute global DST adjustment algorithm across entire database"}'::jsonb,
        '{"ar": "تنفيذ خوارزمية تعديل التوقيت الصيفي الشاملة في قاعدة البيانات", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_directory'::app_permission,
        'parent',
        'view_directory',
        '{"ar": "الوصول إلى دليل أولياء الأمور العام مع مؤشرات الفواتير", "en": "Access global Parents Directory with status metrics and unpaid invoices"}'::jsonb,
        '{"ar": "الوصول إلى دليل أولياء الأمور العام مع مؤشرات الفواتير", "en": "Parents"}'::jsonb,
        true
    ),
    -- Story 8: Parent Profile & Account Lifecycle
    (
        gen_random_uuid (),
        'parent.view_profile'::app_permission,
        'parent',
        'view_profile',
        '{"ar": "عرض الملف التفصيلي لولي الأمر شاملاً البيانات والرسوم", "en": "Access detailed Parent Profile view with PII, social media links, and fee details"}'::jsonb,
        '{"ar": "عرض الملف التفصيلي لولي الأمر شاملاً البيانات والرسوم", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_students'::app_permission,
        'parent',
        'view_students',
        '{"ar": "عرض الطلاب التابعين لولي الأمر المسجل", "en": "View students assigned to the logged-in parent"}'::jsonb,
        '{"ar": "عرض الطلاب التابعين لولي الأمر المسجل", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_own_profile'::app_permission,
        'parent',
        'view_own_profile',
        '{"ar": "عرض الملف الشخصي لولي الأمر (قراءة فقط)", "en": "View own parent profile and social links (read-only)"}'::jsonb,
        '{"ar": "عرض الملف الشخصي لولي الأمر (قراءة فقط)", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.manage_status'::app_permission,
        'parent',
        'manage_status',
        '{"ar": "Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED", "en": "Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'student.view_associated'::app_permission,
        'student',
        'view_associated',
        '{"ar": "عرض قائمة الطلاب المرتبطين بولي أمر معين مع بيانات المعلم والرصيد", "en": "View the aggregated list of students associated with a specific parent, including teacher and quota data"}'::jsonb,
        '{"ar": "عرض قائمة الطلاب المرتبطين بولي أمر معين مع بيانات المعلم والرصيد", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'student.edit_quota'::app_permission,
        'student',
        'edit_quota',
        '{"ar": "Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers", "en": "Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_history'::app_permission,
        'billing',
        'view_history',
        '{"ar": "عرض سجل الفواتير الكامل لولي الأمر شاملة المدفوعة وغير المدفوعة", "en": "Access the full invoice ledger for a single parent, including paid and unpaid invoices"}'::jsonb,
        '{"ar": "عرض سجل الفواتير الكامل لولي الأمر شاملة المدفوعة وغير المدفوعة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'document.manage_parent_docs'::app_permission,
        'document',
        'manage_parent_docs',
        '{"ar": "إرفاق وعرض المستندات الخارجية (العقود، الهوية) المرتبطة بولي الأمر", "en": "Attach and view external files (contracts, ID verification) linked to a specific Parent record"}'::jsonb,
        '{"ar": "إرفاق وعرض المستندات الخارجية (العقود، الهوية) المرتبطة بولي الأمر", "en": "Documents"}'::jsonb,
        true
    ),
    -- Story 9: Invoice Generation & Processing (billing domain)
    (
        gen_random_uuid (),
        'billing.create_invoice'::app_permission,
        'billing',
        'create_invoice',
        '{"ar": "إنشاء فاتورة مخصصة يدويًا خارج دورة تجديد الباقة الآلية", "en": "Manually generate a custom invoice outside the automated package renewal cycle"}'::jsonb,
        '{"ar": "إنشاء فاتورة مخصصة يدويًا خارج دورة تجديد الباقة الآلية", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.update_status_paid'::app_permission,
        'billing',
        'update_status_paid',
        '{"ar": "التحقق يدويًا وتسجيل تسوية الفاتورة المستحقة كمدفوعة", "en": "Manually verify and log the settlement of an outstanding invoice by marking it as Paid"}'::jsonb,
        '{"ar": "التحقق يدويًا وتسجيل تسوية الفاتورة المستحقة كمدفوعة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.submit_payment_proof'::app_permission,
        'billing',
        'submit_payment_proof',
        '{"ar": "تقديم إثبات الدفع للفاتورة المستحقة على حساب ولي الأمر", "en": "Submit payment proof for an outstanding invoice on the parent account"}'::jsonb,
        '{"ar": "تقديم إثبات الدفع للفاتورة المستحقة على حساب ولي الأمر", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.delete_invoice'::app_permission,
        'billing',
        'delete_invoice',
        '{"ar": "حذف السجل المالي من دفتر فوترة ولي الأمر", "en": "Destructively remove a financial record from the parent billing ledger"}'::jsonb,
        '{"ar": "حذف السجل المالي من دفتر فوترة ولي الأمر", "en": "Billing"}'::jsonb,
        true
    ),
    -- Story 9: Student Metadata & Lifecycle Management
    (
        gen_random_uuid (),
        'student.reassign_teacher'::app_permission,
        'student',
        'reassign_teacher',
        '{"ar": "تغيير المعلم المعين للطالب ديناميكيًا من ملف ولي الأمر", "en": "Dynamically change a student assigned instructor from the parent profile view"}'::jsonb,
        '{"ar": "تغيير المعلم المعين للطالب ديناميكيًا من ملف ولي الأمر", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'student.manage_status'::app_permission,
        'student',
        'manage_status',
        '{"ar": "تعديل حالة تسجيل الطالب (منتظم، في إجازة، معلق) من ملف ولي الأمر", "en": "Alter a student global enrollment state (Regular, On Leave, Suspended) from parent profile"}'::jsonb,
        '{"ar": "تعديل حالة تسجيل الطالب (منتظم، في إجازة، معلق) من ملف ولي الأمر", "en": "Students"}'::jsonb,
        true
    ),
    -- Automated System Synchronization
    (
        gen_random_uuid (),
        'system.sync_notifications'::app_permission,
        'system',
        'sync_notifications',
        '{"ar": "قاعدة داخلية لمزامنة الإشعارات العامة مع تغييرات الفوترة الفورية", "en": "Internal rule that forces the global notification tray to reflect real-time billing changes"}'::jsonb,
        '{"ar": "قاعدة داخلية لمزامنة الإشعارات العامة مع تغييرات الفوترة الفورية", "en": "System"}'::jsonb,
        true
    ),
    -- Automated Student Status Enforcement
    (
        gen_random_uuid (),
        'system.enforce_suspended_lock'::app_permission,
        'system',
        'enforce_suspended_lock',
        '{"ar": "قاعدة آلية لتقييد عناصر واجهة جدول المعلم عندما يكون الطالب معلقًا", "en": "Automated rule that locks UI controls on teacher schedule when student is Suspended"}'::jsonb,
        '{"ar": "قاعدة آلية لتقييد عناصر واجهة جدول المعلم عندما يكون الطالب معلقًا", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.process_student_leave'::app_permission,
        'system',
        'process_student_leave',
        '{"ar": "سير عمل آلي لتسجيل الحصص القادمة كمعذورة وإدراجها لإعادة الجدولة عند إجازة الطالب", "en": "Automated workflow that marks future classes as excused and queues rescheduling when student is On Leave"}'::jsonb,
        '{"ar": "سير عمل آلي لتسجيل الحصص القادمة كمعذورة وإدراجها لإعادة الجدولة عند إجازة الطالب", "en": "System"}'::jsonb,
        true
    ),
    -- Story 11: System-Level Resource Access Restriction
    (
        gen_random_uuid (),
        'system.restrict_resource_access'::app_permission,
        'system',
        'restrict_resource_access',
        '{"ar": "تطبيق عزل تخزين الموارد التعليمية عن الوصول غير المصرح", "en": "Enforce isolation of learning resources storage from unauthorized external access"}'::jsonb,
        '{"ar": "تطبيق عزل تخزين الموارد التعليمية عن الوصول غير المصرح", "en": "System"}'::jsonb,
        true
    ),
    -- Story 12: Custom Reporting and Analytics
    (
        gen_random_uuid (),
        'report.generate_custom'::app_permission,
        'report',
        'generate_custom',
        '{"ar": "الوصول إلى واجهة التقارير ومحرك الاستعلامات الديناميكي لتقييم المؤشرات التشغيلية.", "en": "Authorizes access to the overarching Reports interface and the dynamic aggregation query engine to evaluate operational parameters."}'::jsonb,
        '{"ar": "الوصول إلى واجهة التقارير ومحرك الاستعلامات الديناميكي لتقييم المؤشرات التشغيلية.", "en": "Reporting"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'report.view_financials'::app_permission,
        'report',
        'view_financials',
        '{"ar": "حساب وعرض المؤشرات المالية والرواتب الحساسة في التقارير المحدثة.", "en": "Authorizes the query engine to calculate and render highly sensitive payroll and financial metrics within generated reports."}'::jsonb,
        '{"ar": "حساب وعرض المؤشرات المالية والرواتب الحساسة في التقارير المحدثة.", "en": "Reporting"}'::jsonb,
        true
    ),
    -- Story 14: Complaints, Suggestions, Communication Channels
    (
        gen_random_uuid (),
        'support.submit_complaint'::app_permission,
        'support',
        'submit_complaint',
        '{"ar": "تقديم شكوى جديدة من لوحة تحكم ولي الأمر", "en": "Submit a new complaint from the parent dashboard"}'::jsonb,
        '{"ar": "تقديم شكوى جديدة من لوحة تحكم ولي الأمر", "en": "Support"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'support.view_history'::app_permission,
        'support',
        'view_history',
        '{"ar": "عرض سجل الشكاوى المقدمة الخاصة بولي الأمر", "en": "View own complaint submission history as a parent"}'::jsonb,
        '{"ar": "عرض سجل الشكاوى المقدمة الخاصة بولي الأمر", "en": "Support"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'communication.submit_suggestion'::app_permission,
        'communication',
        'submit_suggestion',
        '{"ar": "تقديم اقتراح جديد من لوحة تحكم ولي الأمر", "en": "Submit a new suggestion from the parent dashboard"}'::jsonb,
        '{"ar": "تقديم اقتراح جديد من لوحة تحكم ولي الأمر", "en": "Communication"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.dispatch_email'::app_permission,
        'system',
        'dispatch_email',
        '{"ar": "صلاحية داخلية تسمح للنظام بإرسال الإشعارات عبر البريد الإلكتروني", "en": "Internal permission allowing the system to dispatch outbound email notifications"}'::jsonb,
        '{"ar": "صلاحية داخلية تسمح للنظام بإرسال الإشعارات عبر البريد الإلكتروني", "en": "System"}'::jsonb,
        true
    ),
    -- Story 15: Suggestion Review Workflow
    (
        gen_random_uuid (),
        'suggestions.list'::app_permission,
        'suggestions',
        'list',
        '{"ar": "عرض وفلترة جميع اقتراحات أولياء الأمور وحالة مراجعتها", "en": "List and filter all parent suggestions with review status and duplicate grouping"}'::jsonb,
        '{"ar": "عرض وفلترة جميع اقتراحات أولياء الأمور وحالة مراجعتها", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.review'::app_permission,
        'suggestions',
        'review',
        '{"ar": "مراجعة الاقتراح: تحديده كمراجع مع رد الإدارة أو كمكرر", "en": "Review a suggestion: mark as reviewed with admin response or mark as duplicate of another suggestion"}'::jsonb,
        '{"ar": "مراجعة الاقتراح: تحديده كمراجع مع رد الإدارة أو كمكرر", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.delete'::app_permission,
        'suggestions',
        'delete',
        '{"ar": "الحذف الخفيف لسجل الاقتراح من النظام", "en": "Soft-delete a suggestion record from the system"}'::jsonb,
        '{"ar": "الحذف الخفيف لسجل الاقتراح من النظام", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_exchange_rates'::app_permission,
        'billing',
        'view_exchange_rates',
        '{"ar": "عرض أسعار صرف العملات وآخر حالة مزامنة", "en": "View currency exchange rates and latest sync status"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.refresh_exchange_rates'::app_permission,
        'billing',
        'refresh_exchange_rates',
        '{"ar": "تشغيل مزامنة أسعار صرف العملات يدوياً", "en": "Trigger manual currency exchange rate refresh"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ) ON CONFLICT (key) DO
UPDATE
SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system;

  BEGIN
    ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

INSERT INTO
    permission_groups (
        id,
        name,
        description,
        is_system,
        slug,
        created_at,
        updated_at
    )
VALUES (
        gen_random_uuid (),
        '{"ar": "المشرف الأعلى", "en": "Super Admin"}'::jsonb,
        '{"ar": "وصول كامل للنظام", "en": "Full system access"}'::jsonb,
        true,
        'super_admin',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "المسؤول", "en": "Admin"}'::jsonb,
        '{"ar": "إشراف تشغيلي كامل", "en": "Full operational oversight for the sprint"}'::jsonb,
        true,
        'academy_admin',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "معلم", "en": "Teacher"}'::jsonb,
        '{"ar": "الصلاحيات الافتراضية لحسابات المعلمين", "en": "Default permissions for teacher accounts"}'::jsonb,
        true,
        'teacher_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "ولي أمر", "en": "Parent"}'::jsonb,
        '{"ar": "الصلاحيات الافتراضية لحسابات أولياء الأمور", "en": "Default permissions for parent accounts"}'::jsonb,
        true,
        'parent_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "موظف", "en": "Staff"}'::jsonb,
        '{"ar": "الصلاحيات الافتراضية لحسابات الموظفين", "en": "Default permissions for staff accounts"}'::jsonb,
        true,
        'staff_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "نظام آلي", "en": "System Automated"}'::jsonb,
        '{"ar": "قواعد النظام الداخلية للتحقق", "en": "Internal system rules for validation"}'::jsonb,
        true,
        'system_automated',
        NOW(),
        NOW()
    ) ON CONFLICT (slug) DO
UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system,
    updated_at = NOW();

DELETE FROM group_permissions
WHERE group_id IN (SELECT id FROM permission_groups WHERE is_system = true)
AND permission_id IN (
    SELECT id FROM permissions WHERE key IN (
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.metrics.view_all',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_all',
        'schedule.view_assigned',
        'schedule.view_family',
        'schedule.search_availability',
        'schedule.manage_recurring',
        'schedule.dst_migrate',
        'schedule.view_timezones',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'session.view_details',
        'session.activate_class',
        'session.activate_override',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'session.reschedule',
        'session.reset',
        'session.override_actions',
        'history.view_calendar',
        'history.view_details',
        'teacher.view_dashboard',
        'teacher.view_students',
        'teacher.view_own_profile',
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.bulk_update_dst',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave',
        'system.restrict_resource_access',
        'system.dispatch_email',
        'teachers.list',
        'teachers.create',
        'teachers.edit',
        'teachers.manage_schedule',
        'parents.list',
        'parents.create',
        'parents.edit',
        'students.list',
        'students.create',
        'students.edit',
        'students.change_teacher',
        'students.change_status',
        'students.override_quota',
        'invoices.list',
        'invoices.delete',
        'invoices.create',
        'invoices.mark_paid',
        'invoices.edit',
        'resources.list',
        'resources.delete',
        'resources.upload',
        'reports.generate',
        'complaints.list',
        'complaints.delete',
        'complaints.respond',
        'staff.list',
        'staff.create',
        'staff.edit',
        'staff.view_directory',
        'staff.edit_profile',
        'permission_groups.manage',
        'permission_groups.assign',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'billing.view_history',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'user.view_profile',
        'parent.view_directory',
        'parent.view_profile',
        'parent.view_students',
        'parent.view_own_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'student.reassign_teacher',
        'student.manage_status',
        'document.manage_parent_docs',
        'report.generate_custom',
        'report.view_financials',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion',
        'suggestions.list',
        'suggestions.review',
        'suggestions.delete'
    )
);

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'super_admin'
    AND p.key IN (
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.metrics.view_all',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_all',
        'schedule.view_assigned',
        'schedule.view_family',
        'schedule.search_availability',
        'schedule.manage_recurring',
        'schedule.dst_migrate',
        'schedule.view_timezones',
        'session.view_details',
        'session.activate_class',
        'session.activate_override',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'session.reschedule',
        'session.reset',
        'session.override_actions',
        'history.view_calendar',
        'history.view_details',
        'teacher.view_dashboard',
        'teacher.view_students',
        'teacher.view_own_profile',
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'teachers.list',
        'teachers.create',
        'teachers.edit',
        'teachers.manage_schedule',
        'parents.list',
        'parents.create',
        'parents.edit',
        'students.list',
        'students.create',
        'students.edit',
        'students.change_teacher',
        'students.change_status',
        'students.override_quota',
        'invoices.list',
        'invoices.delete',
        'invoices.create',
        'invoices.mark_paid',
        'invoices.edit',
        'resources.list',
        'resources.delete',
        'resources.upload',
        'reports.generate',
        'complaints.list',
        'complaints.delete',
        'complaints.respond',
        'staff.list',
        'staff.create',
        'staff.edit',
        'permission_groups.manage',
        'permission_groups.assign',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'user.view_profile',
        'staff.view_directory',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'staff.edit_profile',
        'system.bulk_update_dst',
        'parent.view_directory',
        'parent.view_profile',
        'parent.view_students',
        'parent.view_own_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'billing.view_history',
        'document.manage_parent_docs',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'student.reassign_teacher',
        'student.manage_status',
        'system.sync_notifications',
        'report.generate_custom',
        'report.view_financials',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion',
        'system.dispatch_email',
        'suggestions.list',
        'suggestions.review',
        'suggestions.delete',
        'billing.view_exchange_rates',
        'billing.refresh_exchange_rates'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'academy_admin'
    AND p.key IN (
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_timezones',
        'history.view_calendar',
        'history.view_details',
        'session.override_actions',
        'session.view_details',
        'session.activate_override',
        'session.reschedule',
        'session.reset',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'user.view_profile',
        'schedule.search_availability',
        'staff.view_directory',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'staff.edit_profile',
        'parent.view_directory',
        'parent.view_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'billing.view_history',
        'document.manage_parent_docs',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'student.reassign_teacher',
        'student.manage_status',
        'students.list',
        'students.create',
        'resources.list',
        'resources.upload',
        'resources.delete',
        'report.generate_custom',
        'report.view_financials',
        'teachers.create',
        'parents.create',
        'complaints.list',
        'complaints.delete',
        'complaints.respond',
        'suggestions.list',
        'suggestions.review',
        'billing.view_exchange_rates',
        'billing.refresh_exchange_rates',
        'teachers.edit',
        'teachers.list',
        'students.edit',
        'students.change_teacher',
        'students.change_status'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'teacher_default'
    AND p.key IN (
        'dashboard.view',
        'session.view_details',
        'schedule.view_assigned',
        'session.activate_class',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'teacher.view_dashboard',
        'teacher.view_students',
        'teacher.view_own_profile',
        'resources.list',
        'schedule.view_weekly',
        'schedule.view_workload'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'parent_default'
    AND p.key IN (
        'dashboard.view',
        'schedule.view_family',
        'session.view_details',
        'session.update_status.leave',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion',
        'billing.view_history',
        'billing.submit_payment_proof',
        'parent.view_students',
        'parent.view_own_profile'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'staff_default'
    AND p.key IN (
        'dashboard.view',
        'dashboard.view_metrics',
        'dashboard.metrics.view_all',
        'schedule.view_all',
        'session.view_details',
        'teachers.list',
        'parents.list',
        'students.list',
        'complaints.list'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'system_automated'
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave',
        'system.restrict_resource_access',
        'system.dispatch_email'
    ) ON CONFLICT DO NOTHING;

-- Triggers to protect system permissions and groups from deletion or mutation of is_system
CREATE OR REPLACE FUNCTION protect_system_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.is_system = true THEN
            RAISE EXCEPTION 'Cannot delete a system permission or group';
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'permissions' AND NEW.is_system = true THEN
            RAISE EXCEPTION 'Cannot create system permissions';
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'permissions' AND NEW.is_system = true AND (OLD.is_system = false OR OLD.is_system IS NULL) THEN
            RAISE EXCEPTION 'Cannot change is_system to true';
        END IF;

        IF OLD.is_system = true THEN
            IF NEW.is_system = false THEN
                RAISE EXCEPTION 'Cannot change is_system from true to false for system permissions or groups';
            END IF;

            IF TG_TABLE_NAME = 'permissions' THEN
                IF NEW.key IS DISTINCT FROM OLD.key OR 
                   NEW.resource IS DISTINCT FROM OLD.resource OR 
                   NEW.action IS DISTINCT FROM OLD.action THEN
                    RAISE EXCEPTION 'Cannot modify core properties of system permissions; only description and category can be updated';
                END IF;
            ELSIF TG_TABLE_NAME = 'permission_groups' THEN
                IF NEW.slug IS DISTINCT FROM OLD.slug THEN
                    RAISE EXCEPTION 'Cannot modify core properties of system permission groups; only name and description can be updated';
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_system_permissions ON permissions;

CREATE TRIGGER trg_protect_system_permissions
BEFORE INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION protect_system_permissions();

DROP TRIGGER IF EXISTS trg_protect_system_permission_groups ON permission_groups;

CREATE TRIGGER trg_protect_system_permission_groups
BEFORE UPDATE OR DELETE ON permission_groups
FOR EACH ROW EXECUTE FUNCTION protect_system_permissions();