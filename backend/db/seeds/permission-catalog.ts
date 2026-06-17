export type PermissionSeed = {
  key: string;
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
    key: `${resource}.${action}`,
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

  ...createPermissions("Scheduling", "classes", [
    ["view_details", "View class details"],
    ["activate", "Activate a class within time window"],
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

export const SYSTEM_PERMISSION_GROUP_SLUGS = {
  SUPER_ADMIN: "super_admin",
  ACADEMY_ADMIN: "academy_admin",
  TEACHER_DEFAULT: "teacher_default",
  PARENT_DEFAULT: "parent_default",
  STAFF_DEFAULT: "staff_default",
} as const;

const COMMON_DASHBOARD_PERMISSIONS = ["dashboard.view"] as const;
const COMMON_CLASS_PERMISSIONS = ["classes.view_details"] as const;

export const TEACHER_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  "schedule.view_assigned",
  ...COMMON_CLASS_PERMISSIONS,
  "classes.activate",
  "classes.start",
  "classes.mark_absent",
  "classes.request_leave",
  "resources.list",
] as const;

export const PARENT_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  "schedule.view_family",
  ...COMMON_CLASS_PERMISSIONS,
  "classes.request_leave",
  "complaints.list",
] as const;

export const STAFF_DEFAULT_PERMISSION_KEYS = [
  ...COMMON_DASHBOARD_PERMISSIONS,
  "dashboard.metrics.view_all",
  "schedule.view_all",
  ...COMMON_CLASS_PERMISSIONS,
  "teachers.list",
  "parents.list",
  "students.list",
  "complaints.list",
] as const;

export const ACADEMY_ADMIN_PERMISSION_KEYS = [
  "auth.login",
  "auth.view_own_profile",
  "dashboard.view_metrics",
  "dashboard.filter_metrics",
  "schedule.view_list",
  "schedule.filter_advanced",
] as const;
