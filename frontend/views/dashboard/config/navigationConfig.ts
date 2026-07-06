import {
  AssessmentOutlined,
  BadgeOutlined,
  CalendarTodayOutlined,
  CategoryOutlined,
  ClassOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  Diversity1Outlined,
  EventRepeatOutlined,
  FolderOpenOutlined,
  GroupOutlined,
  LightbulbOutlined,
  LogoutOutlined,
  MenuBookOutlined,
  NotificationsActiveOutlined,
  PaymentsOutlined,
  PersonOutlineOutlined,
  ReceiptLongOutlined,
  ReportProblemOutlined,
  SchoolOutlined,
  SearchOutlined,
  SecurityOutlined,
  TimelineOutlined,
  UpdateOutlined,
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
  },
  {
    key: "regular-schedule",
    labelKey: "dashboard.nav.regularSchedule",
    icon: EventRepeatOutlined,
    href: "/teachers/me/schedule/weekly",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherWeeklySchedule,
  },
  {
    key: "your-students",
    labelKey: "dashboard.nav.yourStudents",
    icon: GroupOutlined,
    href: "/teachers/me/students",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherStudents,
  },
  {
    key: "teacher-salary",
    labelKey: "dashboard.nav.salaryDetails",
    icon: PaymentsOutlined,
    href: "/teachers/me/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherOwnProfile,
  },
  {
    key: "teacher-class-details",
    labelKey: "dashboard.nav.classDetails",
    icon: ClassOutlined,
    href: "/teachers/me/classes",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherClassDetails,
  },
  {
    key: "teacher-rules",
    labelKey: "dashboard.nav.teacherRules",
    icon: DescriptionOutlined,
    href: "/teachers/rules",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherRules,
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
    key: "billing-parent",
    labelKey: "dashboard.nav.billingParent",
    icon: ReceiptLongOutlined,
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
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
  },
  {
    key: "regular-schedule",
    labelKey: "dashboard.nav.regularSchedule",
    icon: EventRepeatOutlined,
    href: "/teachers/me/schedule/weekly",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherWeeklySchedule,
  },
  {
    key: "your-students",
    labelKey: "dashboard.nav.yourStudents",
    icon: GroupOutlined,
    href: "/teachers/me/students",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherStudents,
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
    key: "teacher-salary",
    labelKey: "dashboard.nav.salaryDetails",
    icon: PaymentsOutlined,
    href: "/teachers/me/profile",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherOwnProfile,
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
    key: "billing-parent",
    labelKey: "dashboard.nav.billingParent",
    icon: ReceiptLongOutlined,
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
  },
  {
    key: "suggestions-submit",
    labelKey: "dashboard.nav.suggestionsSubmit",
    icon: LightbulbOutlined,
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsSubmit,
  },
  {
    key: "complaints-submit",
    labelKey: "dashboard.nav.complaintsSubmit",
    icon: ReportProblemOutlined,
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
  },
] as const;

/**
 * Filter navigation items based on real user permissions array.
 */
export function getNavItemsForPermissions(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  const filtered = items.filter(item => {
    if (!item.permission) return true;
    if (typeof item.permission === "string") {
      return permissions.includes(item.permission);
    }
    return item.permission.some(p => permissions.includes(p));
  });

  return applyTeacherNavOverrides(filtered, permissions);
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
