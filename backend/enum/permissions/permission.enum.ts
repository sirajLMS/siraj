export enum AppPermission {
  AUTH_LOGIN = "auth.login",
  AUTH_VIEW_OWN_PROFILE = "auth.view_own_profile",
  AUTH_EDIT_OWN_PROFILE = "auth.edit_own_profile",
  DASHBOARD_VIEW = "dashboard.view",
  DASHBOARD_VIEW_METRICS = "dashboard.view_metrics",
  DASHBOARD_FILTER_METRICS = "dashboard.filter_metrics",
  DASHBOARD_METRICS_VIEW_ALL = "dashboard.metrics.view_all",
  SCHEDULE_VIEW_LIST = "schedule.view_list",
  SCHEDULE_FILTER_ADVANCED = "schedule.filter_advanced",
  SCHEDULE_VIEW_ALL = "schedule.view_all",
  SCHEDULE_VIEW_ASSIGNED = "schedule.view_assigned",
  SCHEDULE_VIEW_FAMILY = "schedule.view_family",
  SCHEDULE_SEARCH_AVAILABILITY = "schedule.search_availability",
  SCHEDULE_MANAGE_RECURRING = "schedule.manage_recurring",
  SCHEDULE_DST_MIGRATE = "schedule.dst_migrate",
  SESSION_VIEW_DETAILS = "session.view_details",
  SESSION_ACTIVATE_CLASS = "session.activate_class",
  SESSION_ACTIVATE_OVERRIDE = "session.activate_override",
  SESSION_UPDATE_STATUS_START = "session.update_status.start",
  SESSION_UPDATE_STATUS_ABSENT = "session.update_status.absent",
  SESSION_UPDATE_STATUS_LEAVE = "session.update_status.leave",
  SESSION_RESCHEDULE = "session.reschedule",
  SESSION_RESET = "session.reset",
  SESSION_OVERRIDE_ACTIONS = "session.override_actions",
  DASHBOARD_SEARCH = "dashboard.search",
  SCHEDULE_VIEW_TIMEZONES = "schedule.view_timezones",
  HISTORY_VIEW_CALENDAR = "history.view_calendar",
  HISTORY_VIEW_DETAILS = "history.view_details",
  TEACHER_VIEW_DASHBOARD = "teacher.view_dashboard",
  TEACHER_VIEW_STUDENTS = "teacher.view_students",
  TEACHER_VIEW_PROFILE = "teacher.view_profile",
  TEACHER_VIEW_OWN_PROFILE = "teacher.view_own_profile",
  TEACHER_EDIT_OWN_PROFILE = "teacher.edit_own_profile",
  SYSTEM_ENFORCE_TIME_WINDOW = "system.enforce_time_window",
  SYSTEM_ENFORCE_LEAVE_LIMIT = "system.enforce_leave_limit",
  TEACHERS_LIST = "teachers.list",
  // Teacher Management
  TEACHERS_CREATE = "teachers.create",
  TEACHERS_EDIT = "teachers.edit",
  TEACHERS_MANAGE_SCHEDULE = "teachers.manage_schedule",
  STAFF_VIEW_DIRECTORY = "staff.view_directory",
  SCHEDULE_VIEW_WEEKLY = "schedule.view_weekly",
  SCHEDULE_VIEW_WORKLOAD = "schedule.view_workload",
  SCHEDULE_CREATE_CLASS = "schedule.create_class",
  PARENTS_LIST = "parents.list",
  // Parent Management
  PARENTS_CREATE = "parents.create",
  PARENTS_EDIT = "parents.edit",
  STUDENTS_LIST = "students.list",
  STUDENTS_CREATE = "students.create",
  STUDENTS_EDIT = "students.edit",
  STUDENTS_CHANGE_TEACHER = "students.change_teacher",
  STUDENTS_CHANGE_STATUS = "students.change_status",
  STUDENTS_OVERRIDE_QUOTA = "students.override_quota",
  INVOICES_LIST = "invoices.list",
  INVOICES_DELETE = "invoices.delete",
  INVOICES_CREATE = "invoices.create",
  INVOICES_MARK_PAID = "invoices.mark_paid",
  INVOICES_EDIT = "invoices.edit",
  RESOURCES_LIST = "resources.list",
  RESOURCES_DELETE = "resources.delete",
  RESOURCES_UPLOAD = "resources.upload",
  REPORTS_GENERATE = "reports.generate",
  REPORT_GENERATE_CUSTOM = "report.generate_custom",
  REPORT_VIEW_FINANCIALS = "report.view_financials",
  COMPLAINTS_LIST = "complaints.list",
  COMPLAINTS_DELETE = "complaints.delete",
  COMPLAINTS_RESPOND = "complaints.respond",
  SUPPORT_SUBMIT_COMPLAINT = "support.submit_complaint",
  SUPPORT_VIEW_HISTORY = "support.view_history",
  COMMUNICATION_SUBMIT_SUGGESTION = "communication.submit_suggestion",
  SYSTEM_DISPATCH_EMAIL = "system.dispatch_email",
  STAFF_LIST = "staff.list",
  // Staff/Manager Management
  STAFF_CREATE = "staff.create",
  STAFF_EDIT = "staff.edit",
  STAFF_EDIT_PROFILE = "staff.edit_profile",
  PERMISSION_GROUPS_MANAGE = "permission_groups.manage",
  PERMISSION_GROUPS_ASSIGN = "permission_groups.assign",
  NOTIFICATION_VIEW_ALERTS = "notification.view_alerts",
  BILLING_VIEW_UNPAID_INVOICES = "billing.view_unpaid_invoices",
  SCHEDULE_DELETE_CLASS = "schedule.delete_class",
  SCHEDULE_CLEAR_WEEKLY = "schedule.clear_weekly",
  SYSTEM_BULK_UPDATE_DST = "system.bulk_update_dst",
  PARENT_VIEW_DIRECTORY = "parent.view_directory",
  // Parent Profile & Account Lifecycle Management
  PARENT_VIEW_PROFILE = "parent.view_profile",
  PARENT_VIEW_OWN_PROFILE = "parent.view_own_profile",
  PARENT_EDIT_OWN_PROFILE = "parent.edit_own_profile",
  PARENT_VIEW_STUDENTS = "parent.view_students",
  PARENT_MANAGE_STATUS = "parent.manage_status",
  STUDENT_VIEW_ASSOCIATED = "student.view_associated",
  STUDENT_EDIT_QUOTA = "student.edit_quota",
  BILLING_VIEW_HISTORY = "billing.view_history",
  DOCUMENT_MANAGE_PARENT_DOCS = "document.manage_parent_docs",
  //Invoice Generation & Processing
  BILLING_CREATE_INVOICE = "billing.create_invoice",
  BILLING_UPDATE_STATUS_PAID = "billing.update_status_paid",
  BILLING_SUBMIT_PAYMENT_PROOF = "billing.submit_payment_proof",
  BILLING_DELETE_INVOICE = "billing.delete_invoice",
  // Accounting — credit-hours payments module
  ACCOUNTING_PAYMENTS_VIEW = "accounting.payments_view",
  ACCOUNTING_PAYMENTS_MANAGE = "accounting.payments_manage",
  // Accounting — student credit-hour adjustments
  ACCOUNTING_CREDITS_MANAGE = "accounting.credits_manage",
  // Accounting — teacher payroll
  ACCOUNTING_PAYROLL_VIEW = "accounting.payroll_view",
  ACCOUNTING_PAYROLL_MANAGE = "accounting.payroll_manage",
  // Accounting — session-event audit reports
  ACCOUNTING_REPORTS_VIEW = "accounting.reports_view",
  ACCOUNTING_REPORTS_MANAGE = "accounting.reports_manage",
  // Accounting — carryover balance settlements
  ACCOUNTING_CARRYOVER_VIEW = "accounting.carryover_view",
  ACCOUNTING_CARRYOVER_MANAGE = "accounting.carryover_manage",
  // Accounting — expense ledger
  ACCOUNTING_EXPENSES_VIEW = "accounting.expenses_view",
  ACCOUNTING_EXPENSES_MANAGE = "accounting.expenses_manage",
  // Student Metadata & Lifecycle Management
  STUDENT_REASSIGN_TEACHER = "student.reassign_teacher",
  STUDENT_MANAGE_STATUS = "student.manage_status",
  // Automated System Synchronization
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  // Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  // System-Level Resource Access Restriction
  SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access",
  SUGGESTIONS_LIST = "suggestions.list",
  SUGGESTIONS_REVIEW = "suggestions.review",
  SUGGESTIONS_DELETE = "suggestions.delete",
  SUBJECTS_LIST = "subjects.list",
  SUBJECTS_CREATE = "subjects.create",
  SUBJECTS_UPDATE = "subjects.update",
  SUBJECTS_DELETE = "subjects.delete",
  SUBJECTS_VIEW_RESOURCES = "subjects.view_resources",
  SUBJECTS_MANAGE_RESOURCES = "subjects.manage_resources",
  CATEGORIES_LIST = "categories.list",
  CATEGORIES_CREATE = "categories.create",
  CATEGORIES_UPDATE = "categories.update",
  CATEGORIES_DELETE = "categories.delete",
  NOTES_LIST = "notes.list",
  NOTES_CREATE = "notes.create",
  NOTES_UPDATE = "notes.update",
  NOTES_DELETE = "notes.delete",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
  TEST_CUSTOM_ALT = "test.custom_alt",
  STORAGE_MANAGE = "storage.manage",
  // FX Rate Ingestion
  BILLING_VIEW_EXCHANGE_RATES = "billing.view_exchange_rates",
  BILLING_REFRESH_EXCHANGE_RATES = "billing.refresh_exchange_rates",
  BILLING_MANAGE_FX_PROVIDER = "billing.manage_fx_provider",
  BILLING_OVERRIDE_EXCHANGE_RATES = "billing.override_exchange_rates",
  BILLING_MANAGE_CURRENCY_HEDGES = "billing.manage_currency_hedges",
  BILLING_MANAGE_CURRENCIES = "billing.manage_currencies",
  // Payment Method Catalog Admin
  PAYMENT_METHODS_MANAGE_CATALOGS = "payment_methods.manage_catalogs",
  PAYMENT_METHODS_VERIFY_BANK_TRANSFER = "payment_methods.verify_bank_transfer",
  // Meeting provider catalog + user configs
  MEETING_PROVIDERS_MANAGE_CATALOG = "meeting_providers.manage_catalog",
  MEETING_CONFIGS_MANAGE_OWN = "meeting_configs.manage_own",
  MEETING_CONFIGS_MANAGE_OTHER = "meeting_configs.manage_other",
  MEETING_CONFIGS_MANAGE_CLASS = "meeting_configs.manage_class",
  // Profile field-group ACL (view_own / view_other / edit_own / edit_other per group)
  PROFILE_CORE_IDENTITY_VIEW_OWN = "profile.core_identity.view_own",
  PROFILE_CORE_IDENTITY_VIEW_OTHER = "profile.core_identity.view_other",
  PROFILE_CORE_IDENTITY_EDIT_OWN = "profile.core_identity.edit_own",
  PROFILE_CORE_IDENTITY_EDIT_OTHER = "profile.core_identity.edit_other",
  PROFILE_CORE_CONTACT_VIEW_OWN = "profile.core_contact.view_own",
  PROFILE_CORE_CONTACT_VIEW_OTHER = "profile.core_contact.view_other",
  PROFILE_CORE_CONTACT_EDIT_OWN = "profile.core_contact.edit_own",
  PROFILE_CORE_CONTACT_EDIT_OTHER = "profile.core_contact.edit_other",
  PROFILE_TEACHER_PROFESSIONAL_VIEW_OWN = "profile.teacher_professional.view_own",
  PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER = "profile.teacher_professional.view_other",
  PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN = "profile.teacher_professional.edit_own",
  PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER = "profile.teacher_professional.edit_other",
  PROFILE_TEACHER_IDENTITY_VIEW_OWN = "profile.teacher_identity.view_own",
  PROFILE_TEACHER_IDENTITY_VIEW_OTHER = "profile.teacher_identity.view_other",
  PROFILE_TEACHER_IDENTITY_EDIT_OWN = "profile.teacher_identity.edit_own",
  PROFILE_TEACHER_IDENTITY_EDIT_OTHER = "profile.teacher_identity.edit_other",
  PROFILE_PARENT_SOCIAL_VIEW_OWN = "profile.parent_social.view_own",
  PROFILE_PARENT_SOCIAL_VIEW_OTHER = "profile.parent_social.view_other",
  PROFILE_PARENT_SOCIAL_EDIT_OWN = "profile.parent_social.edit_own",
  PROFILE_PARENT_SOCIAL_EDIT_OTHER = "profile.parent_social.edit_other",
  PROFILE_PARENT_IDENTITY_VIEW_OWN = "profile.parent_identity.view_own",
  PROFILE_PARENT_IDENTITY_VIEW_OTHER = "profile.parent_identity.view_other",
  PROFILE_PARENT_IDENTITY_EDIT_OWN = "profile.parent_identity.edit_own",
  PROFILE_PARENT_IDENTITY_EDIT_OTHER = "profile.parent_identity.edit_other",
  PROFILE_PARENT_BILLING_VIEW_OWN = "profile.parent_billing.view_own",
  PROFILE_PARENT_BILLING_VIEW_OTHER = "profile.parent_billing.view_other",
  PROFILE_PARENT_BILLING_EDIT_OWN = "profile.parent_billing.edit_own",
  PROFILE_PARENT_BILLING_EDIT_OTHER = "profile.parent_billing.edit_other",
  PROFILE_PARENT_ACCOUNT_VIEW_OWN = "profile.parent_account.view_own",
  PROFILE_PARENT_ACCOUNT_VIEW_OTHER = "profile.parent_account.view_other",
  PROFILE_PARENT_ACCOUNT_EDIT_OWN = "profile.parent_account.edit_own",
  PROFILE_PARENT_ACCOUNT_EDIT_OTHER = "profile.parent_account.edit_other",
  PROFILE_PARENT_STUDENTS_VIEW_OWN = "profile.parent_students.view_own",
  PROFILE_PARENT_STUDENTS_VIEW_OTHER = "profile.parent_students.view_other",
  PROFILE_PARENT_STUDENTS_EDIT_OWN = "profile.parent_students.edit_own",
  PROFILE_PARENT_STUDENTS_EDIT_OTHER = "profile.parent_students.edit_other",
  PROFILE_TEACHER_STUDENTS_VIEW_OWN = "profile.teacher_students.view_own",
  PROFILE_TEACHER_STUDENTS_VIEW_OTHER = "profile.teacher_students.view_other",
  PROFILE_TEACHER_STUDENTS_EDIT_OWN = "profile.teacher_students.edit_own",
  PROFILE_TEACHER_STUDENTS_EDIT_OTHER = "profile.teacher_students.edit_other",
  PROFILE_STAFF_ROLE_VIEW_OWN = "profile.staff_role.view_own",
  PROFILE_STAFF_ROLE_VIEW_OTHER = "profile.staff_role.view_other",
  PROFILE_STAFF_ROLE_EDIT_OWN = "profile.staff_role.edit_own",
  PROFILE_STAFF_ROLE_EDIT_OTHER = "profile.staff_role.edit_other",
  PROFILE_STAFF_PERMISSIONS_VIEW_OWN = "profile.staff_permissions.view_own",
  PROFILE_STAFF_PERMISSIONS_VIEW_OTHER = "profile.staff_permissions.view_other",
  PROFILE_STAFF_PERMISSIONS_EDIT_OWN = "profile.staff_permissions.edit_own",
  PROFILE_STAFF_PERMISSIONS_EDIT_OTHER = "profile.staff_permissions.edit_other",
  PROFILE_PAYMENT_METHODS_VIEW_OWN = "profile.payment_methods.view_own",
  PROFILE_PAYMENT_METHODS_VIEW_OTHER = "profile.payment_methods.view_other",
  PROFILE_PAYMENT_METHODS_EDIT_OWN = "profile.payment_methods.edit_own",
  PROFILE_PAYMENT_METHODS_EDIT_OTHER = "profile.payment_methods.edit_other",
  PROFILE_MEETING_CONFIGS_VIEW_OWN = "profile.meeting_configs.view_own",
  PROFILE_MEETING_CONFIGS_VIEW_OTHER = "profile.meeting_configs.view_other",
  PROFILE_MEETING_CONFIGS_EDIT_OWN = "profile.meeting_configs.edit_own",
  PROFILE_MEETING_CONFIGS_EDIT_OTHER = "profile.meeting_configs.edit_other",
  PROFILE_CORE_STATUS_VIEW_OWN = "profile.core_status.view_own",
  PROFILE_CORE_STATUS_VIEW_OTHER = "profile.core_status.view_other",
  PROFILE_CORE_STATUS_EDIT_OWN = "profile.core_status.edit_own",
  PROFILE_CORE_STATUS_EDIT_OTHER = "profile.core_status.edit_other",
  // Student field-group ACL
  STUDENT_IDENTITY_VIEW_OWN = "student.student_identity.view_own",
  STUDENT_IDENTITY_VIEW_OTHER = "student.student_identity.view_other",
  STUDENT_IDENTITY_EDIT_OWN = "student.student_identity.edit_own",
  STUDENT_IDENTITY_EDIT_OTHER = "student.student_identity.edit_other",
  STUDENT_ACADEMIC_VIEW_OWN = "student.student_academic.view_own",
  STUDENT_ACADEMIC_VIEW_OTHER = "student.student_academic.view_other",
  STUDENT_ACADEMIC_EDIT_OWN = "student.student_academic.edit_own",
  STUDENT_ACADEMIC_EDIT_OTHER = "student.student_academic.edit_other",
  STUDENT_TEACHER_VIEW_OWN = "student.student_teacher.view_own",
  STUDENT_TEACHER_VIEW_OTHER = "student.student_teacher.view_other",
  STUDENT_TEACHER_EDIT_OWN = "student.student_teacher.edit_own",
  STUDENT_TEACHER_EDIT_OTHER = "student.student_teacher.edit_other",
  STUDENT_PARENT_VIEW_OWN = "student.student_parent.view_own",
  STUDENT_PARENT_VIEW_OTHER = "student.student_parent.view_other",
  STUDENT_PARENT_EDIT_OWN = "student.student_parent.edit_own",
  STUDENT_PARENT_EDIT_OTHER = "student.student_parent.edit_other",
  STUDENT_SCHEDULE_VIEW_OWN = "student.student_schedule.view_own",
  STUDENT_SCHEDULE_VIEW_OTHER = "student.student_schedule.view_other",
  STUDENT_SCHEDULE_EDIT_OWN = "student.student_schedule.edit_own",
  STUDENT_SCHEDULE_EDIT_OTHER = "student.student_schedule.edit_other",
  STUDENT_HISTORY_VIEW_OWN = "student.student_history.view_own",
  STUDENT_HISTORY_VIEW_OTHER = "student.student_history.view_other",
  STUDENT_HISTORY_EDIT_OWN = "student.student_history.edit_own",
  STUDENT_HISTORY_EDIT_OTHER = "student.student_history.edit_other",
  STUDENT_QUOTA_EDIT_VIEW_OWN = "student.student_quota_edit.view_own",
  STUDENT_QUOTA_EDIT_VIEW_OTHER = "student.student_quota_edit.view_other",
  STUDENT_QUOTA_EDIT_EDIT_OWN = "student.student_quota_edit.edit_own",
  STUDENT_QUOTA_EDIT_EDIT_OTHER = "student.student_quota_edit.edit_other",
  // LMS — Lesson reports workflow
  LESSON_REPORTS_SUBMIT = "lesson_reports.submit",
  LESSON_REPORTS_REVIEW = "lesson_reports.review",
  LESSON_REPORTS_APPROVE = "lesson_reports.approve",
  LESSON_REPORTS_REJECT = "lesson_reports.reject",
  // LMS — Role-scoped dashboard access
  SUPERVISOR_VIEW_DASHBOARD = "supervisor.view_dashboard",
  STUDENT_VIEW_OWN_DASHBOARD = "student.view_own_dashboard",
  // LMS — Credits ledger management
  CREDITS_MANAGE = "credits.manage",
  // LMS — Teacher dues ledger
  TEACHER_DUES_VIEW = "teacher_dues.view",
  // LMS — Mark teacher dues as paid (separate from view access)
  TEACHER_DUES_MARK_PAID = "teacher_dues.mark_paid",
  // LMS — Monthly reports
  MONTHLY_REPORTS_VIEW = "monthly_reports.view",
  // Settings (system / environment config / session / audit / site content / timezones)
  SETTINGS_VIEW = "settings.view",
  SETTINGS_EDIT_GENERAL = "settings.edit_general",
  SETTINGS_EDIT_ENV = "settings.edit_env",
  SETTINGS_EDIT_SESSION = "settings.edit_session",
  SETTINGS_AUDIT_VIEW = "settings.audit_view",
  SETTINGS_SITE_CONTENT_MANAGE = "settings.site_content_manage",
  SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage",
  SETTINGS_TIMEZONES_VIEW = "settings.timezones_view",
  SETTINGS_EDIT_MEETING_INTEGRATIONS = "settings.edit_meeting_integrations",
  // WhatsApp admin (BL2: no whatsapp.dispatch — no send-mutation in v1)
  WHATSAPP_VIEW = "whatsapp.view",
  WHATSAPP_CONFIG_MANAGE = "whatsapp.config_manage",
  WHATSAPP_TEMPLATES_MANAGE = "whatsapp.templates_manage",
  // WhatsApp inbox (coexistence conversations; INBOX_MANAGE reserved for the reply composer)
  WHATSAPP_INBOX_VIEW = "whatsapp.inbox_view",
  WHATSAPP_INBOX_MANAGE = "whatsapp.inbox_manage",
  // Quota Management
  QUOTAS_VIEW = "quotas.view",
  QUOTAS_MANAGE = "quotas.manage",
  // Cron Management
  CRON_MANAGE = "cron.manage",
  // User Admin Management
  USER_ADMIN_RESET_PASSWORD = "user.admin_reset_password",
  USER_VIEW_PROFILE = "user.view_profile",
  USER_EDIT_PROFILE = "user.edit_profile",
  // Monthly Appraisals (F1)
  APPRAISAL_SUBMIT = "appraisal.submit",
  APPRAISAL_VIEW = "appraisal.view",
  APPRAISAL_FEEDBACK = "appraisal.feedback",
  SESSION_SELF_DELAY = "session.self_delay",
  SESSION_SELF_CANCEL = "session.self_cancel",
  PAYMENTS_LEDGER_VIEW = "payments.ledger_view",
}

const appPermissionValues = Object.values(AppPermission) as readonly AppPermission[];
const appPermissionStrings = appPermissionValues as readonly string[];

/**
 * Type guard to check if a string is a valid AppPermission.
 */
export function isAppPermission(value: string): value is AppPermission {
  return appPermissionStrings.includes(value);
}

/**
 * Parses a string value into an AppPermission enum, returning null if invalid.
 */
export function parseAppPermission(value: string | null | undefined): AppPermission | null {
  if (value == null) {
    return null;
  }
  if (isAppPermission(value)) {
    return value;
  }
  return null;
}

/** Drops DB rows whose keys were removed from the TypeScript/GraphQL enum (e.g. legacy profile ACL). */
export function filterKnownAppPermissions(keys: Iterable<string>): AppPermission[] {
  const result: AppPermission[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    const parsed = parseAppPermission(key);
    if (parsed && !seen.has(parsed)) {
      seen.add(parsed);
      result.push(parsed);
    }
  }
  return result;
}
