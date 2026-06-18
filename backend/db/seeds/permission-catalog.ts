import { AppPermission } from "@/shared/lib/enum";

export { SystemPermissionGroupSlug as SYSTEM_PERMISSION_GROUP_SLUGS } from "@/shared/lib/enum";

export type PermissionSeed = {
  key: AppPermission;
  resource: string;
  action: string;
  description: string;
  category: string;
};

const createPermissions = (
  category: string,
  resource: string,
  permissions: Array<[string, string]>
): PermissionSeed[] => {
  return permissions.map(([action, description]) => ({
    key: `${resource}.${action}` as AppPermission,
    resource,
    action,
    description,
    category,
  }));
};

/**
 * Common account-related actions (list, create, edit)
 */
const ACCOUNT_ACTIONS = (
  label: string,
  type: "profiles" | "accounts" = "profiles",
  pluralLabel?: string
): [string, string][] => [
  ["list", `List ${pluralLabel || label + "s"}`],
  ["create", `Create ${label} accounts`],
  ["edit", `Edit ${label} ${type}`],
];

/**
 * Common list and delete actions
 */
const LIST_DELETE_ACTIONS = (pluralLabel: string): [string, string][] => [
  ["list", `List ${pluralLabel}`],
  ["delete", `Delete ${pluralLabel}`],
];

interface PermissionGroupData {
  category: string;
  resource: string;
  items: [string, string][];
}

const GROUPS: PermissionGroupData[] = [
  {
    category: "Authentication",
    resource: "auth",
    items: [
      ["login", "Login to system"],
      ["view_own_profile", "View own profile"],
    ],
  },
  {
    category: "Dashboard",
    resource: "dashboard",
    items: [
      ["view", "View dashboard"],
      ["view_metrics", "View dashboard metrics"],
      ["filter_metrics", "Filter dashboard metrics"],
      ["metrics.view_all", "View all dashboard metrics"],
      ["search", "Global search on admin schedule table"],
    ],
  },
  {
    category: "Scheduling",
    resource: "schedule",
    items: [
      ["view_list", "View daily schedule list"],
      ["filter_advanced", "Advanced filtering of schedule"],
      ["view_all", "View all schedules"],
      ["view_assigned", "View assigned teacher schedule"],
      ["view_family", "View family student schedule"],
      ["search_availability", "Search teacher availability"],
      ["manage_recurring", "Manage recurring schedules"],
      ["dst_migrate", "Run DST migration"],
      ["view_timezones", "View multi-timezone schedule columns"],
    ],
  },
  {
    category: "Scheduling",
    resource: "session",
    items: [
      ["view_details", "View class details"],
      ["activate_class", "Activate a class within time window"],
      ["activate_override", "Bypass time window enforcement to manually activate a class session"],
      ["update_status.start", "Transition an activated session to RUNNING state upon student arrival"],
      ["update_status.absent", "Mark student as absent after waiting period and credit teacher payroll"],
      ["update_status.leave", "Process excused cancellation and trigger reschedule workflow"],
      ["reschedule", "Reschedule a class"],
      ["reset", "Destructively clear session data and revert to NOT_ACTIVATED state"],
      ["override_actions", "Admin override toolbar on class details page"],
    ],
  },
  {
    category: "History",
    resource: "history",
    items: [
      ["view_calendar", "View student class history calendar"],
      ["view_details", "View session metadata in history modal drill-down"],
    ],
  },
  {
    category: "Teacher",
    resource: "teacher",
    items: [["view_dashboard", "Access teacher dashboard"]],
  },
  {
    category: "System",
    resource: "system",
    items: [["enforce_time_window", "Validate activation time window"]],
  },
  {
    category: "Teachers",
    resource: "teachers",
    items: [...ACCOUNT_ACTIONS("teacher"), ["manage_schedule", "Manage teacher schedules"]],
  },
  {
    category: "Parents",
    resource: "parents",
    items: ACCOUNT_ACTIONS("parent"),
  },
  {
    category: "Students",
    resource: "students",
    items: [
      ["list", "List students"],
      ["edit", "Edit student profiles"],
      ["change_teacher", "Reassign student teacher"],
      ["change_status", "Change student status"],
      ["override_quota", "Override student class quota"],
    ],
  },
  {
    category: "Billing",
    resource: "invoices",
    items: [
      ...LIST_DELETE_ACTIONS("invoices"),
      ["create", "Create invoices"],
      ["mark_paid", "Mark invoice as paid"],
      ["edit", "Edit invoices"],
    ],
  },
  {
    category: "Resources",
    resource: "resources",
    items: [...LIST_DELETE_ACTIONS("learning resources"), ["upload", "Upload learning resources"]],
  },
  {
    category: "Reports",
    resource: "reports",
    items: [["generate", "Generate reports"]],
  },
  {
    category: "Communications",
    resource: "complaints",
    items: [...LIST_DELETE_ACTIONS("complaints"), ["respond", "Respond to complaints"]],
  },
  {
    category: "Administration",
    resource: "staff",
    items: ACCOUNT_ACTIONS("staff", "accounts", "staff accounts"),
  },
  {
    category: "Administration",
    resource: "permission_groups",
    items: [
      ["manage", "Manage permission groups"],
      ["assign", "Assign permission groups to users"],
    ],
  },
];

export const PERMISSION_CATALOG: PermissionSeed[] = GROUPS.flatMap(group =>
  createPermissions(group.category, group.resource, group.items)
);

const COMMON_DASHBOARD_PERMISSIONS = [AppPermission.DASHBOARD_VIEW] as const;
const COMMON_SESSION_PERMISSIONS = [AppPermission.SESSION_VIEW_DETAILS] as const;

export const TEACHER_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  ...COMMON_SESSION_PERMISSIONS,
  AppPermission.SCHEDULE_VIEW_ASSIGNED,
  AppPermission.SESSION_ACTIVATE_CLASS,
  AppPermission.SESSION_UPDATE_STATUS_START,
  AppPermission.SESSION_UPDATE_STATUS_ABSENT,
  AppPermission.SESSION_UPDATE_STATUS_LEAVE,
  AppPermission.TEACHER_VIEW_DASHBOARD,
  AppPermission.RESOURCES_LIST,
] as const;

export const PARENT_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  AppPermission.SCHEDULE_VIEW_FAMILY,
  ...COMMON_SESSION_PERMISSIONS,
  AppPermission.SESSION_UPDATE_STATUS_LEAVE,
  AppPermission.COMPLAINTS_LIST,
] as const;

export const STAFF_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  AppPermission.DASHBOARD_METRICS_VIEW_ALL,
  AppPermission.SCHEDULE_VIEW_ALL,
  ...COMMON_SESSION_PERMISSIONS,
  AppPermission.TEACHERS_LIST,
  AppPermission.PARENTS_LIST,
  AppPermission.STUDENTS_LIST,
  AppPermission.COMPLAINTS_LIST,
] as const;

export const ACADEMY_ADMIN_PERMISSION_KEYS = [
  AppPermission.AUTH_LOGIN,
  AppPermission.AUTH_VIEW_OWN_PROFILE,
  AppPermission.DASHBOARD_VIEW_METRICS,
  AppPermission.DASHBOARD_FILTER_METRICS,
  AppPermission.DASHBOARD_SEARCH,
  AppPermission.SCHEDULE_VIEW_LIST,
  AppPermission.SCHEDULE_FILTER_ADVANCED,
  AppPermission.SCHEDULE_VIEW_TIMEZONES,
  AppPermission.HISTORY_VIEW_CALENDAR,
  AppPermission.HISTORY_VIEW_DETAILS,
  AppPermission.SESSION_OVERRIDE_ACTIONS,
  AppPermission.SESSION_VIEW_DETAILS,
  AppPermission.SESSION_ACTIVATE_OVERRIDE,
  AppPermission.SESSION_RESCHEDULE,
  AppPermission.SESSION_RESET,
  AppPermission.SESSION_UPDATE_STATUS_START,
  AppPermission.SESSION_UPDATE_STATUS_ABSENT,
  AppPermission.SESSION_UPDATE_STATUS_LEAVE,
] as const;
