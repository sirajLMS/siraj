import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Common navigation items shared between sidebar and bottom nav.
 */
const COMMON_NAV_ITEMS: Record<string, NavItem> = {
  home: {
    key: "home",
    labelKey: "home",
    iconKey: "dashboard",
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.dashboard,
  },
  teacherDashboard: {
    key: "teacher-dashboard",
    labelKey: "teacherDashboard",
    iconKey: "dashboard",
    href: "/dashboard",
    section: "main",
    permission: PAGE_PERMISSIONS.teacherDashboard,
  },
  teachers: {
    key: "teachers",
    labelKey: "teachers",
    iconKey: "school",
    href: "/teachers",
    section: "main",
    permission: PAGE_PERMISSIONS.teachers,
  },
  teacherWeeklySchedule: {
    key: "teacher-weekly-schedule",
    labelKey: "teacherWeeklySchedule",
    iconKey: "calendarToday",
    href: "/teachers/tea-1/schedule/weekly",
    section: "main",
    permission: AppPermission.TeachersManageSchedule,
  },
  teacherFutureSchedule: {
    key: "teacher-future-schedule",
    labelKey: "teacherFutureSchedule",
    iconKey: "calendarToday",
    href: "/teachers/tea-1/schedule/future",
    section: "main",
    permission: AppPermission.TeachersManageSchedule,
  },
  teacherReassignment: {
    key: "teacher-reassignment",
    labelKey: "teacherReassignment",
    iconKey: "personAddAlt",
    href: "/teachers/tea-1/reassignment",
    section: "main",
    permission: AppPermission.StudentsChangeTeacher,
  },
  dstMigration: {
    key: "dst-migration",
    labelKey: "dstMigration",
    iconKey: "update",
    href: "/tools/dst-migration",
    section: "main",
    permission: PAGE_PERMISSIONS.dstMigration,
  },
  teacherAvailability: {
    key: "teacher-availability",
    labelKey: "teacherAvailability",
    iconKey: "eventRepeat",
    href: "/teachers/tea-1/availability",
    section: "main",
    permission: AppPermission.ScheduleSearchAvailability,
  },
  parents: {
    key: "parents",
    labelKey: "parents",
    iconKey: "diversity1",
    href: "/parents",
    section: "main",
    permission: PAGE_PERMISSIONS.parents,
  },
  students: {
    key: "students",
    labelKey: "students",
    iconKey: "personOutline",
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  reports: {
    key: "reports",
    labelKey: "reports",
    iconKey: "assessment",
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
  },
  billingAdmin: {
    key: "billing-admin",
    labelKey: "billingAdmin",
    iconKey: "payments",
    href: "/billing",
    section: "main",
    permission: PAGE_PERMISSIONS.billingAdmin,
  },
  paymentCatalogs: {
    key: "payment-catalogs",
    labelKey: "paymentCatalogs",
    iconKey: "payments",
    href: "/payment-catalogs",
    section: "main",
    permission: PAGE_PERMISSIONS.paymentCatalogs,
  },
  billingParent: {
    key: "billing-parent",
    labelKey: "billingParent",
    iconKey: "receiptLong",
    href: "/billing/invoices",
    section: "main",
    permission: PAGE_PERMISSIONS.billingParent,
  },
  billingManual: {
    key: "billing-manual",
    labelKey: "billingManual",
    iconKey: "noteAdd",
    href: "/billing/manual",
    section: "main",
    permission: AppPermission.InvoicesCreate,
  },
  suggestionsManage: {
    key: "suggestions-manage",
    labelKey: "suggestionsManage",
    iconKey: "lightbulb",
    href: "/suggestions/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsManage,
  },
  suggestionsSubmit: {
    key: "suggestions-submit",
    labelKey: "suggestionsSubmit",
    iconKey: "lightbulb",
    href: "/suggestions",
    section: "main",
    permission: PAGE_PERMISSIONS.suggestionsSubmit,
  },
  complaintsManage: {
    key: "complaints-manage",
    labelKey: "complaintsManage",
    iconKey: "reportProblem",
    href: "/complaints/manage",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsManage,
  },
  complaintsSubmit: {
    key: "complaints-submit",
    labelKey: "complaintsSubmit",
    iconKey: "reportProblem",
    href: "/complaints",
    section: "main",
    permission: PAGE_PERMISSIONS.complaintsSubmit,
  },
};

/**
 * Full navigation items for the dashboard sidebar.
 * Each item has a permission key; only items matching the user's
 * permissions will be rendered.
 */
export const SIDEBAR_NAV_ITEMS: readonly NavItem[] = [
  COMMON_NAV_ITEMS.home,
  COMMON_NAV_ITEMS.teacherDashboard,
  {
    key: "schedule-search",
    labelKey: "scheduleSearch",
    iconKey: "search",
    href: "/schedule-search",
    section: "main",
    permission: AppPermission.ScheduleSearchAvailability,
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
    key: "class-details",
    labelKey: "classDetails",
    iconKey: "class",
    href: "/classes/cls-9921",
    section: "main",
    permission: [AppPermission.SessionViewDetails, AppPermission.SessionReschedule],
  },
  {
    key: "class-audit",
    labelKey: "classAudit",
    iconKey: "history",
    href: "/classes/cls-9921/audit",
    section: "main",
    permission: AppPermission.SessionViewDetails,
  },
  COMMON_NAV_ITEMS.teachers,
  COMMON_NAV_ITEMS.teacherWeeklySchedule,
  COMMON_NAV_ITEMS.teacherFutureSchedule,
  COMMON_NAV_ITEMS.teacherReassignment,
  COMMON_NAV_ITEMS.teacherAvailability,
  COMMON_NAV_ITEMS.teacherOnboarding,
  COMMON_NAV_ITEMS.parentOnboarding,
  COMMON_NAV_ITEMS.managerOnboarding,
  COMMON_NAV_ITEMS.parents,
  {
    key: "parent-profile",
    labelKey: "parents",
    iconKey: "personOutline",
    href: profileHrefForParent({ parentId: "par-001" }) ?? "/parents",
    section: "main",
    permission: AppPermission.ParentsEdit,
  },
  COMMON_NAV_ITEMS.students,
  {
    key: "student-history",
    labelKey: "studentHistory",
    iconKey: "history",
    href: "/students/SRJ-9921/profile?tab=history",
    section: "main",
    permission: AppPermission.SessionViewDetails,
  },
  {
    key: "student-quota",
    labelKey: "studentQuota",
    iconKey: "edit",
    href: "/students/SRJ-9921/profile?tab=quota",
    section: "main",
    permission: AppPermission.StudentsOverrideQuota,
  },
  {
    key: "student-status",
    labelKey: "studentStatus",
    iconKey: "class",
    href: "/students/SRJ-9921/profile?tab=status",
    section: "main",
    permission: AppPermission.StudentsChangeStatus,
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
    key: "books-and-bags",
    labelKey: "booksAndBags",
    iconKey: "menuBook",
    href: "/resources/books-and-bags",
    section: "main",
    permission: PAGE_PERMISSIONS.booksAndBags,
  },
  COMMON_NAV_ITEMS.reports,
  COMMON_NAV_ITEMS.billingAdmin,
  COMMON_NAV_ITEMS.billingParent,
  COMMON_NAV_ITEMS.billingManual,
  COMMON_NAV_ITEMS.suggestionsManage,
  COMMON_NAV_ITEMS.suggestionsSubmit,
  COMMON_NAV_ITEMS.complaintsManage,
  COMMON_NAV_ITEMS.complaintsSubmit,
  COMMON_NAV_ITEMS.dstMigration,
  {
    key: "add-account",
    labelKey: "addAccount",
    iconKey: "personAddAlt",
    href: "/add-account",
    section: "footer",
    permission: AppPermission.PermissionGroupsAssign,
  },
  { key: "logout", labelKey: "logout", iconKey: "logout", href: "/logout", section: "footer" },
];

/**
 * Bottom navigation items for mobile.
 * A condensed subset of the sidebar items.
 */
export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  {
    key: "schedule",
    labelKey: "schedule",
    iconKey: "calendarToday",
    href: "/dashboard",
    section: "main",
    permission: AppPermission.DashboardView,
  },
  COMMON_NAV_ITEMS.teacherDashboard,
  COMMON_NAV_ITEMS.teachers,
  COMMON_NAV_ITEMS.teacherWeeklySchedule,
  COMMON_NAV_ITEMS.teacherFutureSchedule,
  COMMON_NAV_ITEMS.teacherReassignment,
  COMMON_NAV_ITEMS.teacherAvailability,
  COMMON_NAV_ITEMS.teacherOnboarding,
  COMMON_NAV_ITEMS.parents,
  {
    key: "students",
    labelKey: "students",
    iconKey: "group",
    href: "/students",
    section: "main",
    permission: PAGE_PERMISSIONS.students,
  },
  {
    key: "reports",
    labelKey: "reports",
    iconKey: "analytics",
    href: "/reports",
    section: "main",
    permission: PAGE_PERMISSIONS.reports,
  },
  COMMON_NAV_ITEMS.billingAdmin,
  COMMON_NAV_ITEMS.billingParent,
  COMMON_NAV_ITEMS.suggestionsSubmit,
  COMMON_NAV_ITEMS.complaintsSubmit,
];

/**
 * Filter navigation items based on user permissions.
 */
export function getNavItemsForPermissions(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  return items.filter(item => {
    if (!item.permission) return true;
    if (typeof item.permission === "string") {
      return permissions.includes(item.permission);
    }
    return item.permission.some(p => permissions.includes(p));
  });
}
