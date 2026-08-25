import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
export interface NavFeatureFlags {
  readonly enableUsersDirectory: boolean;
}

export const DEFAULT_NAV_FEATURE_FLAGS: NavFeatureFlags = {
  enableUsersDirectory: false,
};

/** Nav items pinned to the bottom of the sidebar (above the account footer). */
export const SIDEBAR_END_NAV_ITEM_KEYS = new Set(["teacher-rules", "parent-rules"]);

/**
 * Factory: teacher nav items shared between sidebar and bottom nav.
 * These three items (today-classes, regular-schedule, your-students) are
 * identical in both arrays.
 */
function makeTeacherNavItems(): readonly NavItem[] {
  return [
    {
      key: "today-classes",
      labelKey: "todayClasses",
      iconKey: "calendarToday",
      href: "/dashboard",
      section: "main",
      permission: PAGE_PERMISSIONS.teacherDashboard,
      audience: "teacher",
    },
    {
      key: "regular-schedule",
      labelKey: "regularSchedule",
      iconKey: "eventRepeat",
      href: "/schedule/weekly",
      section: "main",
      permission: PAGE_PERMISSIONS.teacherWeeklySchedule,
      audience: "teacher",
    },
    {
      key: "your-students",
      labelKey: "yourStudents",
      iconKey: "group",
      href: "/students",
      section: "main",
      permission: PAGE_PERMISSIONS.teacherStudents,
      audience: "teacher",
    },
  ];
}

/**
 * Factory: student + supervisor nav items shared between sidebar and bottom nav.
 * The only difference is `teacher-dues` includes a `groupId` in the sidebar
 * (for visual grouping) but not in the bottom nav (which ignores groups).
 */
function makeStudentSupervisorNavItems(includeGroupId: boolean): readonly NavItem[] {
  return [
    {
      key: "student-today-classes",
      labelKey: "studentTodayClasses",
      iconKey: "calendarToday",
      href: "/dashboard",
      section: "main",
      permission: PAGE_PERMISSIONS.studentSelfDashboard,
      audience: "student",
    },
    {
      key: "student-schedule",
      labelKey: "studentLessonHistory",
      iconKey: "eventRepeat",
      href: "/students/history",
      section: "main",
      permission: PAGE_PERMISSIONS.studentOwnHistory,
      audience: "student",
    },
    {
      key: "student-sessions",
      labelKey: "studentSessions",
      iconKey: "history",
      href: "/students/sessions",
      section: "main",
      permission: PAGE_PERMISSIONS.studentSessions,
      audience: "student",
    },
    {
      key: "student-credits",
      labelKey: "studentCredits",
      iconKey: "accountBalanceWallet",
      href: "/students/credits",
      section: "main",
      permission: PAGE_PERMISSIONS.studentCredits,
      audience: "student",
    },
    {
      key: "student-week-schedule",
      labelKey: "studentWeekSchedule",
      iconKey: "calendarToday",
      href: "/student/week-schedule",
      section: "main",
      permission: PAGE_PERMISSIONS.studentSessions,
      audience: "student",
    },
    {
      key: "student-monthly-appraisals",
      labelKey: "studentMonthlyAppraisals",
      iconKey: "rateReview",
      href: "/student/monthly-appraisals",
      section: "main",
      permission: PAGE_PERMISSIONS.studentSessions,
      audience: "student",
    },
    {
      key: "student-requests",
      labelKey: "studentRequests",
      iconKey: "assessment",
      href: "/student/requests",
      section: "main",
      permission: PAGE_PERMISSIONS.studentSessions,
      audience: "student",
    },
    {
      key: "supervisor-home",
      labelKey: "supervisorHome",
      iconKey: "dashboard",
      href: "/dashboard",
      section: "main",
      permission: PAGE_PERMISSIONS.supervisorDashboard,
      audience: "supervisor",
    },
    {
      key: "pending-reviews",
      labelKey: "pendingReviews",
      iconKey: "rateReview",
      href: "/lesson-reports",
      section: "main",
      permission: PAGE_PERMISSIONS.lessonReportsReview,
      audience: "supervisor",
      groupId: "grp_reports",
    },
    {
      key: "teacher-dues",
      labelKey: "teacherDues",
      iconKey: "payments",
      href: "/teacher-dues",
      section: "main",
      permission: PAGE_PERMISSIONS.teacherDuesView,
      audience: "supervisor",
      ...(includeGroupId ? { groupId: "grp_finance" } : {}),
    },
  ];
}

/**
 * Sidebar navigation GROUPS — labelled, optionally-collapsible clusters of
 * nav items. Each item in {@link SIDEBAR_NAV_ITEMS} can reference a group
 * via its `groupId` field; the renderer groups items under their matching
 * header (with optional `<Divider>` separator + `Collapse` animation).
 *
 * Portals (teacher/parent/student/supervisor) attach audience to specific
 * items rather than relying on groups — so for portals the groups array is
 * effectively decorative: empty groups are dropped by
 * `getNavItemsForPermissions` so portal users won't see empty headers.
 *
 * Group                     | Items (key)                          | Permission gate (any-of)
 * --------------------------|--------------------------------------|------------------------------
 * grp_home                  | home, search-schedule, schedule-tracking, status-tracking, schedule-alerts | per-item (admin)
 * grp_people                | teachers, parents, students, staff  | StaffViewDirectory / ParentsList / TeacherViewStudents / StudentsList
 * grp_schedule              | schedule-tracking* (after Phase 3), schedule-alerts | per-item
 * grp_billing               | (Phase 3 merged billing parent)       | BillingViewHistory / BillingManageCurrencyHedges / BillingCreateInvoice
 * grp_catalogs              | payment-catalogs, meeting-providers   | PaymentMethodsManageCatalogs / MeetingProvidersManageCatalog
 * grp_feedback              | complaints-manage, suggestions-manage | ComplaintsRespond|ComplaintsList / SuggestionsList
 * grp_reports               | reports, monthly-reports, teacher-dues, lesson-reports | per-item
 * grp_admin                 | permissions, settings, dst-migration, user-profile | PermissionGroupsManage / SettingsView* / SystemBulkUpdateDst
 * grp_integrations          | whatsapp-settings                   | WhatsappView / WhatsappConfigManage
 * grp_resources             | resources, books-and-bags, subjects   | ResourcesList / SubjectsList
 * grp_classes               | (Phase 2) new teacher-class-details   | ClassViewDetails
 * footer_account            | own-profile, logout                   | AuthViewOwnProfile / —
 *
 * Portal-audience items (teacher/parent/student/supervisor) intentionally
 * have NO `groupId` — they stay flat because portal nav is too short to
 * benefit from grouping, and audience overrides can vary per item.
 */
export const SIDEBAR_NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "grp_users",
    labelKey: "navGroupUsers",
    iconKey: "group",
    section: "main",
    permission: [
      AppPermission.TeachersList,
      AppPermission.ParentsList,
      AppPermission.TeacherViewStudents,
      AppPermission.StudentsList,
    ],
  },
  {
    id: "grp_schedule",
    labelKey: "navGroupSchedule",
    iconKey: "eventRepeat",
    section: "main",
    permission: [
      AppPermission.ScheduleSearchAvailability,
      AppPermission.SessionReschedule,
      AppPermission.ScheduleViewAll,
      AppPermission.ScheduleViewList,
      AppPermission.ScheduleManageRecurring,
    ],
    separator: true,
  },
  {
    id: "grp_content",
    labelKey: "navGroupContent",
    iconKey: "folderOpen",
    section: "main",
    permission: [AppPermission.ResourcesList, AppPermission.SubjectsList, AppPermission.SessionViewDetails],
    separator: true,
  },
  {
    id: "grp_finance",
    labelKey: "navGroupFinance",
    iconKey: "payments",
    section: "main",
    permission: [
      AppPermission.BillingViewHistory,
      AppPermission.BillingViewExchangeRates,
      AppPermission.BillingManageCurrencyHedges,
      AppPermission.BillingCreateInvoice,
      AppPermission.PaymentMethodsManageCatalogs,
      AppPermission.MeetingProvidersManageCatalog,
      AppPermission.TeacherDuesView,
      AppPermission.QuotasView,
      AppPermission.QuotasManage,
    ],
    separator: true,
  },

  {
    id: "grp_reports",
    labelKey: "navGroupReports",
    iconKey: "assessment",
    section: "main",
    permission: [
      AppPermission.ReportGenerateCustom,
      AppPermission.MonthlyReportsView,
      AppPermission.LessonReportsReview,
      AppPermission.LessonReportsApprove,
    ],
    separator: true,
  },
  {
    id: "grp_feedback",
    labelKey: "navGroupFeedback",
    iconKey: "reportProblem",
    section: "main",
    permission: [AppPermission.ComplaintsRespond, AppPermission.ComplaintsList, AppPermission.SuggestionsList],
    separator: true,
  },
  {
    id: "grp_admin",
    labelKey: "navGroupAdmin",
    iconKey: "security",
    section: "main",
    permission: [
      AppPermission.PermissionGroupsManage,
      AppPermission.SettingsView,
      AppPermission.SystemBulkUpdateDst,
      AppPermission.CronManage,
      AppPermission.SettingsEditMeetingIntegrations,
    ],
    separator: true,
  },
  {
    id: "grp_integrations",
    labelKey: "navGroupIntegrations",
    iconKey: "hub",
    section: "main",
    permission: [AppPermission.WhatsappView, AppPermission.WhatsappConfigManage],
    separator: true,
  },
] as const;

/**
 * Full navigation items for the dashboard sidebar.
 * Items are filtered at runtime by the user's permissions.
 */
export const SIDEBAR_NAV_ITEMS: readonly NavItem[] = [
  {
    key: "home",
    labelKey: "home",
    iconKey: "dashboard",
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.dashboard,
  },
  ...makeTeacherNavItems(),
  {
    key: "teacher-class-details",
    labelKey: "teacherClassList",
    iconKey: "class",
    href: "/classes",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherClassDetails,
    audience: "teacher",
  },
  {
    key: "teacher-rules",
    labelKey: "teacherRules",
    iconKey: "description",
    href: "/teachers/rules",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherRules,
    audience: "teacher",
  },
  {
    key: "parent-today-classes",
    labelKey: "todayClasses",
    iconKey: "calendarToday",
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.parentDashboard,
    audience: "parent",
  },
  {
    key: "parent-your-students",
    labelKey: "yourStudents",
    iconKey: "group",
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.parentStudents,
    audience: "parent",
  },
  {
    key: "billing-parent",
    labelKey: "invoices",
    iconKey: "receiptLong",
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
    audience: "parent",
  },
  {
    key: "parent-suggest",
    labelKey: "suggest",
    iconKey: "lightbulb",
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.parentSuggest,
    audience: "parent",
  },
  {
    key: "parent-rules",
    labelKey: "parentRules",
    iconKey: "description",
    href: "/parents/rules",
    section: "main",
    permission: PAGE_PERMISSIONS.parentRules,
    audience: "parent",
  },
  {
    key: "parent-social",
    labelKey: "socialMedia",
    iconKey: "share",
    href: "/parents/social",
    section: "footer",
    permission: PAGE_PERMISSIONS.parentOwnProfile,
    audience: "parent",
  },
  {
    key: "parent-payments-ledger",
    labelKey: "parentPaymentsLedger",
    iconKey: "payments",
    href: "/parent/payments",
    section: "main",
    permission: PAGE_PERMISSIONS.parentOwnProfile,
    audience: "parent",
  },
  {
    key: "parent-monthly-appraisals",
    labelKey: "parentMonthlyAppraisals",
    iconKey: "rateReview",
    href: "/parent/monthly-appraisals",
    section: "main",
    permission: PAGE_PERMISSIONS.parentOwnProfile,
    audience: "parent",
  },
  {
    key: "parent-requests",
    labelKey: "parentRequests",
    iconKey: "assessment",
    href: "/parent/requests",
    section: "main",
    permission: PAGE_PERMISSIONS.parentOwnProfile,
    audience: "parent",
  },
  ...makeStudentSupervisorNavItems(true),
  {
    key: "monthly-reports",
    labelKey: "monthlyReports",
    iconKey: "assessment",
    href: "/monthly-reports",
    section: "main",
    permission: PAGE_PERMISSIONS.monthlyReportsView,
    audience: "supervisor",
    groupId: "grp_reports",
  },
  {
    key: "search-schedule",
    labelKey: "scheduleSearch",
    iconKey: "search",
    href: "/search-schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.searchSchedule,
    groupId: "grp_schedule",
  },
  {
    key: "schedule-tracking",
    labelKey: "scheduleTrackingParent",
    iconKey: "eventRepeat",
    href: "/schedule/tracking",
    section: "main",
    permission: PAGE_PERMISSIONS.scheduleTrackingParent,
    groupId: "grp_schedule",
  },
  {
    key: "recurring-schedules",
    labelKey: "createClass",
    iconKey: "eventRepeat",
    href: "/recurring-schedules",
    section: "main",
    permission: PAGE_PERMISSIONS.recurringSchedules,
    groupId: "grp_schedule",
  },
  {
    key: "users-directory",
    labelKey: "usersDirectory",
    iconKey: "group",
    href: "/users",
    section: "main",
    permission: PAGE_PERMISSIONS.usersDirectoryParent,
  },
  {
    key: "teachers",
    labelKey: "teachers",
    iconKey: "school",
    href: "/teachers",
    section: "main",
    permission: PAGE_PERMISSIONS.teachers,
    groupId: "grp_users",
  },
  {
    key: "parents",
    labelKey: "parents",
    iconKey: "diversity1",
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
    groupId: "grp_users",
  },
  {
    key: "students",
    labelKey: "students",
    iconKey: "personOutline",
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
    groupId: "grp_users",
  },
  {
    key: "staff",
    labelKey: "staff",
    iconKey: "badge",
    href: "/staff",
    section: "main",
    permission: PAGE_PERMISSIONS.staff,
    groupId: "grp_users",
  },
  {
    key: "subjects",
    labelKey: "subjects",
    iconKey: "category",
    href: "/subjects",
    section: "main",
    permission: PAGE_PERMISSIONS.subjects,
    groupId: "grp_content",
  },
  {
    key: "classes",
    labelKey: "classDetails",
    iconKey: "class",
    href: "/classes",
    section: "main",
    permission: PAGE_PERMISSIONS.classesPage,
    groupId: "grp_content",
  },
  {
    key: "resources",
    labelKey: "resources",
    iconKey: "folderOpen",
    href: "/resources",
    section: "main",
    permission: PAGE_PERMISSIONS.resources,
    groupId: "grp_content",
  },
  {
    key: "books-and-bags",
    labelKey: "booksAndBags",
    iconKey: "menuBook",
    href: "/resources/books-and-bags",
    section: "main",
    permission: PAGE_PERMISSIONS.booksAndBags,
    groupId: "grp_content",
  },
  {
    key: "reports",
    labelKey: "reports",
    iconKey: "assessment",
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
    groupId: "grp_reports",
  },
  {
    key: "billing-admin",
    labelKey: "billingAdmin",
    iconKey: "payments",
    href: "/billing",
    section: "main",
    permission: PAGE_PERMISSIONS.billingAdmin,
    groupId: "grp_finance",
  },
  {
    key: "quotas",
    labelKey: "quotas",
    iconKey: "accountBalanceWallet",
    href: "/quotas",
    section: "main",
    permission: PAGE_PERMISSIONS.quotas,
    groupId: "grp_finance",
  },
  {
    key: "quotas-create",
    labelKey: "quotasCreate",
    iconKey: "accountBalanceWallet",
    href: "/quotas/new",
    section: "main",
    permission: PAGE_PERMISSIONS.quotasCreate,
    groupId: "grp_finance",
  },

  {
    key: "quotas-insights",
    labelKey: "quotasInsights",
    iconKey: "assessment",
    href: "/quotas/insights",
    section: "main",
    permission: PAGE_PERMISSIONS.quotasInsights,
    groupId: "grp_finance",
  },

  {
    key: "payment-catalogs",
    labelKey: "paymentCatalogs",
    iconKey: "accountBalanceWallet",
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogsParent,
    groupId: "grp_finance",
  },

  {
    key: "feedback-manage",
    labelKey: "feedbackManage",
    iconKey: "reportProblem",
    href: "/feedback/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.feedbackManageParent,
    groupId: "grp_feedback",
  },
  {
    key: "suggestions-submit",
    labelKey: "suggestionsSubmit",
    iconKey: "lightbulb",
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsSubmit,
    audience: "parent",
  },
  {
    key: "complaints-submit",
    labelKey: "complaintsSubmit",
    iconKey: "reportProblem",
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
    audience: "parent",
  },
  {
    key: "dst-migration",
    labelKey: "dstMigration",
    iconKey: "update",
    href: "/tools/dst-migration",
    section: "main",
    permission: PAGE_PERMISSIONS.dstMigration,
    groupId: "grp_admin",
  },
  {
    key: "cron",
    labelKey: "cron",
    iconKey: "eventRepeat",
    href: "/cron",
    section: "main",
    permission: PAGE_PERMISSIONS.cronManagement,
    groupId: "grp_admin",
  },
  {
    key: "permissions",
    labelKey: "permissions",
    iconKey: "security",
    href: "/permissions",
    section: "main",
    permission: PAGE_PERMISSIONS.permissions,
    groupId: "grp_admin",
  },
  {
    key: "settings",
    labelKey: "settings",
    iconKey: "settings",
    href: "/settings",
    section: "main",
    permission: PAGE_PERMISSIONS.settings,
    groupId: "grp_admin",
  },
  {
    key: "whatsapp-settings",
    labelKey: "whatsappSettings",
    iconKey: "hub",
    href: "/settings/whatsapp",
    section: "main",
    permission: PAGE_PERMISSIONS.whatsappSettings,
    groupId: "grp_integrations",
  },
] as const;

/**
 * Bottom navigation items for mobile, condensed.
 *
 * Bottom nav stays FLAT — it intentionally ignores `groupId` because the
 * bottom bar is space-constrained and groups don't translate to a
 * horizontal scrollrail. The `key` matches the sidebar counterpart for each
 * entry so callers can use the same `getActiveNavKey` against this list.
 */
export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  ...makeTeacherNavItems(),
  {
    key: "home",
    labelKey: "home",
    iconKey: "dashboard",
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.dashboard,
  },
  {
    key: "schedule",
    labelKey: "schedule",
    iconKey: "calendarToday",
    href: "/dashboard",
    section: "main",
    permission: AppPermission.DashboardView,
  },
  {
    key: "resources",
    labelKey: "resources",
    iconKey: "folderOpen",
    href: "/resources",
    section: "main",
    permission: PAGE_PERMISSIONS.resources,
  },
  {
    key: "teachers",
    labelKey: "teachers",
    iconKey: "school",
    href: "/teachers",
    section: "main",
    permission: PAGE_PERMISSIONS.teachers,
  },
  {
    key: "students",
    labelKey: "students",
    iconKey: "group",
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  {
    key: "parents",
    labelKey: "parents",
    iconKey: "diversity1",
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
  },
  {
    key: "subjects",
    labelKey: "subjects",
    iconKey: "category",
    href: "/subjects",
    section: "main",
    permission: PAGE_PERMISSIONS.subjects,
  },
  {
    key: "reports",
    labelKey: "reports",
    iconKey: "assessment",
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
  },
  {
    key: "billing-admin",
    labelKey: "billingAdmin",
    iconKey: "payments",
    href: "/billing",
    section: "main",
    permission: PAGE_PERMISSIONS.billingAdmin,
  },
  {
    key: "quotas",
    labelKey: "quotas",
    iconKey: "accountBalanceWallet",
    href: "/quotas",
    section: "main",
    permission: PAGE_PERMISSIONS.quotas,
  },
  {
    key: "quotas-create",
    labelKey: "quotasCreate",
    iconKey: "noteAdd",
    href: "/quotas/new",
    section: "main",
    permission: PAGE_PERMISSIONS.quotasCreate,
  },
  {
    key: "quotas-insights",
    labelKey: "quotasInsights",
    iconKey: "analytics",
    href: "/quotas/insights",
    section: "main",
    permission: PAGE_PERMISSIONS.quotasInsights,
  },

  {
    key: "payment-catalogs",
    labelKey: "paymentCatalogs",
    iconKey: "accountBalanceWallet",
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogsParent,
  },
  {
    key: "billing-parent",
    labelKey: "invoices",
    iconKey: "receiptLong",
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
    audience: "parent",
  },
  {
    key: "parent-today-classes",
    labelKey: "todayClasses",
    iconKey: "calendarToday",
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.parentDashboard,
    audience: "parent",
  },
  {
    key: "parent-your-students",
    labelKey: "yourStudents",
    iconKey: "group",
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.parentStudents,
    audience: "parent",
  },
  {
    key: "parent-suggest",
    labelKey: "suggest",
    iconKey: "lightbulb",
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.parentSuggest,
    audience: "parent",
  },
  ...makeStudentSupervisorNavItems(false),
  {
    key: "complaints-submit",
    labelKey: "complaintsSubmit",
    iconKey: "reportProblem",
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
    audience: "parent",
  },
  {
    key: "feedback-manage",
    labelKey: "feedbackManage",
    iconKey: "reportProblem",
    href: "/feedback/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.feedbackManageParent,
  },
] as const;

function hasItemPermission(item: NavItem, permissions: readonly AppPermission[]): boolean {
  if (!item.permission) {
    return true;
  }
  if (typeof item.permission === "string") {
    return permissions.includes(item.permission);
  }
  return item.permission.some(p => permissions.includes(p));
}

/**
 * Detects whether the current user is a SUPERADMIN (the `super_admin`
 * permission group). SUPERADMIN holds `PermissionGroupsManage`, granted only
 * to that group by the seed migration, so this is a stable discriminator.
 * Used to relax the supervisor audience gate so SUPERADMIN inherits every
 * supervisor-only nav item (`pending-reviews`, `teacher-dues`,
 * `monthly-reports`) — `supervisor-home` is excluded
 * by [`skipSuperAdminKeysForSupervisorItems`] below because the admin `home`
 * item already serves `/dashboard` for them (user decision: consolidate).
 */
export function isSuperAdminNavUser(permissions: readonly AppPermission[]): boolean {
  return permissions.includes(AppPermission.PermissionGroupsManage);
}

/** Supervisor-audience keys that should remain hidden for SUPERADMIN. */
const SUPERADMIN_HIDDEN_SUPERVISOR_KEYS = new Set<string>(["supervisor-home"]);

function isNavFeatureFlags(value: readonly AppPermission[] | NavFeatureFlags | undefined): value is NavFeatureFlags {
  return value !== undefined && !Array.isArray(value);
}

function resolveNavFeatureFlags(
  maybeFlags: readonly AppPermission[] | NavFeatureFlags | undefined,
  fallbackFlags?: NavFeatureFlags
): NavFeatureFlags {
  if (isNavFeatureFlags(maybeFlags)) {
    return maybeFlags;
  }
  return fallbackFlags ?? DEFAULT_NAV_FEATURE_FLAGS;
}

/**
 * Type guards for the union-typed parameters of
 * `getNavItemsForPermissions`. The active overload is selected by the third
 * argument (`maybePermissionsOrFlags`); these guards narrow the correlated
 * array parameters so the implementation can avoid unsafe type assertions.
 * `NavItem` carries a required `href` (absent on `NavGroup`), and
 * `AppPermission` is a string enum — so a single element check is enough to
 * classify a homogeneous array. Empty arrays match either branch, which is
 * safe because filtering an empty array is a no-op.
 */
type NavEntryArray = readonly NavGroup[] | readonly NavItem[] | readonly AppPermission[];

const isNavItemArray = (arr: NavEntryArray): arr is readonly NavItem[] =>
  arr.length === 0 || (typeof arr[0] === "object" && arr[0] !== null && "href" in arr[0]);

const isNavGroupArray = (arr: NavEntryArray): arr is readonly NavGroup[] =>
  arr.length === 0 || (typeof arr[0] === "object" && arr[0] !== null && !("href" in arr[0]));

const isAppPermissionArray = (arr: NavEntryArray): arr is readonly AppPermission[] =>
  arr.length === 0 || typeof arr[0] === "string";

/**
 * Returns the subset of NAV ITEMS that survive the user's permission + audience
 * gate + per-portal overrides. The same predicate is reused for both the
 * sidebar and the mobile bottom nav (which administers its own flat list).
 *
 * Group filtering (the second overload below) is a separate concern: a group
 * is dropped when it has no surviving children OR when the group itself is
 * gated against the user. Empty groups never surface — portals don't see
 * empty headers in the sidebar.
 */
export function getNavItemsForPermissions(
  items: readonly NavItem[],
  permissions: readonly AppPermission[],
  featureFlags?: NavFeatureFlags
): NavItem[];
export function getNavItemsForPermissions(
  groups: readonly NavGroup[],
  items: readonly NavItem[],
  permissions: readonly AppPermission[],
  featureFlags?: NavFeatureFlags
): NavGroup[];
export function getNavItemsForPermissions(
  groupsOrItems: readonly NavGroup[] | readonly NavItem[],
  itemsOrPermissions: readonly NavItem[] | readonly AppPermission[],
  maybePermissionsOrFlags?: readonly AppPermission[] | NavFeatureFlags,
  maybeFeatureFlags?: NavFeatureFlags
): NavItem[] | NavGroup[] {
  // Overload 1: (items, permissions[, featureFlags]) => NavItem[]
  if (maybePermissionsOrFlags === undefined || !Array.isArray(maybePermissionsOrFlags)) {
    const items = isNavItemArray(groupsOrItems) ? groupsOrItems : [];
    const permissions = isAppPermissionArray(itemsOrPermissions) ? itemsOrPermissions : [];
    const featureFlags = resolveNavFeatureFlags(maybePermissionsOrFlags);
    const filtered = items.filter(item => {
      // Next.js App Router Link rejects unresolved dynamic segments
      // (e.g. `/quotas/[id]`). Detail routes must be linked with a real id.
      if (item.href.includes("[")) {
        return false;
      }
      if (item.audience === "teacher" && !isTeacherPortalUser(permissions)) return false;
      if (item.audience === "parent" && !isParentPortalUser(permissions)) return false;
      if (item.audience === "student" && !isStudentPortalUser(permissions)) return false;
      // SUPERADMIN sees the supervisor-only items (the user's Phase 5 ask),
      // EXCEPT `supervisor-home` because the admin `home` item already serves
      // `/dashboard`. A non-SUPERADMIN without SupervisorViewDashboard never
      // sees supervisor items at all.
      if (item.audience === "supervisor") {
        if (!isSupervisorPortalUser(permissions) && !isSuperAdminNavUser(permissions)) {
          return false;
        }
        if (isSuperAdminNavUser(permissions) && !isSupervisorPortalUser(permissions)) {
          return !SUPERADMIN_HIDDEN_SUPERVISOR_KEYS.has(item.key);
        }
      }
      if (!hasItemPermission(item, permissions)) {
        return false;
      }
      return true;
    });

    return applyProfileNavOverrides(
      applySupervisorNavOverrides(
        applyStudentNavOverrides(
          applyParentNavOverrides(
            applyTeacherNavOverrides(applyUsersDirectoryNavOverrides(filtered, featureFlags), permissions),
            permissions
          ),
          permissions
        ),
        permissions
      ),
      permissions
    );
  }

  // Overload 2: (groups, items, permissions[, featureFlags]) => NavGroup[]
  const groups = isNavGroupArray(groupsOrItems) ? groupsOrItems : [];
  const items = isNavItemArray(itemsOrPermissions) ? itemsOrPermissions : [];
  const permissions = Array.isArray(maybePermissionsOrFlags) ? maybePermissionsOrFlags : [];
  const featureFlags = resolveNavFeatureFlags(undefined, maybeFeatureFlags);

  // 1) Filter items (single pass, exactly the same logic as overload 1).
  const filteredItems = getNavItemsForPermissions(items, permissions, featureFlags);

  // 2) Keep a group when (a) it passes its own audience+permission gate AND
  //    (b) it has at least one surviving child item.
  const itemKeysByGroup = new Map<string, string[]>();
  for (const item of filteredItems) {
    if (!item.groupId) {
      continue;
    }
    const arr = itemKeysByGroup.get(item.groupId);
    if (arr) {
      arr.push(item.key);
    } else {
      itemKeysByGroup.set(item.groupId, [item.key]);
    }
  }

  const survivingGroups = groups.filter(group => {
    if (group.audience === "teacher" && !isTeacherPortalUser(permissions)) return false;
    if (group.audience === "parent" && !isParentPortalUser(permissions)) return false;
    if (group.audience === "student" && !isStudentPortalUser(permissions)) return false;
    if (group.audience === "supervisor" && !isSupervisorPortalUser(permissions) && !isSuperAdminNavUser(permissions))
      return false;
    if (group.permission) {
      const hasGroupPermission =
        typeof group.permission === "string"
          ? permissions.includes(group.permission)
          : group.permission.some(p => permissions.includes(p));
      if (!hasGroupPermission) {
        return false;
      }
    }
    const children = itemKeysByGroup.get(group.id);
    return children !== undefined && children.length > 0;
  });

  return survivingGroups;
}

function applyUsersDirectoryNavOverrides(items: readonly NavItem[], featureFlags: NavFeatureFlags): NavItem[] {
  const directoryKeys = new Set(["teachers", "parents", "students", "staff"]);
  if (featureFlags.enableUsersDirectory) {
    return items.filter(item => !directoryKeys.has(item.key));
  }
  return items.filter(item => item.key !== "users-directory");
}

function applyProfileNavOverrides(items: readonly NavItem[], _permissions: readonly AppPermission[]): NavItem[] {
  // Profile is only reachable via SidebarAccountFooter for every audience.
  return items.filter(item => item.href !== "/profile" && item.key !== "own-profile");
}

function isParentPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function applyParentNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (!isParentPortalUser(permissions)) {
    return [...items];
  }

  const hiddenKeys = new Set([
    "home",
    "teacher-class-details",
    "classes",
    "billing-admin",
    "suggestions-submit",
    "schedule",
    "whatsapp-settings",
  ]);
  return items.filter(item => !hiddenKeys.has(item.key));
}

function isTeacherPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function applyTeacherNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (!isTeacherPortalUser(permissions)) {
    return [...items];
  }

  const hiddenKeys = new Set(["home", "books-and-bags", "whatsapp-settings"]);
  // Hide the admin grouped "classes" item only when the teacher-portal
  // "teacher-class-details" entry is also available (same /classes route).
  if (items.some(item => item.key === "teacher-class-details")) {
    hiddenKeys.add("classes");
  }
  return items.filter(item => !hiddenKeys.has(item.key));
}

function isStudentPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.StudentViewOwnDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function applyStudentNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (!isStudentPortalUser(permissions)) {
    return [...items];
  }
  // Student portal: hide admin-focused items
  const hiddenKeys = new Set(["home", "search-schedule", "schedule-tracking", "own-profile", "whatsapp-settings"]);
  return items.filter(item => !hiddenKeys.has(item.key));
}

function isSupervisorPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.SupervisorViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function applySupervisorNavOverrides(
  items: readonly NavItem[],
  permissions: readonly AppPermission[]
): NavItem[] {
  if (!isSupervisorPortalUser(permissions)) {
    return [...items];
  }
  // Supervisor portal: hide admin chrome unlocked by triage permissions
  // (students list, schedule alerts, complaints, etc.).
  const hiddenKeys = new Set([
    "home",
    "own-profile",
    "search-schedule",
    "schedule-tracking",
    "schedule",
    "managers",
    "resources",
    "subjects",
    "books-and-bags",
    "reports",
    "billing-admin",
    "payment-catalogs",
    "feedback-manage",
    "dst-migration",
    "cron",
    "permissions",
    "settings",
    "whatsapp-settings",
  ]);
  return items.filter(item => !hiddenKeys.has(item.key));
}
