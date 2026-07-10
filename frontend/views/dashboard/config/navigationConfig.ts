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
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { PAGE_PERMISSIONS } from "@/frontend/types/page-permissions.types";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";

/**
 * Full navigation items for the dashboard sidebar.
 * Items are filtered at runtime by the user's permissions.
 */
export const SIDEBAR_NAV_ITEMS: readonly NavItem[] = [
  {
    key: "home",
    labelKey: "dashboard.nav.home",
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.dashboard,
  },
  {
    key: "today-classes",
    labelKey: "dashboard.nav.todayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDashboard,
    audience: "teacher",
  },
  {
    key: "regular-schedule",
    labelKey: "dashboard.nav.regularSchedule",
    icon: EventRepeatOutlined,
    href: "/schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherWeeklySchedule,
    audience: "teacher",
  },
  {
    key: "your-students",
    labelKey: "dashboard.nav.yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherStudents,
    audience: "teacher",
  },
  {
    key: "teacher-profile",
    labelKey: "dashboard.nav.yourProfile",
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
    labelKey: "dashboard.nav.teacherRules",
    icon: DescriptionOutlined,
    href: "/teachers/rules",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherRules,
    audience: "teacher",
  },
  {
    key: "parent-today-classes",
    labelKey: "dashboard.nav.todayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.parentDashboard,
    audience: "parent",
  },
  {
    key: "parent-your-students",
    labelKey: "dashboard.nav.yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.parentStudents,
    audience: "parent",
  },
  {
    key: "parent-suggest",
    labelKey: "dashboard.nav.suggest",
    icon: LightbulbOutlined,
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.parentSuggest,
    audience: "parent",
  },
  {
    key: "parent-rules",
    labelKey: "dashboard.nav.parentRules",
    icon: DescriptionOutlined,
    href: "/parents/rules",
    section: "main",
    permission: PAGE_PERMISSIONS.parentRules,
    audience: "parent",
  },
  {
    key: "parent-profile",
    labelKey: "dashboard.nav.yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.parentProfile,
    audience: "parent",
  },
  {
    key: "parent-social",
    labelKey: "dashboard.nav.socialMedia",
    icon: ShareOutlined,
    href: "/social",
    section: "footer",
    permission: PAGE_PERMISSIONS.parentOwnProfile,
    audience: "parent",
  },
  {
    key: "search-schedule",
    labelKey: "dashboard.nav.scheduleSearch",
    icon: SearchOutlined,
    href: "/search-schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.searchSchedule,
  },
  {
    key: "schedule-tracking",
    labelKey: "dashboard.nav.scheduleTracking",
    icon: EventRepeatOutlined,
    href: "/schedule/tracking/reschedule",
    section: "main",
    permission: PAGE_PERMISSIONS.scheduleTracking,
  },
  {
    key: "status-tracking",
    labelKey: "dashboard.nav.statusTracking",
    icon: TimelineOutlined,
    href: "/schedule/tracking/status",
    section: "main",
    permission: PAGE_PERMISSIONS.statusTracking,
  },
  {
    key: "schedule-alerts",
    labelKey: "dashboard.nav.scheduleAlerts",
    icon: NotificationsActiveOutlined,
    href: "/schedule/alerts",
    section: "main",
    permission: PAGE_PERMISSIONS.scheduleAlerts,
  },
  {
    key: "teachers",
    labelKey: "dashboard.nav.teachers",
    icon: SchoolOutlined,
    href: "/teachers",
    section: "main",
    permission: PAGE_PERMISSIONS.teachers,
  },
  {
    key: "parents",
    labelKey: "dashboard.nav.parents",
    icon: Diversity1Outlined,
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
  },
  {
    key: "students",
    labelKey: "dashboard.nav.students",
    icon: PersonOutlineOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  {
    key: "managers",
    labelKey: "dashboard.nav.managers",
    icon: BadgeOutlined,
    href: "/managers",
    section: "main",
    permission: PAGE_PERMISSIONS.managers,
  },
  {
    key: "resources",
    labelKey: "dashboard.nav.resources",
    icon: FolderOpenOutlined,
    href: "/resources",
    section: "main",
    permission: PAGE_PERMISSIONS.resources,
  },
  {
    key: "subjects",
    labelKey: "dashboard.nav.subjects",
    icon: CategoryOutlined,
    href: "/subjects",
    section: "main",
    permission: PAGE_PERMISSIONS.subjects,
  },
  {
    key: "books-and-bags",
    labelKey: "dashboard.nav.booksAndBags",
    icon: MenuBookOutlined,
    href: "/resources/books-and-bags",
    section: "main",
    permission: PAGE_PERMISSIONS.booksAndBags,
  },
  {
    key: "reports",
    labelKey: "dashboard.nav.reports",
    icon: AssessmentOutlined,
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
  },
  {
    key: "billing-admin",
    labelKey: "dashboard.nav.billingAdmin",
    icon: PaymentsOutlined,
    href: "/billing",
    section: "main",
    permission: PAGE_PERMISSIONS.billingAdmin,
  },
  {
    key: "exchange-rates",
    labelKey: "dashboard.nav.exchangeRates",
    icon: TimelineOutlined,
    href: "/billing/exchange-rates",
    section: "main",
    permission: PAGE_PERMISSIONS.exchangeRates,
  },
  {
    key: "supported-currencies",
    labelKey: "dashboard.nav.supportedCurrencies",
    icon: CurrencyExchangeOutlined,
    href: "/billing/currencies",
    section: "main",
    permission: PAGE_PERMISSIONS.supportedCurrencies,
  },
  {
    key: "currency-hedges",
    labelKey: "dashboard.nav.currencyHedges",
    icon: ShieldOutlined,
    href: "/billing/currency-hedges",
    section: "main",
    permission: PAGE_PERMISSIONS.currencyHedges,
  },
  {
    key: "billing-manual",
    labelKey: "dashboard.nav.billingManual",
    icon: NoteAddOutlined,
    href: "/billing/manual",
    section: "main",
    permission: PAGE_PERMISSIONS.billingManual,
  },
  {
    key: "payment-catalogs",
    labelKey: "dashboard.nav.paymentCatalogs",
    icon: AccountBalanceWalletOutlined,
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogs,
  },
  {
    key: "meeting-providers",
    labelKey: "dashboard.nav.meetingProviders",
    icon: VideocamOutlined,
    href: "/meeting-providers",
    section: "main",
    permission: PAGE_PERMISSIONS.meetingProviders,
  },
  {
    key: "billing-parent",
    labelKey: "dashboard.nav.invoices",
    icon: ReceiptLongOutlined,
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
    audience: "parent",
  },
  {
    key: "suggestions-manage",
    labelKey: "dashboard.nav.suggestionsManage",
    icon: LightbulbOutlined,
    href: "/suggestions/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsManage,
  },
  {
    key: "suggestions-submit",
    labelKey: "dashboard.nav.suggestionsSubmit",
    icon: LightbulbOutlined,
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsSubmit,
    audience: "parent",
  },
  {
    key: "complaints-manage",
    labelKey: "dashboard.nav.complaintsManage",
    icon: ReportProblemOutlined,
    href: "/complaints/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsManage,
  },
  {
    key: "complaints-submit",
    labelKey: "dashboard.nav.complaintsSubmit",
    icon: ReportProblemOutlined,
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
    audience: "parent",
  },
  {
    key: "dst-migration",
    labelKey: "dashboard.nav.dstMigration",
    icon: UpdateOutlined,
    href: "/tools/dst-migration",
    section: "main",
    permission: PAGE_PERMISSIONS.dstMigration,
  },
  {
    key: "permissions",
    labelKey: "dashboard.nav.permissions",
    icon: SecurityOutlined,
    href: "/permissions",
    section: "main",
    permission: PAGE_PERMISSIONS.permissions,
  },
  {
    key: "own-profile",
    labelKey: "dashboard.nav.yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "footer",
    permission: PAGE_PERMISSIONS.profile,
  },
  {
    key: "logout",
    labelKey: "dashboard.nav.logout",
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
    labelKey: "dashboard.nav.todayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDashboard,
    audience: "teacher",
  },
  {
    key: "regular-schedule",
    labelKey: "dashboard.nav.regularSchedule",
    icon: EventRepeatOutlined,
    href: "/schedule",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherWeeklySchedule,
    audience: "teacher",
  },
  {
    key: "your-students",
    labelKey: "dashboard.nav.yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherStudents,
    audience: "teacher",
  },
  {
    key: "home",
    labelKey: "dashboard.nav.home",
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.dashboard,
  },
  {
    key: "schedule",
    labelKey: "dashboard.nav.schedule",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: AppPermission.DashboardView,
  },
  {
    key: "resources",
    labelKey: "dashboard.nav.resources",
    icon: FolderOpenOutlined,
    href: "/resources",
    section: "main",
    permission: PAGE_PERMISSIONS.resources,
  },
  {
    key: "teacher-profile",
    labelKey: "dashboard.nav.yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherOwnProfile,
    audience: "teacher",
  },
  {
    key: "teachers",
    labelKey: "dashboard.nav.teachers",
    icon: SchoolOutlined,
    href: "/teachers",
    section: "main",
    permission: PAGE_PERMISSIONS.teachers,
  },
  {
    key: "students",
    labelKey: "dashboard.nav.students",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  {
    key: "parents",
    labelKey: "dashboard.nav.parents",
    icon: Diversity1Outlined,
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
  },
  {
    key: "subjects",
    labelKey: "dashboard.nav.subjects",
    icon: CategoryOutlined,
    href: "/subjects",
    section: "main",
    permission: PAGE_PERMISSIONS.subjects,
  },
  {
    key: "reports",
    labelKey: "dashboard.nav.reports",
    icon: AssessmentOutlined,
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
  },
  {
    key: "billing-admin",
    labelKey: "dashboard.nav.billingAdmin",
    icon: PaymentsOutlined,
    href: "/billing",
    section: "main",
    permission: PAGE_PERMISSIONS.billingAdmin,
  },
  {
    key: "exchange-rates",
    labelKey: "dashboard.nav.exchangeRates",
    icon: TimelineOutlined,
    href: "/billing/exchange-rates",
    section: "main",
    permission: PAGE_PERMISSIONS.exchangeRates,
  },
  {
    key: "supported-currencies",
    labelKey: "dashboard.nav.supportedCurrencies",
    icon: CurrencyExchangeOutlined,
    href: "/billing/currencies",
    section: "main",
    permission: PAGE_PERMISSIONS.supportedCurrencies,
  },
  {
    key: "currency-hedges",
    labelKey: "dashboard.nav.currencyHedges",
    icon: ShieldOutlined,
    href: "/billing/currency-hedges",
    section: "main",
    permission: PAGE_PERMISSIONS.currencyHedges,
  },
  {
    key: "billing-manual",
    labelKey: "dashboard.nav.billingManual",
    icon: NoteAddOutlined,
    href: "/billing/manual",
    section: "main",
    permission: PAGE_PERMISSIONS.billingManual,
  },
  {
    key: "payment-catalogs",
    labelKey: "dashboard.nav.paymentCatalogs",
    icon: AccountBalanceWalletOutlined,
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogs,
  },
  {
    key: "meeting-providers",
    labelKey: "dashboard.nav.meetingProviders",
    icon: VideocamOutlined,
    href: "/meeting-providers",
    section: "main",
    permission: PAGE_PERMISSIONS.meetingProviders,
  },
  {
    key: "billing-parent",
    labelKey: "dashboard.nav.invoices",
    icon: ReceiptLongOutlined,
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
    audience: "parent",
  },
  {
    key: "parent-today-classes",
    labelKey: "dashboard.nav.todayClasses",
    icon: CalendarTodayOutlined,
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.parentDashboard,
    audience: "parent",
  },
  {
    key: "parent-your-students",
    labelKey: "dashboard.nav.yourStudents",
    icon: GroupOutlined,
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.parentStudents,
    audience: "parent",
  },
  {
    key: "parent-suggest",
    labelKey: "dashboard.nav.suggest",
    icon: LightbulbOutlined,
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.parentSuggest,
    audience: "parent",
  },
  {
    key: "parent-profile",
    labelKey: "dashboard.nav.yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.parentProfile,
    audience: "parent",
  },
  {
    key: "complaints-submit",
    labelKey: "dashboard.nav.complaintsSubmit",
    icon: ReportProblemOutlined,
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
    audience: "parent",
  },
  {
    key: "own-profile",
    labelKey: "dashboard.nav.yourProfile",
    icon: PersonOutlineOutlined,
    href: "/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.profile,
  },
  {
    key: "suggestions-manage",
    labelKey: "dashboard.nav.suggestionsManage",
    icon: LightbulbOutlined,
    href: "/suggestions/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsManage,
  },
  {
    key: "complaints-manage",
    labelKey: "dashboard.nav.complaintsManage",
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
    if (!item.permission) return true;
    if (typeof item.permission === "string") {
      return permissions.includes(item.permission);
    }
    return item.permission.some(p => permissions.includes(p));
  });

  return applyProfileNavOverrides(
    applyParentNavOverrides(applyTeacherNavOverrides(filtered, permissions), permissions),
    permissions
  );
}

function applyProfileNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (isTeacherPortalUser(permissions) || isParentPortalUser(permissions)) {
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
