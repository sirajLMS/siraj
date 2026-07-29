import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

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
    href: "/schedule",
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
  {
    key: "teacher-profile",
    labelKey: "yourProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherOwnProfile,
    audience: "teacher",
  },
  // {
  //   key: "teacher-class-details",
  //   labelKey: "dashboard.nav.classDetails",
  //   icon: ClassOutlined,
  //   href: "/classes",
  //   section: "main",
  //   permission: PAGE_PERMISSIONS.teacherClassDetails,
  // },
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
    key: "parent-profile",
    labelKey: "yourProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.parentProfile,
    audience: "parent",
  },
  {
    key: "parent-social",
    labelKey: "socialMedia",
    iconKey: "share",
    href: "/social",
    section: "footer",
    permission: PAGE_PERMISSIONS.parentOwnProfile,
    audience: "parent",
  },
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
    labelKey: "studentSchedule",
    iconKey: "eventRepeat",
    href: "/students/me/history",
    section: "main",
    permission: PAGE_PERMISSIONS.studentOwnHistory,
    audience: "student",
  },
  {
    key: "student-credits",
    labelKey: "studentCredits",
    iconKey: "accountBalanceWallet",
    href: "/students/me/credits",
    section: "main",
    permission: PAGE_PERMISSIONS.studentCredits,
    audience: "student",
  },
  {
    key: "student-profile",
    labelKey: "studentProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.studentSelfProfile,
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
  },
  {
    key: "teacher-dues",
    labelKey: "teacherDues",
    iconKey: "payments",
    href: "/teacher-dues",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDuesView,
    audience: "supervisor",
  },
  {
    key: "monthly-reports",
    labelKey: "monthlyReports",
    iconKey: "assessment",
    href: "/monthly-reports",
    section: "main",
    permission: PAGE_PERMISSIONS.monthlyReportsView,
    audience: "supervisor",
  },
  {
    key: "supervisor-profile",
    labelKey: "supervisorProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.profile,
    audience: "supervisor",
  },
  {
    key: "search-schedule",
    labelKey: "scheduleSearch",
    iconKey: "search",
    href: "/search-schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.searchSchedule,
  },
  {
    key: "schedule-tracking",
    labelKey: "scheduleTracking",
    iconKey: "eventRepeat",
    href: "/schedule/tracking/reschedule",
    section: "main",
    permission: PAGE_PERMISSIONS.scheduleTracking,
  },
  {
    key: "status-tracking",
    labelKey: "statusTracking",
    iconKey: "timeline",
    href: "/schedule/tracking/status",
    section: "main",
    permission: PAGE_PERMISSIONS.statusTracking,
  },
  {
    key: "schedule-alerts",
    labelKey: "scheduleAlerts",
    iconKey: "notificationsActive",
    href: "/schedule/alerts",
    section: "main",
    permission: PAGE_PERMISSIONS.scheduleAlerts,
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
    key: "parents",
    labelKey: "parents",
    iconKey: "diversity1",
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
  },
  {
    key: "students",
    labelKey: "students",
    iconKey: "personOutline",
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  {
    key: "staff",
    labelKey: "staff",
    iconKey: "badge",
    href: "/staff",
    section: "main",
    permission: PAGE_PERMISSIONS.staff,
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
    key: "subjects",
    labelKey: "subjects",
    iconKey: "category",
    href: "/subjects",
    section: "main",
    permission: PAGE_PERMISSIONS.subjects,
  },
  {
    key: "books-and-bags",
    labelKey: "booksAndBags",
    iconKey: "menuBook",
    href: "/resources/books-and-bags",
    section: "main",
    permission: PAGE_PERMISSIONS.booksAndBags,
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
    key: "exchange-rates",
    labelKey: "exchangeRates",
    iconKey: "timeline",
    href: "/billing/exchange-rates",
    section: "main",
    permission: PAGE_PERMISSIONS.exchangeRates,
  },
  {
    key: "supported-currencies",
    labelKey: "supportedCurrencies",
    iconKey: "currencyExchange",
    href: "/billing/currencies",
    section: "main",
    permission: PAGE_PERMISSIONS.supportedCurrencies,
  },
  {
    key: "currency-hedges",
    labelKey: "currencyHedges",
    iconKey: "shield",
    href: "/billing/currency-hedges",
    section: "main",
    permission: PAGE_PERMISSIONS.currencyHedges,
  },
  {
    key: "billing-manual",
    labelKey: "billingManual",
    iconKey: "noteAdd",
    href: "/billing/manual",
    section: "main",
    permission: PAGE_PERMISSIONS.billingManual,
  },
  {
    key: "payment-catalogs",
    labelKey: "paymentCatalogs",
    iconKey: "accountBalanceWallet",
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogs,
  },
  {
    key: "meeting-providers",
    labelKey: "meetingProviders",
    iconKey: "videocam",
    href: "/meeting-providers",
    section: "main",
    permission: PAGE_PERMISSIONS.meetingProviders,
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
    key: "suggestions-manage",
    labelKey: "suggestionsManage",
    iconKey: "lightbulb",
    href: "/suggestions/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsManage,
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
    key: "complaints-manage",
    labelKey: "complaintsManage",
    iconKey: "reportProblem",
    href: "/complaints/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsManage,
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
  },
  {
    key: "permissions",
    labelKey: "permissions",
    iconKey: "security",
    href: "/permissions",
    section: "main",
    permission: PAGE_PERMISSIONS.permissions,
  },
  {
    key: "settings",
    labelKey: "settings",
    iconKey: "settings",
    href: "/settings",
    section: "main",
    permission: PAGE_PERMISSIONS.settings,
  },
  {
    key: "own-profile",
    labelKey: "yourProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "footer",
    permission: PAGE_PERMISSIONS.profile,
  },
  {
    key: "logout",
    labelKey: "logout",
    iconKey: "logout",
    href: "/logout",
    section: "footer",
  },
] as const;

/**
 * Bottom navigation items for mobile, condensed.
 */
export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
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
    href: "/schedule",
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
    key: "teacher-profile",
    labelKey: "yourProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherOwnProfile,
    audience: "teacher",
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
    key: "exchange-rates",
    labelKey: "exchangeRates",
    iconKey: "timeline",
    href: "/billing/exchange-rates",
    section: "main",
    permission: PAGE_PERMISSIONS.exchangeRates,
  },
  {
    key: "supported-currencies",
    labelKey: "supportedCurrencies",
    iconKey: "currencyExchange",
    href: "/billing/currencies",
    section: "main",
    permission: PAGE_PERMISSIONS.supportedCurrencies,
  },
  {
    key: "currency-hedges",
    labelKey: "currencyHedges",
    iconKey: "shield",
    href: "/billing/currency-hedges",
    section: "main",
    permission: PAGE_PERMISSIONS.currencyHedges,
  },
  {
    key: "billing-manual",
    labelKey: "billingManual",
    iconKey: "noteAdd",
    href: "/billing/manual",
    section: "main",
    permission: PAGE_PERMISSIONS.billingManual,
  },
  {
    key: "payment-catalogs",
    labelKey: "paymentCatalogs",
    iconKey: "accountBalanceWallet",
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogs,
  },
  {
    key: "meeting-providers",
    labelKey: "meetingProviders",
    iconKey: "videocam",
    href: "/meeting-providers",
    section: "main",
    permission: PAGE_PERMISSIONS.meetingProviders,
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
  {
    key: "parent-profile",
    labelKey: "yourProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.parentProfile,
    audience: "parent",
  },
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
    labelKey: "studentSchedule",
    iconKey: "eventRepeat",
    href: "/students/me/history",
    section: "main",
    permission: PAGE_PERMISSIONS.studentOwnHistory,
    audience: "student",
  },
  {
    key: "student-credits",
    labelKey: "studentCredits",
    iconKey: "accountBalanceWallet",
    href: "/students/me/credits",
    section: "main",
    permission: PAGE_PERMISSIONS.studentCredits,
    audience: "student",
  },
  {
    key: "student-profile",
    labelKey: "studentProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.studentSelfProfile,
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
  },
  {
    key: "teacher-dues",
    labelKey: "teacherDues",
    iconKey: "payments",
    href: "/teacher-dues",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDuesView,
    audience: "supervisor",
  },
  {
    key: "supervisor-profile",
    labelKey: "supervisorProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.profile,
    audience: "supervisor",
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
    key: "own-profile",
    labelKey: "yourProfile",
    iconKey: "personOutline",
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.profile,
  },
  {
    key: "suggestions-manage",
    labelKey: "suggestionsManage",
    iconKey: "lightbulb",
    href: "/suggestions/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsManage,
  },
  {
    key: "complaints-manage",
    labelKey: "complaintsManage",
    iconKey: "reportProblem",
    href: "/complaints/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsManage,
  },
] as const;

/**
 * Filter navigation items based on real user permissions array.
 */
export function getNavItemsForPermissions(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  const filtered = items.filter(item => {
    if (item.audience === "teacher" && !isTeacherPortalUser(permissions)) return false;
    if (item.audience === "parent" && !isParentPortalUser(permissions)) return false;
    if (item.audience === "student" && !isStudentPortalUser(permissions)) return false;
    if (item.audience === "supervisor" && !isSupervisorPortalUser(permissions)) return false;
    if (!item.permission) return true;
    if (typeof item.permission === "string") {
      return permissions.includes(item.permission);
    }
    return item.permission.some(p => permissions.includes(p));
  });

  return applyProfileNavOverrides(
    applySupervisorNavOverrides(
      applyStudentNavOverrides(
        applyParentNavOverrides(applyTeacherNavOverrides(filtered, permissions), permissions),
        permissions
      ),
      permissions
    ),
    permissions
  );
}

function applyProfileNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (
    isTeacherPortalUser(permissions) ||
    isParentPortalUser(permissions) ||
    isStudentPortalUser(permissions) ||
    isSupervisorPortalUser(permissions)
  ) {
    return items.filter(item => item.key !== "own-profile");
  }

  return [...items];
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

  const hiddenKeys = new Set(["home", "teacher-class-details", "suggestions-submit", "schedule"]);
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

  const hiddenKeys = new Set(["home", "books-and-bags"]);
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
  const hiddenKeys = new Set([
    "home",
    "search-schedule",
    "schedule-tracking",
    "status-tracking",
    "schedule-alerts",
    "own-profile",
  ]);
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
    "status-tracking",
    "schedule-alerts",
    "schedule",
    "teachers",
    "students",
    "parents",
    "managers",
    "resources",
    "subjects",
    "books-and-bags",
    "reports",
    "billing-admin",
    "exchange-rates",
    "supported-currencies",
    "currency-hedges",
    "billing-manual",
    "payment-catalogs",
    "meeting-providers",
    "suggestions-manage",
    "complaints-manage",
    "dst-migration",
    "permissions",
    "settings",
  ]);
  return items.filter(item => !hiddenKeys.has(item.key));
}
