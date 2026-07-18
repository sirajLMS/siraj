import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import logger from "@/backend/lib/logger";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";
import { SystemPermissionGroupSlug } from "@/shared/constants/permission-group.enum";

type LmsPermissionSeed = {
  key: AppPermission;
  resource: string;
  action: string;
  description: LocalizedString;
  category: LocalizedString;
};

const LMS_PERMISSION_SEEDS: readonly LmsPermissionSeed[] = [
  {
    key: AppPermission.LESSON_REPORTS_SUBMIT,
    resource: "lesson_reports",
    action: "submit",
    description: {
      en: "Submit a lesson report for a completed class instance",
      ar: "إرسال تقرير حصة لحصة مكتملة",
    },
    category: { en: "Lesson Reports", ar: "تقارير الحصص" },
  },
  {
    key: AppPermission.LESSON_REPORTS_REVIEW,
    resource: "lesson_reports",
    action: "review",
    description: {
      en: "Review pending lesson reports",
      ar: "مراجعة تقارير الحصص المعلقة",
    },
    category: { en: "Lesson Reports", ar: "تقارير الحصص" },
  },
  {
    key: AppPermission.LESSON_REPORTS_APPROVE,
    resource: "lesson_reports",
    action: "approve",
    description: {
      en: "Approve a pending lesson report",
      ar: "الموافقة على تقرير حصة معلق",
    },
    category: { en: "Lesson Reports", ar: "تقارير الحصص" },
  },
  {
    key: AppPermission.LESSON_REPORTS_REJECT,
    resource: "lesson_reports",
    action: "reject",
    description: {
      en: "Reject a pending lesson report with a reason",
      ar: "رفض تقرير حصة معلق مع ذكر السبب",
    },
    category: { en: "Lesson Reports", ar: "تقارير الحصص" },
  },
  {
    key: AppPermission.SUPERVISOR_VIEW_DASHBOARD,
    resource: "supervisor",
    action: "view_dashboard",
    description: {
      en: "Access the supervisor dashboard",
      ar: "الوصول إلى لوحة المشرف",
    },
    category: { en: "Supervisor", ar: "المشرف" },
  },
  {
    key: AppPermission.STUDENT_VIEW_OWN_DASHBOARD,
    resource: "student",
    action: "view_own_dashboard",
    description: {
      en: "View the student's own dashboard",
      ar: "عرض لوحة الطالب الخاصة",
    },
    category: { en: "Student", ar: "الطالب" },
  },
  {
    key: AppPermission.CREDITS_MANAGE,
    resource: "credits",
    action: "manage",
    description: {
      en: "Manage student credit ledger entries (purchases / adjustments)",
      ar: "إدارة رصيد ساعات الطالب (مشتريات / تعديلات)",
    },
    category: { en: "Credits", ar: "الرصيد" },
  },
  {
    key: AppPermission.TEACHER_DUES_VIEW,
    resource: "teacher_dues",
    action: "view",
    description: {
      en: "View teacher dues ledger and monthly reports",
      ar: "عرض مستحقات المعلم والتقارير الشهرية",
    },
    category: { en: "Teacher Dues", ar: "مستحقات المعلمين" },
  },
  {
    key: AppPermission.TEACHER_DUES_MARK_PAID,
    resource: "teacher_dues",
    action: "mark_paid",
    description: {
      en: "Mark teacher dues entries as paid (single or bulk)",
      ar: "تعليم مستحقات المعلمين كمدفوعة (مفردة أو دفعة)",
    },
    category: { en: "Teacher Dues", ar: "مستحقات المعلمين" },
  },
  {
    key: AppPermission.MONTHLY_REPORTS_VIEW,
    resource: "monthly_reports",
    action: "view",
    description: {
      en: "View monthly operational and financial reports",
      ar: "عرض التقارير التشغيلية والمالية الشهرية",
    },
    category: { en: "Reports", ar: "التقارير" },
  },
] as const;

const SUPERVISOR_GROUP_PERMISSIONS: readonly AppPermission[] = [
  AppPermission.LESSON_REPORTS_REVIEW,
  AppPermission.LESSON_REPORTS_APPROVE,
  AppPermission.LESSON_REPORTS_REJECT,
  AppPermission.SUPERVISOR_VIEW_DASHBOARD,
  AppPermission.MONTHLY_REPORTS_VIEW,
  AppPermission.TEACHER_DUES_VIEW,
  AppPermission.TEACHER_DUES_MARK_PAID,
  // Own profile (/profile + supervisor profile nav). Do NOT grant
  // DASHBOARD_VIEW_METRICS — that flag marks admin users and hides the
  // supervisor portal sidebar/dashboard.
  AppPermission.AUTH_VIEW_OWN_PROFILE,
  // Visibility over the schedule, sessions, and history so supervisors can
  // triage lesson reports across teachers.
  AppPermission.DASHBOARD_VIEW,
  AppPermission.SCHEDULE_VIEW_LIST,
  AppPermission.SCHEDULE_VIEW_ASSIGNED,
  AppPermission.SESSION_VIEW_DETAILS,
  AppPermission.HISTORY_VIEW_CALENDAR,
  AppPermission.HISTORY_VIEW_DETAILS,
  AppPermission.TEACHERS_LIST,
  AppPermission.STUDENTS_LIST,
  AppPermission.COMPLAINTS_LIST,
  AppPermission.COMPLAINTS_RESPOND,
  AppPermission.NOTIFICATION_VIEW_ALERTS,
];

const STUDENT_GROUP_PERMISSIONS: readonly AppPermission[] = [
  AppPermission.STUDENT_VIEW_OWN_DASHBOARD,
  AppPermission.AUTH_VIEW_OWN_PROFILE,
  AppPermission.SCHEDULE_VIEW_ASSIGNED,
  AppPermission.SESSION_VIEW_DETAILS,
  AppPermission.HISTORY_VIEW_CALENDAR,
  AppPermission.HISTORY_VIEW_DETAILS,
  // Rows come from seed-profile-field-permissions; grant only.
  AppPermission.STUDENT_IDENTITY_EDIT_OWN,
  AppPermission.STUDENT_PARENT_EDIT_OWN,
  AppPermission.NOTIFICATION_VIEW_ALERTS,
];

const ADMIN_GROUP_SLUGS: readonly string[] = ["super_admin", "academy_admin"];

const SUPERVISOR_DEFAULT_SYSTEM_GROUP = {
  slug: SystemPermissionGroupSlug.SUPERVISOR_DEFAULT,
  name: { en: "Supervisor", ar: "مشرف" } satisfies LocalizedString,
  description: {
    en: "Default permissions for supervisor accounts (LMS workflow)",
    ar: "صلاحيات افتراضية لحسابات المشرفين (سير العمل LMS)",
  } satisfies LocalizedString,
};

const STUDENT_DEFAULT_SYSTEM_GROUP = {
  slug: SystemPermissionGroupSlug.STUDENT_DEFAULT,
  name: { en: "Student", ar: "طالب" } satisfies LocalizedString,
  description: {
    en: "Default permissions for student accounts (LMS workflow)",
    ar: "صلاحيات افتراضية لحسابات الطلاب (سير العمل LMS)",
  } satisfies LocalizedString,
};

const ALL_PERMISSION_KEYS = LMS_PERMISSION_SEEDS.map(spec => spec.key);

export async function seedOrGet() {
  logger.info("Seeding LMS permissions and supervisor/student groups...");

  await PermissionManagementService.upsertSystemPermissions(LMS_PERMISSION_SEEDS);

  await PermissionManagementService.ensureSystemPermissionGroup(SUPERVISOR_DEFAULT_SYSTEM_GROUP);
  await PermissionManagementService.ensureSystemPermissionGroup(STUDENT_DEFAULT_SYSTEM_GROUP);

  await PermissionManagementService.ensureGroupPermissionsForGroups(ADMIN_GROUP_SLUGS, ALL_PERMISSION_KEYS);
  // Withdraw admin-metrics from supervisor_default if an earlier seed granted it —
  // that key makes portal detection treat supervisors as admins (broken sidebar).
  await PermissionManagementService.revokeGroupPermissions(SystemPermissionGroupSlug.SUPERVISOR_DEFAULT, [
    AppPermission.DASHBOARD_VIEW_METRICS,
  ]);
  await PermissionManagementService.ensureGroupPermissionsForGroups(
    [SystemPermissionGroupSlug.SUPERVISOR_DEFAULT],
    SUPERVISOR_GROUP_PERMISSIONS
  );
  await PermissionManagementService.ensureGroupPermissionsForGroups(
    [SystemPermissionGroupSlug.TEACHER_DEFAULT],
    [AppPermission.LESSON_REPORTS_SUBMIT]
  );
  await PermissionManagementService.ensureGroupPermissionsForGroups(
    [SystemPermissionGroupSlug.STUDENT_DEFAULT],
    STUDENT_GROUP_PERMISSIONS
  );

  logger.info(`LMS permissions seeded (${LMS_PERMISSION_SEEDS.length} keys).`);
  return ALL_PERMISSION_KEYS;
}
