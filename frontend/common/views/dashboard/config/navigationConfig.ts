import {
  AccountBalanceWalletOutlined,
  AssessmentOutlined,
  BadgeOutlined,
  CalendarTodayOutlined,
  CategoryOutlined,
  CurrencyExchangeOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  Diversity1Outlined,
  EventRepeatOutlined,
  FolderOpenOutlined,
  GroupOutlined,
  LightbulbOutlined,
  LogoutOutlined,
  MenuBookOutlined,
  NoteAddOutlined,
  NotificationsActiveOutlined,
  PaymentsOutlined,
  PersonOutlineOutlined,
  RateReviewOutlined,
  ReceiptLongOutlined,
  ReportProblemOutlined,
  SchoolOutlined,
  SearchOutlined,
  SecurityOutlined,
  ShareOutlined,
  ShieldOutlined,
  TimelineOutlined,
  UpdateOutlined,
  VideocamOutlined,
} from "@mui/icons-material";
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
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.dashboard,
  },
  {
    key: "today-classes",
    labelKey: "todayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDashboard,
    audience: "teacher",
  },
  {
    key: "regular-schedule",
    labelKey: "regularSchedule",
    icon: EventRepeatOutlined,
    href: "/schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherWeeklySchedule,
    audience: "teacher",
  },
  {
    key: "your-students",
    labelKey: "yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherStudents,
    audience: "teacher",
  },
  {
    key: "teacher-profile",
    labelKey: "yourProfile",
    icon: PersonOutlineOutlined,
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
    icon: DescriptionOutlined,
    href: "/teachers/rules",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherRules,
    audience: "teacher",
  },
  {
    key: "parent-today-classes",
    labelKey: "todayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.parentDashboard,
    audience: "parent",
  },
  {
    key: "parent-your-students",
    labelKey: "yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.parentStudents,
    audience: "parent",
  },
  {
    key: "parent-suggest",
    labelKey: "suggest",
    icon: LightbulbOutlined,
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.parentSuggest,
    audience: "parent",
  },
  {
    key: "parent-rules",
    labelKey: "parentRules",
    icon: DescriptionOutlined,
    href: "/parents/rules",
    section: "main",
    permission: PAGE_PERMISSIONS.parentRules,
    audience: "parent",
  },
  {
    key: "parent-profile",
    labelKey: "yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.parentProfile,
    audience: "parent",
  },
  {
    key: "parent-social",
    labelKey: "socialMedia",
    icon: ShareOutlined,
    href: "/social",
    section: "footer",
    permission: PAGE_PERMISSIONS.parentOwnProfile,
    audience: "parent",
  },
  {
    key: "student-today-classes",
    labelKey: "studentTodayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.studentSelfDashboard,
    audience: "student",
  },
  {
    key: "student-schedule",
    labelKey: "studentSchedule",
    icon: EventRepeatOutlined,
    href: "/students/me/history",
    section: "main",
    permission: PAGE_PERMISSIONS.studentOwnHistory,
    audience: "student",
  },
  {
    key: "student-credits",
    labelKey: "studentCredits",
    icon: AccountBalanceWalletOutlined,
    href: "/students/me/credits",
    section: "main",
    permission: PAGE_PERMISSIONS.studentCredits,
    audience: "student",
  },
  {
    key: "student-profile",
    labelKey: "studentProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.studentSelfProfile,
    audience: "student",
  },
  {
    key: "supervisor-home",
    labelKey: "supervisorHome",
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.supervisorDashboard,
    audience: "supervisor",
  },
  {
    key: "pending-reviews",
    labelKey: "pendingReviews",
    icon: RateReviewOutlined,
    href: "/lesson-reports",
    section: "main",
    permission: PAGE_PERMISSIONS.lessonReportsReview,
    audience: "supervisor",
  },
  {
    key: "teacher-dues",
    labelKey: "teacherDues",
    icon: PaymentsOutlined,
    href: "/teacher-dues",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDuesView,
    audience: "supervisor",
  },
  {
    key: "monthly-reports",
    labelKey: "monthlyReports",
    icon: AssessmentOutlined,
    href: "/monthly-reports",
    section: "main",
    permission: PAGE_PERMISSIONS.monthlyReportsView,
    audience: "supervisor",
  },
  {
    key: "supervisor-profile",
    labelKey: "supervisorProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.profile,
    audience: "supervisor",
  },
  {
    key: "search-schedule",
    labelKey: "scheduleSearch",
    icon: SearchOutlined,
    href: "/search-schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.searchSchedule,
  },
  {
    key: "schedule-tracking",
    labelKey: "scheduleTracking",
    icon: EventRepeatOutlined,
    href: "/schedule/tracking/reschedule",
    section: "main",
    permission: PAGE_PERMISSIONS.scheduleTracking,
  },
  {
    key: "status-tracking",
    labelKey: "statusTracking",
    icon: TimelineOutlined,
    href: "/schedule/tracking/status",
    section: "main",
    permission: PAGE_PERMISSIONS.statusTracking,
  },
  {
    key: "schedule-alerts",
    labelKey: "scheduleAlerts",
    icon: NotificationsActiveOutlined,
    href: "/schedule/alerts",
    section: "main",
    permission: PAGE_PERMISSIONS.scheduleAlerts,
  },
  {
    key: "teachers",
    labelKey: "teachers",
    icon: SchoolOutlined,
    href: "/teachers",
    section: "main",
    permission: PAGE_PERMISSIONS.teachers,
  },
  {
    key: "parents",
    labelKey: "parents",
    icon: Diversity1Outlined,
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
  },
  {
    key: "students",
    labelKey: "students",
    icon: PersonOutlineOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  {
    key: "staff",
    labelKey: "staff",
    icon: BadgeOutlined,
    href: "/staff",
    section: "main",
    permission: PAGE_PERMISSIONS.staff,
  },
  {
    key: "resources",
    labelKey: "resources",
    icon: FolderOpenOutlined,
    href: "/resources",
    section: "main",
    permission: PAGE_PERMISSIONS.resources,
  },
  {
    key: "subjects",
    labelKey: "subjects",
    icon: CategoryOutlined,
    href: "/subjects",
    section: "main",
    permission: PAGE_PERMISSIONS.subjects,
  },
  {
    key: "books-and-bags",
    labelKey: "booksAndBags",
    icon: MenuBookOutlined,
    href: "/resources/books-and-bags",
    section: "main",
    permission: PAGE_PERMISSIONS.booksAndBags,
  },
  {
    key: "reports",
    labelKey: "reports",
    icon: AssessmentOutlined,
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
  },
  {
    key: "billing-admin",
    labelKey: "billingAdmin",
    icon: PaymentsOutlined,
    href: "/billing",
    section: "main",
    permission: PAGE_PERMISSIONS.billingAdmin,
  },
  {
    key: "exchange-rates",
    labelKey: "exchangeRates",
    icon: TimelineOutlined,
    href: "/billing/exchange-rates",
    section: "main",
    permission: PAGE_PERMISSIONS.exchangeRates,
  },
  {
    key: "supported-currencies",
    labelKey: "supportedCurrencies",
    icon: CurrencyExchangeOutlined,
    href: "/billing/currencies",
    section: "main",
    permission: PAGE_PERMISSIONS.supportedCurrencies,
  },
  {
    key: "currency-hedges",
    labelKey: "currencyHedges",
    icon: ShieldOutlined,
    href: "/billing/currency-hedges",
    section: "main",
    permission: PAGE_PERMISSIONS.currencyHedges,
  },
  {
    key: "billing-manual",
    labelKey: "billingManual",
    icon: NoteAddOutlined,
    href: "/billing/manual",
    section: "main",
    permission: PAGE_PERMISSIONS.billingManual,
  },
  {
    key: "payment-catalogs",
    labelKey: "paymentCatalogs",
    icon: AccountBalanceWalletOutlined,
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogs,
  },
  {
    key: "meeting-providers",
    labelKey: "meetingProviders",
    icon: VideocamOutlined,
    href: "/meeting-providers",
    section: "main",
    permission: PAGE_PERMISSIONS.meetingProviders,
  },
  {
    key: "billing-parent",
    labelKey: "invoices",
    icon: ReceiptLongOutlined,
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
    audience: "parent",
  },
  {
    key: "suggestions-manage",
    labelKey: "suggestionsManage",
    icon: LightbulbOutlined,
    href: "/suggestions/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsManage,
  },
  {
    key: "suggestions-submit",
    labelKey: "suggestionsSubmit",
    icon: LightbulbOutlined,
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsSubmit,
    audience: "parent",
  },
  {
    key: "complaints-manage",
    labelKey: "complaintsManage",
    icon: ReportProblemOutlined,
    href: "/complaints/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsManage,
  },
  {
    key: "complaints-submit",
    labelKey: "complaintsSubmit",
    icon: ReportProblemOutlined,
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
    audience: "parent",
  },
  {
    key: "dst-migration",
    labelKey: "dstMigration",
    icon: UpdateOutlined,
    href: "/tools/dst-migration",
    section: "main",
    permission: PAGE_PERMISSIONS.dstMigration,
  },
  {
    key: "permissions",
    labelKey: "permissions",
    icon: SecurityOutlined,
    href: "/permissions",
    section: "main",
    permission: PAGE_PERMISSIONS.permissions,
  },
  {
    key: "own-profile",
    labelKey: "yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "footer",
    permission: PAGE_PERMISSIONS.profile,
  },
  {
    key: "logout",
    labelKey: "logout",
    icon: LogoutOutlined,
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
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDashboard,
    audience: "teacher",
  },
  {
    key: "regular-schedule",
    labelKey: "regularSchedule",
    icon: EventRepeatOutlined,
    href: "/schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherWeeklySchedule,
    audience: "teacher",
  },
  {
    key: "your-students",
    labelKey: "yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherStudents,
    audience: "teacher",
  },
  {
    key: "home",
    labelKey: "home",
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.dashboard,
  },
  {
    key: "schedule",
    labelKey: "schedule",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: AppPermission.DashboardView,
  },
  {
    key: "resources",
    labelKey: "resources",
    icon: FolderOpenOutlined,
    href: "/resources",
    section: "main",
    permission: PAGE_PERMISSIONS.resources,
  },
  {
    key: "teacher-profile",
    labelKey: "yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherOwnProfile,
    audience: "teacher",
  },
  {
    key: "teachers",
    labelKey: "teachers",
    icon: SchoolOutlined,
    href: "/teachers",
    section: "main",
    permission: PAGE_PERMISSIONS.teachers,
  },
  {
    key: "students",
    labelKey: "students",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  {
    key: "parents",
    labelKey: "parents",
    icon: Diversity1Outlined,
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
  },
  {
    key: "subjects",
    labelKey: "subjects",
    icon: CategoryOutlined,
    href: "/subjects",
    section: "main",
    permission: PAGE_PERMISSIONS.subjects,
  },
  {
    key: "reports",
    labelKey: "reports",
    icon: AssessmentOutlined,
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
  },
  {
    key: "billing-admin",
    labelKey: "billingAdmin",
    icon: PaymentsOutlined,
    href: "/billing",
    section: "main",
    permission: PAGE_PERMISSIONS.billingAdmin,
  },
  {
    key: "exchange-rates",
    labelKey: "exchangeRates",
    icon: TimelineOutlined,
    href: "/billing/exchange-rates",
    section: "main",
    permission: PAGE_PERMISSIONS.exchangeRates,
  },
  {
    key: "supported-currencies",
    labelKey: "supportedCurrencies",
    icon: CurrencyExchangeOutlined,
    href: "/billing/currencies",
    section: "main",
    permission: PAGE_PERMISSIONS.supportedCurrencies,
  },
  {
    key: "currency-hedges",
    labelKey: "currencyHedges",
    icon: ShieldOutlined,
    href: "/billing/currency-hedges",
    section: "main",
    permission: PAGE_PERMISSIONS.currencyHedges,
  },
  {
    key: "billing-manual",
    labelKey: "billingManual",
    icon: NoteAddOutlined,
    href: "/billing/manual",
    section: "main",
    permission: PAGE_PERMISSIONS.billingManual,
  },
  {
    key: "payment-catalogs",
    labelKey: "paymentCatalogs",
    icon: AccountBalanceWalletOutlined,
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogs,
  },
  {
    key: "meeting-providers",
    labelKey: "meetingProviders",
    icon: VideocamOutlined,
    href: "/meeting-providers",
    section: "main",
    permission: PAGE_PERMISSIONS.meetingProviders,
  },
  {
    key: "billing-parent",
    labelKey: "invoices",
    icon: ReceiptLongOutlined,
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
    audience: "parent",
  },
  {
    key: "parent-today-classes",
    labelKey: "todayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.parentDashboard,
    audience: "parent",
  },
  {
    key: "parent-your-students",
    labelKey: "yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.parentStudents,
    audience: "parent",
  },
  {
    key: "parent-suggest",
    labelKey: "suggest",
    icon: LightbulbOutlined,
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.parentSuggest,
    audience: "parent",
  },
  {
    key: "parent-profile",
    labelKey: "yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.parentProfile,
    audience: "parent",
  },
  {
    key: "student-today-classes",
    labelKey: "studentTodayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.studentSelfDashboard,
    audience: "student",
  },
  {
    key: "student-schedule",
    labelKey: "studentSchedule",
    icon: EventRepeatOutlined,
    href: "/students/me/history",
    section: "main",
    permission: PAGE_PERMISSIONS.studentOwnHistory,
    audience: "student",
  },
  {
    key: "student-credits",
    labelKey: "studentCredits",
    icon: AccountBalanceWalletOutlined,
    href: "/students/me/credits",
    section: "main",
    permission: PAGE_PERMISSIONS.studentCredits,
    audience: "student",
  },
  {
    key: "student-profile",
    labelKey: "studentProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.studentSelfProfile,
    audience: "student",
  },
  {
    key: "supervisor-home",
    labelKey: "supervisorHome",
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.supervisorDashboard,
    audience: "supervisor",
  },
  {
    key: "pending-reviews",
    labelKey: "pendingReviews",
    icon: RateReviewOutlined,
    href: "/lesson-reports",
    section: "main",
    permission: PAGE_PERMISSIONS.lessonReportsReview,
    audience: "supervisor",
  },
  {
    key: "teacher-dues",
    labelKey: "teacherDues",
    icon: PaymentsOutlined,
    href: "/teacher-dues",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDuesView,
    audience: "supervisor",
  },
  {
    key: "supervisor-profile",
    labelKey: "supervisorProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.profile,
    audience: "supervisor",
  },
  {
    key: "complaints-submit",
    labelKey: "complaintsSubmit",
    icon: ReportProblemOutlined,
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
    audience: "parent",
  },
  {
    key: "own-profile",
    labelKey: "yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.profile,
  },
  {
    key: "suggestions-manage",
    labelKey: "suggestionsManage",
    icon: LightbulbOutlined,
    href: "/suggestions/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsManage,
  },
  {
    key: "complaints-manage",
    labelKey: "complaintsManage",
    icon: ReportProblemOutlined,
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
  ]);
  return items.filter(item => !hiddenKeys.has(item.key));
}
