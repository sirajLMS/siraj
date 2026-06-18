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

export const PERMISSION_CATALOG: PermissionSeed[] = [
  ...createPermissions("Authentication", "auth", [
    ["login", "Login to system"],
    ["view_own_profile", "View own profile"],
  ]),

  ...createPermissions("Dashboard", "dashboard", [
    ["view", "View dashboard"],
    ["view_metrics", "View dashboard metrics"],
    ["filter_metrics", "Filter dashboard metrics"],
    ["metrics.view_all", "View all dashboard metrics"],
  ]),

  ...createPermissions("Scheduling", "schedule", [
    ["view_list", "View daily schedule list"],
    ["filter_advanced", "Advanced filtering of schedule"],
    ["view_all", "View all schedules"],
    ["view_assigned", "View assigned teacher schedule"],
    ["view_family", "View family student schedule"],
    ["search_availability", "Search teacher availability"],
    ["manage_recurring", "Manage recurring schedules"],
    ["dst_migrate", "Run DST migration"],
  ]),

  ...createPermissions("Scheduling", "session", [
    ["view_details", "View class details"],
    ["activate_class", "Activate a class within time window"],
    ["force_activate", "Force activate a class"],
    ["start", "Start a class session"],
    ["mark_absent", "Mark student as absent"],
    ["request_leave", "Request class leave"],
    ["admin_leave", "Admin excused leave on a class"],
    ["reschedule", "Reschedule a class"],
    ["revert", "Revert class to pending state"],
  ]),

  ...createPermissions("Teachers", "teachers", [
    ...ACCOUNT_ACTIONS("teacher"),
    ["manage_schedule", "Manage teacher schedules"],
  ]),

  ...createPermissions("Parents", "parents", ACCOUNT_ACTIONS("parent")),

  ...createPermissions("Students", "students", [
    ["list", "List students"],
    ["edit", "Edit student profiles"],
    ["change_teacher", "Reassign student teacher"],
    ["change_status", "Change student status"],
    ["override_quota", "Override student class quota"],
  ]),

  ...createPermissions("Billing", "invoices", [
    ...LIST_DELETE_ACTIONS("invoices"),
    ["create", "Create invoices"],
    ["mark_paid", "Mark invoice as paid"],
    ["edit", "Edit invoices"],
  ]),

  ...createPermissions("Resources", "resources", [
    ...LIST_DELETE_ACTIONS("learning resources"),
    ["upload", "Upload learning resources"],
  ]),

  ...createPermissions("Reports", "reports", [["generate", "Generate reports"]]),

  ...createPermissions("Communications", "complaints", [
    ...LIST_DELETE_ACTIONS("complaints"),
    ["respond", "Respond to complaints"],
  ]),

  ...createPermissions("Administration", "staff", ACCOUNT_ACTIONS("staff", "accounts", "staff accounts")),

  ...createPermissions("Administration", "permission_groups", [
    ["manage", "Manage permission groups"],
    ["assign", "Assign permission groups to users"],
  ]),
];

const COMMON_DASHBOARD_PERMISSIONS = [AppPermission.DASHBOARD_VIEW] as const;
const COMMON_CLASS_PERMISSIONS = [AppPermission.SESSION_VIEW_DETAILS] as const;

export const TEACHER_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  AppPermission.SCHEDULE_VIEW_ASSIGNED,
  ...COMMON_CLASS_PERMISSIONS,
  AppPermission.SESSION_ACTIVATE_CLASS,
  AppPermission.SESSION_START,
  AppPermission.SESSION_MARK_ABSENT,
  AppPermission.SESSION_REQUEST_LEAVE,
  AppPermission.RESOURCES_LIST,
] as const;

export const PARENT_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  AppPermission.SCHEDULE_VIEW_FAMILY,
  ...COMMON_CLASS_PERMISSIONS,
  AppPermission.SESSION_REQUEST_LEAVE,
  AppPermission.COMPLAINTS_LIST,
] as const;

export const STAFF_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  AppPermission.DASHBOARD_METRICS_VIEW_ALL,
  AppPermission.SCHEDULE_VIEW_ALL,
  ...COMMON_CLASS_PERMISSIONS,
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
  AppPermission.SCHEDULE_VIEW_LIST,
  AppPermission.SCHEDULE_FILTER_ADVANCED,
] as const;
