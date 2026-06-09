export type PermissionSeed = {
  key: string;
  resource: string;
  action: string;
  description: string;
  category: string;
};

export const PERMISSION_CATALOG: PermissionSeed[] = [
  // Dashboard
  {
    key: "dashboard.view",
    resource: "dashboard",
    action: "view",
    description: "View dashboard",
    category: "Dashboard",
  },
  {
    key: "dashboard.metrics.view_all",
    resource: "dashboard",
    action: "metrics.view_all",
    description: "View all dashboard metrics",
    category: "Dashboard",
  },

  // Schedule
  {
    key: "schedule.view_all",
    resource: "schedule",
    action: "view_all",
    description: "View all schedules",
    category: "Scheduling",
  },
  {
    key: "schedule.view_assigned",
    resource: "schedule",
    action: "view_assigned",
    description: "View assigned teacher schedule",
    category: "Scheduling",
  },
  {
    key: "schedule.view_family",
    resource: "schedule",
    action: "view_family",
    description: "View family student schedule",
    category: "Scheduling",
  },
  {
    key: "schedule.search_availability",
    resource: "schedule",
    action: "search_availability",
    description: "Search teacher availability",
    category: "Scheduling",
  },
  {
    key: "schedule.manage_recurring",
    resource: "schedule",
    action: "manage_recurring",
    description: "Manage recurring schedules",
    category: "Scheduling",
  },
  {
    key: "schedule.dst_migrate",
    resource: "schedule",
    action: "dst_migrate",
    description: "Run DST migration",
    category: "Scheduling",
  },

  // Classes
  {
    key: "classes.view_details",
    resource: "classes",
    action: "view_details",
    description: "View class details",
    category: "Scheduling",
  },
  {
    key: "classes.activate",
    resource: "classes",
    action: "activate",
    description: "Activate a class within time window",
    category: "Scheduling",
  },
  {
    key: "classes.force_activate",
    resource: "classes",
    action: "force_activate",
    description: "Force activate a class",
    category: "Scheduling",
  },
  {
    key: "classes.start",
    resource: "classes",
    action: "start",
    description: "Start a class session",
    category: "Scheduling",
  },
  {
    key: "classes.mark_absent",
    resource: "classes",
    action: "mark_absent",
    description: "Mark student as absent",
    category: "Scheduling",
  },
  {
    key: "classes.request_leave",
    resource: "classes",
    action: "request_leave",
    description: "Request class leave",
    category: "Scheduling",
  },
  {
    key: "classes.admin_leave",
    resource: "classes",
    action: "admin_leave",
    description: "Admin excused leave on a class",
    category: "Scheduling",
  },
  {
    key: "classes.reschedule",
    resource: "classes",
    action: "reschedule",
    description: "Reschedule a class",
    category: "Scheduling",
  },
  {
    key: "classes.revert",
    resource: "classes",
    action: "revert",
    description: "Revert class to pending state",
    category: "Scheduling",
  },

  // Teachers
  { key: "teachers.list", resource: "teachers", action: "list", description: "List teachers", category: "Teachers" },
  {
    key: "teachers.create",
    resource: "teachers",
    action: "create",
    description: "Create teacher accounts",
    category: "Teachers",
  },
  {
    key: "teachers.edit",
    resource: "teachers",
    action: "edit",
    description: "Edit teacher profiles",
    category: "Teachers",
  },
  {
    key: "teachers.manage_schedule",
    resource: "teachers",
    action: "manage_schedule",
    description: "Manage teacher schedules",
    category: "Teachers",
  },

  // Parents
  { key: "parents.list", resource: "parents", action: "list", description: "List parents", category: "Parents" },
  {
    key: "parents.create",
    resource: "parents",
    action: "create",
    description: "Create parent accounts",
    category: "Parents",
  },
  {
    key: "parents.edit",
    resource: "parents",
    action: "edit",
    description: "Edit parent profiles",
    category: "Parents",
  },

  // Students
  { key: "students.list", resource: "students", action: "list", description: "List students", category: "Students" },
  {
    key: "students.edit",
    resource: "students",
    action: "edit",
    description: "Edit student profiles",
    category: "Students",
  },
  {
    key: "students.change_teacher",
    resource: "students",
    action: "change_teacher",
    description: "Reassign student teacher",
    category: "Students",
  },
  {
    key: "students.change_status",
    resource: "students",
    action: "change_status",
    description: "Change student status",
    category: "Students",
  },
  {
    key: "students.override_quota",
    resource: "students",
    action: "override_quota",
    description: "Override student class quota",
    category: "Students",
  },

  // Invoices
  { key: "invoices.list", resource: "invoices", action: "list", description: "List invoices", category: "Billing" },
  {
    key: "invoices.create",
    resource: "invoices",
    action: "create",
    description: "Create invoices",
    category: "Billing",
  },
  {
    key: "invoices.mark_paid",
    resource: "invoices",
    action: "mark_paid",
    description: "Mark invoice as paid",
    category: "Billing",
  },
  { key: "invoices.edit", resource: "invoices", action: "edit", description: "Edit invoices", category: "Billing" },
  {
    key: "invoices.delete",
    resource: "invoices",
    action: "delete",
    description: "Delete invoices",
    category: "Billing",
  },

  // Resources
  {
    key: "resources.list",
    resource: "resources",
    action: "list",
    description: "List learning resources",
    category: "Resources",
  },
  {
    key: "resources.upload",
    resource: "resources",
    action: "upload",
    description: "Upload learning resources",
    category: "Resources",
  },
  {
    key: "resources.delete",
    resource: "resources",
    action: "delete",
    description: "Delete learning resources",
    category: "Resources",
  },

  // Reports
  {
    key: "reports.generate",
    resource: "reports",
    action: "generate",
    description: "Generate reports",
    category: "Reports",
  },

  // Complaints
  {
    key: "complaints.list",
    resource: "complaints",
    action: "list",
    description: "List complaints",
    category: "Communications",
  },
  {
    key: "complaints.respond",
    resource: "complaints",
    action: "respond",
    description: "Respond to complaints",
    category: "Communications",
  },
  {
    key: "complaints.delete",
    resource: "complaints",
    action: "delete",
    description: "Delete complaints",
    category: "Communications",
  },

  // Staff
  {
    key: "staff.list",
    resource: "staff",
    action: "list",
    description: "List staff accounts",
    category: "Administration",
  },
  {
    key: "staff.create",
    resource: "staff",
    action: "create",
    description: "Create staff accounts",
    category: "Administration",
  },
  {
    key: "staff.edit",
    resource: "staff",
    action: "edit",
    description: "Edit staff accounts",
    category: "Administration",
  },

  // Permission groups (meta)
  {
    key: "permission_groups.manage",
    resource: "permission_groups",
    action: "manage",
    description: "Manage permission groups",
    category: "Administration",
  },
  {
    key: "permission_groups.assign",
    resource: "permission_groups",
    action: "assign",
    description: "Assign permission groups to users",
    category: "Administration",
  },
];

export const SYSTEM_PERMISSION_GROUP_SLUGS = {
  SUPER_ADMIN: "super_admin",
  TEACHER_DEFAULT: "teacher_default",
  PARENT_DEFAULT: "parent_default",
  STAFF_DEFAULT: "staff_default",
} as const;

export const TEACHER_DEFAULT_PERMISSION_KEYS = [
  "dashboard.view",
  "schedule.view_assigned",
  "classes.view_details",
  "classes.activate",
  "classes.start",
  "classes.mark_absent",
  "classes.request_leave",
  "resources.list",
] as const;

export const PARENT_DEFAULT_PERMISSION_KEYS = [
  "dashboard.view",
  "schedule.view_family",
  "classes.view_details",
  "classes.request_leave",
  "complaints.list",
] as const;

export const STAFF_DEFAULT_PERMISSION_KEYS = [
  "dashboard.view",
  "dashboard.metrics.view_all",
  "schedule.view_all",
  "classes.view_details",
  "teachers.list",
  "parents.list",
  "students.list",
  "complaints.list",
] as const;
