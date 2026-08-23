/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { IanaTimezone } from '@/shared/constants/iana-timezone.enum';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export enum AccountStatus {
  Activated = 'ACTIVATED',
  Deactivated = 'DEACTIVATED'
}

export type AdminDashboardScheduleInput = {
  date: string;
  metricFilter: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
  teacherId: string | null | undefined;
};

export type AdminResetPasswordInput = {
  newPassword: string;
  sendNotificationEmail: boolean | null | undefined;
  userId: string | number;
};

export type AdminRevokeTokenInput = {
  providerSlug: MeetingIntegrationProviderSlug;
  userId: string;
};

export enum AppLanguage {
  Ar = 'ar',
  En = 'en'
}

export enum AppPermission {
  AuthEditOwnProfile = 'AUTH_EDIT_OWN_PROFILE',
  AuthLogin = 'AUTH_LOGIN',
  AuthViewOwnProfile = 'AUTH_VIEW_OWN_PROFILE',
  BillingCreateInvoice = 'BILLING_CREATE_INVOICE',
  BillingDeleteInvoice = 'BILLING_DELETE_INVOICE',
  BillingManageCurrencies = 'BILLING_MANAGE_CURRENCIES',
  BillingManageCurrencyHedges = 'BILLING_MANAGE_CURRENCY_HEDGES',
  BillingManageFxProvider = 'BILLING_MANAGE_FX_PROVIDER',
  BillingOverrideExchangeRates = 'BILLING_OVERRIDE_EXCHANGE_RATES',
  BillingRefreshExchangeRates = 'BILLING_REFRESH_EXCHANGE_RATES',
  BillingSubmitPaymentProof = 'BILLING_SUBMIT_PAYMENT_PROOF',
  BillingUpdateStatusPaid = 'BILLING_UPDATE_STATUS_PAID',
  BillingViewExchangeRates = 'BILLING_VIEW_EXCHANGE_RATES',
  BillingViewHistory = 'BILLING_VIEW_HISTORY',
  BillingViewUnpaidInvoices = 'BILLING_VIEW_UNPAID_INVOICES',
  CategoriesCreate = 'CATEGORIES_CREATE',
  CategoriesDelete = 'CATEGORIES_DELETE',
  CategoriesList = 'CATEGORIES_LIST',
  CategoriesUpdate = 'CATEGORIES_UPDATE',
  CommunicationSubmitSuggestion = 'COMMUNICATION_SUBMIT_SUGGESTION',
  ComplaintsDelete = 'COMPLAINTS_DELETE',
  ComplaintsList = 'COMPLAINTS_LIST',
  ComplaintsRespond = 'COMPLAINTS_RESPOND',
  CreditsManage = 'CREDITS_MANAGE',
  CronManage = 'CRON_MANAGE',
  DashboardFilterMetrics = 'DASHBOARD_FILTER_METRICS',
  DashboardMetricsViewAll = 'DASHBOARD_METRICS_VIEW_ALL',
  DashboardSearch = 'DASHBOARD_SEARCH',
  DashboardView = 'DASHBOARD_VIEW',
  DashboardViewMetrics = 'DASHBOARD_VIEW_METRICS',
  DocumentManageParentDocs = 'DOCUMENT_MANAGE_PARENT_DOCS',
  HistoryViewCalendar = 'HISTORY_VIEW_CALENDAR',
  HistoryViewDetails = 'HISTORY_VIEW_DETAILS',
  InvoicesCreate = 'INVOICES_CREATE',
  InvoicesDelete = 'INVOICES_DELETE',
  InvoicesEdit = 'INVOICES_EDIT',
  InvoicesList = 'INVOICES_LIST',
  InvoicesMarkPaid = 'INVOICES_MARK_PAID',
  LessonReportsApprove = 'LESSON_REPORTS_APPROVE',
  LessonReportsReject = 'LESSON_REPORTS_REJECT',
  LessonReportsReview = 'LESSON_REPORTS_REVIEW',
  LessonReportsSubmit = 'LESSON_REPORTS_SUBMIT',
  MeetingConfigsManageClass = 'MEETING_CONFIGS_MANAGE_CLASS',
  MeetingConfigsManageOther = 'MEETING_CONFIGS_MANAGE_OTHER',
  MeetingConfigsManageOwn = 'MEETING_CONFIGS_MANAGE_OWN',
  MeetingProvidersManageCatalog = 'MEETING_PROVIDERS_MANAGE_CATALOG',
  MonthlyReportsView = 'MONTHLY_REPORTS_VIEW',
  NotesCreate = 'NOTES_CREATE',
  NotesDelete = 'NOTES_DELETE',
  NotesList = 'NOTES_LIST',
  NotesUpdate = 'NOTES_UPDATE',
  NotificationViewAlerts = 'NOTIFICATION_VIEW_ALERTS',
  ParentsCreate = 'PARENTS_CREATE',
  ParentsEdit = 'PARENTS_EDIT',
  ParentsList = 'PARENTS_LIST',
  ParentEditOwnProfile = 'PARENT_EDIT_OWN_PROFILE',
  ParentManageStatus = 'PARENT_MANAGE_STATUS',
  ParentViewDirectory = 'PARENT_VIEW_DIRECTORY',
  ParentViewOwnProfile = 'PARENT_VIEW_OWN_PROFILE',
  ParentViewProfile = 'PARENT_VIEW_PROFILE',
  ParentViewStudents = 'PARENT_VIEW_STUDENTS',
  PaymentMethodsManageCatalogs = 'PAYMENT_METHODS_MANAGE_CATALOGS',
  PaymentMethodsVerifyBankTransfer = 'PAYMENT_METHODS_VERIFY_BANK_TRANSFER',
  PermissionGroupsAssign = 'PERMISSION_GROUPS_ASSIGN',
  PermissionGroupsManage = 'PERMISSION_GROUPS_MANAGE',
  ProfileCoreContactEditOther = 'PROFILE_CORE_CONTACT_EDIT_OTHER',
  ProfileCoreContactEditOwn = 'PROFILE_CORE_CONTACT_EDIT_OWN',
  ProfileCoreContactViewOther = 'PROFILE_CORE_CONTACT_VIEW_OTHER',
  ProfileCoreContactViewOwn = 'PROFILE_CORE_CONTACT_VIEW_OWN',
  ProfileCoreIdentityEditOther = 'PROFILE_CORE_IDENTITY_EDIT_OTHER',
  ProfileCoreIdentityEditOwn = 'PROFILE_CORE_IDENTITY_EDIT_OWN',
  ProfileCoreIdentityViewOther = 'PROFILE_CORE_IDENTITY_VIEW_OTHER',
  ProfileCoreIdentityViewOwn = 'PROFILE_CORE_IDENTITY_VIEW_OWN',
  ProfileCoreStatusEditOther = 'PROFILE_CORE_STATUS_EDIT_OTHER',
  ProfileCoreStatusEditOwn = 'PROFILE_CORE_STATUS_EDIT_OWN',
  ProfileCoreStatusViewOther = 'PROFILE_CORE_STATUS_VIEW_OTHER',
  ProfileCoreStatusViewOwn = 'PROFILE_CORE_STATUS_VIEW_OWN',
  ProfileMeetingConfigsEditOther = 'PROFILE_MEETING_CONFIGS_EDIT_OTHER',
  ProfileMeetingConfigsEditOwn = 'PROFILE_MEETING_CONFIGS_EDIT_OWN',
  ProfileMeetingConfigsViewOther = 'PROFILE_MEETING_CONFIGS_VIEW_OTHER',
  ProfileMeetingConfigsViewOwn = 'PROFILE_MEETING_CONFIGS_VIEW_OWN',
  ProfileParentAccountEditOther = 'PROFILE_PARENT_ACCOUNT_EDIT_OTHER',
  ProfileParentAccountEditOwn = 'PROFILE_PARENT_ACCOUNT_EDIT_OWN',
  ProfileParentAccountViewOther = 'PROFILE_PARENT_ACCOUNT_VIEW_OTHER',
  ProfileParentAccountViewOwn = 'PROFILE_PARENT_ACCOUNT_VIEW_OWN',
  ProfileParentBillingEditOther = 'PROFILE_PARENT_BILLING_EDIT_OTHER',
  ProfileParentBillingEditOwn = 'PROFILE_PARENT_BILLING_EDIT_OWN',
  ProfileParentBillingViewOther = 'PROFILE_PARENT_BILLING_VIEW_OTHER',
  ProfileParentBillingViewOwn = 'PROFILE_PARENT_BILLING_VIEW_OWN',
  ProfileParentIdentityEditOther = 'PROFILE_PARENT_IDENTITY_EDIT_OTHER',
  ProfileParentIdentityEditOwn = 'PROFILE_PARENT_IDENTITY_EDIT_OWN',
  ProfileParentIdentityViewOther = 'PROFILE_PARENT_IDENTITY_VIEW_OTHER',
  ProfileParentIdentityViewOwn = 'PROFILE_PARENT_IDENTITY_VIEW_OWN',
  ProfileParentSocialEditOther = 'PROFILE_PARENT_SOCIAL_EDIT_OTHER',
  ProfileParentSocialEditOwn = 'PROFILE_PARENT_SOCIAL_EDIT_OWN',
  ProfileParentSocialViewOther = 'PROFILE_PARENT_SOCIAL_VIEW_OTHER',
  ProfileParentSocialViewOwn = 'PROFILE_PARENT_SOCIAL_VIEW_OWN',
  ProfileParentStudentsEditOther = 'PROFILE_PARENT_STUDENTS_EDIT_OTHER',
  ProfileParentStudentsEditOwn = 'PROFILE_PARENT_STUDENTS_EDIT_OWN',
  ProfileParentStudentsViewOther = 'PROFILE_PARENT_STUDENTS_VIEW_OTHER',
  ProfileParentStudentsViewOwn = 'PROFILE_PARENT_STUDENTS_VIEW_OWN',
  ProfilePaymentMethodsEditOther = 'PROFILE_PAYMENT_METHODS_EDIT_OTHER',
  ProfilePaymentMethodsEditOwn = 'PROFILE_PAYMENT_METHODS_EDIT_OWN',
  ProfilePaymentMethodsViewOther = 'PROFILE_PAYMENT_METHODS_VIEW_OTHER',
  ProfilePaymentMethodsViewOwn = 'PROFILE_PAYMENT_METHODS_VIEW_OWN',
  ProfileStaffPermissionsEditOther = 'PROFILE_STAFF_PERMISSIONS_EDIT_OTHER',
  ProfileStaffPermissionsEditOwn = 'PROFILE_STAFF_PERMISSIONS_EDIT_OWN',
  ProfileStaffPermissionsViewOther = 'PROFILE_STAFF_PERMISSIONS_VIEW_OTHER',
  ProfileStaffPermissionsViewOwn = 'PROFILE_STAFF_PERMISSIONS_VIEW_OWN',
  ProfileStaffRoleEditOther = 'PROFILE_STAFF_ROLE_EDIT_OTHER',
  ProfileStaffRoleEditOwn = 'PROFILE_STAFF_ROLE_EDIT_OWN',
  ProfileStaffRoleViewOther = 'PROFILE_STAFF_ROLE_VIEW_OTHER',
  ProfileStaffRoleViewOwn = 'PROFILE_STAFF_ROLE_VIEW_OWN',
  ProfileTeacherIdentityEditOther = 'PROFILE_TEACHER_IDENTITY_EDIT_OTHER',
  ProfileTeacherIdentityEditOwn = 'PROFILE_TEACHER_IDENTITY_EDIT_OWN',
  ProfileTeacherIdentityViewOther = 'PROFILE_TEACHER_IDENTITY_VIEW_OTHER',
  ProfileTeacherIdentityViewOwn = 'PROFILE_TEACHER_IDENTITY_VIEW_OWN',
  ProfileTeacherProfessionalEditOther = 'PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER',
  ProfileTeacherProfessionalEditOwn = 'PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN',
  ProfileTeacherProfessionalViewOther = 'PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER',
  ProfileTeacherProfessionalViewOwn = 'PROFILE_TEACHER_PROFESSIONAL_VIEW_OWN',
  ProfileTeacherStudentsEditOther = 'PROFILE_TEACHER_STUDENTS_EDIT_OTHER',
  ProfileTeacherStudentsEditOwn = 'PROFILE_TEACHER_STUDENTS_EDIT_OWN',
  ProfileTeacherStudentsViewOther = 'PROFILE_TEACHER_STUDENTS_VIEW_OTHER',
  ProfileTeacherStudentsViewOwn = 'PROFILE_TEACHER_STUDENTS_VIEW_OWN',
  QuotasManage = 'QUOTAS_MANAGE',
  QuotasView = 'QUOTAS_VIEW',
  ReportsGenerate = 'REPORTS_GENERATE',
  ReportGenerateCustom = 'REPORT_GENERATE_CUSTOM',
  ReportViewFinancials = 'REPORT_VIEW_FINANCIALS',
  ResourcesDelete = 'RESOURCES_DELETE',
  ResourcesList = 'RESOURCES_LIST',
  ResourcesUpload = 'RESOURCES_UPLOAD',
  ScheduleClearWeekly = 'SCHEDULE_CLEAR_WEEKLY',
  ScheduleCreateClass = 'SCHEDULE_CREATE_CLASS',
  ScheduleDeleteClass = 'SCHEDULE_DELETE_CLASS',
  ScheduleDstMigrate = 'SCHEDULE_DST_MIGRATE',
  ScheduleFilterAdvanced = 'SCHEDULE_FILTER_ADVANCED',
  ScheduleManageRecurring = 'SCHEDULE_MANAGE_RECURRING',
  ScheduleSearchAvailability = 'SCHEDULE_SEARCH_AVAILABILITY',
  ScheduleViewAll = 'SCHEDULE_VIEW_ALL',
  ScheduleViewAssigned = 'SCHEDULE_VIEW_ASSIGNED',
  ScheduleViewFamily = 'SCHEDULE_VIEW_FAMILY',
  ScheduleViewList = 'SCHEDULE_VIEW_LIST',
  ScheduleViewTimezones = 'SCHEDULE_VIEW_TIMEZONES',
  ScheduleViewWeekly = 'SCHEDULE_VIEW_WEEKLY',
  ScheduleViewWorkload = 'SCHEDULE_VIEW_WORKLOAD',
  SessionActivateClass = 'SESSION_ACTIVATE_CLASS',
  SessionActivateOverride = 'SESSION_ACTIVATE_OVERRIDE',
  SessionOverrideActions = 'SESSION_OVERRIDE_ACTIONS',
  SessionReschedule = 'SESSION_RESCHEDULE',
  SessionReset = 'SESSION_RESET',
  SessionUpdateStatusAbsent = 'SESSION_UPDATE_STATUS_ABSENT',
  SessionUpdateStatusLeave = 'SESSION_UPDATE_STATUS_LEAVE',
  SessionUpdateStatusStart = 'SESSION_UPDATE_STATUS_START',
  SessionViewDetails = 'SESSION_VIEW_DETAILS',
  SettingsAppearanceManage = 'SETTINGS_APPEARANCE_MANAGE',
  SettingsAuditView = 'SETTINGS_AUDIT_VIEW',
  SettingsEditEnv = 'SETTINGS_EDIT_ENV',
  SettingsEditGeneral = 'SETTINGS_EDIT_GENERAL',
  SettingsEditMeetingIntegrations = 'SETTINGS_EDIT_MEETING_INTEGRATIONS',
  SettingsEditSession = 'SETTINGS_EDIT_SESSION',
  SettingsSiteContentManage = 'SETTINGS_SITE_CONTENT_MANAGE',
  SettingsTimezonesView = 'SETTINGS_TIMEZONES_VIEW',
  SettingsView = 'SETTINGS_VIEW',
  StaffCreate = 'STAFF_CREATE',
  StaffEdit = 'STAFF_EDIT',
  StaffEditProfile = 'STAFF_EDIT_PROFILE',
  StaffList = 'STAFF_LIST',
  StaffViewDirectory = 'STAFF_VIEW_DIRECTORY',
  StorageManage = 'STORAGE_MANAGE',
  StudentsChangeStatus = 'STUDENTS_CHANGE_STATUS',
  StudentsChangeTeacher = 'STUDENTS_CHANGE_TEACHER',
  StudentsCreate = 'STUDENTS_CREATE',
  StudentsEdit = 'STUDENTS_EDIT',
  StudentsList = 'STUDENTS_LIST',
  StudentsOverrideQuota = 'STUDENTS_OVERRIDE_QUOTA',
  StudentAcademicEditOther = 'STUDENT_ACADEMIC_EDIT_OTHER',
  StudentAcademicEditOwn = 'STUDENT_ACADEMIC_EDIT_OWN',
  StudentAcademicViewOther = 'STUDENT_ACADEMIC_VIEW_OTHER',
  StudentAcademicViewOwn = 'STUDENT_ACADEMIC_VIEW_OWN',
  StudentEditQuota = 'STUDENT_EDIT_QUOTA',
  StudentHistoryEditOther = 'STUDENT_HISTORY_EDIT_OTHER',
  StudentHistoryEditOwn = 'STUDENT_HISTORY_EDIT_OWN',
  StudentHistoryViewOther = 'STUDENT_HISTORY_VIEW_OTHER',
  StudentHistoryViewOwn = 'STUDENT_HISTORY_VIEW_OWN',
  StudentIdentityEditOther = 'STUDENT_IDENTITY_EDIT_OTHER',
  StudentIdentityEditOwn = 'STUDENT_IDENTITY_EDIT_OWN',
  StudentIdentityViewOther = 'STUDENT_IDENTITY_VIEW_OTHER',
  StudentIdentityViewOwn = 'STUDENT_IDENTITY_VIEW_OWN',
  StudentManageStatus = 'STUDENT_MANAGE_STATUS',
  StudentParentEditOther = 'STUDENT_PARENT_EDIT_OTHER',
  StudentParentEditOwn = 'STUDENT_PARENT_EDIT_OWN',
  StudentParentViewOther = 'STUDENT_PARENT_VIEW_OTHER',
  StudentParentViewOwn = 'STUDENT_PARENT_VIEW_OWN',
  StudentQuotaEditEditOther = 'STUDENT_QUOTA_EDIT_EDIT_OTHER',
  StudentQuotaEditEditOwn = 'STUDENT_QUOTA_EDIT_EDIT_OWN',
  StudentQuotaEditViewOther = 'STUDENT_QUOTA_EDIT_VIEW_OTHER',
  StudentQuotaEditViewOwn = 'STUDENT_QUOTA_EDIT_VIEW_OWN',
  StudentReassignTeacher = 'STUDENT_REASSIGN_TEACHER',
  StudentScheduleEditOther = 'STUDENT_SCHEDULE_EDIT_OTHER',
  StudentScheduleEditOwn = 'STUDENT_SCHEDULE_EDIT_OWN',
  StudentScheduleViewOther = 'STUDENT_SCHEDULE_VIEW_OTHER',
  StudentScheduleViewOwn = 'STUDENT_SCHEDULE_VIEW_OWN',
  StudentTeacherEditOther = 'STUDENT_TEACHER_EDIT_OTHER',
  StudentTeacherEditOwn = 'STUDENT_TEACHER_EDIT_OWN',
  StudentTeacherViewOther = 'STUDENT_TEACHER_VIEW_OTHER',
  StudentTeacherViewOwn = 'STUDENT_TEACHER_VIEW_OWN',
  StudentViewAssociated = 'STUDENT_VIEW_ASSOCIATED',
  StudentViewOwnDashboard = 'STUDENT_VIEW_OWN_DASHBOARD',
  SubjectsCreate = 'SUBJECTS_CREATE',
  SubjectsDelete = 'SUBJECTS_DELETE',
  SubjectsList = 'SUBJECTS_LIST',
  SubjectsManageResources = 'SUBJECTS_MANAGE_RESOURCES',
  SubjectsUpdate = 'SUBJECTS_UPDATE',
  SubjectsViewResources = 'SUBJECTS_VIEW_RESOURCES',
  SuggestionsDelete = 'SUGGESTIONS_DELETE',
  SuggestionsList = 'SUGGESTIONS_LIST',
  SuggestionsReview = 'SUGGESTIONS_REVIEW',
  SupervisorViewDashboard = 'SUPERVISOR_VIEW_DASHBOARD',
  SupportSubmitComplaint = 'SUPPORT_SUBMIT_COMPLAINT',
  SupportViewHistory = 'SUPPORT_VIEW_HISTORY',
  SystemBulkUpdateDst = 'SYSTEM_BULK_UPDATE_DST',
  SystemDispatchEmail = 'SYSTEM_DISPATCH_EMAIL',
  SystemEnforceLeaveLimit = 'SYSTEM_ENFORCE_LEAVE_LIMIT',
  SystemEnforceSuspendedLock = 'SYSTEM_ENFORCE_SUSPENDED_LOCK',
  SystemEnforceTimeWindow = 'SYSTEM_ENFORCE_TIME_WINDOW',
  SystemProcessStudentLeave = 'SYSTEM_PROCESS_STUDENT_LEAVE',
  SystemRestrictResourceAccess = 'SYSTEM_RESTRICT_RESOURCE_ACCESS',
  SystemSyncNotifications = 'SYSTEM_SYNC_NOTIFICATIONS',
  TeachersCreate = 'TEACHERS_CREATE',
  TeachersEdit = 'TEACHERS_EDIT',
  TeachersList = 'TEACHERS_LIST',
  TeachersManageSchedule = 'TEACHERS_MANAGE_SCHEDULE',
  TeacherDuesMarkPaid = 'TEACHER_DUES_MARK_PAID',
  TeacherDuesView = 'TEACHER_DUES_VIEW',
  TeacherEditOwnProfile = 'TEACHER_EDIT_OWN_PROFILE',
  TeacherViewDashboard = 'TEACHER_VIEW_DASHBOARD',
  TeacherViewOwnProfile = 'TEACHER_VIEW_OWN_PROFILE',
  TeacherViewProfile = 'TEACHER_VIEW_PROFILE',
  TeacherViewStudents = 'TEACHER_VIEW_STUDENTS',
  TestCustomAlt = 'TEST_CUSTOM_ALT',
  TestCustomOnly = 'TEST_CUSTOM_ONLY',
  TestSystemOnly = 'TEST_SYSTEM_ONLY',
  UserAdminResetPassword = 'USER_ADMIN_RESET_PASSWORD',
  UserEditProfile = 'USER_EDIT_PROFILE',
  UserViewProfile = 'USER_VIEW_PROFILE',
  WhatsappConfigManage = 'WHATSAPP_CONFIG_MANAGE',
  WhatsappTemplatesManage = 'WHATSAPP_TEMPLATES_MANAGE',
  WhatsappView = 'WHATSAPP_VIEW'
}

/** Input pair of brand colors (primary + secondary) for a single mode. */
export type AppearanceColorPairInput = {
  primaryMain: string;
  secondaryMain: string;
};

/** Input for per-mode brand colors (light + dark). */
export type AppearanceColorsInput = {
  dark: AppearanceColorPairInput;
  light: AppearanceColorPairInput;
};

/** Input for the saveAppearanceDraft mutation (full draft field bundle). */
export type AppearanceDraftInput = {
  colors: AppearanceColorsInput;
  defaultColorScheme: string;
  logoUrl: string | null | undefined;
  siteDescription: string;
  siteName: string;
  siteTitle: string;
};

export type AssignPermissionGroupToUserInput = {
  groupId: string;
  userId: string;
};

export type AttachSubjectResourceInput = {
  learningResourceId: string;
  resourceType: string | null | undefined;
  sortOrder: number | null | undefined;
  subjectId: string;
};

export enum AttendanceEvaluation {
  Absent = 'ABSENT',
  Late = 'LATE',
  Present = 'PRESENT'
}

/** Filters applied to the dynamic attendance query engine. */
export type AttendanceReportFiltersInput = {
  /** ISO Date String representing start bound */
  fromDate: string;
  groupBy: ReportGroupingMode;
  /** Optional UUID to filter by a specific teacher */
  teacherId: string | null | undefined;
  /** ISO Date String representing end bound */
  toDate: string;
};

export type AvailabilitySearchInput = {
  daysOfWeek: Array<DayOfWeek> | null | undefined;
  fromDate: string | null | undefined;
  fromTime: string;
  gender: Gender | null | undefined;
  minAvailableDays: number | null | undefined;
  minTotalGaps: number | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
  sortBy: AvailabilitySearchSortBy | null | undefined;
  teacherNameSearch: string | null | undefined;
  toDate: string | null | undefined;
  toTime: string;
};

export enum AvailabilitySearchSortBy {
  MostAvailableDays = 'MOST_AVAILABLE_DAYS',
  MostGaps = 'MOST_GAPS',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC',
  TimezoneAsc = 'TIMEZONE_ASC'
}

export type BillingMonthInput = {
  month: number;
  year: number;
};

export enum BookingStatus {
  Confirmed = 'CONFIRMED',
  Rescheduled = 'RESCHEDULED'
}

export type ChangePasswordInput = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

export type ClassCategoryCreateInput = {
  description: string | null | undefined;
  isActive: boolean | null | undefined;
  name: string;
  slug: string;
  sortOrder: number | null | undefined;
};

export type ClassCategoryUpdateInput = {
  description: string | null | undefined;
  isActive: boolean | null | undefined;
  name: string | null | undefined;
  slug: string | null | undefined;
  sortOrder: number | null | undefined;
};

export enum ClassExecutionState {
  Activated = 'ACTIVATED',
  Completed = 'COMPLETED',
  NotActivated = 'NOT_ACTIVATED',
  OnDemandConflictHeld = 'ON_DEMAND_CONFLICT_HELD',
  OnDemandNoCreditsAbsent = 'ON_DEMAND_NO_CREDITS_ABSENT',
  OnDemandNoCreditsCancelled = 'ON_DEMAND_NO_CREDITS_CANCELLED',
  OnDemandPendingCredits = 'ON_DEMAND_PENDING_CREDITS',
  Running = 'RUNNING'
}

export type ClassMeetingConfigCreateInput = {
  classInstanceId: string | null | undefined;
  details: MeetingConfigDetailsInput;
  isDefault: boolean;
  label: string | null | undefined;
  password: string | null | undefined;
  providerId: string;
  recurringScheduleId: string | null | undefined;
};

export type ClassMeetingConfigUpdateInput = {
  details: MeetingConfigDetailsInput | null | undefined;
  isDefault: boolean | null | undefined;
  label: string | null | undefined;
  password: string | null | undefined;
  providerId: string | null | undefined;
};

export enum ClassOutcome {
  Absent = 'ABSENT',
  Leave = 'LEAVE',
  Pending = 'PENDING',
  Taken = 'TAKEN'
}

export type ClassSubjectCreateInput = {
  avatarUrl: string | null | undefined;
  categoryId: string;
  description: string | null | undefined;
  hourlyRate: string | null | undefined;
  isActive: boolean | null | undefined;
  name: string;
  rateCurrency: CurrencyCode | null | undefined;
  slug: string;
  sortOrder: number | null | undefined;
};

export type ClassSubjectUpdateInput = {
  avatarUrl: string | null | undefined;
  categoryId: string | null | undefined;
  description: string | null | undefined;
  hourlyRate: string | null | undefined;
  isActive: boolean | null | undefined;
  name: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
  slug: string | null | undefined;
  sortOrder: number | null | undefined;
};

export enum ClassType {
  Advance = 'ADVANCE',
  Regular = 'REGULAR',
  Trial = 'TRIAL'
}

/** Categories for parent complaints. */
export enum ComplaintCategory {
  Other = 'OTHER',
  RegardingSystem = 'REGARDING_SYSTEM',
  RegardingTeacher = 'REGARDING_TEACHER'
}

/** Input metadata for a pre-uploaded complaint attachment. */
export type ComplaintFileMetadataInput = {
  mimeType: string;
  path: string;
  sizeBytes: number;
};

/** Filter options for the admin complaint queue. */
export type ComplaintQueueFilter = {
  search: string | null | undefined;
  status: ComplaintStatus | null | undefined;
};

/** Status of a complaint in the support queue. */
export enum ComplaintStatus {
  Answered = 'ANSWERED',
  Unanswered = 'UNANSWERED'
}

/** Input for submitting a new complaint. */
export type ComplaintSubmitInput = {
  body: string;
  category: ComplaintCategory;
  files: Array<ComplaintFileMetadataInput> | null | undefined;
  studentId: string | null | undefined;
  submitterEmail: string;
};

export type ConnectMeetingProviderOAuthInput = {
  providerSlug: MeetingIntegrationProviderSlug;
  returnPath: string;
};

export type CoreUserProfileFieldsInput = {
  avatarUrl: string | null | undefined;
  displayCurrency: CurrencyCode | null | undefined;
  email: string | null | undefined;
  name: string | null | undefined;
  /** User account status (super admin only) */
  status: AccountStatus | null | undefined;
  timezone: IanaTimezone | null | undefined;
};

export enum CountryCode {
  Ad = 'AD',
  Ae = 'AE',
  Af = 'AF',
  Ag = 'AG',
  Ai = 'AI',
  Al = 'AL',
  Am = 'AM',
  Ao = 'AO',
  Aq = 'AQ',
  Ar = 'AR',
  As = 'AS',
  At = 'AT',
  Au = 'AU',
  Aw = 'AW',
  Ax = 'AX',
  Az = 'AZ',
  Ba = 'BA',
  Bb = 'BB',
  Bd = 'BD',
  Be = 'BE',
  Bf = 'BF',
  Bg = 'BG',
  Bh = 'BH',
  Bi = 'BI',
  Bj = 'BJ',
  Bl = 'BL',
  Bm = 'BM',
  Bn = 'BN',
  Bo = 'BO',
  Br = 'BR',
  Bs = 'BS',
  Bt = 'BT',
  Bv = 'BV',
  Bw = 'BW',
  By = 'BY',
  Bz = 'BZ',
  Ca = 'CA',
  Cc = 'CC',
  Cd = 'CD',
  Cf = 'CF',
  Cg = 'CG',
  Ch = 'CH',
  Ci = 'CI',
  Ck = 'CK',
  Cl = 'CL',
  Cm = 'CM',
  Cn = 'CN',
  Co = 'CO',
  Cr = 'CR',
  Cu = 'CU',
  Cv = 'CV',
  Cw = 'CW',
  Cx = 'CX',
  Cy = 'CY',
  Cz = 'CZ',
  De = 'DE',
  Dj = 'DJ',
  Dk = 'DK',
  Dm = 'DM',
  Do = 'DO',
  Dz = 'DZ',
  Ec = 'EC',
  Ee = 'EE',
  Eg = 'EG',
  Eh = 'EH',
  Er = 'ER',
  Es = 'ES',
  Et = 'ET',
  Fi = 'FI',
  Fj = 'FJ',
  Fk = 'FK',
  Fm = 'FM',
  Fo = 'FO',
  Fr = 'FR',
  Ga = 'GA',
  Gb = 'GB',
  Gd = 'GD',
  Ge = 'GE',
  Gf = 'GF',
  Gg = 'GG',
  Gh = 'GH',
  Gi = 'GI',
  Gl = 'GL',
  Gm = 'GM',
  Gn = 'GN',
  Gp = 'GP',
  Gq = 'GQ',
  Gr = 'GR',
  Gs = 'GS',
  Gt = 'GT',
  Gu = 'GU',
  Gw = 'GW',
  Gy = 'GY',
  Hk = 'HK',
  Hm = 'HM',
  Hn = 'HN',
  Hr = 'HR',
  Ht = 'HT',
  Hu = 'HU',
  Id = 'ID',
  Ie = 'IE',
  Im = 'IM',
  In = 'IN',
  Io = 'IO',
  Iq = 'IQ',
  Ir = 'IR',
  Is = 'IS',
  It = 'IT',
  Je = 'JE',
  Jm = 'JM',
  Jo = 'JO',
  Jp = 'JP',
  Ke = 'KE',
  Kg = 'KG',
  Kh = 'KH',
  Ki = 'KI',
  Km = 'KM',
  Kn = 'KN',
  Kp = 'KP',
  Kr = 'KR',
  Kw = 'KW',
  Ky = 'KY',
  Kz = 'KZ',
  La = 'LA',
  Lb = 'LB',
  Lc = 'LC',
  Li = 'LI',
  Lk = 'LK',
  Lr = 'LR',
  Ls = 'LS',
  Lt = 'LT',
  Lu = 'LU',
  Lv = 'LV',
  Ly = 'LY',
  Ma = 'MA',
  Mc = 'MC',
  Md = 'MD',
  Me = 'ME',
  Mf = 'MF',
  Mg = 'MG',
  Mh = 'MH',
  Mk = 'MK',
  Ml = 'ML',
  Mm = 'MM',
  Mn = 'MN',
  Mo = 'MO',
  Mp = 'MP',
  Mq = 'MQ',
  Mr = 'MR',
  Ms = 'MS',
  Mt = 'MT',
  Mu = 'MU',
  Mv = 'MV',
  Mw = 'MW',
  Mx = 'MX',
  My = 'MY',
  Mz = 'MZ',
  Na = 'NA',
  Nc = 'NC',
  Ne = 'NE',
  Nf = 'NF',
  Ng = 'NG',
  Ni = 'NI',
  Nl = 'NL',
  No = 'NO',
  Np = 'NP',
  Nr = 'NR',
  Nu = 'NU',
  Nz = 'NZ',
  Om = 'OM',
  Pa = 'PA',
  Pe = 'PE',
  Pf = 'PF',
  Pg = 'PG',
  Ph = 'PH',
  Pk = 'PK',
  Pl = 'PL',
  Pm = 'PM',
  Pn = 'PN',
  Pr = 'PR',
  Ps = 'PS',
  Pt = 'PT',
  Pw = 'PW',
  Py = 'PY',
  Qa = 'QA',
  Re = 'RE',
  Ro = 'RO',
  Rs = 'RS',
  Ru = 'RU',
  Rw = 'RW',
  Sa = 'SA',
  Sb = 'SB',
  Sc = 'SC',
  Sd = 'SD',
  Se = 'SE',
  Sg = 'SG',
  Sh = 'SH',
  Si = 'SI',
  Sj = 'SJ',
  Sk = 'SK',
  Sl = 'SL',
  Sm = 'SM',
  Sn = 'SN',
  So = 'SO',
  Sr = 'SR',
  Ss = 'SS',
  St = 'ST',
  Sv = 'SV',
  Sx = 'SX',
  Sy = 'SY',
  Sz = 'SZ',
  Tc = 'TC',
  Td = 'TD',
  Tf = 'TF',
  Tg = 'TG',
  Th = 'TH',
  Tj = 'TJ',
  Tk = 'TK',
  Tl = 'TL',
  Tm = 'TM',
  Tn = 'TN',
  To = 'TO',
  Tr = 'TR',
  Tv = 'TV',
  Tw = 'TW',
  Tz = 'TZ',
  Ua = 'UA',
  Ug = 'UG',
  Us = 'US',
  Uy = 'UY',
  Uz = 'UZ',
  Va = 'VA',
  Vc = 'VC',
  Ve = 'VE',
  Vg = 'VG',
  Vi = 'VI',
  Vn = 'VN',
  Vu = 'VU',
  Wf = 'WF',
  Ws = 'WS',
  Xk = 'XK',
  Ye = 'YE',
  Yt = 'YT',
  Za = 'ZA',
  Zm = 'ZM',
  Zw = 'ZW'
}

export type CreateManualClassEntryInput = {
  classType: ClassType | null | undefined;
  durationMinutes: number;
  scheduledEndAt: string;
  scheduledStartAt: string;
  studentId: string | number;
  subjectId: string | number;
  teacherId: string | number;
};

export type CreatePermissionGroupInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  name: Partial<Record<'ar' | 'en', string>>;
  permissionIds: Array<string>;
};

export type CreateRecurringClassInput = {
  classType: ClassType | null | undefined;
  days: Array<RecurringClassDayInput>;
  defaultStartTime: string;
  durationMinutes: number;
  earmarkedClasses: number | null | undefined;
  effectiveFrom: string | null | undefined;
  effectiveUntil: string | null | undefined;
  generateInstancesForWeeks: number | null | undefined;
  generationHorizonWeeks: number | null | undefined;
  hourlyRate: string | null | undefined;
  ondemandNoCreditsOutcome: OnDemandNoCreditsOutcome | null | undefined;
  quotaId: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
  schedulingMode: SchedulingMode | null | undefined;
  studentId: string;
  subjectId: string;
  teacherId: string;
  timezone: IanaTimezone;
};

export type CreateTeacherNoteInput = {
  body: string | null | undefined;
  expiresAt: string | null | undefined;
  isPublished: boolean | null | undefined;
  priority: number | null | undefined;
  startsAt: string | null | undefined;
  title: string;
};

export enum CreditReason {
  Adjustment = 'ADJUSTMENT',
  Deduction = 'DEDUCTION',
  Purchase = 'PURCHASE',
  Refund = 'REFUND'
}

export enum CronConcurrencyPolicy {
  Allow = 'ALLOW',
  Replace = 'REPLACE',
  Skip = 'SKIP'
}

export enum CronJobKind {
  Noop = 'NOOP'
}

export type CronRunListInput = {
  from: string | null | undefined;
  limit: number | null | undefined;
  offset: number | null | undefined;
  scheduleId: string | null | undefined;
  status: CronRunStatus | null | undefined;
  statuses: Array<CronRunStatus> | null | undefined;
  to: string | null | undefined;
};

export enum CronRunStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Retrying = 'RETRYING',
  Running = 'RUNNING',
  Timeout = 'TIMEOUT'
}

export type CronRunTriggerInput = {
  id: string;
  payload: unknown;
};

export type CronScheduleDeleteInput = {
  hard: boolean | null | undefined;
  id: string;
};

export type CronScheduleListInput = {
  jobKind: CronJobKind | null | undefined;
  limit: number | null | undefined;
  name: string | null | undefined;
  offset: number | null | undefined;
  status: CronScheduleStatus | null | undefined;
};

export enum CronScheduleStatus {
  Active = 'ACTIVE',
  Disabled = 'DISABLED',
  Paused = 'PAUSED'
}

export type CronScheduleSubmitInput = {
  concurrencyPolicy: CronConcurrencyPolicy | null | undefined;
  cronExpression: string;
  description: string | null | undefined;
  jobKind: CronJobKind;
  maxRetries: number | null | undefined;
  name: string;
  payload: unknown;
  retryBackoffSeconds: number | null | undefined;
  timeoutSeconds: number | null | undefined;
  timezone: string | null | undefined;
};

export type CronScheduleUpdateInput = {
  concurrencyPolicy: CronConcurrencyPolicy | null | undefined;
  cronExpression: string | null | undefined;
  description: string | null | undefined;
  jobKind: CronJobKind | null | undefined;
  maxRetries: number | null | undefined;
  name: string | null | undefined;
  payload: unknown;
  retryBackoffSeconds: number | null | undefined;
  timeoutSeconds: number | null | undefined;
  timezone: string | null | undefined;
};

export enum CronTriggerSource {
  External = 'EXTERNAL',
  Manual = 'MANUAL',
  VercelExplicit = 'VERCEL_EXPLICIT',
  VercelTicker = 'VERCEL_TICKER',
  WorkerRetry = 'WORKER_RETRY'
}

export enum CurrencyCode {
  Aed = 'AED',
  Aud = 'AUD',
  Bhd = 'BHD',
  Cad = 'CAD',
  Chf = 'CHF',
  Cny = 'CNY',
  Djf = 'DJF',
  Dzd = 'DZD',
  Egp = 'EGP',
  Eur = 'EUR',
  Gbp = 'GBP',
  Ils = 'ILS',
  Inr = 'INR',
  Iqd = 'IQD',
  Jod = 'JOD',
  Jpy = 'JPY',
  Kmf = 'KMF',
  Kwd = 'KWD',
  Lbp = 'LBP',
  Lyd = 'LYD',
  Mad = 'MAD',
  Mru = 'MRU',
  Omr = 'OMR',
  Qar = 'QAR',
  Sar = 'SAR',
  Sdg = 'SDG',
  Sos = 'SOS',
  Syp = 'SYP',
  Tnd = 'TND',
  Try = 'TRY',
  Usd = 'USD',
  Yer = 'YER'
}

export enum DayOfWeek {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

/** Input for the demo fast login mutation. */
export type DemoLoginInput = {
  /** The unique slug of the permission group to authenticate as. */
  groupSlug: string;
};

export type DisconnectMeetingProviderOAuthInput = {
  providerSlug: MeetingIntegrationProviderSlug;
};

export enum EffectiveMeetingSource {
  Class = 'CLASS',
  None = 'NONE',
  Recurring = 'RECURRING',
  Teacher = 'TEACHER'
}

export type EnvConfigUpsertInput = {
  key: string;
  value: string;
};

export enum FxProvider {
  Fixer = 'Fixer',
  OpenExchangeRates = 'OpenExchangeRates'
}

export enum FxProviderConfigSource {
  Database = 'DATABASE',
  Env = 'ENV'
}

export enum FxSyncStatus {
  Failed = 'Failed',
  Partial = 'Partial',
  Running = 'Running',
  Success = 'Success'
}

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE'
}

/** Input for creating a general user with permission group assignment */
export type GeneralUserCreateInput = {
  email: string;
  groupSlug: string;
  name: string;
  password: string;
  phone: string | null | undefined;
  status: AccountStatus | null | undefined;
};

export type GenerateMeetingUrlInput = {
  durationMinutes: number | null | undefined;
  providerId: string;
  startDateTime: string | null | undefined;
  topic: string;
};

export enum GroupClassAttendanceStatus {
  Absent = 'ABSENT',
  Late = 'LATE',
  Pending = 'PENDING',
  Present = 'PRESENT'
}

export enum IdentifierKind {
  Email = 'EMAIL',
  EmailOrHandle = 'EMAIL_OR_HANDLE',
  Handle = 'HANDLE'
}

export enum InvoicePaymentSubmissionStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum InvoiceStatus {
  Cancelled = 'CANCELLED',
  Paid = 'PAID',
  PaymentPending = 'PAYMENT_PENDING',
  Unpaid = 'UNPAID'
}

export enum InvoiceType {
  Manual = 'MANUAL',
  Monthly = 'MONTHLY',
  PerClasses = 'PER_CLASSES'
}

export enum LeaveRequestStatus {
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Pending = 'PENDING',
  Rescheduled = 'RESCHEDULED'
}

export enum LessonReportStatus {
  Approved = 'APPROVED',
  Draft = 'DRAFT',
  PendingReview = 'PENDING_REVIEW',
  Rejected = 'REJECTED'
}

/** Input for submitting a lesson report for a completed class instance */
export type LessonReportSubmitInput = {
  attendanceEvaluation: AttendanceEvaluation;
  classInstanceId: string | number;
  completionPercentage: number;
  durationMinutes: number;
  teacherNotes: string | null | undefined;
};

export type LogSupportRequestInput = {
  reason: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export enum ManagerAccountType {
  Manager = 'manager',
  Supervisor = 'supervisor'
}

/** Input for creating a new manager/staff account with RBAC assignment */
export type ManagerOnboardingInput = {
  accountType: ManagerAccountType;
  avatarUrl: string | null | undefined;
  displayCurrency: CurrencyCode | null | undefined;
  email: string;
  name: string;
  password: string;
  phone: string | null | undefined;
  timezone: IanaTimezone | null | undefined;
};

/** Input for marking a suggestion as a duplicate of another suggestion. */
export type MarkSuggestionDuplicateInput = {
  duplicateOfId: string;
  suggestionId: string;
};

export type MeetingConfigDetailsInput = {
  meetingUrl: string | null | undefined;
  tenantId: string | null | undefined;
  username: string | null | undefined;
};

export enum MeetingConnectionTestMode {
  GenerateAndDelete = 'GENERATE_AND_DELETE',
  ValidateConfig = 'VALIDATE_CONFIG'
}

export enum MeetingIntegrationConnectedAccountStatus {
  Connected = 'CONNECTED',
  ExpiringSoon = 'EXPIRING_SOON',
  ReauthNeeded = 'REAUTH_NEEDED',
  Revoked = 'REVOKED'
}

export enum MeetingIntegrationProviderSlug {
  GoogleMeet = 'GOOGLE_MEET',
  MicrosoftTeams = 'MICROSOFT_TEAMS',
  Zoom = 'ZOOM'
}

export type MeetingProviderCreateInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  fieldSchema: MeetingProviderFieldSchemaInput;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>>;
  providerKind: string | null | undefined;
  slug: string;
  urlAllowlist: Array<string>;
  urlExample: string | null | undefined;
};

export type MeetingProviderFieldSchemaInput = {
  requiresMeetingUrl: boolean;
  supportsAutoGeneration: boolean | null | undefined;
  supportsPassword: boolean | null | undefined;
  supportsTenantId: boolean | null | undefined;
  supportsUsername: boolean | null | undefined;
};

export type MeetingProviderUpdateInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  fieldSchema: MeetingProviderFieldSchemaInput | null | undefined;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>> | null | undefined;
  providerKind: string | null | undefined;
  slug: string | null | undefined;
  urlAllowlist: Array<string> | null | undefined;
  urlExample: string | null | undefined;
};

export enum NotificationChannel {
  Email = 'EMAIL',
  OnApp = 'ON_APP',
  Push = 'PUSH',
  Sms = 'SMS',
  Whatsapp = 'WHATSAPP'
}

export enum NotificationEventType {
  ClassActivated = 'CLASS_ACTIVATED',
  ClassCancelled = 'CLASS_CANCELLED',
  ClassCompleted = 'CLASS_COMPLETED',
  ClassLeaveRequested = 'CLASS_LEAVE_REQUESTED',
  ClassMarkedAbsent = 'CLASS_MARKED_ABSENT',
  ClassMarkedMissed = 'CLASS_MARKED_MISSED',
  ClassReminder = 'CLASS_REMINDER',
  ClassRescheduled = 'CLASS_RESCHEDULED',
  ClassReset = 'CLASS_RESET',
  ClassScheduled = 'CLASS_SCHEDULED',
  ClassStarted = 'CLASS_STARTED',
  ComplaintResponse = 'COMPLAINT_RESPONSE',
  InvoiceGenerated = 'INVOICE_GENERATED',
  InvoiceStatusChanged = 'INVOICE_STATUS_CHANGED',
  LessonReportReviewed = 'LESSON_REPORT_REVIEWED',
  LessonReportSubmitted = 'LESSON_REPORT_SUBMITTED',
  NewComplaint = 'NEW_COMPLAINT',
  NewSuggestion = 'NEW_SUGGESTION',
  OnDemandInstancePendingCredit = 'ON_DEMAND_INSTANCE_PENDING_CREDIT',
  OnDemandInstanceReminderT1 = 'ON_DEMAND_INSTANCE_REMINDER_T1',
  OnDemandInstanceReminderT3 = 'ON_DEMAND_INSTANCE_REMINDER_T3',
  OnDemandTeacherDailyDigest = 'ON_DEMAND_TEACHER_DAILY_DIGEST',
  PasswordResetByAdmin = 'PASSWORD_RESET_BY_ADMIN',
  PaymentMethodChanged = 'PAYMENT_METHOD_CHANGED',
  QuotaExpired = 'QUOTA_EXPIRED',
  QuotaExpiringSoon = 'QUOTA_EXPIRING_SOON',
  QuotaLowBalance = 'QUOTA_LOW_BALANCE',
  StudentQuotaOverridden = 'STUDENT_QUOTA_OVERRIDDEN',
  StudentStatusChanged = 'STUDENT_STATUS_CHANGED',
  StudentTeacherReassigned = 'STUDENT_TEACHER_REASSIGNED',
  SuggestionAcknowledged = 'SUGGESTION_ACKNOWLEDGED',
  SuggestionDuplicateMarked = 'SUGGESTION_DUPLICATE_MARKED',
  UserStatusChanged = 'USER_STATUS_CHANGED'
}

export type NotificationPreferenceInput = {
  channel: NotificationChannel;
  enabled: boolean;
  eventType: NotificationEventType;
};

export enum OnDemandNoCreditsOutcome {
  AutoAbsentNoCredits = 'AUTO_ABSENT_NO_CREDITS',
  AutoCancel = 'AUTO_CANCEL',
  RemindOnly = 'REMIND_ONLY'
}

export enum OrderSortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export enum OverrideState {
  Denied = 'DENIED',
  Granted = 'GRANTED'
}

export type PaginationArgs = {
  after: string | null | undefined;
  before: string | null | undefined;
  first: number | null | undefined;
  last: number | null | undefined;
  maxCount: number | null | undefined;
  page: number | null | undefined;
  skip: number | null | undefined;
};

export type ParentAdminProfileUpdateInput = {
  address: string | null | undefined;
  currency: CurrencyCode | null | undefined;
  facebook: string | null | undefined;
  feeAmount: string | null | undefined;
  invoiceType: string | null | undefined;
  nationality: string | null | undefined;
  phone: string | null | undefined;
  timezone: IanaTimezone | null | undefined;
  twitter: string | null | undefined;
  whatsapp: string | null | undefined;
};

/** Input for creating a new parent account with billing configuration */
export type ParentOnboardingInput = {
  address: string | null | undefined;
  avatarUrl: string | null | undefined;
  currency: CurrencyCode | null | undefined;
  displayCurrency: CurrencyCode | null | undefined;
  email: string;
  facebook: string | null | undefined;
  feeAmount: string | null | undefined;
  initialPayinMethod: UserPaymentMethodInitialInput | null | undefined;
  invoiceType: InvoiceType | null | undefined;
  name: string;
  nationality: string | null | undefined;
  password: string;
  phone: string | null | undefined;
  timezone: IanaTimezone;
  twitter: string | null | undefined;
  whatsapp: string | null | undefined;
};

export type ParentOwnProfileUpdateInput = {
  address: string | null | undefined;
  facebook: string | null | undefined;
  nationality: string | null | undefined;
  phone: string | null | undefined;
  timezone: IanaTimezone | null | undefined;
  twitter: string | null | undefined;
  whatsapp: string | null | undefined;
};

export enum ParentStatus {
  OnLeave = 'ON_LEAVE',
  OnTrial = 'ON_TRIAL',
  Regular = 'REGULAR',
  Suspended = 'SUSPENDED'
}

export enum PaymentDirection {
  Both = 'BOTH',
  Payin = 'PAYIN',
  Payout = 'PAYOUT'
}

export type PaymentMethodDetailsInput = {
  accountNumber: string | null | undefined;
  bankName: string | null | undefined;
  beneficiaryName: string | null | undefined;
  iban: string | null | undefined;
  identifier: string | null | undefined;
  note: string | null | undefined;
  onlineAccountId: string | null | undefined;
  paymentLinkId: string | null | undefined;
  phone: string | null | undefined;
  routingNumber: string | null | undefined;
  swiftBic: string | null | undefined;
  url: string | null | undefined;
  walletId: string | null | undefined;
};

export enum PaymentMethodType {
  BankTransfer = 'BANK_TRANSFER',
  Cash = 'CASH',
  MobileWallet = 'MOBILE_WALLET',
  OnlineAccount = 'ONLINE_ACCOUNT',
  PaymentLink = 'PAYMENT_LINK',
  ProofUpload = 'PROOF_UPLOAD'
}

export enum ProfileAudience {
  Parent = 'PARENT',
  Staff = 'STAFF',
  Student = 'STUDENT',
  Teacher = 'TEACHER'
}

export enum ProfileScope {
  Other = 'OTHER',
  Own = 'OWN'
}

export enum QuotaKind {
  Package = 'PACKAGE',
  Periodic = 'PERIODIC'
}

export enum QuotaLedgerReason {
  Adjust = 'ADJUST',
  Expire = 'EXPIRE',
  Grant = 'GRANT',
  Redeem = 'REDEEM',
  Release = 'RELEASE',
  Reserve = 'RESERVE'
}

/** Filter options for querying quotas */
export type QuotaPaginatedFilterInput = {
  kind: QuotaKind | null | undefined;
  search: string | null | undefined;
  status: QuotaStatus | null | undefined;
  studentId: string | null | undefined;
};

export enum QuotaPeriodType {
  Custom = 'CUSTOM',
  Monthly = 'MONTHLY',
  Weekly = 'WEEKLY'
}

/** Rollover policy configuration for periodic quotas */
export type QuotaRolloverPolicyInput = {
  accumulationCap: number | null | undefined;
  maxRolloverPercent: number | null | undefined;
};

export enum QuotaStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Expired = 'EXPIRED'
}

/** Input for creating a new student quota */
export type QuotaSubmitInput = {
  idempotencyKey: string | null | undefined;
  kind: QuotaKind;
  name: string;
  periodDays: number | null | undefined;
  periodType: QuotaPeriodType | null | undefined;
  priority: number | null | undefined;
  rolloverPolicy: QuotaRolloverPolicyInput | null | undefined;
  studentId: string;
  totalClasses: number;
  validFrom: string | null | undefined;
  validUntil: string | null | undefined;
};

/** Input for updating an existing quota */
export type QuotaUpdateInput = {
  name: string | null | undefined;
  priority: number | null | undefined;
  status: QuotaStatus | null | undefined;
  validUntil: string | null | undefined;
};

export enum RateSource {
  Override = 'OVERRIDE',
  Recurring = 'RECURRING',
  Subject = 'SUBJECT',
  Teacher = 'TEACHER'
}

export type RecurringClassDayInput = {
  dayOfWeek: DayOfWeek;
  isActive: boolean;
  startTime: string;
};

/** Determines how the attendance data is aggregated. */
export enum ReportGroupingMode {
  Date = 'DATE',
  Student = 'STUDENT',
  Teacher = 'TEACHER'
}

export type RescheduleClassInput = {
  durationMinutes: number;
  scheduledEndAt: string;
  scheduledStartAt: string;
};

export enum RescheduleDateLabel {
  LeaveRequest = 'LEAVE_REQUEST',
  NewDate = 'NEW_DATE'
}

export type ResourceUploadInput = {
  displayName: string;
  fileId: string | number;
  filePath: string;
};

/** Input for responding to a complaint. */
export type RespondToComplaintInput = {
  body: string;
  complaintId: string;
};

/** Input for responding to a suggestion with an admin response. */
export type RespondToSuggestionInput = {
  adminResponse: string;
  suggestionId: string;
};

export type RevokePermissionGroupFromUserInput = {
  groupId: string;
  userId: string;
};

export enum SchedulingMode {
  NumberOfClasses = 'NUMBER_OF_CLASSES',
  OnDemand = 'ON_DEMAND',
  Quota = 'QUOTA'
}

/** Input for creating or updating a per-role session configuration. */
export type SessionConfigUpsertInput = {
  maxConcurrentSessions: number;
  roleName: string;
  ttlSeconds: number;
};

/** Filter and pagination options for the settings audit log query. */
export type SettingsAuditLogFilter = {
  action: string | null | undefined;
  actorUserId: string | null | undefined;
  endDate: string | null | undefined;
  entityType: string | null | undefined;
  limit: number | null | undefined;
  offset: number | null | undefined;
  startDate: string | null | undefined;
};

export type SiteContentUpsertInput = {
  body: string;
  contentType: string;
  isPublished: boolean;
  slug: string;
  title: string;
};

export type StaffAdminProfileUpdateInput = {
  phone: string | null | undefined;
  status: string | null | undefined;
};

export type StaffOwnProfileUpdateInput = {
  phone: string | null | undefined;
};

export type StudentFilterArgs = {
  birthDate: string | null | undefined;
  birthDateAfter: string | null | undefined;
  birthDateBefore: string | null | undefined;
  birthDateFrom: string | null | undefined;
  birthDateIsEmpty: boolean | null | undefined;
  birthDateIsNotEmpty: boolean | null | undefined;
  birthDateNot: string | null | undefined;
  birthDateOnOrAfter: string | null | undefined;
  birthDateOnOrBefore: string | null | undefined;
  birthDateTo: string | null | undefined;
  createdAt: string | null | undefined;
  createdAtAfter: string | null | undefined;
  createdAtBefore: string | null | undefined;
  createdAtFrom: string | null | undefined;
  createdAtIsEmpty: boolean | null | undefined;
  createdAtIsNotEmpty: boolean | null | undefined;
  createdAtNot: string | null | undefined;
  createdAtOnOrAfter: string | null | undefined;
  createdAtOnOrBefore: string | null | undefined;
  createdAtTo: string | null | undefined;
  gender: Gender | null | undefined;
  language: AppLanguage | null | undefined;
  name: string | null | undefined;
  nameEndsWith: string | null | undefined;
  nameEquals: string | null | undefined;
  nameIsEmpty: boolean | null | undefined;
  nameIsNotEmpty: boolean | null | undefined;
  nameNotContains: string | null | undefined;
  nameNotEquals: string | null | undefined;
  nameStartsWith: string | null | undefined;
  parentId: string | null | undefined;
  primaryTeacherId: string | null | undefined;
  status: StudentStatus | null | undefined;
};

/** Input for creating a new student profile under a parent */
export type StudentOnboardingInput = {
  /** Student avatar URL */
  avatarUrl: string | null | undefined;
  classesRemaining: number | null | undefined;
  classesTotal: number | null | undefined;
  dateOfBirth: string | null | undefined;
  /** User display currency */
  displayCurrency: CurrencyCode | null | undefined;
  /** Student login email (creates a users row when provided) */
  email: string | null | undefined;
  gender: Gender | null | undefined;
  language: AppLanguage | null | undefined;
  name: string;
  parentId: string | null | undefined;
  /** Student login password (required when email is provided) */
  password: string | null | undefined;
  /** Student phone (stored on users row) */
  phone: string | null | undefined;
  primaryTeacherId: string | null | undefined;
  status: StudentStatus | null | undefined;
  /** Student timezone (applied to the created user record) */
  timezone: IanaTimezone | null | undefined;
};

export type StudentProfileEditInput = {
  avatarUrl: string | null | undefined;
  dateOfBirth: string | null | undefined;
  displayCurrency: CurrencyCode | null | undefined;
  gender: Gender | null | undefined;
  language: AppLanguage | null | undefined;
  parentPhone: string | null | undefined;
  phone: string | null | undefined;
  studentId: string | number | null | undefined;
  timezone: string | null | undefined;
  timezoneOverride: string | null | undefined;
};

export enum StudentStatus {
  Deactivated = 'DEACTIVATED',
  OnLeave = 'ON_LEAVE',
  OnTrial = 'ON_TRIAL',
  Regular = 'REGULAR',
  Suspended = 'SUSPENDED'
}

export type StudentsOrderByClause = {
  column: StudentsOrderByColumn;
  order: OrderSortDirection | null | undefined;
};

export enum StudentsOrderByColumn {
  ClassesRemaining = 'CLASSES_REMAINING',
  ClassesTotal = 'CLASSES_TOTAL',
  CreatedAt = 'CREATED_AT',
  DateOfBirth = 'DATE_OF_BIRTH',
  Gender = 'GENDER',
  Id = 'ID',
  Name = 'NAME',
  ParentId = 'PARENT_ID',
  Status = 'STATUS',
  UpdatedAt = 'UPDATED_AT'
}

/** Input for submitting a new suggestion. */
export type SubmitSuggestionInput = {
  body: string;
  submitterName: string;
};

/** Filter and pagination options for the admin suggestion list. */
export type SuggestionFilter = {
  limit: number;
  offset: number;
  search: string | null | undefined;
  status: SuggestionStatus | null | undefined;
};

/** Status of a suggestion in the review pipeline. */
export enum SuggestionStatus {
  Duplicate = 'DUPLICATE',
  Pending = 'PENDING',
  Reviewed = 'REVIEWED'
}

export type SupportedCurrencyUpsertInput = {
  code: CurrencyCode;
  countryCode: CountryCode | null | undefined;
  decimals: number | null | undefined;
  sortOrder: number | null | undefined;
  symbol: string;
};

export type SupportedMobileWalletCreateInput = {
  countryCode: CountryCode | null | undefined;
  currencyCode: CurrencyCode | null | undefined;
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>>;
  phoneRegion: string | null | undefined;
  slug: string;
  supportedDirections: PaymentDirection | null | undefined;
};

export type SupportedMobileWalletUpdateInput = {
  countryCode: CountryCode | null | undefined;
  currencyCode: CurrencyCode | null | undefined;
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>> | null | undefined;
  phoneRegion: string | null | undefined;
  slug: string | null | undefined;
  supportedDirections: PaymentDirection | null | undefined;
};

export type SupportedOnlineAccountCreateInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  identifierKind: IdentifierKind;
  identifierLabel: Partial<Record<'ar' | 'en', string>> | null | undefined;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>>;
  slug: string;
  supportedDirections: PaymentDirection | null | undefined;
};

export type SupportedOnlineAccountUpdateInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  identifierKind: IdentifierKind | null | undefined;
  identifierLabel: Partial<Record<'ar' | 'en', string>> | null | undefined;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>> | null | undefined;
  slug: string | null | undefined;
  supportedDirections: PaymentDirection | null | undefined;
};

export type SupportedPaymentLinkCreateInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>>;
  slug: string;
  supportedDirections: PaymentDirection | null | undefined;
  urlAllowlist: Array<string>;
  urlExample: string | null | undefined;
};

export type SupportedPaymentLinkUpdateInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>> | null | undefined;
  slug: string | null | undefined;
  supportedDirections: PaymentDirection | null | undefined;
  urlAllowlist: Array<string> | null | undefined;
  urlExample: string | null | undefined;
};

export enum SystemSettingCategory {
  App = 'App',
  Auth = 'Auth',
  Billing = 'Billing',
  Cache = 'Cache',
  Communication = 'Communication',
  Email = 'Email',
  Fx = 'Fx',
  General = 'General',
  Meeting = 'Meeting',
  Push = 'Push',
  Redis = 'Redis',
  Scheduling = 'Scheduling',
  Security = 'Security',
  Sms = 'Sms',
  Storage = 'Storage',
  System = 'System'
}

export enum SystemSettingDataType {
  Boolean = 'Boolean',
  Integer = 'Integer',
  Json = 'Json',
  String = 'String'
}

export type SystemSettingUpsertInput = {
  category: SystemSettingCategory | null | undefined;
  dataType: SystemSettingDataType | null | undefined;
  description: string | null | undefined;
  key: string;
  value: string;
};

export enum TeacherDueStatus {
  Paid = 'PAID',
  Pending = 'PENDING'
}

/** Input for creating a new teacher account with comprehensive profile */
export type TeacherOnboardingInput = {
  /** Teacher address */
  address: string | null | undefined;
  /** Teacher avatar URL */
  avatarUrl: string | null | undefined;
  /** Teacher country code */
  countryCode: CountryCode | null | undefined;
  /** Teacher date of birth (ISO date string) */
  dateOfBirth: string | null | undefined;
  displayCurrency: CurrencyCode | null | undefined;
  /** Teacher email address */
  email: string;
  /** Teacher gender */
  gender: Gender | null | undefined;
  /** Teacher hourly rate */
  hourlyRate: string | null | undefined;
  /** Optional initial payout payment method for the teacher */
  initialPayoutMethod: UserPaymentMethodInitialInput | null | undefined;
  /** Teacher full name */
  name: string;
  /** Teacher national ID (encrypted) */
  nationalId: string | null | undefined;
  /** Teacher nationality (country code) */
  nationality: string | null | undefined;
  /** Teacher password */
  password: string;
  /** Teacher phone number */
  phone: string | null | undefined;
  /** Teacher qualifications */
  qualifications: string | null | undefined;
  /** Currency for hourly rate */
  rateCurrency: CurrencyCode | null | undefined;
  timezone: IanaTimezone;
};

export type TeacherOwnProfileUpdateInput = {
  address: string | null | undefined;
  countryCode: string | null | undefined;
  dateOfBirth: string | null | undefined;
  gender: Gender | null | undefined;
  nationalId: string | null | undefined;
  nationality: string | null | undefined;
  phone: string | null | undefined;
  qualifications: string | null | undefined;
  timezone: IanaTimezone | null | undefined;
};

export type TeacherProfileUpdateInput = {
  address: string | null | undefined;
  countryCode: string | null | undefined;
  dateOfBirth: string | null | undefined;
  gender: Gender | null | undefined;
  hourlyRate: string | null | undefined;
  nationalId: string | null | undefined;
  nationality: string | null | undefined;
  phone: string | null | undefined;
  qualifications: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
  status: AccountStatus | null | undefined;
  timezone: IanaTimezone | null | undefined;
};

export enum TeacherProgressFeedEventKind {
  Activated = 'ACTIVATED',
  AutoMissed = 'AUTO_MISSED',
  Completed = 'COMPLETED',
  Leave = 'LEAVE',
  MarkedAbsent = 'MARKED_ABSENT',
  Other = 'OTHER',
  Started = 'STARTED'
}

export type TestMeetingConnectionInput = {
  mode: MeetingConnectionTestMode;
  providerSlug: MeetingIntegrationProviderSlug;
};

export type UpdateManagerProfileInput = {
  email: string | null | undefined;
  hourlyRate: string | null | undefined;
  name: string | null | undefined;
  phone: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
  status: AccountStatus | null | undefined;
};

export type UpdateOwnProfileInput = {
  core: CoreUserProfileFieldsInput | null | undefined;
  parent: ParentOwnProfileUpdateInput | null | undefined;
  staff: StaffOwnProfileUpdateInput | null | undefined;
  teacher: TeacherOwnProfileUpdateInput | null | undefined;
};

export type UpdatePermissionGroupInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  groupId: string;
  name: Partial<Record<'ar' | 'en', string>> | null | undefined;
  permissionIds: Array<string> | null | undefined;
};

export type UpdateRecurringClassRateInput = {
  hourlyRate: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
  recurringScheduleId: string;
};

export type UpdateTeacherNoteInput = {
  body: string | null | undefined;
  expiresAt: string | null | undefined;
  isPublished: boolean | null | undefined;
  priority: number | null | undefined;
  startsAt: string | null | undefined;
  title: string | null | undefined;
};

export type UpdateUserProfileInput = {
  core: CoreUserProfileFieldsInput | null | undefined;
  parent: ParentAdminProfileUpdateInput | null | undefined;
  staff: StaffAdminProfileUpdateInput | null | undefined;
  teacher: TeacherProfileUpdateInput | null | undefined;
};

export type UploadPreparationInput = {
  contentHash: string;
  contentType: string;
  fileSize: number;
  path: string;
};

export enum UploadType {
  SignedUrl = 'SIGNED_URL',
  VercelBlobClient = 'VERCEL_BLOB_CLIENT'
}

export type UserMeetingConfigCreateInput = {
  details: MeetingConfigDetailsInput;
  isDefault: boolean;
  label: string | null | undefined;
  password: string | null | undefined;
  providerId: string;
  userId: string;
};

export type UserMeetingConfigUpdateInput = {
  details: MeetingConfigDetailsInput | null | undefined;
  forceRegenerate: boolean | null | undefined;
  isDefault: boolean | null | undefined;
  label: string | null | undefined;
  password: string | null | undefined;
  providerId: string | null | undefined;
};

export type UserOverrideInput = {
  permissionId: string;
  state: OverrideState;
};

export type UserPaymentMethodCreateInput = {
  details: PaymentMethodDetailsInput;
  direction: PaymentDirection;
  isDefault: boolean | null | undefined;
  label: string | null | undefined;
  type: PaymentMethodType;
  userId: string;
};

export type UserPaymentMethodInitialInput = {
  details: PaymentMethodDetailsInput;
  direction: PaymentDirection;
  isDefault: boolean | null | undefined;
  label: string | null | undefined;
  type: PaymentMethodType;
};

export type UserPaymentMethodUpdateInput = {
  details: PaymentMethodDetailsInput | null | undefined;
  direction: PaymentDirection | null | undefined;
  isDefault: boolean | null | undefined;
  label: string | null | undefined;
};

export type WhatsappAccountCreateInput = {
  displayName: Partial<Record<'ar' | 'en', string>> | null | undefined;
  /** Display phone number (max 32 chars) */
  displayPhoneNumber: string | null | undefined;
  isActive: boolean | null | undefined;
  /** Phone number ID (max 64 chars) */
  phoneNumberId: string;
  portfolioMessagingLimitTier: WhatsappLimitTier | null | undefined;
  qualityRating: WhatsappQualityRating | null | undefined;
  throughputLevel: string | null | undefined;
  /** WhatsApp Business Account ID (max 64 chars) */
  wabaId: string;
};

export type WhatsappAccountUpdateInput = {
  displayName: Partial<Record<'ar' | 'en', string>> | null | undefined;
  /** Display phone number (max 32 chars) */
  displayPhoneNumber: string | null | undefined;
  isActive: boolean | null | undefined;
  portfolioMessagingLimitTier: WhatsappLimitTier | null | undefined;
  qualityRating: WhatsappQualityRating | null | undefined;
  throughputLevel: string | null | undefined;
};

export enum WhatsappLimitTier {
  Tier_1K = 'TIER_1K',
  Tier_10K = 'TIER_10K',
  Tier_50 = 'TIER_50',
  Tier_100K = 'TIER_100K',
  Tier_250 = 'TIER_250',
  TierNotSet = 'TIER_NOT_SET',
  TierUnlimited = 'TIER_UNLIMITED',
  Untiered = 'UNTIERED'
}

export enum WhatsappQualityRating {
  Green = 'GREEN',
  Red = 'RED',
  Unknown = 'UNKNOWN',
  Yellow = 'YELLOW'
}

export enum WhatsappTemplateCategory {
  Authentication = 'AUTHENTICATION',
  Marketing = 'MARKETING',
  Utility = 'UTILITY'
}

export enum WhatsappTemplateStatus {
  Approved = 'APPROVED',
  Disabled = 'DISABLED',
  Paused = 'PAUSED',
  Pending = 'PENDING',
  PendingDeletion = 'PENDING_DELETION',
  Rejected = 'REJECTED'
}

export type MeQuery_me = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type MeQuery = { me: MeQuery_me | null };


export type MeQueryVariables = Exact<{ [key: string]: never; }>;

export type UserQuery_user = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type UserQuery = { user: UserQuery_user | null };


export type UserQueryVariables = Exact<{
  id: string;
}>;

export type UsersQuery_users = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type UsersQuery = { users: Array<UsersQuery_users> | null };


export type UsersQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
  offset: number | null | undefined;
}>;

export type LoginMutation_login_user = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type LoginMutation_login = { token: string | null, user: LoginMutation_login_user | null };

export type LoginMutation = { login: LoginMutation_login | null };


export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type DemoLoginMutation_demoLogin_user = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type DemoLoginMutation_demoLogin = { token: string | null, user: DemoLoginMutation_demoLogin_user | null };

export type DemoLoginMutation = { demoLogin: DemoLoginMutation_demoLogin | null };


export type DemoLoginMutationVariables = Exact<{
  input: DemoLoginInput;
}>;

export type LogoutMutation = { logout: boolean | null };


export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;

export type RefreshTokenMutation_refreshToken_user = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type RefreshTokenMutation_refreshToken = { token: string | null, user: RefreshTokenMutation_refreshToken_user | null };

export type RefreshTokenMutation = { refreshToken: RefreshTokenMutation_refreshToken | null };


export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;

export type ImpersonationStatusQuery_impersonationStatus_targetUser = { id: string | null, name: string | null, email: string | null };

export type ImpersonationStatusQuery_impersonationStatus_actorUser = { id: string | null, name: string | null, email: string | null };

export type ImpersonationStatusQuery_impersonationStatus = { id: string | null, isActive: boolean | null, startedAt: string | null, expiresAt: string | null, reason: string | null, targetUser: ImpersonationStatusQuery_impersonationStatus_targetUser | null, actorUser: ImpersonationStatusQuery_impersonationStatus_actorUser | null };

export type ImpersonationStatusQuery = { impersonationStatus: ImpersonationStatusQuery_impersonationStatus | null };


export type ImpersonationStatusQueryVariables = Exact<{ [key: string]: never; }>;

export type StartImpersonationMutation_startImpersonation_targetUser = { id: string | null, name: string | null, email: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, phone: string | null, status: AccountStatus | null, displayCurrency: CurrencyCode | null };

export type StartImpersonationMutation_startImpersonation = { id: string | null, token: string | null, expiresAt: string | null, impersonationSessionId: string | null, targetUser: StartImpersonationMutation_startImpersonation_targetUser | null };

export type StartImpersonationMutation = { startImpersonation: StartImpersonationMutation_startImpersonation | null };


export type StartImpersonationMutationVariables = Exact<{
  targetUserId: string;
  reason: string | null | undefined;
}>;

export type EndImpersonationMutation_endImpersonation = { token: string | null };

export type EndImpersonationMutation = { endImpersonation: EndImpersonationMutation_endImpersonation | null };


export type EndImpersonationMutationVariables = Exact<{ [key: string]: never; }>;

export type PermissionGroupSimulationStatusQuery_permissionGroupSimulationStatus = { isActive: boolean | null, groupSlug: string | null, groupName: string | null, startedAt: string | null, expiresAt: string | null };

export type PermissionGroupSimulationStatusQuery = { permissionGroupSimulationStatus: PermissionGroupSimulationStatusQuery_permissionGroupSimulationStatus | null };


export type PermissionGroupSimulationStatusQueryVariables = Exact<{ [key: string]: never; }>;

export type SimulatablePermissionGroupsQuery_simulatablePermissionGroups = { id: string | null, slug: string | null, name: string | null, description: string | null };

export type SimulatablePermissionGroupsQuery = { simulatablePermissionGroups: Array<SimulatablePermissionGroupsQuery_simulatablePermissionGroups> | null };


export type SimulatablePermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;

export type StartPermissionGroupSimulationMutation_startPermissionGroupSimulation = { token: string | null, expiresAt: string | null, groupSlug: string | null };

export type StartPermissionGroupSimulationMutation = { startPermissionGroupSimulation: StartPermissionGroupSimulationMutation_startPermissionGroupSimulation | null };


export type StartPermissionGroupSimulationMutationVariables = Exact<{
  groupSlug: string;
}>;

export type EndPermissionGroupSimulationMutation_endPermissionGroupSimulation = { token: string | null };

export type EndPermissionGroupSimulationMutation = { endPermissionGroupSimulation: EndPermissionGroupSimulationMutation_endPermissionGroupSimulation | null };


export type EndPermissionGroupSimulationMutationVariables = Exact<{ [key: string]: never; }>;

export type ChangePasswordMutation = { changePassword: boolean | null };


export type ChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInput;
}>;

export type AdminResetPasswordMutation_adminResetPassword = { success: boolean | null, userId: string | null, message: string | null };

export type AdminResetPasswordMutation = { adminResetPassword: AdminResetPasswordMutation_adminResetPassword | null };


export type AdminResetPasswordMutationVariables = Exact<{
  input: AdminResetPasswordInput;
}>;

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_overdueAmountsByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_overdueAmountsByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_overdueAmountsByCurrency_displayAmount | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_items_amountsByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_items_amountsByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_items_amountsByCurrency_displayAmount | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_items = { id: string | null, userId: string | null, userName: string | null, userEmail: string | null, totalUnpaidAmount: string | null, currency: CurrencyCode | null, overdueCount: number | null, oldestDueDate: string | null, amountsByCurrency: Array<UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_items_amountsByCurrency> | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert = { id: string | null, totalOverdueInvoices: number | null, totalOverdueAmount: string | null, overdueAmountsByCurrency: Array<UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_overdueAmountsByCurrency> | null, items: Array<UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_items> | null };

export type UnpaidInvoicesAlertQuery = { unpaidInvoicesAlert: UnpaidInvoicesAlertQuery_unpaidInvoicesAlert | null };


export type UnpaidInvoicesAlertQueryVariables = Exact<{ [key: string]: never; }>;

export type CreateManualInvoiceMutation_createManualInvoice_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type CreateManualInvoiceMutation_createManualInvoice = { id: string | null, parentId: string | null, studentId: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, version: number | null, createdAt: string | null, displayAmount: CreateManualInvoiceMutation_createManualInvoice_displayAmount | null };

export type CreateManualInvoiceMutation = { createManualInvoice: CreateManualInvoiceMutation_createManualInvoice | null };


export type CreateManualInvoiceMutationVariables = Exact<{
  parentId: string;
  studentId: string | null | undefined;
  amount: string;
  currency: CurrencyCode;
  invoiceType: InvoiceType;
  issueDate: string;
  dueDate: string;
  exchangeRateSnapshot: string | null | undefined;
  exchangeRateSource: string | null | undefined;
  billingMonths: Array<BillingMonthInput> | BillingMonthInput | null | undefined;
  sendEmail: boolean | null | undefined;
}>;

export type MarkInvoicePaidMutation_markInvoicePaid = { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type MarkInvoicePaidMutation = { markInvoicePaid: MarkInvoicePaidMutation_markInvoicePaid | null };


export type MarkInvoicePaidMutationVariables = Exact<{
  invoiceId: string;
  proofFileId: string | number;
  expectedVersion: number | null | undefined;
}>;

export type SubmitPaymentProofMutation_submitPaymentProof = { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type SubmitPaymentProofMutation = { submitPaymentProof: SubmitPaymentProofMutation_submitPaymentProof | null };


export type SubmitPaymentProofMutationVariables = Exact<{
  invoiceId: string;
  proofFileId: string | number;
  expectedVersion: number | null | undefined;
}>;

export type ApprovePaymentProofMutation_approvePaymentProof = { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type ApprovePaymentProofMutation = { approvePaymentProof: ApprovePaymentProofMutation_approvePaymentProof | null };


export type ApprovePaymentProofMutationVariables = Exact<{
  invoiceId: string;
  expectedVersion: number | null | undefined;
}>;

export type RejectPaymentProofMutation_rejectPaymentProof = { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type RejectPaymentProofMutation = { rejectPaymentProof: RejectPaymentProofMutation_rejectPaymentProof | null };


export type RejectPaymentProofMutationVariables = Exact<{
  invoiceId: string;
  rejectionReason: string | null | undefined;
  expectedVersion: number | null | undefined;
}>;

export type InvoicePaymentSubmissionQuery_invoicePaymentSubmission = { id: string | null, invoiceId: string | null, fileId: string | null, filePath: string | null, mimeType: string | null, status: InvoicePaymentSubmissionStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null };

export type InvoicePaymentSubmissionQuery = { invoicePaymentSubmission: InvoicePaymentSubmissionQuery_invoicePaymentSubmission | null };


export type InvoicePaymentSubmissionQueryVariables = Exact<{
  invoiceId: string;
}>;

export type DeleteInvoiceMutation_deleteInvoice = { id: string | null, parentId: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type DeleteInvoiceMutation = { deleteInvoice: DeleteInvoiceMutation_deleteInvoice | null };


export type DeleteInvoiceMutationVariables = Exact<{
  invoiceId: string;
}>;

export type SendPaymentReminderMutation_sendPaymentReminder = { id: string | null, success: boolean | null };

export type SendPaymentReminderMutation = { sendPaymentReminder: SendPaymentReminderMutation_sendPaymentReminder | null };


export type SendPaymentReminderMutationVariables = Exact<{
  studentId: string;
}>;

export type InvoicePaymentsQuery_invoicePayments_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_details = { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null };

export type InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_catalog = { id: string | null, catalogId: string | null, catalogSlug: string | null, catalogName: Partial<Record<'ar' | 'en', string>> | null };

export type InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot = { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_details | null, catalog: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_catalog | null };

export type InvoicePaymentsQuery_invoicePayments = { id: string | null, invoiceId: string | null, amount: string | null, currency: CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: PaymentMethodType | null, transactionId: string | null, createdAt: string | null, displayAmount: InvoicePaymentsQuery_invoicePayments_displayAmount | null, paymentMethodSnapshot: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot | null };

export type InvoicePaymentsQuery = { invoicePayments: Array<InvoicePaymentsQuery_invoicePayments> | null };


export type InvoicePaymentsQueryVariables = Exact<{
  invoiceId: string | number;
}>;

export type RecordPaymentMutation_recordPayment_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type RecordPaymentMutation_recordPayment_paymentMethodSnapshot = { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_details | null, catalog: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_catalog | null };

export type RecordPaymentMutation_recordPayment = { id: string | null, invoiceId: string | null, amount: string | null, currency: CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: PaymentMethodType | null, displayAmount: RecordPaymentMutation_recordPayment_displayAmount | null, paymentMethodSnapshot: RecordPaymentMutation_recordPayment_paymentMethodSnapshot | null };

export type RecordPaymentMutation = { recordPayment: RecordPaymentMutation_recordPayment | null };


export type RecordPaymentMutationVariables = Exact<{
  invoiceId: string | number;
  amount: string;
  currency: CurrencyCode;
  userPaymentMethodId: string | number;
  transactionId: string | null | undefined;
}>;

export type CreateTeacherPaymentMutation_createTeacherPayment_paymentMethodSnapshot = { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_details | null, catalog: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_catalog | null };

export type CreateTeacherPaymentMutation_createTeacherPayment = { id: string | null, teacherId: string | null, amount: string | null, currency: CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: PaymentMethodType | null, isTestPayment: boolean | null, paymentMethodSnapshot: CreateTeacherPaymentMutation_createTeacherPayment_paymentMethodSnapshot | null };

export type CreateTeacherPaymentMutation = { createTeacherPayment: CreateTeacherPaymentMutation_createTeacherPayment | null };


export type CreateTeacherPaymentMutationVariables = Exact<{
  teacherId: string | number;
  amount: string;
  currency: CurrencyCode;
  userPaymentMethodId: string | number;
  paymentDate: string | null | undefined;
  isTestPayment: boolean | null | undefined;
}>;

export type StudentCreditBalanceQuery_studentCreditBalance = { id: string | null, studentId: string | null, classesRemaining: number | null, classesTotal: number | null };

export type StudentCreditBalanceQuery = { studentCreditBalance: StudentCreditBalanceQuery_studentCreditBalance | null };


export type StudentCreditBalanceQueryVariables = Exact<{
  studentId: string | number;
}>;

export type StudentCreditTransactionsQuery_studentCreditTransactions = { id: string | null, studentId: string | null, changeAmount: number | null, reason: CreditReason | null, sourcePaymentId: string | null, classInstanceId: string | null, notes: string | null, creditedByUserId: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentCreditTransactionsQuery = { studentCreditTransactions: Array<StudentCreditTransactionsQuery_studentCreditTransactions> | null };


export type StudentCreditTransactionsQueryVariables = Exact<{
  studentId: string | number;
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type RecordCreditPurchaseMutation_recordCreditPurchase = { id: string | null, studentId: string | null, changeAmount: number | null, reason: CreditReason | null, sourcePaymentId: string | null, classInstanceId: string | null, notes: string | null, creditedByUserId: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type RecordCreditPurchaseMutation = { recordCreditPurchase: RecordCreditPurchaseMutation_recordCreditPurchase | null };


export type RecordCreditPurchaseMutationVariables = Exact<{
  studentId: string | number;
  hours: number;
  notes: string | null | undefined;
}>;

export type SupportedCurrencyFieldsFragment = { id: string | null, code: CurrencyCode | null, symbol: string | null, countryCode: CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null };

export type SupportedCurrenciesQuery_supportedCurrencies = { id: string | null, code: CurrencyCode | null, symbol: string | null, countryCode: CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null };

export type SupportedCurrenciesQuery = { supportedCurrencies: Array<SupportedCurrenciesQuery_supportedCurrencies> | null };


export type SupportedCurrenciesQueryVariables = Exact<{
  activeOnly: boolean | null | undefined;
}>;

export type ActivateSupportedCurrencyMutation_activateSupportedCurrency = { id: string | null, code: CurrencyCode | null, symbol: string | null, countryCode: CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null };

export type ActivateSupportedCurrencyMutation = { activateSupportedCurrency: ActivateSupportedCurrencyMutation_activateSupportedCurrency | null };


export type ActivateSupportedCurrencyMutationVariables = Exact<{
  input: SupportedCurrencyUpsertInput;
}>;

export type DeactivateSupportedCurrencyMutation = { deactivateSupportedCurrency: boolean | null };


export type DeactivateSupportedCurrencyMutationVariables = Exact<{
  code: CurrencyCode;
}>;

export type LatestExchangeRatesQuery_latestExchangeRates = { id: string | null, fromCurrency: string | null, toCurrency: string | null, rate: string | null, source: string | null, effectiveDate: string | null };

export type LatestExchangeRatesQuery = { latestExchangeRates: Array<LatestExchangeRatesQuery_latestExchangeRates> | null };


export type LatestExchangeRatesQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type ExchangeRateHistoryQuery_exchangeRateHistory_rows = { id: string | null, fromCurrency: CurrencyCode | null, toCurrency: CurrencyCode | null, rate: string | null, source: string | null, effectiveDate: string | null };

export type ExchangeRateHistoryQuery_exchangeRateHistory_pageInfo = { count: number, currentPage: number, firstItem: number | null, lastItem: number | null, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type ExchangeRateHistoryQuery_exchangeRateHistory = { id: string | null, totalCount: number | null, rows: Array<ExchangeRateHistoryQuery_exchangeRateHistory_rows> | null, pageInfo: ExchangeRateHistoryQuery_exchangeRateHistory_pageInfo | null };

export type ExchangeRateHistoryQuery = { exchangeRateHistory: ExchangeRateHistoryQuery_exchangeRateHistory | null };


export type ExchangeRateHistoryQueryVariables = Exact<{
  from: CurrencyCode;
  to: CurrencyCode;
  paginationArgs: PaginationArgs | null | undefined;
  maxDays: number | null | undefined;
}>;

export type LatestFxSyncRunQuery_latestFxSyncRun = { id: string | null, provider: FxProvider | null, status: FxSyncStatus | null, pairsWritten: string | null, pairsFailed: string | null, errorMessage: string | null, triggerType: string | null, triggeredByUserId: string | null, startedAt: string | null, finishedAt: string | null };

export type LatestFxSyncRunQuery = { latestFxSyncRun: LatestFxSyncRunQuery_latestFxSyncRun | null };


export type LatestFxSyncRunQueryVariables = Exact<{ [key: string]: never; }>;

export type RefreshExchangeRatesMutation_refreshExchangeRates = { id: string | null, success: boolean | null, pairsWritten: number | null, pairsFailed: number | null, syncRunId: string | null, errorMessage: string | null };

export type RefreshExchangeRatesMutation = { refreshExchangeRates: RefreshExchangeRatesMutation_refreshExchangeRates | null };


export type RefreshExchangeRatesMutationVariables = Exact<{
  force: boolean | null | undefined;
}>;

export type FxSyncHealthQuery_fxSyncHealth = { id: string | null, isStale: boolean | null, status: FxSyncStatus | null, finishedAt: string | null };

export type FxSyncHealthQuery = { fxSyncHealth: FxSyncHealthQuery_fxSyncHealth | null };


export type FxSyncHealthQueryVariables = Exact<{ [key: string]: never; }>;

export type FxProviderConfigQuery_fxProviderConfig = { id: string | null, activeProvider: FxProvider | null, source: FxProviderConfigSource | null, updatedAt: string | null, updatedByUserId: string | null, updatedByName: string | null };

export type FxProviderConfigQuery = { fxProviderConfig: FxProviderConfigQuery_fxProviderConfig | null };


export type FxProviderConfigQueryVariables = Exact<{ [key: string]: never; }>;

export type UpdateFxProviderMutation_updateFxProvider = { id: string | null, activeProvider: FxProvider | null, source: FxProviderConfigSource | null, updatedAt: string | null, updatedByUserId: string | null, updatedByName: string | null };

export type UpdateFxProviderMutation = { updateFxProvider: UpdateFxProviderMutation_updateFxProvider | null };


export type UpdateFxProviderMutationVariables = Exact<{
  provider: FxProvider;
}>;

export type UpsertManualExchangeRateMutation_upsertManualExchangeRate_rate = { id: string | null, fromCurrency: string | null, toCurrency: string | null, rate: string | null, source: string | null, effectiveDate: string | null };

export type UpsertManualExchangeRateMutation_upsertManualExchangeRate = { id: string | null, rate: UpsertManualExchangeRateMutation_upsertManualExchangeRate_rate | null };

export type UpsertManualExchangeRateMutation = { upsertManualExchangeRate: UpsertManualExchangeRateMutation_upsertManualExchangeRate | null };


export type UpsertManualExchangeRateMutationVariables = Exact<{
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: string;
  effectiveDate: string | null | undefined;
}>;

export type CurrencyHedgesQuery_currencyHedges = { id: string | null, currency: CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null };

export type CurrencyHedgesQuery = { currencyHedges: Array<CurrencyHedgesQuery_currencyHedges> | null };


export type CurrencyHedgesQueryVariables = Exact<{ [key: string]: never; }>;

export type CreateCurrencyHedgeMutation_createCurrencyHedge = { id: string | null, currency: CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null };

export type CreateCurrencyHedgeMutation = { createCurrencyHedge: CreateCurrencyHedgeMutation_createCurrencyHedge | null };


export type CreateCurrencyHedgeMutationVariables = Exact<{
  currency: CurrencyCode;
  amount: string;
  hedgeType: string;
  notes: string | null | undefined;
}>;

export type UpdateCurrencyHedgeMutation_updateCurrencyHedge = { id: string | null, currency: CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null };

export type UpdateCurrencyHedgeMutation = { updateCurrencyHedge: UpdateCurrencyHedgeMutation_updateCurrencyHedge | null };


export type UpdateCurrencyHedgeMutationVariables = Exact<{
  id: string;
  currency: CurrencyCode | null | undefined;
  amount: string | null | undefined;
  hedgeType: string | null | undefined;
  notes: string | null | undefined;
}>;

export type DeleteCurrencyHedgeMutation = { deleteCurrencyHedge: boolean | null };


export type DeleteCurrencyHedgeMutationVariables = Exact<{
  id: string;
}>;

export type PaymentMethodDetailsFieldsFragment = { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null };

export type PaymentMethodTransactionSnapshotFieldsFragment = { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_details | null, catalog: InvoicePaymentsQuery_invoicePayments_paymentMethodSnapshot_catalog | null };

export type UserPaymentMethodFieldsFragment_details = { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null };

export type UserPaymentMethodFieldsFragment = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type PaymentMethodDefaultsFieldsFragment_payinDefault = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type PaymentMethodDefaultsFieldsFragment_payoutDefault = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type PaymentMethodDefaultsFieldsFragment = { payinDefault: PaymentMethodDefaultsFieldsFragment_payinDefault | null, payoutDefault: PaymentMethodDefaultsFieldsFragment_payoutDefault | null };

export type SupportedMobileWalletFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedPaymentLinkFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedOnlineAccountFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UserPaymentMethodsQuery_userPaymentMethods = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type UserPaymentMethodsQuery = { userPaymentMethods: Array<UserPaymentMethodsQuery_userPaymentMethods> | null };


export type UserPaymentMethodsQueryVariables = Exact<{
  userId: string | number;
  direction: PaymentDirection | null | undefined;
}>;

export type UserPaymentMethodQuery_userPaymentMethod = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type UserPaymentMethodQuery = { userPaymentMethod: UserPaymentMethodQuery_userPaymentMethod | null };


export type UserPaymentMethodQueryVariables = Exact<{
  id: string | number;
}>;

export type SupportedMobileWalletsQuery_supportedMobileWallets = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedMobileWalletsQuery = { supportedMobileWallets: Array<SupportedMobileWalletsQuery_supportedMobileWallets> | null };


export type SupportedMobileWalletsQueryVariables = Exact<{
  countryCode: CountryCode | null | undefined;
  direction: PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;

export type SupportedPaymentLinksQuery_supportedPaymentLinks = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedPaymentLinksQuery = { supportedPaymentLinks: Array<SupportedPaymentLinksQuery_supportedPaymentLinks> | null };


export type SupportedPaymentLinksQueryVariables = Exact<{
  direction: PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;

export type SupportedOnlineAccountsQuery_supportedOnlineAccounts = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedOnlineAccountsQuery = { supportedOnlineAccounts: Array<SupportedOnlineAccountsQuery_supportedOnlineAccounts> | null };


export type SupportedOnlineAccountsQueryVariables = Exact<{
  direction: PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;

export type CreateUserPaymentMethodMutation_createUserPaymentMethod = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type CreateUserPaymentMethodMutation = { createUserPaymentMethod: CreateUserPaymentMethodMutation_createUserPaymentMethod | null };


export type CreateUserPaymentMethodMutationVariables = Exact<{
  input: UserPaymentMethodCreateInput;
}>;

export type UpdateUserPaymentMethodMutation_updateUserPaymentMethod = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type UpdateUserPaymentMethodMutation = { updateUserPaymentMethod: UpdateUserPaymentMethodMutation_updateUserPaymentMethod | null };


export type UpdateUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
  input: UserPaymentMethodUpdateInput;
}>;

export type DeleteUserPaymentMethodMutation = { deleteUserPaymentMethod: boolean | null };


export type DeleteUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;

export type SetDefaultUserPaymentMethodMutation_setDefaultUserPaymentMethod = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type SetDefaultUserPaymentMethodMutation = { setDefaultUserPaymentMethod: SetDefaultUserPaymentMethodMutation_setDefaultUserPaymentMethod | null };


export type SetDefaultUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;

export type VerifyBankTransferPaymentMethodMutation_verifyBankTransferPaymentMethod = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type VerifyBankTransferPaymentMethodMutation = { verifyBankTransferPaymentMethod: VerifyBankTransferPaymentMethodMutation_verifyBankTransferPaymentMethod | null };


export type VerifyBankTransferPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;

export type CreateSupportedMobileWalletMutation_createSupportedMobileWallet = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type CreateSupportedMobileWalletMutation = { createSupportedMobileWallet: CreateSupportedMobileWalletMutation_createSupportedMobileWallet | null };


export type CreateSupportedMobileWalletMutationVariables = Exact<{
  input: SupportedMobileWalletCreateInput;
}>;

export type UpdateSupportedMobileWalletMutation_updateSupportedMobileWallet = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSupportedMobileWalletMutation = { updateSupportedMobileWallet: UpdateSupportedMobileWalletMutation_updateSupportedMobileWallet | null };


export type UpdateSupportedMobileWalletMutationVariables = Exact<{
  id: string | number;
  input: SupportedMobileWalletUpdateInput;
}>;

export type DeactivateSupportedMobileWalletMutation_deactivateSupportedMobileWallet = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type DeactivateSupportedMobileWalletMutation = { deactivateSupportedMobileWallet: DeactivateSupportedMobileWalletMutation_deactivateSupportedMobileWallet | null };


export type DeactivateSupportedMobileWalletMutationVariables = Exact<{
  id: string | number;
}>;

export type CreateSupportedPaymentLinkMutation_createSupportedPaymentLink = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type CreateSupportedPaymentLinkMutation = { createSupportedPaymentLink: CreateSupportedPaymentLinkMutation_createSupportedPaymentLink | null };


export type CreateSupportedPaymentLinkMutationVariables = Exact<{
  input: SupportedPaymentLinkCreateInput;
}>;

export type UpdateSupportedPaymentLinkMutation_updateSupportedPaymentLink = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSupportedPaymentLinkMutation = { updateSupportedPaymentLink: UpdateSupportedPaymentLinkMutation_updateSupportedPaymentLink | null };


export type UpdateSupportedPaymentLinkMutationVariables = Exact<{
  id: string | number;
  input: SupportedPaymentLinkUpdateInput;
}>;

export type DeactivateSupportedPaymentLinkMutation_deactivateSupportedPaymentLink = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type DeactivateSupportedPaymentLinkMutation = { deactivateSupportedPaymentLink: DeactivateSupportedPaymentLinkMutation_deactivateSupportedPaymentLink | null };


export type DeactivateSupportedPaymentLinkMutationVariables = Exact<{
  id: string | number;
}>;

export type CreateSupportedOnlineAccountMutation_createSupportedOnlineAccount = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type CreateSupportedOnlineAccountMutation = { createSupportedOnlineAccount: CreateSupportedOnlineAccountMutation_createSupportedOnlineAccount | null };


export type CreateSupportedOnlineAccountMutationVariables = Exact<{
  input: SupportedOnlineAccountCreateInput;
}>;

export type UpdateSupportedOnlineAccountMutation_updateSupportedOnlineAccount = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSupportedOnlineAccountMutation = { updateSupportedOnlineAccount: UpdateSupportedOnlineAccountMutation_updateSupportedOnlineAccount | null };


export type UpdateSupportedOnlineAccountMutationVariables = Exact<{
  id: string | number;
  input: SupportedOnlineAccountUpdateInput;
}>;

export type DeactivateSupportedOnlineAccountMutation_deactivateSupportedOnlineAccount = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type DeactivateSupportedOnlineAccountMutation = { deactivateSupportedOnlineAccount: DeactivateSupportedOnlineAccountMutation_deactivateSupportedOnlineAccount | null };


export type DeactivateSupportedOnlineAccountMutationVariables = Exact<{
  id: string | number;
}>;

export type QuotaFieldsFragment = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: QuotaStatus | null, periodType: QuotaPeriodType | null, periodDays: number | null, priority: number | null, createdAt: string | null, updatedAt: string | null };

export type QuotaQuery_quota = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: QuotaStatus | null, periodType: QuotaPeriodType | null, periodDays: number | null, priority: number | null, createdAt: string | null, updatedAt: string | null };

export type QuotaQuery = { quota: QuotaQuery_quota | null };


export type QuotaQueryVariables = Exact<{
  id: string | number;
}>;

export type QuotasQuery_quotas_rows = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: QuotaStatus | null, periodType: QuotaPeriodType | null, periodDays: number | null, priority: number | null, createdAt: string | null, updatedAt: string | null };

export type QuotasQuery_quotas = { totalCount: number | null, rows: Array<QuotasQuery_quotas_rows> | null };

export type QuotasQuery = { quotas: QuotasQuery_quotas | null };


export type QuotasQueryVariables = Exact<{
  filter: QuotaPaginatedFilterInput | null | undefined;
  pagination: PaginationArgs | null | undefined;
}>;

export type QuotaLedgerQuery_quotaLedger_rows = { id: string | null, quotaId: string | null, studentId: string | null, recurringScheduleId: string | null, classInstanceId: string | null, delta: number | null, reason: QuotaLedgerReason | null, reasonNote: string | null, actorUserId: string | null, createdAt: string | null };

export type QuotaLedgerQuery_quotaLedger = { totalCount: number | null, rows: Array<QuotaLedgerQuery_quotaLedger_rows> | null };

export type QuotaLedgerQuery = { quotaLedger: QuotaLedgerQuery_quotaLedger | null };


export type QuotaLedgerQueryVariables = Exact<{
  quotaId: string | number;
  pagination: PaginationArgs | null | undefined;
}>;

export type CreateQuotaMutation_createQuota = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: QuotaStatus | null, periodType: QuotaPeriodType | null, periodDays: number | null, priority: number | null, createdAt: string | null, updatedAt: string | null };

export type CreateQuotaMutation = { createQuota: CreateQuotaMutation_createQuota | null };


export type CreateQuotaMutationVariables = Exact<{
  input: QuotaSubmitInput;
}>;

export type UpdateQuotaMutation_updateQuota = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: QuotaStatus | null, periodType: QuotaPeriodType | null, periodDays: number | null, priority: number | null, createdAt: string | null, updatedAt: string | null };

export type UpdateQuotaMutation = { updateQuota: UpdateQuotaMutation_updateQuota | null };


export type UpdateQuotaMutationVariables = Exact<{
  id: string | number;
  input: QuotaUpdateInput;
}>;

export type DeleteQuotaMutation_deleteQuota = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, status: QuotaStatus | null };

export type DeleteQuotaMutation = { deleteQuota: DeleteQuotaMutation_deleteQuota | null };


export type DeleteQuotaMutationVariables = Exact<{
  id: string | number;
}>;

export type StudentQuotasQuery_studentQuotas = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: QuotaStatus | null, periodType: QuotaPeriodType | null, periodDays: number | null, priority: number | null, createdAt: string | null, updatedAt: string | null };

export type StudentQuotasQuery = { studentQuotas: Array<StudentQuotasQuery_studentQuotas> | null };


export type StudentQuotasQueryVariables = Exact<{
  studentId: string | number;
}>;

export type StudentOpenQuotasQuery_studentOpenQuotas = { id: string | null, studentId: string | null, name: string | null, kind: QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: QuotaStatus | null, periodType: QuotaPeriodType | null, periodDays: number | null, priority: number | null, createdAt: string | null, updatedAt: string | null };

export type StudentOpenQuotasQuery = { studentOpenQuotas: Array<StudentOpenQuotasQuery_studentOpenQuotas> | null };


export type StudentOpenQuotasQueryVariables = Exact<{
  studentId: string | number;
}>;

export type QuotaBalanceQuery_quotaBalance_breakdownByExpiration = { id: string | null, quotaId: string | null, quotaName: string | null, remaining: number | null, validUntil: string | null };

export type QuotaBalanceQuery_quotaBalance = { id: string | null, studentId: string | null, totalActiveClasses: number | null, totalRemaining: number | null, totalReserved: number | null, breakdownByExpiration: Array<QuotaBalanceQuery_quotaBalance_breakdownByExpiration> | null };

export type QuotaBalanceQuery = { quotaBalance: QuotaBalanceQuery_quotaBalance | null };


export type QuotaBalanceQueryVariables = Exact<{
  studentId: string | number;
}>;

export type UserBillingProfileSummaryQuery_parentBillingSummary_nextUnpaidInvoice = { id: string | null, amount: string | null, currency: CurrencyCode | null, dueDate: string | null, studentName: string | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_outstandingByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_outstandingByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: UserBillingProfileSummaryQuery_parentBillingSummary_outstandingByCurrency_displayAmount | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_paidThisTermByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_paidThisTermByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: UserBillingProfileSummaryQuery_parentBillingSummary_paidThisTermByCurrency_displayAmount | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary = { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null, pendingPaymentCount: number | null, nextUnpaidInvoice: UserBillingProfileSummaryQuery_parentBillingSummary_nextUnpaidInvoice | null, outstandingByCurrency: Array<UserBillingProfileSummaryQuery_parentBillingSummary_outstandingByCurrency> | null, paidThisTermByCurrency: Array<UserBillingProfileSummaryQuery_parentBillingSummary_paidThisTermByCurrency> | null };

export type UserBillingProfileSummaryQuery = { parentBillingSummary: UserBillingProfileSummaryQuery_parentBillingSummary | null };


export type UserBillingProfileSummaryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
}>;

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_rows_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_rows = { id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_rows_displayAmount | null };

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory = { id: string | null, totalCount: number | null, rows: Array<UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_rows> | null, pageInfo: UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_pageInfo | null };

export type UserBillingProfileInvoiceHistoryQuery = { parentInvoiceHistory: UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory | null };


export type UserBillingProfileInvoiceHistoryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;

export type ClassCategoryFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type ClassCategoriesQuery_classCategories = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type ClassCategoriesQuery = { classCategories: Array<ClassCategoriesQuery_classCategories> | null };


export type ClassCategoriesQueryVariables = Exact<{ [key: string]: never; }>;

export type CreateClassCategoryMutation_createClassCategory = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type CreateClassCategoryMutation = { createClassCategory: CreateClassCategoryMutation_createClassCategory | null };


export type CreateClassCategoryMutationVariables = Exact<{
  input: ClassCategoryCreateInput;
}>;

export type UpdateClassCategoryMutation_updateClassCategory = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type UpdateClassCategoryMutation = { updateClassCategory: UpdateClassCategoryMutation_updateClassCategory | null };


export type UpdateClassCategoryMutationVariables = Exact<{
  id: string | number;
  input: ClassCategoryUpdateInput;
}>;

export type DeleteClassCategoryMutation = { deleteClassCategory: boolean | null };


export type DeleteClassCategoryMutationVariables = Exact<{
  id: string | number;
}>;

export type ClassSubjectFieldsFragment_category = { id: string | null, name: string | null, slug: string | null };

export type ClassSubjectFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, category: ClassSubjectFieldsFragment_category | null };

export type SubjectResourceFieldsFragment = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectsQuery_classSubjects_resources = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectsQuery_classSubjects = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, resources: Array<ClassSubjectsQuery_classSubjects_resources> | null, category: ClassSubjectFieldsFragment_category | null };

export type ClassSubjectsQuery = { classSubjects: Array<ClassSubjectsQuery_classSubjects> | null };


export type ClassSubjectsQueryVariables = Exact<{
  categoryId: string | null | undefined;
}>;

export type ClassSubjectByIdQuery_classSubject_resources = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectByIdQuery_classSubject = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, resources: Array<ClassSubjectByIdQuery_classSubject_resources> | null, category: ClassSubjectFieldsFragment_category | null };

export type ClassSubjectByIdQuery = { classSubject: ClassSubjectByIdQuery_classSubject | null };


export type ClassSubjectByIdQueryVariables = Exact<{
  id: string | number;
}>;

export type CreateClassSubjectMutation_createClassSubject = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, category: ClassSubjectFieldsFragment_category | null };

export type CreateClassSubjectMutation = { createClassSubject: CreateClassSubjectMutation_createClassSubject | null };


export type CreateClassSubjectMutationVariables = Exact<{
  input: ClassSubjectCreateInput;
}>;

export type UpdateClassSubjectMutation_updateClassSubject = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, category: ClassSubjectFieldsFragment_category | null };

export type UpdateClassSubjectMutation = { updateClassSubject: UpdateClassSubjectMutation_updateClassSubject | null };


export type UpdateClassSubjectMutationVariables = Exact<{
  id: string | number;
  input: ClassSubjectUpdateInput;
}>;

export type DeleteClassSubjectMutation = { deleteClassSubject: boolean | null };


export type DeleteClassSubjectMutationVariables = Exact<{
  id: string | number;
}>;

export type AttachSubjectResourceMutation_attachSubjectResource = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type AttachSubjectResourceMutation = { attachSubjectResource: AttachSubjectResourceMutation_attachSubjectResource | null };


export type AttachSubjectResourceMutationVariables = Exact<{
  input: AttachSubjectResourceInput;
}>;

export type DetachSubjectResourceMutation = { detachSubjectResource: boolean | null };


export type DetachSubjectResourceMutationVariables = Exact<{
  subjectId: string | number;
  learningResourceId: string | number;
}>;

export type GroupClassAuditQuery_groupClassAudit_students = { id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: GroupClassAttendanceStatus | null, avatarUrl: string | null };

export type GroupClassAuditQuery_groupClassAudit_meetingInfo = { platform: string | null, meetingId: string | null, joinUrl: string | null, logoUrl: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, source: string | null };

export type GroupClassAuditQuery_groupClassAudit_communications = { id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null };

export type GroupClassAuditQuery_groupClassAudit_adminNote = { content: string | null, lastUpdated: string | null };

export type GroupClassAuditQuery_groupClassAudit = { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<GroupClassAuditQuery_groupClassAudit_students> | null, meetingInfo: GroupClassAuditQuery_groupClassAudit_meetingInfo | null, communications: Array<GroupClassAuditQuery_groupClassAudit_communications> | null, adminNote: GroupClassAuditQuery_groupClassAudit_adminNote | null };

export type GroupClassAuditQuery = { groupClassAudit: GroupClassAuditQuery_groupClassAudit | null };


export type GroupClassAuditQueryVariables = Exact<{
  classInstanceId: string;
}>;

export type UpdateClassAdminNoteMutation_updateClassAdminNote_students = { id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: GroupClassAttendanceStatus | null, avatarUrl: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote_meetingInfo = { platform: string | null, meetingId: string | null, joinUrl: string | null, logoUrl: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, source: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote_communications = { id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote_adminNote = { content: string | null, lastUpdated: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote = { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<UpdateClassAdminNoteMutation_updateClassAdminNote_students> | null, meetingInfo: UpdateClassAdminNoteMutation_updateClassAdminNote_meetingInfo | null, communications: Array<UpdateClassAdminNoteMutation_updateClassAdminNote_communications> | null, adminNote: UpdateClassAdminNoteMutation_updateClassAdminNote_adminNote | null };

export type UpdateClassAdminNoteMutation = { updateClassAdminNote: UpdateClassAdminNoteMutation_updateClassAdminNote | null };


export type UpdateClassAdminNoteMutationVariables = Exact<{
  classInstanceId: string;
  content: string;
}>;

export type ResendClassNotificationsMutation_resendClassNotifications = { id: string | null, success: boolean | null };

export type ResendClassNotificationsMutation = { resendClassNotifications: ResendClassNotificationsMutation_resendClassNotifications | null };


export type ResendClassNotificationsMutationVariables = Exact<{
  classInstanceId: string;
}>;

export type LessonReportQuery_lessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type LessonReportQuery = { lessonReport: LessonReportQuery_lessonReport | null };


export type LessonReportQueryVariables = Exact<{
  classInstanceId: string | number;
}>;

export type LessonReportByIdQuery_lessonReportById = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type LessonReportByIdQuery = { lessonReportById: LessonReportByIdQuery_lessonReportById | null };


export type LessonReportByIdQueryVariables = Exact<{
  reportId: string | number;
}>;

export type PendingLessonReportsQuery_pendingLessonReports_rows = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type PendingLessonReportsQuery_pendingLessonReports = { totalCount: number | null, rows: Array<PendingLessonReportsQuery_pendingLessonReports_rows> | null };

export type PendingLessonReportsQuery = { pendingLessonReports: PendingLessonReportsQuery_pendingLessonReports | null };


export type PendingLessonReportsQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
  studentId: string | number | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type RecentApprovedLessonReportsQuery_recentApprovedLessonReports_rows = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type RecentApprovedLessonReportsQuery_recentApprovedLessonReports = { totalCount: number | null, rows: Array<RecentApprovedLessonReportsQuery_recentApprovedLessonReports_rows> | null };

export type RecentApprovedLessonReportsQuery = { recentApprovedLessonReports: RecentApprovedLessonReportsQuery_recentApprovedLessonReports | null };


export type RecentApprovedLessonReportsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type StudentRecentLessonReportsQuery_studentRecentLessonReports_rows = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentRecentLessonReportsQuery_studentRecentLessonReports = { totalCount: number | null, rows: Array<StudentRecentLessonReportsQuery_studentRecentLessonReports_rows> | null };

export type StudentRecentLessonReportsQuery = { studentRecentLessonReports: StudentRecentLessonReportsQuery_studentRecentLessonReports | null };


export type StudentRecentLessonReportsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type LessonReportCountQuery_lessonReportCount = { pendingCount: number | null };

export type LessonReportCountQuery = { lessonReportCount: LessonReportCountQuery_lessonReportCount | null };


export type LessonReportCountQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
  studentId: string | number | null | undefined;
}>;

export type SubmitLessonReportMutation_submitLessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type SubmitLessonReportMutation = { submitLessonReport: SubmitLessonReportMutation_submitLessonReport | null };


export type SubmitLessonReportMutationVariables = Exact<{
  classInstanceId: string | number;
  input: LessonReportSubmitInput;
}>;

export type ApproveLessonReportMutation_approveLessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type ApproveLessonReportMutation = { approveLessonReport: ApproveLessonReportMutation_approveLessonReport | null };


export type ApproveLessonReportMutationVariables = Exact<{
  reportId: string | number;
}>;

export type RejectLessonReportMutation_rejectLessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type RejectLessonReportMutation = { rejectLessonReport: RejectLessonReportMutation_rejectLessonReport | null };


export type RejectLessonReportMutationVariables = Exact<{
  reportId: string | number;
  rejectionReason: string;
}>;

export type SubmitStudentLessonReportReflectionMutation_submitStudentLessonReportReflection = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type SubmitStudentLessonReportReflectionMutation = { submitStudentLessonReportReflection: SubmitStudentLessonReportReflectionMutation_submitStudentLessonReportReflection | null };


export type SubmitStudentLessonReportReflectionMutationVariables = Exact<{
  classInstanceId: string | number;
  studentNotes: string;
}>;

export type ParentComplaintsQuery_parentComplaints_complaints_responses = { id: string | null, body: string | null, emailSent: boolean | null, createdAt: string | null, responderName: string | null };

export type ParentComplaintsQuery_parentComplaints_complaints = { id: string | null, category: ComplaintCategory | null, body: string | null, status: ComplaintStatus | null, createdAt: string | null, studentName: string | null, responses: Array<ParentComplaintsQuery_parentComplaints_complaints_responses> | null };

export type ParentComplaintsQuery_parentComplaints_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentComplaintsQuery_parentComplaints = { id: string | null, totalCount: number | null, complaints: Array<ParentComplaintsQuery_parentComplaints_complaints> | null, pageInfo: ParentComplaintsQuery_parentComplaints_pageInfo | null };

export type ParentComplaintsQuery = { parentComplaints: ParentComplaintsQuery_parentComplaints | null };


export type ParentComplaintsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type AdminComplaintQueueQuery_adminComplaintQueue_rows_responses = { id: string | null, body: string | null, createdAt: string | null, responderName: string | null, emailSent: boolean | null };

export type AdminComplaintQueueQuery_adminComplaintQueue_rows = { id: string | null, category: ComplaintCategory | null, body: string | null, status: ComplaintStatus | null, createdAt: string | null, parentName: string | null, parentAvatarUrl: string | null, studentName: string | null, responses: Array<AdminComplaintQueueQuery_adminComplaintQueue_rows_responses> | null };

export type AdminComplaintQueueQuery_adminComplaintQueue_metrics = { id: string | null, unanswered: number | null, answered: number | null, avgResolutionTime: string | null };

export type AdminComplaintQueueQuery_adminComplaintQueue_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type AdminComplaintQueueQuery_adminComplaintQueue = { id: string | null, totalCount: number | null, rows: Array<AdminComplaintQueueQuery_adminComplaintQueue_rows> | null, metrics: AdminComplaintQueueQuery_adminComplaintQueue_metrics | null, pageInfo: AdminComplaintQueueQuery_adminComplaintQueue_pageInfo | null };

export type AdminComplaintQueueQuery = { adminComplaintQueue: AdminComplaintQueueQuery_adminComplaintQueue | null };


export type AdminComplaintQueueQueryVariables = Exact<{
  filter: ComplaintQueueFilter;
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type SubmitComplaintMutation_submitComplaint = { id: string | null, category: ComplaintCategory | null, body: string | null, status: ComplaintStatus | null, createdAt: string | null };

export type SubmitComplaintMutation = { submitComplaint: SubmitComplaintMutation_submitComplaint | null };


export type SubmitComplaintMutationVariables = Exact<{
  input: ComplaintSubmitInput;
}>;

export type RespondToComplaintMutation_respondToComplaint = { id: string | null, body: string | null, emailSent: boolean | null, createdAt: string | null, responderName: string | null };

export type RespondToComplaintMutation = { respondToComplaint: RespondToComplaintMutation_respondToComplaint | null };


export type RespondToComplaintMutationVariables = Exact<{
  input: RespondToComplaintInput;
}>;

export type DeleteComplaintMutation = { deleteComplaint: boolean | null };


export type DeleteComplaintMutationVariables = Exact<{
  complaintId: string;
}>;

export type CronScheduleFieldsFragment = { id: string | null, name: string | null, description: string | null, cronExpression: string | null, jobKind: CronJobKind | null, payload: unknown, status: CronScheduleStatus | null, timezone: string | null, nextRunAt: string | null, lastRunAt: string | null, concurrencyPolicy: CronConcurrencyPolicy | null, maxRetries: number | null, retryBackoffSeconds: number | null, timeoutSeconds: number | null, createdAt: string | null, updatedAt: string | null };

export type CronRunFieldsFragment = { id: string | null, scheduleId: string | null, jobKind: CronJobKind | null, status: CronRunStatus | null, triggerSource: CronTriggerSource | null, payload: unknown, attempt: number | null, startedAt: string | null, completedAt: string | null, durationMs: number | null, errorMessage: string | null, workerId: string | null, createdAt: string | null, updatedAt: string | null };

export type CronQueueStatsFieldsFragment = { id: string | null, backend: string | null, pending: number | null, inFlight: number | null, failed: number | null, byJobKind: unknown };

export type CronSchedulesQuery_cronSchedules_rows = { id: string | null, name: string | null, description: string | null, cronExpression: string | null, jobKind: CronJobKind | null, payload: unknown, status: CronScheduleStatus | null, timezone: string | null, nextRunAt: string | null, lastRunAt: string | null, concurrencyPolicy: CronConcurrencyPolicy | null, maxRetries: number | null, retryBackoffSeconds: number | null, timeoutSeconds: number | null, createdAt: string | null, updatedAt: string | null };

export type CronSchedulesQuery_cronSchedules = { totalCount: number | null, rows: Array<CronSchedulesQuery_cronSchedules_rows> | null };

export type CronSchedulesQuery = { cronSchedules: CronSchedulesQuery_cronSchedules | null };


export type CronSchedulesQueryVariables = Exact<{
  input: CronScheduleListInput | null | undefined;
}>;

export type CronRunsQuery_cronRuns_rows = { id: string | null, scheduleId: string | null, jobKind: CronJobKind | null, status: CronRunStatus | null, triggerSource: CronTriggerSource | null, payload: unknown, attempt: number | null, startedAt: string | null, completedAt: string | null, durationMs: number | null, errorMessage: string | null, workerId: string | null, createdAt: string | null, updatedAt: string | null };

export type CronRunsQuery_cronRuns = { totalCount: number | null, rows: Array<CronRunsQuery_cronRuns_rows> | null };

export type CronRunsQuery = { cronRuns: CronRunsQuery_cronRuns | null };


export type CronRunsQueryVariables = Exact<{
  input: CronRunListInput | null | undefined;
}>;

export type CronQueueStatsQuery_cronQueueStats = { id: string | null, backend: string | null, pending: number | null, inFlight: number | null, failed: number | null, byJobKind: unknown };

export type CronQueueStatsQuery = { cronQueueStats: CronQueueStatsQuery_cronQueueStats | null };


export type CronQueueStatsQueryVariables = Exact<{ [key: string]: never; }>;

export type CronScheduleCreateMutation_cronScheduleCreate = { id: string | null, name: string | null, description: string | null, cronExpression: string | null, jobKind: CronJobKind | null, payload: unknown, status: CronScheduleStatus | null, timezone: string | null, nextRunAt: string | null, lastRunAt: string | null, concurrencyPolicy: CronConcurrencyPolicy | null, maxRetries: number | null, retryBackoffSeconds: number | null, timeoutSeconds: number | null, createdAt: string | null, updatedAt: string | null };

export type CronScheduleCreateMutation = { cronScheduleCreate: CronScheduleCreateMutation_cronScheduleCreate | null };


export type CronScheduleCreateMutationVariables = Exact<{
  input: CronScheduleSubmitInput;
}>;

export type CronScheduleUpdateMutation_cronScheduleUpdate = { id: string | null, name: string | null, description: string | null, cronExpression: string | null, jobKind: CronJobKind | null, payload: unknown, status: CronScheduleStatus | null, timezone: string | null, nextRunAt: string | null, lastRunAt: string | null, concurrencyPolicy: CronConcurrencyPolicy | null, maxRetries: number | null, retryBackoffSeconds: number | null, timeoutSeconds: number | null, createdAt: string | null, updatedAt: string | null };

export type CronScheduleUpdateMutation = { cronScheduleUpdate: CronScheduleUpdateMutation_cronScheduleUpdate | null };


export type CronScheduleUpdateMutationVariables = Exact<{
  id: string;
  input: CronScheduleUpdateInput;
}>;

export type CronSchedulePauseMutation_cronSchedulePause = { id: string | null, name: string | null, description: string | null, cronExpression: string | null, jobKind: CronJobKind | null, payload: unknown, status: CronScheduleStatus | null, timezone: string | null, nextRunAt: string | null, lastRunAt: string | null, concurrencyPolicy: CronConcurrencyPolicy | null, maxRetries: number | null, retryBackoffSeconds: number | null, timeoutSeconds: number | null, createdAt: string | null, updatedAt: string | null };

export type CronSchedulePauseMutation = { cronSchedulePause: CronSchedulePauseMutation_cronSchedulePause | null };


export type CronSchedulePauseMutationVariables = Exact<{
  id: string;
}>;

export type CronScheduleResumeMutation_cronScheduleResume = { id: string | null, name: string | null, description: string | null, cronExpression: string | null, jobKind: CronJobKind | null, payload: unknown, status: CronScheduleStatus | null, timezone: string | null, nextRunAt: string | null, lastRunAt: string | null, concurrencyPolicy: CronConcurrencyPolicy | null, maxRetries: number | null, retryBackoffSeconds: number | null, timeoutSeconds: number | null, createdAt: string | null, updatedAt: string | null };

export type CronScheduleResumeMutation = { cronScheduleResume: CronScheduleResumeMutation_cronScheduleResume | null };


export type CronScheduleResumeMutationVariables = Exact<{
  id: string;
}>;

export type CronScheduleDeleteMutation = { cronScheduleDelete: boolean | null };


export type CronScheduleDeleteMutationVariables = Exact<{
  input: CronScheduleDeleteInput;
}>;

export type CronRunTriggerMutation_cronRunTrigger = { id: string | null, scheduleId: string | null, jobKind: CronJobKind | null, status: CronRunStatus | null, triggerSource: CronTriggerSource | null, payload: unknown, attempt: number | null, startedAt: string | null, completedAt: string | null, durationMs: number | null, errorMessage: string | null, workerId: string | null, createdAt: string | null, updatedAt: string | null };

export type CronRunTriggerMutation = { cronRunTrigger: CronRunTriggerMutation_cronRunTrigger | null };


export type CronRunTriggerMutationVariables = Exact<{
  input: CronRunTriggerInput;
}>;

export type MeetingProviderFieldsFragment_fieldSchema = { requiresMeetingUrl: boolean | null, supportsAutoGeneration: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null };

export type MeetingProviderFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, providerKind: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_fieldSchema | null };

export type UserMeetingConfigFieldsFragment_details = { id: string | null, meetingUrl: string | null, username: string | null, tenantId: string | null };

export type UserMeetingConfigFieldsFragment_provider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, providerKind: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_fieldSchema | null };

export type UserMeetingConfigFieldsFragment = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, oauthTokenExpiresAt: string | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_details | null, provider: UserMeetingConfigFieldsFragment_provider | null };

export type MeetingProvidersQuery_meetingProviders = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, providerKind: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_fieldSchema | null };

export type MeetingProvidersQuery = { meetingProviders: Array<MeetingProvidersQuery_meetingProviders> | null };


export type MeetingProvidersQueryVariables = Exact<{
  activeOnly: boolean | null | undefined;
}>;

export type MeetingProviderQuery_meetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, providerKind: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_fieldSchema | null };

export type MeetingProviderQuery = { meetingProvider: MeetingProviderQuery_meetingProvider | null };


export type MeetingProviderQueryVariables = Exact<{
  id: string | number;
}>;

export type UserMeetingConfigsQuery_userMeetingConfigs = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, oauthTokenExpiresAt: string | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_details | null, provider: UserMeetingConfigFieldsFragment_provider | null };

export type UserMeetingConfigsQuery = { userMeetingConfigs: Array<UserMeetingConfigsQuery_userMeetingConfigs> | null };


export type UserMeetingConfigsQueryVariables = Exact<{
  userId: string | number;
}>;

export type UserMeetingConfigQuery_userMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, oauthTokenExpiresAt: string | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_details | null, provider: UserMeetingConfigFieldsFragment_provider | null };

export type UserMeetingConfigQuery = { userMeetingConfig: UserMeetingConfigQuery_userMeetingConfig | null };


export type UserMeetingConfigQueryVariables = Exact<{
  id: string | number;
}>;

export type CreateMeetingProviderMutation_createMeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, providerKind: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_fieldSchema | null };

export type CreateMeetingProviderMutation = { createMeetingProvider: CreateMeetingProviderMutation_createMeetingProvider | null };


export type CreateMeetingProviderMutationVariables = Exact<{
  input: MeetingProviderCreateInput;
}>;

export type UpdateMeetingProviderMutation_updateMeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, providerKind: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_fieldSchema | null };

export type UpdateMeetingProviderMutation = { updateMeetingProvider: UpdateMeetingProviderMutation_updateMeetingProvider | null };


export type UpdateMeetingProviderMutationVariables = Exact<{
  id: string | number;
  input: MeetingProviderUpdateInput;
}>;

export type DeleteMeetingProviderMutation = { deleteMeetingProvider: boolean | null };


export type DeleteMeetingProviderMutationVariables = Exact<{
  id: string | number;
}>;

export type CreateUserMeetingConfigMutation_createUserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, oauthTokenExpiresAt: string | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_details | null, provider: UserMeetingConfigFieldsFragment_provider | null };

export type CreateUserMeetingConfigMutation = { createUserMeetingConfig: CreateUserMeetingConfigMutation_createUserMeetingConfig | null };


export type CreateUserMeetingConfigMutationVariables = Exact<{
  input: UserMeetingConfigCreateInput;
}>;

export type UpdateUserMeetingConfigMutation_updateUserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, oauthTokenExpiresAt: string | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_details | null, provider: UserMeetingConfigFieldsFragment_provider | null };

export type UpdateUserMeetingConfigMutation = { updateUserMeetingConfig: UpdateUserMeetingConfigMutation_updateUserMeetingConfig | null };


export type UpdateUserMeetingConfigMutationVariables = Exact<{
  id: string | number;
  input: UserMeetingConfigUpdateInput;
}>;

export type DeleteUserMeetingConfigMutation = { deleteUserMeetingConfig: boolean | null };


export type DeleteUserMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;

export type SetDefaultMeetingConfigMutation_setDefaultMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, oauthTokenExpiresAt: string | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_details | null, provider: UserMeetingConfigFieldsFragment_provider | null };

export type SetDefaultMeetingConfigMutation = { setDefaultMeetingConfig: SetDefaultMeetingConfigMutation_setDefaultMeetingConfig | null };


export type SetDefaultMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;

export type ClassMeetingConfigFieldsFragment_details = { id: string | null, meetingUrl: string | null, username: string | null, tenantId: string | null };

export type ClassMeetingConfigFieldsFragment_provider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, providerKind: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_fieldSchema | null };

export type ClassMeetingConfigFieldsFragment = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_details | null, provider: ClassMeetingConfigFieldsFragment_provider | null };

export type EffectiveMeetingFieldsFragment = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type ClassMeetingConfigsQuery_classMeetingConfigs = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_details | null, provider: ClassMeetingConfigFieldsFragment_provider | null };

export type ClassMeetingConfigsQuery = { classMeetingConfigs: Array<ClassMeetingConfigsQuery_classMeetingConfigs> | null };


export type ClassMeetingConfigsQueryVariables = Exact<{
  classInstanceId: string | number;
}>;

export type ClassMeetingConfigsWithStatusQuery_classMeetingConfigs_details = { id: string | null, meetingUrl: string | null, username: string | null, tenantId: string | null };

export type ClassMeetingConfigsWithStatusQuery_classMeetingConfigs_provider_fieldSchema = { requiresMeetingUrl: boolean | null, supportsAutoGeneration: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null };

export type ClassMeetingConfigsWithStatusQuery_classMeetingConfigs_provider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, providerKind: string | null, isActive: boolean | null, fieldSchema: ClassMeetingConfigsWithStatusQuery_classMeetingConfigs_provider_fieldSchema | null };

export type ClassMeetingConfigsWithStatusQuery_classMeetingConfigs = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, providerMetadata: unknown, meetingUrlStatus: string | null, meetingUrlExpiresAt: string | null, meetingUrlError: string | null, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigsWithStatusQuery_classMeetingConfigs_details | null, provider: ClassMeetingConfigsWithStatusQuery_classMeetingConfigs_provider | null };

export type ClassMeetingConfigsWithStatusQuery = { classMeetingConfigs: Array<ClassMeetingConfigsWithStatusQuery_classMeetingConfigs> | null };


export type ClassMeetingConfigsWithStatusQueryVariables = Exact<{
  classInstanceId: string | number;
}>;

export type RecurringMeetingConfigsQuery_recurringMeetingConfigs = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_details | null, provider: ClassMeetingConfigFieldsFragment_provider | null };

export type RecurringMeetingConfigsQuery = { recurringMeetingConfigs: Array<RecurringMeetingConfigsQuery_recurringMeetingConfigs> | null };


export type RecurringMeetingConfigsQueryVariables = Exact<{
  recurringScheduleId: string | number;
}>;

export type CreateClassMeetingConfigMutation_createClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_details | null, provider: ClassMeetingConfigFieldsFragment_provider | null };

export type CreateClassMeetingConfigMutation = { createClassMeetingConfig: CreateClassMeetingConfigMutation_createClassMeetingConfig | null };


export type CreateClassMeetingConfigMutationVariables = Exact<{
  input: ClassMeetingConfigCreateInput;
}>;

export type UpdateClassMeetingConfigMutation_updateClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_details | null, provider: ClassMeetingConfigFieldsFragment_provider | null };

export type UpdateClassMeetingConfigMutation = { updateClassMeetingConfig: UpdateClassMeetingConfigMutation_updateClassMeetingConfig | null };


export type UpdateClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
  input: ClassMeetingConfigUpdateInput;
}>;

export type DeleteClassMeetingConfigMutation = { deleteClassMeetingConfig: boolean | null };


export type DeleteClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;

export type SetDefaultClassMeetingConfigMutation_setDefaultClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, providerMetadata: unknown, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_details | null, provider: ClassMeetingConfigFieldsFragment_provider | null };

export type SetDefaultClassMeetingConfigMutation = { setDefaultClassMeetingConfig: SetDefaultClassMeetingConfigMutation_setDefaultClassMeetingConfig | null };


export type SetDefaultClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;

export type GenerateMeetingUrlMutation_generateMeetingUrl = { joinUrl: string | null, meetingId: string | null, expiresAt: string | null };

export type GenerateMeetingUrlMutation = { generateMeetingUrl: GenerateMeetingUrlMutation_generateMeetingUrl | null };


export type GenerateMeetingUrlMutationVariables = Exact<{
  input: GenerateMeetingUrlInput;
}>;

export type ConnectMeetingProviderOAuthMutation_connectMeetingProviderOAuth = { id: string | null, authorizeUrl: string | null, state: string | null };

export type ConnectMeetingProviderOAuthMutation = { connectMeetingProviderOAuth: ConnectMeetingProviderOAuthMutation_connectMeetingProviderOAuth | null };


export type ConnectMeetingProviderOAuthMutationVariables = Exact<{
  input: ConnectMeetingProviderOAuthInput;
}>;

export type DisconnectMeetingProviderOAuthMutation_disconnectMeetingProviderOAuth = { id: string | null, ok: boolean | null, providerSlug: string | null };

export type DisconnectMeetingProviderOAuthMutation = { disconnectMeetingProviderOAuth: DisconnectMeetingProviderOAuthMutation_disconnectMeetingProviderOAuth | null };


export type DisconnectMeetingProviderOAuthMutationVariables = Exact<{
  input: DisconnectMeetingProviderOAuthInput;
}>;

export type MyConnectedMeetingProvidersQuery_myConnectedMeetingProviders = { id: string | null, providerSlug: string | null, email: string | null, connectedAt: string | null, expiresAt: string | null };

export type MyConnectedMeetingProvidersQuery = { myConnectedMeetingProviders: Array<MyConnectedMeetingProvidersQuery_myConnectedMeetingProviders> | null };


export type MyConnectedMeetingProvidersQueryVariables = Exact<{ [key: string]: never; }>;

export type NotificationAlertsQuery_notificationAlerts_alerts = { id: string | null, deliveryId: string | null, type: string | null, eventType: NotificationEventType | null, channel: NotificationChannel | null, metadata: unknown, title: string | null, body: string | null, createdAt: string | null, severity: string | null, readAt: string | null };

export type NotificationAlertsQuery_notificationAlerts = { id: string | null, totalCount: number | null, unreadCount: number | null, alerts: Array<NotificationAlertsQuery_notificationAlerts_alerts> | null };

export type NotificationAlertsQuery = { notificationAlerts: NotificationAlertsQuery_notificationAlerts | null };


export type NotificationAlertsQueryVariables = Exact<{ [key: string]: never; }>;

export type MarkNotificationsReadMutation = { markNotificationsRead: number | null };


export type MarkNotificationsReadMutationVariables = Exact<{ [key: string]: never; }>;

export type MarkNotificationReadMutation = { markNotificationRead: boolean | null };


export type MarkNotificationReadMutationVariables = Exact<{
  deliveryId: string | number;
}>;

export type NotificationPreferencesQuery_notificationPreferences = { id: string | null, channel: NotificationChannel | null, eventType: NotificationEventType | null, enabled: boolean | null };

export type NotificationPreferencesQuery = { notificationPreferences: Array<NotificationPreferencesQuery_notificationPreferences> | null };


export type NotificationPreferencesQueryVariables = Exact<{ [key: string]: never; }>;

export type UpdateNotificationPreferencesMutation_updateNotificationPreferences = { id: string | null, channel: NotificationChannel | null, eventType: NotificationEventType | null, enabled: boolean | null };

export type UpdateNotificationPreferencesMutation = { updateNotificationPreferences: Array<UpdateNotificationPreferencesMutation_updateNotificationPreferences> | null };


export type UpdateNotificationPreferencesMutationVariables = Exact<{
  input: Array<NotificationPreferenceInput> | NotificationPreferenceInput;
}>;

export type ParentInvoiceHistoryQuery_parentInvoiceHistory_rows_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ParentInvoiceHistoryQuery_parentInvoiceHistory_rows = { id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null, parentId: string | null, parentUserId: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: ParentInvoiceHistoryQuery_parentInvoiceHistory_rows_displayAmount | null };

export type ParentInvoiceHistoryQuery_parentInvoiceHistory_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentInvoiceHistoryQuery_parentInvoiceHistory = { id: string | null, totalCount: number | null, rows: Array<ParentInvoiceHistoryQuery_parentInvoiceHistory_rows> | null, pageInfo: ParentInvoiceHistoryQuery_parentInvoiceHistory_pageInfo | null };

export type ParentInvoiceHistoryQuery = { parentInvoiceHistory: ParentInvoiceHistoryQuery_parentInvoiceHistory | null };


export type ParentInvoiceHistoryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;

export type AdminInvoicesQuery_adminInvoices_rows_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type AdminInvoicesQuery_adminInvoices_rows = { id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null, parentId: string | null, parentUserId: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: AdminInvoicesQuery_adminInvoices_rows_displayAmount | null };

export type AdminInvoicesQuery_adminInvoices_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type AdminInvoicesQuery_adminInvoices = { id: string | null, totalCount: number | null, rows: Array<AdminInvoicesQuery_adminInvoices_rows> | null, pageInfo: AdminInvoicesQuery_adminInvoices_pageInfo | null };

export type AdminInvoicesQuery = { adminInvoices: AdminInvoicesQuery_adminInvoices | null };


export type AdminInvoicesQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;

export type AdminBillingSummaryQuery_adminBillingSummary_outstandingByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type AdminBillingSummaryQuery_adminBillingSummary_outstandingByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: AdminBillingSummaryQuery_adminBillingSummary_outstandingByCurrency_displayAmount | null };

export type AdminBillingSummaryQuery_adminBillingSummary_mtdRevenueByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type AdminBillingSummaryQuery_adminBillingSummary_mtdRevenueByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: AdminBillingSummaryQuery_adminBillingSummary_mtdRevenueByCurrency_displayAmount | null };

export type AdminBillingSummaryQuery_adminBillingSummary = { id: string | null, totalOutstanding: string | null, pendingCount: number | null, mtdRevenue: string | null, negativeBalanceCount: number | null, outstandingByCurrency: Array<AdminBillingSummaryQuery_adminBillingSummary_outstandingByCurrency> | null, mtdRevenueByCurrency: Array<AdminBillingSummaryQuery_adminBillingSummary_mtdRevenueByCurrency> | null };

export type AdminBillingSummaryQuery = { adminBillingSummary: AdminBillingSummaryQuery_adminBillingSummary | null };


export type AdminBillingSummaryQueryVariables = Exact<{ [key: string]: never; }>;

export type StudentCreditStatusQuery_studentCreditStatus = { id: string | null, studentName: string | null, parentEmail: string | null, planType: InvoiceType | null, classesRemaining: number | null, classesTotal: number | null, status: StudentStatus | null };

export type StudentCreditStatusQuery = { studentCreditStatus: Array<StudentCreditStatusQuery_studentCreditStatus> | null };


export type StudentCreditStatusQueryVariables = Exact<{ [key: string]: never; }>;

export type ParentBillingSummaryQuery_parentBillingSummary_nextUnpaidInvoice = { id: string | null, amount: string | null, currency: CurrencyCode | null, dueDate: string | null, studentName: string | null };

export type ParentBillingSummaryQuery_parentBillingSummary_outstandingByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ParentBillingSummaryQuery_parentBillingSummary_outstandingByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: ParentBillingSummaryQuery_parentBillingSummary_outstandingByCurrency_displayAmount | null };

export type ParentBillingSummaryQuery_parentBillingSummary_paidThisTermByCurrency_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ParentBillingSummaryQuery_parentBillingSummary_paidThisTermByCurrency = { id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: ParentBillingSummaryQuery_parentBillingSummary_paidThisTermByCurrency_displayAmount | null };

export type ParentBillingSummaryQuery_parentBillingSummary = { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null, pendingPaymentCount: number | null, nextUnpaidInvoice: ParentBillingSummaryQuery_parentBillingSummary_nextUnpaidInvoice | null, outstandingByCurrency: Array<ParentBillingSummaryQuery_parentBillingSummary_outstandingByCurrency> | null, paidThisTermByCurrency: Array<ParentBillingSummaryQuery_parentBillingSummary_paidThisTermByCurrency> | null };

export type ParentBillingSummaryQuery = { parentBillingSummary: ParentBillingSummaryQuery_parentBillingSummary | null };


export type ParentBillingSummaryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
}>;

export type ParentDashboardScheduleQuery_parentDashboardSchedule_rows_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type ParentDashboardScheduleQuery_parentDashboardSchedule_rows = { id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentAvatarUrl: string | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, bookingStatus: BookingStatus | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, classTimeFormatted: string | null, effectiveMeeting: ParentDashboardScheduleQuery_parentDashboardSchedule_rows_effectiveMeeting | null };

export type ParentDashboardScheduleQuery_parentDashboardSchedule_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentDashboardScheduleQuery_parentDashboardSchedule = { id: string | null, totalCount: number | null, rows: Array<ParentDashboardScheduleQuery_parentDashboardSchedule_rows> | null, pageInfo: ParentDashboardScheduleQuery_parentDashboardSchedule_pageInfo | null };

export type ParentDashboardScheduleQuery = { parentDashboardSchedule: ParentDashboardScheduleQuery_parentDashboardSchedule | null };


export type ParentDashboardScheduleQueryVariables = Exact<{
  date: string | null | undefined;
  search: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type ParentDashboardMetricsQuery_parentDashboardMetrics_metrics = { id: string | null, totalStudents: number | null, todaysClasses: number | null, pendingInvoicesCount: number | null, pendingInvoicesAmount: string | null, performanceAvg: number | null, performanceAvgMobile: number | null, pendingMessages: number | null };

export type ParentDashboardMetricsQuery_parentDashboardMetrics_studentProgress = { id: string | null, name: string | null, completionPercent: number | null };

export type ParentDashboardMetricsQuery_parentDashboardMetrics_workshopPromo = { id: string | null, title: string | null, description: string | null, imageUrl: string | null };

export type ParentDashboardMetricsQuery_parentDashboardMetrics = { id: string | null, metrics: ParentDashboardMetricsQuery_parentDashboardMetrics_metrics | null, studentProgress: Array<ParentDashboardMetricsQuery_parentDashboardMetrics_studentProgress> | null, workshopPromo: ParentDashboardMetricsQuery_parentDashboardMetrics_workshopPromo | null };

export type ParentDashboardMetricsQuery = { parentDashboardMetrics: ParentDashboardMetricsQuery_parentDashboardMetrics | null };


export type ParentDashboardMetricsQueryVariables = Exact<{ [key: string]: never; }>;

export type ParentDirectoryAutocompleteRowFragment = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type ParentDirectoryQuery_parentDirectory_metrics = { id: string | null, regular: number | null, onLeave: number | null, onTrial: number | null, suspended: number | null };

export type ParentDirectoryQuery_parentDirectory_rows = { id: string | null, userId: string | null, index: number | null, name: string | null, email: string | null, avatarUrl: string | null, guardianOf: string | null, time: string | null, lifecycleStatus: ParentStatus | null, accountStatus: AccountStatus | null, unpaidInvoices: number | null };

export type ParentDirectoryQuery_parentDirectory_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentDirectoryQuery_parentDirectory = { id: string | null, totalCount: number | null, metrics: ParentDirectoryQuery_parentDirectory_metrics | null, rows: Array<ParentDirectoryQuery_parentDirectory_rows> | null, pageInfo: ParentDirectoryQuery_parentDirectory_pageInfo | null };

export type ParentDirectoryQuery = { parentDirectory: ParentDirectoryQuery_parentDirectory | null };


export type ParentDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
  lifecycleStatusFilter: ParentStatus | null | undefined;
}>;

export type ParentsDirectoryQuery_parentsDirectory = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type ParentsDirectoryQuery = { parentsDirectory: Array<ParentsDirectoryQuery_parentsDirectory> };


export type ParentsDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
}>;

export type ParentDocumentsQuery_parentDocuments = { id: string | null, fileId: string | null, filePath: string | null, isProtected: boolean | null, usageType: string | null, createdAt: string | null };

export type ParentDocumentsQuery = { parentDocuments: Array<ParentDocumentsQuery_parentDocuments> | null };


export type ParentDocumentsQueryVariables = Exact<{
  parentId: string;
}>;

export type LinkDocumentToParentMutation_linkDocumentToParent = { id: string | null, fileId: string | null, filePath: string | null, isProtected: boolean | null, usageType: string | null, createdAt: string | null };

export type LinkDocumentToParentMutation = { linkDocumentToParent: LinkDocumentToParentMutation_linkDocumentToParent | null };


export type LinkDocumentToParentMutationVariables = Exact<{
  parentId: string;
  fileId: string;
  usageType: string;
}>;

export type ChangeParentLifecycleStatusMutation_changeParentLifecycleStatus = { id: string | null, lifecycleStatus: ParentStatus | null };

export type ChangeParentLifecycleStatusMutation = { changeParentLifecycleStatus: ChangeParentLifecycleStatusMutation_changeParentLifecycleStatus | null };


export type ChangeParentLifecycleStatusMutationVariables = Exact<{
  parentId: string;
  newStatus: ParentStatus;
}>;

export type CreateParentMutation_createParent = { id: string | null, userId: string | null, parentId: string | null, name: string | null, email: string | null, status: string | null, invoiceType: string | null, currency: CurrencyCode | null };

export type CreateParentMutation = { createParent: CreateParentMutation_createParent | null };


export type CreateParentMutationVariables = Exact<{
  input: ParentOnboardingInput;
}>;

export type ParentAssignedStudentsQuery_parentAssignedStudents_rows = { id: string | null, name: string | null, studentAvatarUrl: string | null, status: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null };

export type ParentAssignedStudentsQuery_parentAssignedStudents = { id: string | null, totalCount: number | null, rows: Array<ParentAssignedStudentsQuery_parentAssignedStudents_rows> | null };

export type ParentAssignedStudentsQuery = { parentAssignedStudents: ParentAssignedStudentsQuery_parentAssignedStudents | null };


export type ParentAssignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;

export type ParentOwnProfileQuery_parentOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null };

export type ParentOwnProfileQuery = { parentOwnProfile: ParentOwnProfileQuery_parentOwnProfile | null };


export type ParentOwnProfileQueryVariables = Exact<{ [key: string]: never; }>;

export type ParentHandbookUrlQuery_parentHandbookUrl = { id: string | null, url: string | null };

export type ParentHandbookUrlQuery = { parentHandbookUrl: ParentHandbookUrlQuery_parentHandbookUrl | null };


export type ParentHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;

export type ParentProfileQuery_parentProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ParentProfileQuery_parentProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: CurrencyCode | null, timezone: IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: ParentProfileQuery_parentProfile_displayAmount | null };

export type ParentProfileQuery = { parentProfile: ParentProfileQuery_parentProfile | null };


export type ParentProfileQueryVariables = Exact<{
  parentId: string;
}>;

export type ParentAssociatedStudentsQuery_parentAssociatedStudents = { id: string | null, name: string | null, avatarUrl: string | null, status: StudentStatus | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, updatedAt: string | null };

export type ParentAssociatedStudentsQuery = { parentAssociatedStudents: Array<ParentAssociatedStudentsQuery_parentAssociatedStudents> | null };


export type ParentAssociatedStudentsQueryVariables = Exact<{
  parentId: string;
}>;

export type DeactivateParentMutation_deactivateParent = { id: string | null, userId: string | null, accountStatus: AccountStatus | null };

export type DeactivateParentMutation = { deactivateParent: DeactivateParentMutation_deactivateParent | null };


export type DeactivateParentMutationVariables = Exact<{
  parentId: string;
}>;

export type ReactivateParentMutation_reactivateParent = { id: string | null, userId: string | null, accountStatus: AccountStatus | null };

export type ReactivateParentMutation = { reactivateParent: ReactivateParentMutation_reactivateParent | null };


export type ReactivateParentMutationVariables = Exact<{
  parentId: string;
}>;

export type UpdateStudentQuotaMutation_updateStudentQuota = { id: string | null, classesRemaining: number | null, classesTotal: number | null, version: number | null };

export type UpdateStudentQuotaMutation = { updateStudentQuota: UpdateStudentQuotaMutation_updateStudentQuota | null };


export type UpdateStudentQuotaMutationVariables = Exact<{
  studentId: string;
  newClassesRemaining: number;
  expectedVersion: number | null | undefined;
}>;

export type PermissionFieldsFragment = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionGroupFieldsFragment = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null };

export type PermissionGroupDetailFieldsFragment_assignedUsers = { id: string | null, name: string | null, email: string | null };

export type PermissionGroupDetailFieldsFragment = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_assignedUsers> | null };

export type UserOverrideFieldsFragment = { id: string | null, permissionId: string | null, state: OverrideState | null, assignedBy: string | null };

export type PermissionsQuery_permissions = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionsQuery = { permissions: Array<PermissionsQuery_permissions> | null };


export type PermissionsQueryVariables = Exact<{ [key: string]: never; }>;

export type PermissionGroupsQuery_permissionGroups = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null };

export type PermissionGroupsQuery = { permissionGroups: Array<PermissionGroupsQuery_permissionGroups> | null };


export type PermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;

export type PermissionGroupQuery_permissionGroup = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_assignedUsers> | null };

export type PermissionGroupQuery = { permissionGroup: PermissionGroupQuery_permissionGroup | null };


export type PermissionGroupQueryVariables = Exact<{
  id: string;
}>;

export type UserPermissionGroupsQuery = { userPermissionGroups: Array<string> | null };


export type UserPermissionGroupsQueryVariables = Exact<{
  userId: string;
}>;

export type UserOverridesQuery_userOverrides = { id: string | null, permissionId: string | null, state: OverrideState | null, assignedBy: string | null };

export type UserOverridesQuery = { userOverrides: Array<UserOverridesQuery_userOverrides> | null };


export type UserOverridesQueryVariables = Exact<{
  userId: string;
}>;

export type EffectiveUserPermissionsQuery = { effectiveUserPermissions: Array<string> | null };


export type EffectiveUserPermissionsQueryVariables = Exact<{
  userId: string;
}>;

export type CreatePermissionGroupMutation_createPermissionGroup = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_assignedUsers> | null };

export type CreatePermissionGroupMutation = { createPermissionGroup: CreatePermissionGroupMutation_createPermissionGroup | null };


export type CreatePermissionGroupMutationVariables = Exact<{
  input: CreatePermissionGroupInput;
}>;

export type UpdatePermissionGroupMutation_updatePermissionGroup = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_assignedUsers> | null };

export type UpdatePermissionGroupMutation = { updatePermissionGroup: UpdatePermissionGroupMutation_updatePermissionGroup | null };


export type UpdatePermissionGroupMutationVariables = Exact<{
  input: UpdatePermissionGroupInput;
}>;

export type DeletePermissionGroupMutation = { deletePermissionGroup: boolean | null };


export type DeletePermissionGroupMutationVariables = Exact<{
  groupId: string;
}>;

export type AssignPermissionGroupToUserMutation = { assignPermissionGroupToUser: boolean | null };


export type AssignPermissionGroupToUserMutationVariables = Exact<{
  input: AssignPermissionGroupToUserInput;
}>;

export type RevokePermissionGroupFromUserMutation = { revokePermissionGroupFromUser: boolean | null };


export type RevokePermissionGroupFromUserMutationVariables = Exact<{
  input: RevokePermissionGroupFromUserInput;
}>;

export type BulkAssignUsersToGroupMutation = { bulkAssignUsersToGroup: boolean | null };


export type BulkAssignUsersToGroupMutationVariables = Exact<{
  groupId: string;
  userIds: Array<string> | string;
}>;

export type BulkRevokeUsersFromGroupMutation = { bulkRevokeUsersFromGroup: boolean | null };


export type BulkRevokeUsersFromGroupMutationVariables = Exact<{
  groupId: string;
  userIds: Array<string> | string;
}>;

export type UpdateUserOverridesMutation = { updateUserOverrides: boolean | null };


export type UpdateUserOverridesMutationVariables = Exact<{
  userId: string;
  overrides: Array<UserOverrideInput> | UserOverrideInput;
}>;

export type ProfileByUserIdQuery_profileByUserId_teacherOwnProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_teacherOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, countryCode: string | null, nationalId: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, totalClasses: number | null, displayAmount: ProfileByUserIdQuery_profileByUserId_teacherOwnProfile_displayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_teacherAdminProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_teacherAdminProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, nationalId: string | null, nationality: string | null, countryCode: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null, displayAmount: ProfileByUserIdQuery_profileByUserId_teacherAdminProfile_displayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_parentOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null };

export type ProfileByUserIdQuery_profileByUserId_parentAdminProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_parentAdminProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: CurrencyCode | null, timezone: IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: ProfileByUserIdQuery_profileByUserId_parentAdminProfile_displayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_paymentMethods = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type ProfileByUserIdQuery_profileByUserId_paymentMethodDefaults = { payinDefault: PaymentMethodDefaultsFieldsFragment_payinDefault | null, payoutDefault: PaymentMethodDefaultsFieldsFragment_payoutDefault | null };

export type ProfileByUserIdQuery_profileByUserId_associatedStudents_rows = { id: string | null, name: string | null, studentAvatarUrl: string | null, status: string | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null };

export type ProfileByUserIdQuery_profileByUserId_associatedStudents = { id: string | null, totalCount: number | null, rows: Array<ProfileByUserIdQuery_profileByUserId_associatedStudents_rows> | null };

export type ProfileByUserIdQuery_profileByUserId_staffProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_staffProfile = { id: string | null, userId: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: ProfileByUserIdQuery_profileByUserId_staffProfile_displayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_staffPermissionGroups = { id: string | null, name: string | null, slug: string | null, description: string | null };

export type ProfileByUserIdQuery_profileByUserId_staffPermissionOverrides = { id: string | null, permissionId: string | null, permissionKey: string | null, resource: string | null, action: string | null, state: OverrideState | null };

export type ProfileByUserIdQuery_profileByUserId_meetingConfigs_details = { id: string | null, meetingUrl: string | null, username: string | null, tenantId: string | null };

export type ProfileByUserIdQuery_profileByUserId_meetingConfigs_provider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null };

export type ProfileByUserIdQuery_profileByUserId_meetingConfigs = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, details: ProfileByUserIdQuery_profileByUserId_meetingConfigs_details | null, provider: ProfileByUserIdQuery_profileByUserId_meetingConfigs_provider | null };

export type ProfileByUserIdQuery_profileByUserId_assignedStudents_rows = { id: string | null, name: string | null, studentAvatarUrl: string | null, parentId: string | null, parentUserId: string | null, parentName: string | null, parentAvatarUrl: string | null, className: string | null, status: StudentStatus | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null };

export type ProfileByUserIdQuery_profileByUserId_assignedStudents = { id: string | null, totalCount: number | null, rows: Array<ProfileByUserIdQuery_profileByUserId_assignedStudents_rows> | null };

export type ProfileByUserIdQuery_profileByUserId = { id: string | null, userId: string | null, audience: ProfileAudience | null, scope: ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: CurrencyCode | null, timezone: IanaTimezone | null, phone: string | null, teacherOwnProfile: ProfileByUserIdQuery_profileByUserId_teacherOwnProfile | null, teacherAdminProfile: ProfileByUserIdQuery_profileByUserId_teacherAdminProfile | null, parentOwnProfile: ProfileByUserIdQuery_profileByUserId_parentOwnProfile | null, parentAdminProfile: ProfileByUserIdQuery_profileByUserId_parentAdminProfile | null, paymentMethods: Array<ProfileByUserIdQuery_profileByUserId_paymentMethods> | null, paymentMethodDefaults: ProfileByUserIdQuery_profileByUserId_paymentMethodDefaults | null, associatedStudents: ProfileByUserIdQuery_profileByUserId_associatedStudents | null, staffProfile: ProfileByUserIdQuery_profileByUserId_staffProfile | null, staffPermissionGroups: Array<ProfileByUserIdQuery_profileByUserId_staffPermissionGroups> | null, staffPermissionOverrides: Array<ProfileByUserIdQuery_profileByUserId_staffPermissionOverrides> | null, meetingConfigs: Array<ProfileByUserIdQuery_profileByUserId_meetingConfigs> | null, assignedStudents: ProfileByUserIdQuery_profileByUserId_assignedStudents | null };

export type ProfileByUserIdQuery = { profileByUserId: ProfileByUserIdQuery_profileByUserId | null };


export type ProfileByUserIdQueryVariables = Exact<{
  userId: string;
}>;

export type UpdateOwnProfileMutation_updateOwnProfile_teacherOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, countryCode: string | null, nationalId: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, totalClasses: number | null };

export type UpdateOwnProfileMutation_updateOwnProfile_parentOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null };

export type UpdateOwnProfileMutation_updateOwnProfile_staffProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UpdateOwnProfileMutation_updateOwnProfile_staffProfile = { id: string | null, userId: string | null, staffProfileId: string | null, name: string | null, email: string | null, phone: string | null, status: AccountStatus | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: UpdateOwnProfileMutation_updateOwnProfile_staffProfile_displayAmount | null };

export type UpdateOwnProfileMutation_updateOwnProfile = { id: string | null, userId: string | null, audience: ProfileAudience | null, scope: ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: CurrencyCode | null, timezone: IanaTimezone | null, teacherOwnProfile: UpdateOwnProfileMutation_updateOwnProfile_teacherOwnProfile | null, parentOwnProfile: UpdateOwnProfileMutation_updateOwnProfile_parentOwnProfile | null, staffProfile: UpdateOwnProfileMutation_updateOwnProfile_staffProfile | null };

export type UpdateOwnProfileMutation = { updateOwnProfile: UpdateOwnProfileMutation_updateOwnProfile | null };


export type UpdateOwnProfileMutationVariables = Exact<{
  input: UpdateOwnProfileInput;
}>;

export type UpdateUserProfileMutation_updateUserProfile_teacherAdminProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, nationalId: string | null, nationality: string | null, countryCode: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null };

export type UpdateUserProfileMutation_updateUserProfile_parentAdminProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UpdateUserProfileMutation_updateUserProfile_parentAdminProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: CurrencyCode | null, timezone: IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: UpdateUserProfileMutation_updateUserProfile_parentAdminProfile_displayAmount | null };

export type UpdateUserProfileMutation_updateUserProfile_paymentMethods = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_details | null };

export type UpdateUserProfileMutation_updateUserProfile_paymentMethodDefaults = { payinDefault: PaymentMethodDefaultsFieldsFragment_payinDefault | null, payoutDefault: PaymentMethodDefaultsFieldsFragment_payoutDefault | null };

export type UpdateUserProfileMutation_updateUserProfile_staffProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type UpdateUserProfileMutation_updateUserProfile_staffProfile = { id: string | null, userId: string | null, staffProfileId: string | null, name: string | null, email: string | null, phone: string | null, status: AccountStatus | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: UpdateUserProfileMutation_updateUserProfile_staffProfile_displayAmount | null };

export type UpdateUserProfileMutation_updateUserProfile = { id: string | null, userId: string | null, audience: ProfileAudience | null, scope: ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: CurrencyCode | null, teacherAdminProfile: UpdateUserProfileMutation_updateUserProfile_teacherAdminProfile | null, parentAdminProfile: UpdateUserProfileMutation_updateUserProfile_parentAdminProfile | null, paymentMethods: Array<UpdateUserProfileMutation_updateUserProfile_paymentMethods> | null, paymentMethodDefaults: UpdateUserProfileMutation_updateUserProfile_paymentMethodDefaults | null, staffProfile: UpdateUserProfileMutation_updateUserProfile_staffProfile | null };

export type UpdateUserProfileMutation = { updateUserProfile: UpdateUserProfileMutation_updateUserProfile | null };


export type UpdateUserProfileMutationVariables = Exact<{
  userId: string;
  input: UpdateUserProfileInput;
}>;

export type StudentMonthlyReportQuery_studentMonthlyReport = { id: string | null, studentId: string | null, studentName: string | null, year: number | null, month: number | null, totalLessons: number | null, completedLessons: number | null, cancelledLessons: number | null, presentCount: number | null, absentCount: number | null, lateCount: number | null, totalHours: number | null, creditsPurchased: number | null, creditsDeducted: number | null, creditsRefunded: number | null, creditsBalance: number | null };

export type StudentMonthlyReportQuery = { studentMonthlyReport: StudentMonthlyReportQuery_studentMonthlyReport };


export type StudentMonthlyReportQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;

export type GenerateAttendanceReportQuery_generateAttendanceReport_rows_paidAmounts_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type GenerateAttendanceReportQuery_generateAttendanceReport_rows_paidAmounts = { id: string | null, amount: string | null, currency: CurrencyCode | null, displayAmount: GenerateAttendanceReportQuery_generateAttendanceReport_rows_paidAmounts_displayAmount | null };

export type GenerateAttendanceReportQuery_generateAttendanceReport_rows = { id: string | null, groupKey: string | null, groupLabel: string | null, takenClasses: number | null, absentClasses: number | null, leaveClasses: number | null, pendingClasses: number | null, totalHours: number | null, engagementGrowth: number | null, paidAmounts: Array<GenerateAttendanceReportQuery_generateAttendanceReport_rows_paidAmounts> | null };

export type GenerateAttendanceReportQuery_generateAttendanceReport = { engagementGrowth: number | null, rows: Array<GenerateAttendanceReportQuery_generateAttendanceReport_rows> | null };

export type GenerateAttendanceReportQuery = { generateAttendanceReport: GenerateAttendanceReportQuery_generateAttendanceReport | null };


export type GenerateAttendanceReportQueryVariables = Exact<{
  filters: AttendanceReportFiltersInput;
}>;

export type DeleteBookMutation = { deleteBook: boolean | null };


export type DeleteBookMutationVariables = Exact<{
  id: string | number;
}>;

export type LearningResourceRowFragment = { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null };

export type LearningResourcesQuery_learningResources = { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null };

export type LearningResourcesQuery = { learningResources: Array<LearningResourcesQuery_learningResources> | null };


export type LearningResourcesQueryVariables = Exact<{
  searchQuery: string | null | undefined;
}>;

export type UploadLearningResourceMutation_uploadLearningResource = { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null };

export type UploadLearningResourceMutation = { uploadLearningResource: UploadLearningResourceMutation_uploadLearningResource | null };


export type UploadLearningResourceMutationVariables = Exact<{
  input: ResourceUploadInput;
}>;

export type PrepareUploadMutation_prepareUpload = { id: string, url: string, uploadType: UploadType };

export type PrepareUploadMutation = { prepareUpload: PrepareUploadMutation_prepareUpload | null };


export type PrepareUploadMutationVariables = Exact<{
  input: UploadPreparationInput;
}>;

export type DeleteLearningResourceMutation = { deleteLearningResource: boolean | null };


export type DeleteLearningResourceMutationVariables = Exact<{
  id: string | number;
}>;

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_pageInfo = { count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers_gaps = { id: string | null, teacherId: string | null, teacherName: string | null, teacherGender: string | null, dayOfWeek: DayOfWeek | null, calendarDate: string | null, gapStartTime: string | null, gapEndTime: string | null, timezone: IanaTimezone | null };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers = { id: string | null, name: string | null, gender: Gender | null, timezone: IanaTimezone | null, availableDaysCount: number | null, gaps: Array<SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers_gaps> | null };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability = { id: string | null, totalGaps: number | null, totalCount: number | null, pageInfo: SearchTeacherAvailabilityQuery_searchTeacherAvailability_pageInfo | null, teachers: Array<SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers> | null };

export type SearchTeacherAvailabilityQuery = { searchTeacherAvailability: SearchTeacherAvailabilityQuery_searchTeacherAvailability | null };


export type SearchTeacherAvailabilityQueryVariables = Exact<{
  input: AvailabilitySearchInput;
}>;

export type AvailableClassSlotsQuery_availableClassSlots = { id: string | null, teacherId: string | null, startAt: string | null, endAt: string | null, available: boolean | null };

export type AvailableClassSlotsQuery = { availableClassSlots: Array<AvailableClassSlotsQuery_availableClassSlots> | null };


export type AvailableClassSlotsQueryVariables = Exact<{
  studentId: string | number;
  date: string;
  teacherId: string | number | null | undefined;
  durationMinutes: number | null | undefined;
}>;

export type ClassInstanceQuery_classInstance_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type ClassInstanceQuery_classInstance_student = { id: string | null, name: string | null, grade: string | null, level: string | null, avatarUrl: string | null };

export type ClassInstanceQuery_classInstance_teacher = { id: string | null, name: string | null, title: string | null, avatarUrl: string | null };

export type ClassInstanceQuery_classInstance_performance = { id: string | null, engagementScore: number | null, assessmentProgress: number | null, assessmentTotal: number | null, focusLevel: string | null, sessionHealth: string | null, heatmapData: Array<unknown> | null, latencyMs: number | null, authorizationLabel: string | null, attendanceRate: number | null, avgGrade: string | null, lastClassDaysAgo: number | null };

export type ClassInstanceQuery_classInstance = { id: string | null, courseName: string | null, classType: ClassType | null, instanceId: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, status: ClassExecutionState | null, remarks: string | null, hasTimezoneMismatch: boolean | null, studentTimezone: IanaTimezone | null, teacherTimezone: IanaTimezone | null, recurringScheduleId: string | null, payrollCredited: boolean | null, isRescheduled: boolean | null, isFrozen: boolean | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, avatarUrl: string | null, subjectId: string | null, subjectName: string | null, subjectAvatarUrl: string | null, rateAmount: string | null, rateCurrency: CurrencyCode | null, isRateOverridden: boolean | null, rateSource: RateSource | null, effectiveMeeting: ClassInstanceQuery_classInstance_effectiveMeeting | null, student: ClassInstanceQuery_classInstance_student | null, teacher: ClassInstanceQuery_classInstance_teacher | null, performance: ClassInstanceQuery_classInstance_performance | null };

export type ClassInstanceQuery = { classInstance: ClassInstanceQuery_classInstance | null };


export type ClassInstanceQueryVariables = Exact<{
  id: string | number;
}>;

export type ClassStatusEventsQuery_classStatusEvents = { id: string | null, eventType: string | null, description: string | null, createdAt: string | null };

export type ClassStatusEventsQuery = { classStatusEvents: Array<ClassStatusEventsQuery_classStatusEvents> | null };


export type ClassStatusEventsQueryVariables = Exact<{
  classInstanceId: string | number;
}>;

export type ActivateClassMutation_activateClass = { id: string | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type ActivateClassMutation = { activateClass: ActivateClassMutation_activateClass | null };


export type ActivateClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type ActivateOverrideClassMutation_activateOverrideClass = { id: string | null, executionState: ClassExecutionState | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type ActivateOverrideClassMutation = { activateOverrideClass: ActivateOverrideClassMutation_activateOverrideClass | null };


export type ActivateOverrideClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type ResetClassMutation = { resetClass: boolean | null };


export type ResetClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type UpdateSessionStatusStartMutation_updateSessionStatusStart = { id: string | null, executionState: ClassExecutionState | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type UpdateSessionStatusStartMutation = { updateSessionStatusStart: UpdateSessionStatusStartMutation_updateSessionStatusStart | null };


export type UpdateSessionStatusStartMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type UpdateSessionStatusAbsentMutation_updateSessionStatusAbsent = { id: string | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, payrollCredited: boolean | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type UpdateSessionStatusAbsentMutation = { updateSessionStatusAbsent: UpdateSessionStatusAbsentMutation_updateSessionStatusAbsent | null };


export type UpdateSessionStatusAbsentMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_completedInstance = { id: string | null, outcome: ClassOutcome | null, isRescheduled: boolean | null };

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_rescheduledInstance = { id: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null };

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave = { id: string | null, completedInstanceId: string | null, rescheduledInstanceId: string | null, completedInstance: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_completedInstance | null, rescheduledInstance: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_rescheduledInstance | null };

export type UpdateSessionStatusLeaveMutation = { updateSessionStatusLeave: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave | null };


export type UpdateSessionStatusLeaveMutationVariables = Exact<{
  classInstanceId: string | number;
  leaveReason: string;
}>;

export type StopClassMutation_stopClass = { id: string | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type StopClassMutation = { stopClass: StopClassMutation_stopClass | null };


export type StopClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type RescheduleClassMutation_rescheduleClass = { id: string | null, status: ClassExecutionState | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null };

export type RescheduleClassMutation = { rescheduleClass: RescheduleClassMutation_rescheduleClass | null };


export type RescheduleClassMutationVariables = Exact<{
  classInstanceId: string | number;
  input: RescheduleClassInput;
}>;

export type DeleteClassInstanceMutation_deleteClassInstance = { success: boolean | null, warnings: Array<string> | null };

export type DeleteClassInstanceMutation = { deleteClassInstance: DeleteClassInstanceMutation_deleteClassInstance | null };


export type DeleteClassInstanceMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type OverrideClassInstanceRateMutation_overrideClassInstanceRate = { id: string | null, rateAmount: string | null, rateCurrency: CurrencyCode | null, isRateOverridden: boolean | null, rateSource: RateSource | null };

export type OverrideClassInstanceRateMutation = { overrideClassInstanceRate: OverrideClassInstanceRateMutation_overrideClassInstanceRate | null };


export type OverrideClassInstanceRateMutationVariables = Exact<{
  classInstanceId: string | number;
  rateAmount: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
}>;

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_updatedSessions = { id: string | null, studentId: string | null, teacherId: string | null, studentName: string | null, teacherName: string | null, fromTime: string | null, toTime: string | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_conflictGroups_conflicts = { id: string | null, studentName: string | null, message: string | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_conflictGroups = { id: string | null, teacherName: string | null, conflicts: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_conflictGroups_conflicts> | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_checkedEmptyItems = { id: string | null, studentName: string | null, reason: string | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate = { id: string | null, runId: string | null, updated: number | null, conflicts: number | null, unchanged: number | null, total: number | null, status: string | null, updatedSessions: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_updatedSessions> | null, conflictGroups: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_conflictGroups> | null, checkedEmptyItems: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_checkedEmptyItems> | null };

export type ExecuteDstBulkUpdateMutation = { executeDstBulkUpdate: ExecuteDstBulkUpdateMutation_executeDstBulkUpdate | null };


export type ExecuteDstBulkUpdateMutationVariables = Exact<{
  offsetMinutes: number;
  description: string;
}>;

export type CreateRecurringClassMutation_createRecurringClass = { id: string | null, recurringScheduleId: string | null, classInstanceIds: Array<string> | null, classInstanceCount: number | null, meetingUrl: string | null };

export type CreateRecurringClassMutation = { createRecurringClass: CreateRecurringClassMutation_createRecurringClass | null };


export type CreateRecurringClassMutationVariables = Exact<{
  input: CreateRecurringClassInput;
}>;

export type RecurringScheduleQuery_recurringSchedule_days = { id: string | null, dayOfWeek: string | null, startTime: string | null, isActive: boolean | null };

export type RecurringScheduleQuery_recurringSchedule = { id: string | null, studentId: string | null, studentName: string | null, teacherId: string | null, teacherName: string | null, durationMinutes: number | null, defaultStartTime: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, days: Array<RecurringScheduleQuery_recurringSchedule_days> | null };

export type RecurringScheduleQuery = { recurringSchedule: RecurringScheduleQuery_recurringSchedule | null };


export type RecurringScheduleQueryVariables = Exact<{
  id: string | number;
}>;

export type RecurringSchedulesQuery_recurringSchedules_rows = { id: string | null, studentId: string | null, studentName: string | null, teacherId: string | null, teacherName: string | null, durationMinutes: number | null, defaultStartTime: string | null, timezone: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, createdAt: string | null, updatedAt: string | null };

export type RecurringSchedulesQuery_recurringSchedules_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type RecurringSchedulesQuery_recurringSchedules = { id: string | null, totalCount: number | null, rows: Array<RecurringSchedulesQuery_recurringSchedules_rows> | null, pageInfo: RecurringSchedulesQuery_recurringSchedules_pageInfo | null };

export type RecurringSchedulesQuery = { recurringSchedules: RecurringSchedulesQuery_recurringSchedules | null };


export type RecurringSchedulesQueryVariables = Exact<{
  pagination: PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;

export type UpdateRecurringClassRateMutation_updateRecurringClassRate = { id: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null };

export type UpdateRecurringClassRateMutation = { updateRecurringClassRate: UpdateRecurringClassRateMutation_updateRecurringClassRate | null };


export type UpdateRecurringClassRateMutationVariables = Exact<{
  input: UpdateRecurringClassRateInput;
}>;

export type DeleteRecurringClassMutation = { deleteRecurringClass: boolean | null };


export type DeleteRecurringClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;

export type ClearWeeklyScheduleMutation = { clearWeeklySchedule: boolean | null };


export type ClearWeeklyScheduleMutationVariables = Exact<{
  teacherId: string | number;
}>;

export type AdminDashboardScheduleQuery_adminDashboardSchedule_metrics = { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_rows_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_rows_student = { id: string | null, name: string | null, avatarUrl: string | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_rows_teacher = { id: string | null, name: string | null, avatarUrl: string | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_rows = { id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, teacherTimezone: IanaTimezone | null, studentTimezone: IanaTimezone | null, duration: number | null, scheduledStartAt: string | null, scheduledEndAt: string | null, outcome: ClassOutcome | null, executionState: ClassExecutionState | null, isFrozen: boolean | null, meetingJoinUrl: string | null, courseName: string | null, avatarUrl: string | null, effectiveMeeting: AdminDashboardScheduleQuery_adminDashboardSchedule_rows_effectiveMeeting | null, student: AdminDashboardScheduleQuery_adminDashboardSchedule_rows_student | null, teacher: AdminDashboardScheduleQuery_adminDashboardSchedule_rows_teacher | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type AdminDashboardScheduleQuery_adminDashboardSchedule = { id: string | null, totalCount: number | null, metrics: AdminDashboardScheduleQuery_adminDashboardSchedule_metrics | null, rows: Array<AdminDashboardScheduleQuery_adminDashboardSchedule_rows> | null, pageInfo: AdminDashboardScheduleQuery_adminDashboardSchedule_pageInfo | null };

export type AdminDashboardScheduleQuery = { adminDashboardSchedule: AdminDashboardScheduleQuery_adminDashboardSchedule | null };


export type AdminDashboardScheduleQueryVariables = Exact<{
  input: AdminDashboardScheduleInput;
}>;

export type DailyScheduleMetricsQuery_dailyScheduleMetrics = { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type DailyScheduleMetricsQuery = { dailyScheduleMetrics: DailyScheduleMetricsQuery_dailyScheduleMetrics | null };


export type DailyScheduleMetricsQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
}>;

export type DailyScheduleListQuery_dailyScheduleList_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type DailyScheduleListQuery_dailyScheduleList_student = { id: string | null, name: string | null, avatarUrl: string | null };

export type DailyScheduleListQuery_dailyScheduleList_teacher = { id: string | null, name: string | null, avatarUrl: string | null };

export type DailyScheduleListQuery_dailyScheduleList = { id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, teacherTimezone: IanaTimezone | null, studentTimezone: IanaTimezone | null, duration: number | null, outcome: ClassOutcome | null, executionState: ClassExecutionState | null, isFrozen: boolean | null, meetingJoinUrl: string | null, courseName: string | null, avatarUrl: string | null, effectiveMeeting: DailyScheduleListQuery_dailyScheduleList_effectiveMeeting | null, student: DailyScheduleListQuery_dailyScheduleList_student | null, teacher: DailyScheduleListQuery_dailyScheduleList_teacher | null };

export type DailyScheduleListQuery = { dailyScheduleList: Array<DailyScheduleListQuery_dailyScheduleList> | null };


export type DailyScheduleListQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
  search: string | null | undefined;
  metricFilter: string | null | undefined;
}>;

export type RescheduleTrackingRowsQuery_rescheduleTrackingRows_rows = { id: string | null, originalClassId: string | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, status: LeaveRequestStatus | null, dateLabel: RescheduleDateLabel | null, remarks: string | null };

export type RescheduleTrackingRowsQuery_rescheduleTrackingRows_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type RescheduleTrackingRowsQuery_rescheduleTrackingRows = { id: string | null, totalCount: number | null, rows: Array<RescheduleTrackingRowsQuery_rescheduleTrackingRows_rows> | null, pageInfo: RescheduleTrackingRowsQuery_rescheduleTrackingRows_pageInfo | null };

export type RescheduleTrackingRowsQuery = { rescheduleTrackingRows: RescheduleTrackingRowsQuery_rescheduleTrackingRows | null };


export type RescheduleTrackingRowsQueryVariables = Exact<{
  search: string | null | undefined;
  status: LeaveRequestStatus | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type RescheduleTrackingMetricsQuery_rescheduleTrackingMetrics = { id: string | null, pending: number | null, approved: number | null, leave: number | null, rescheduled: number | null, cancelled: number | null };

export type RescheduleTrackingMetricsQuery = { rescheduleTrackingMetrics: RescheduleTrackingMetricsQuery_rescheduleTrackingMetrics | null };


export type RescheduleTrackingMetricsQueryVariables = Exact<{ [key: string]: never; }>;

export type StatusTrackingScheduleQuery_statusTrackingSchedule_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type StatusTrackingScheduleQuery_statusTrackingSchedule = { id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentAvatarUrl: string | null, studentStatus: StudentStatus | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, courseName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StatusTrackingScheduleQuery_statusTrackingSchedule_effectiveMeeting | null };

export type StatusTrackingScheduleQuery = { statusTrackingSchedule: Array<StatusTrackingScheduleQuery_statusTrackingSchedule> | null };


export type StatusTrackingScheduleQueryVariables = Exact<{
  date: string;
  search: string | null | undefined;
  viewerTimezone: IanaTimezone | null | undefined;
}>;

export type TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_classes_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_classes = { id: string | null, studentName: string | null, studentId: string | null, duration: number | null, startTime: string | null, day: string | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, subjectName: string | null, classType: ClassType | null, meetingJoinUrl: string | null, effectiveMeeting: TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_classes_effectiveMeeting | null };

export type TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid = { id: string | null, teacherId: string | null, weekStart: string | null, weekEnd: string | null, classes: Array<TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_classes> | null };

export type TeacherWeeklyScheduleGridQuery = { teacherWeeklyScheduleGrid: TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid | null };


export type TeacherWeeklyScheduleGridQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;

export type TeacherWorkloadMetricsQuery_teacherWorkloadMetrics = { id: string | null, weeklyHoursWorked: string | null, totalMinutes: number | null, classCount: number | null };

export type TeacherWorkloadMetricsQuery = { teacherWorkloadMetrics: TeacherWorkloadMetricsQuery_teacherWorkloadMetrics | null };


export type TeacherWorkloadMetricsQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;

export type EnvConfigEntryFieldsFragment = { id: string | null, key: string | null, category: string | null, displayStrategy: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSecret: boolean | null, excludeFromDb: boolean | null, value: string | null, source: string | null, hasDbOverride: boolean | null, editable: boolean | null };

export type EnvConfigUpsertResultFieldsFragment = { id: string | null, key: string | null, source: string | null, hasDbOverride: boolean | null, updatedAt: string | null };

export type EnvConfigDeleteResultFieldsFragment = { id: string | null, key: string | null, deleted: boolean | null, source: string | null };

export type EnvConfigEntriesQuery_envConfigEntries = { id: string | null, key: string | null, category: string | null, displayStrategy: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSecret: boolean | null, excludeFromDb: boolean | null, value: string | null, source: string | null, hasDbOverride: boolean | null, editable: boolean | null };

export type EnvConfigEntriesQuery = { envConfigEntries: Array<EnvConfigEntriesQuery_envConfigEntries> | null };


export type EnvConfigEntriesQueryVariables = Exact<{ [key: string]: never; }>;

export type UpsertEnvConfigEntryMutation_upsertEnvConfigEntry = { id: string | null, key: string | null, source: string | null, hasDbOverride: boolean | null, updatedAt: string | null };

export type UpsertEnvConfigEntryMutation = { upsertEnvConfigEntry: UpsertEnvConfigEntryMutation_upsertEnvConfigEntry | null };


export type UpsertEnvConfigEntryMutationVariables = Exact<{
  input: EnvConfigUpsertInput;
}>;

export type DeleteEnvConfigEntryMutation_deleteEnvConfigEntry = { id: string | null, key: string | null, deleted: boolean | null, source: string | null };

export type DeleteEnvConfigEntryMutation = { deleteEnvConfigEntry: DeleteEnvConfigEntryMutation_deleteEnvConfigEntry | null };


export type DeleteEnvConfigEntryMutationVariables = Exact<{
  key: string;
}>;

export type SystemSettingFieldsFragment = { id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type SystemSettingsQuery_systemSettings = { id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type SystemSettingsQuery = { systemSettings: Array<SystemSettingsQuery_systemSettings> | null };


export type SystemSettingsQueryVariables = Exact<{ [key: string]: never; }>;

export type SystemSettingQuery_systemSetting = { id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type SystemSettingQuery = { systemSetting: SystemSettingQuery_systemSetting | null };


export type SystemSettingQueryVariables = Exact<{
  key: string;
}>;

export type UpsertSystemSettingMutation_upsertSystemSetting = { id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type UpsertSystemSettingMutation = { upsertSystemSetting: UpsertSystemSettingMutation_upsertSystemSetting | null };


export type UpsertSystemSettingMutationVariables = Exact<{
  input: SystemSettingUpsertInput;
}>;

export type DeleteSystemSettingMutation = { deleteSystemSetting: boolean | null };


export type DeleteSystemSettingMutationVariables = Exact<{
  key: string;
}>;

export type MeetingIntegrationProviderFieldsFragment = { id: string | null, slug: string | null, kind: string | null, credentialsHealthy: boolean | null, lastTestedAt: string | null, connectedTeacherCount: number | null, reauthNeededCount: number | null, endpoints: Array<string> | null };

export type MeetingIntegrationConnectedAccountFieldsFragment = { id: string | null, userId: string | null, name: string | null, email: string | null, connectedAt: string | null, expiresAt: string | null, lastRefreshedAt: string | null, status: MeetingIntegrationConnectedAccountStatus | null, scopes: Array<string> | null };

export type TestMeetingConnectionResultFieldsFragment = { id: string | null, ok: boolean | null, latencyMs: number | null, mode: MeetingConnectionTestMode | null, testJoinUrl: string | null, deleted: boolean | null, upstreamResponseSummary: string | null, errorCode: string | null, errorMessage: string | null, rawUpstreamPayload: unknown, requiredScopes: Array<string> | null, grantedScopes: Array<string> | null };

export type AdminRevokeTokenResultFieldsFragment = { id: string | null, providerSlug: string | null, userId: string | null, revoked: boolean | null };

export type MeetingIntegrationProvidersQuery_meetingIntegrationProviders = { id: string | null, slug: string | null, kind: string | null, credentialsHealthy: boolean | null, lastTestedAt: string | null, connectedTeacherCount: number | null, reauthNeededCount: number | null, endpoints: Array<string> | null };

export type MeetingIntegrationProvidersQuery = { meetingIntegrationProviders: Array<MeetingIntegrationProvidersQuery_meetingIntegrationProviders> | null };


export type MeetingIntegrationProvidersQueryVariables = Exact<{ [key: string]: never; }>;

export type MeetingIntegrationConnectedAccountsQuery_meetingIntegrationConnectedAccounts = { id: string | null, userId: string | null, name: string | null, email: string | null, connectedAt: string | null, expiresAt: string | null, lastRefreshedAt: string | null, status: MeetingIntegrationConnectedAccountStatus | null, scopes: Array<string> | null };

export type MeetingIntegrationConnectedAccountsQuery = { meetingIntegrationConnectedAccounts: Array<MeetingIntegrationConnectedAccountsQuery_meetingIntegrationConnectedAccounts> | null };


export type MeetingIntegrationConnectedAccountsQueryVariables = Exact<{
  providerSlug: string;
}>;

export type TestMeetingProviderConnectionMutation_testMeetingProviderConnection = { id: string | null, ok: boolean | null, latencyMs: number | null, mode: MeetingConnectionTestMode | null, testJoinUrl: string | null, deleted: boolean | null, upstreamResponseSummary: string | null, errorCode: string | null, errorMessage: string | null, rawUpstreamPayload: unknown, requiredScopes: Array<string> | null, grantedScopes: Array<string> | null };

export type TestMeetingProviderConnectionMutation = { testMeetingProviderConnection: TestMeetingProviderConnectionMutation_testMeetingProviderConnection | null };


export type TestMeetingProviderConnectionMutationVariables = Exact<{
  input: TestMeetingConnectionInput;
}>;

export type AdminRevokeMeetingProviderTokenMutation_adminRevokeMeetingProviderToken = { id: string | null, providerSlug: string | null, userId: string | null, revoked: boolean | null };

export type AdminRevokeMeetingProviderTokenMutation = { adminRevokeMeetingProviderToken: AdminRevokeMeetingProviderTokenMutation_adminRevokeMeetingProviderToken | null };


export type AdminRevokeMeetingProviderTokenMutationVariables = Exact<{
  input: AdminRevokeTokenInput;
}>;

export type SessionConfigFieldsFragment = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type SessionConfigsQuery_sessionConfigs = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type SessionConfigsQuery = { sessionConfigs: Array<SessionConfigsQuery_sessionConfigs> | null };


export type SessionConfigsQueryVariables = Exact<{ [key: string]: never; }>;

export type SessionConfigQuery_sessionConfig = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type SessionConfigQuery = { sessionConfig: SessionConfigQuery_sessionConfig | null };


export type SessionConfigQueryVariables = Exact<{
  roleName: string;
}>;

export type UpsertSessionConfigMutation_upsertSessionConfig = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type UpsertSessionConfigMutation = { upsertSessionConfig: UpsertSessionConfigMutation_upsertSessionConfig | null };


export type UpsertSessionConfigMutationVariables = Exact<{
  input: SessionConfigUpsertInput;
}>;

export type DeleteSessionConfigMutation = { deleteSessionConfig: boolean | null };


export type DeleteSessionConfigMutationVariables = Exact<{
  roleName: string;
}>;

export type AuditLogFieldsFragment = { id: string | null, actorUserId: string | null, actorType: string | null, entityType: string | null, entityId: string | null, action: string | null, description: string | null, previousState: unknown, newState: unknown, changes: unknown, ipAddress: string | null, userAgent: string | null, metadata: unknown, createdAt: string | null };

export type SettingsAuditLogsQuery_settingsAuditLogs_logs = { id: string | null, actorUserId: string | null, actorType: string | null, entityType: string | null, entityId: string | null, action: string | null, description: string | null, previousState: unknown, newState: unknown, changes: unknown, ipAddress: string | null, userAgent: string | null, metadata: unknown, createdAt: string | null };

export type SettingsAuditLogsQuery_settingsAuditLogs = { id: string | null, total: number | null, hasMore: boolean | null, logs: Array<SettingsAuditLogsQuery_settingsAuditLogs_logs> | null };

export type SettingsAuditLogsQuery = { settingsAuditLogs: SettingsAuditLogsQuery_settingsAuditLogs | null };


export type SettingsAuditLogsQueryVariables = Exact<{
  filter: SettingsAuditLogFilter | null | undefined;
}>;

export type AppearanceFieldsSelectionFragment_colors_light = { primaryMain: string | null, secondaryMain: string | null };

export type AppearanceFieldsSelectionFragment_colors_dark = { primaryMain: string | null, secondaryMain: string | null };

export type AppearanceFieldsSelectionFragment_colors = { light: AppearanceFieldsSelectionFragment_colors_light | null, dark: AppearanceFieldsSelectionFragment_colors_dark | null };

export type AppearanceFieldsSelectionFragment = { logoUrl: string | null, siteName: string | null, siteTitle: string | null, siteDescription: string | null, defaultColorScheme: string | null, colors: AppearanceFieldsSelectionFragment_colors | null };

export type AppearanceSettingsFieldsSelectionFragment_draftFields = { logoUrl: string | null, siteName: string | null, siteTitle: string | null, siteDescription: string | null, defaultColorScheme: string | null, colors: AppearanceFieldsSelectionFragment_colors | null };

export type AppearanceSettingsFieldsSelectionFragment = { id: string | null, primaryMain: string | null, secondaryMain: string | null, logoUrl: string | null, siteName: string | null, siteTitle: string | null, siteDescription: string | null, defaultColorScheme: string | null, updatedByUserId: string | null, updatedAt: string | null, createdAt: string | null, draftFields: AppearanceSettingsFieldsSelectionFragment_draftFields | null };

export type AppearanceSettingsQuery_appearanceSettings = { id: string | null, primaryMain: string | null, secondaryMain: string | null, logoUrl: string | null, siteName: string | null, siteTitle: string | null, siteDescription: string | null, defaultColorScheme: string | null, updatedByUserId: string | null, updatedAt: string | null, createdAt: string | null, draftFields: AppearanceSettingsFieldsSelectionFragment_draftFields | null };

export type AppearanceSettingsQuery = { appearanceSettings: AppearanceSettingsQuery_appearanceSettings | null };


export type AppearanceSettingsQueryVariables = Exact<{
  draft?: boolean | null | undefined;
}>;

export type SaveAppearanceDraftMutation_saveAppearanceDraft = { id: string | null, primaryMain: string | null, secondaryMain: string | null, logoUrl: string | null, siteName: string | null, siteTitle: string | null, siteDescription: string | null, defaultColorScheme: string | null, updatedByUserId: string | null, updatedAt: string | null, createdAt: string | null, draftFields: AppearanceSettingsFieldsSelectionFragment_draftFields | null };

export type SaveAppearanceDraftMutation = { saveAppearanceDraft: SaveAppearanceDraftMutation_saveAppearanceDraft | null };


export type SaveAppearanceDraftMutationVariables = Exact<{
  input: AppearanceDraftInput;
  expectedUpdatedAt: string | null | undefined;
}>;

export type PublishAppearanceMutation_publishAppearance = { id: string | null, primaryMain: string | null, secondaryMain: string | null, logoUrl: string | null, siteName: string | null, siteTitle: string | null, siteDescription: string | null, defaultColorScheme: string | null, updatedByUserId: string | null, updatedAt: string | null, createdAt: string | null, draftFields: AppearanceSettingsFieldsSelectionFragment_draftFields | null };

export type PublishAppearanceMutation = { publishAppearance: PublishAppearanceMutation_publishAppearance | null };


export type PublishAppearanceMutationVariables = Exact<{
  expectedUpdatedAt: string | null | undefined;
}>;

export type ResetAppearanceDraftMutation_resetAppearanceDraft = { id: string | null, primaryMain: string | null, secondaryMain: string | null, logoUrl: string | null, siteName: string | null, siteTitle: string | null, siteDescription: string | null, defaultColorScheme: string | null, updatedByUserId: string | null, updatedAt: string | null, createdAt: string | null, draftFields: AppearanceSettingsFieldsSelectionFragment_draftFields | null };

export type ResetAppearanceDraftMutation = { resetAppearanceDraft: ResetAppearanceDraftMutation_resetAppearanceDraft | null };


export type ResetAppearanceDraftMutationVariables = Exact<{ [key: string]: never; }>;

export type SiteContentEntryFieldsFragment = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type SiteContentEntriesQuery_siteContentEntries = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type SiteContentEntriesQuery = { siteContentEntries: Array<SiteContentEntriesQuery_siteContentEntries> | null };


export type SiteContentEntriesQueryVariables = Exact<{ [key: string]: never; }>;

export type SiteContentEntryQuery_siteContentEntry = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type SiteContentEntryQuery = { siteContentEntry: SiteContentEntryQuery_siteContentEntry | null };


export type SiteContentEntryQueryVariables = Exact<{
  id: string | number;
}>;

export type UpsertSiteContentMutation_upsertSiteContent = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type UpsertSiteContentMutation = { upsertSiteContent: UpsertSiteContentMutation_upsertSiteContent | null };


export type UpsertSiteContentMutationVariables = Exact<{
  input: SiteContentUpsertInput;
}>;

export type UpdateSiteContentPublishStateMutation_updateSiteContentPublishState = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSiteContentPublishStateMutation = { updateSiteContentPublishState: UpdateSiteContentPublishStateMutation_updateSiteContentPublishState | null };


export type UpdateSiteContentPublishStateMutationVariables = Exact<{
  id: string | number;
  isPublished: boolean;
}>;

export type DeleteSiteContentMutation = { deleteSiteContent: boolean | null };


export type DeleteSiteContentMutationVariables = Exact<{
  id: string | number;
}>;

export type SettingsTimezoneFieldsFragment = { id: string | null, ianaId: string | null, name: string | null, baseOffsetMinutes: number | null, offsetMinutes: number | null, isDstSupported: boolean | null };

export type SettingsTimezonesQuery_settingsTimezones_rows = { id: string | null, ianaId: string | null, name: string | null, baseOffsetMinutes: number | null, offsetMinutes: number | null, isDstSupported: boolean | null };

export type SettingsTimezonesQuery_settingsTimezones_pageInfo = { count: number, currentPage: number, endCursor: string | null, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, startCursor: string | null, total: number };

export type SettingsTimezonesQuery_settingsTimezones = { id: string | null, totalCount: number | null, rows: Array<SettingsTimezonesQuery_settingsTimezones_rows> | null, pageInfo: SettingsTimezonesQuery_settingsTimezones_pageInfo | null };

export type SettingsTimezonesQuery = { settingsTimezones: SettingsTimezonesQuery_settingsTimezones | null };


export type SettingsTimezonesQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type EnsureDemoUsersMutation = { ensureDemoUsers: boolean | null };


export type EnsureDemoUsersMutationVariables = Exact<{ [key: string]: never; }>;

export type CreateTestEntitiesMutation_createTestEntities = { studentUserEmail: string | null, studentUserId: string | null, studentId: string | null, studentName: string | null, parentUserEmail: string | null, parentUserId: string | null, parentId: string | null, parentName: string | null, teacherUserEmail: string | null, teacherUserId: string | null, teacherId: string | null, teacherName: string | null };

export type CreateTestEntitiesMutation = { createTestEntities: CreateTestEntitiesMutation_createTestEntities | null };


export type CreateTestEntitiesMutationVariables = Exact<{
  prefix: string;
  classesRemaining: number | null | undefined;
}>;

export type CleanupTestEntitiesMutation = { cleanupTestEntities: boolean | null };


export type CleanupTestEntitiesMutationVariables = Exact<{
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  studentId: string;
  teacherId: string;
  parentId: string;
}>;

export type CreateTestGroupClassMutation_createTestGroupClass = { groupClassId: string | null };

export type CreateTestGroupClassMutation = { createTestGroupClass: CreateTestGroupClassMutation_createTestGroupClass | null };


export type CreateTestGroupClassMutationVariables = Exact<{
  classInstanceId: string;
  teacherName: string;
}>;

export type CleanupTestGroupClassMutation = { cleanupTestGroupClass: boolean | null };


export type CleanupTestGroupClassMutationVariables = Exact<{
  groupClassId: string;
}>;

export type CleanupTestManagerMutation = { cleanupTestManager: boolean | null };


export type CleanupTestManagerMutationVariables = Exact<{
  userId: string;
}>;

export type CreateTestSuperAdminMutation_createTestSuperAdmin = { userId: string | null, email: string | null };

export type CreateTestSuperAdminMutation = { createTestSuperAdmin: CreateTestSuperAdminMutation_createTestSuperAdmin | null };


export type CreateTestSuperAdminMutationVariables = Exact<{
  prefix: string;
}>;

export type CleanupTestSuperAdminMutation = { cleanupTestSuperAdmin: boolean | null };


export type CleanupTestSuperAdminMutationVariables = Exact<{
  userId: string;
}>;

export type WelcomeMessageQuery = { welcomeMessage: string | null };


export type WelcomeMessageQueryVariables = Exact<{ [key: string]: never; }>;

export type TranslatedMessageQuery = { translatedMessage: string | null };


export type TranslatedMessageQueryVariables = Exact<{
  key: string;
  namespace: string;
}>;

export type StudentDirectoryRowFragment = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryQuery_studentDirectory_rows = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryQuery_studentDirectory_pageInfo = { count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type StudentDirectoryQuery_studentDirectory = { id: string | null, totalCount: number | null, rows: Array<StudentDirectoryQuery_studentDirectory_rows> | null, pageInfo: StudentDirectoryQuery_studentDirectory_pageInfo | null };

export type StudentDirectoryQuery = { studentDirectory: StudentDirectoryQuery_studentDirectory | null };


export type StudentDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  orderBy: Array<StudentsOrderByClause> | StudentsOrderByClause | null | undefined;
  filterArgs: StudentFilterArgs | null | undefined;
}>;

export type StudentsDirectoryQuery_studentsDirectory = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentsDirectoryQuery = { studentsDirectory: Array<StudentsDirectoryQuery_studentsDirectory> };


export type StudentsDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
}>;

export type StudentClassHistoryQuery_studentClassHistory_metrics = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentClassHistoryQuery_studentClassHistory_sessions_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type StudentClassHistoryQuery_studentClassHistory_sessions = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, isFrozen: boolean | null, instructor: string | null, teacherId: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: StudentClassHistoryQuery_studentClassHistory_sessions_effectiveMeeting | null };

export type StudentClassHistoryQuery_studentClassHistory = { id: string | null, studentName: string | null, metrics: StudentClassHistoryQuery_studentClassHistory_metrics | null, sessions: Array<StudentClassHistoryQuery_studentClassHistory_sessions> | null };

export type StudentClassHistoryQuery = { studentClassHistory: StudentClassHistoryQuery_studentClassHistory | null };


export type StudentClassHistoryQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;

export type StudentClassSessionDetailQuery_studentClassSessionDetail_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type StudentClassSessionDetailQuery_studentClassSessionDetail = { id: string | null, durationMinutes: number | null, executionState: string | null, outcome: string | null, remarks: string | null, meetingJoinUrl: string | null, teacherName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, effectiveMeeting: StudentClassSessionDetailQuery_studentClassSessionDetail_effectiveMeeting | null };

export type StudentClassSessionDetailQuery = { studentClassSessionDetail: StudentClassSessionDetailQuery_studentClassSessionDetail | null };


export type StudentClassSessionDetailQueryVariables = Exact<{
  classInstanceId: string | number;
}>;

export type ReassignStudentTeacherMutation_reassignStudentTeacher = { id: string | null, primaryTeacherId: string | null, version: number | null };

export type ReassignStudentTeacherMutation = { reassignStudentTeacher: ReassignStudentTeacherMutation_reassignStudentTeacher | null };


export type ReassignStudentTeacherMutationVariables = Exact<{
  studentId: string;
  newTeacherId: string;
  expectedVersion: number | null | undefined;
}>;

export type ChangeStudentStatusMutation_changeStudentStatus = { id: string | null, status: StudentStatus | null, version: number | null };

export type ChangeStudentStatusMutation = { changeStudentStatus: ChangeStudentStatusMutation_changeStudentStatus | null };


export type ChangeStudentStatusMutationVariables = Exact<{
  studentId: string;
  newStatus: StudentStatus;
  expectedVersion: number | null | undefined;
}>;

export type CreateStudentMutation_createStudent = { id: string | null, studentId: string | null, parentId: string | null, name: string | null, status: StudentStatus | null, primaryTeacherId: string | null };

export type CreateStudentMutation = { createStudent: CreateStudentMutation_createStudent | null };


export type CreateStudentMutationVariables = Exact<{
  input: StudentOnboardingInput;
}>;

export type StudentUpcomingClassFieldsFragment_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type StudentUpcomingClassFieldsFragment = { id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StudentUpcomingClassFieldsFragment_effectiveMeeting | null };

export type StudentHistoryMetricsFieldsFragment = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentHistorySessionFieldsFragment_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type StudentHistorySessionFieldsFragment = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, isFrozen: boolean | null, instructor: string | null, teacherId: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: StudentHistorySessionFieldsFragment_effectiveMeeting | null };

export type StudentProfileQuery_studentProfile_upcomingClasses_classes = { id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StudentUpcomingClassFieldsFragment_effectiveMeeting | null };

export type StudentProfileQuery_studentProfile_upcomingClasses = { id: string | null, studentId: string | null, studentName: string | null, status: StudentStatus | null, classes: Array<StudentProfileQuery_studentProfile_upcomingClasses_classes> | null };

export type StudentProfileQuery_studentProfile_classHistory_metrics = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentProfileQuery_studentProfile_classHistory_sessions = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, isFrozen: boolean | null, instructor: string | null, teacherId: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: StudentHistorySessionFieldsFragment_effectiveMeeting | null };

export type StudentProfileQuery_studentProfile_classHistory = { id: string | null, studentName: string | null, metrics: StudentProfileQuery_studentProfile_classHistory_metrics | null, sessions: Array<StudentProfileQuery_studentProfile_classHistory_sessions> | null };

export type StudentProfileQuery_studentProfile = { id: string | null, name: string | null, status: StudentStatus | null, avatarUrl: string | null, dateOfBirth: string | null, gender: Gender | null, language: AppLanguage | null, timezoneOverride: string | null, email: string | null, phone: string | null, timezone: IanaTimezone | null, displayCurrency: CurrencyCode | null, parentId: string | null, parentUserId: string | null, parentName: string | null, parentEmail: string | null, parentPhone: string | null, isAssociatedViewer: boolean | null, isOwnStudentProfile: boolean | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null, version: number | null, createdAt: string | null, updatedAt: string | null, upcomingClasses: StudentProfileQuery_studentProfile_upcomingClasses | null, classHistory: StudentProfileQuery_studentProfile_classHistory | null };

export type StudentProfileQuery = { studentProfile: StudentProfileQuery_studentProfile | null };


export type StudentProfileQueryVariables = Exact<{
  studentId: string | null | undefined;
  year: number | null | undefined;
  month: number | null | undefined;
  includeUpcomingClasses: boolean | null | undefined;
}>;

export type RecordStudentProfileEditMutation_recordStudentProfileEdit = { id: string | null, name: string | null, status: StudentStatus | null, avatarUrl: string | null, dateOfBirth: string | null, gender: Gender | null, language: AppLanguage | null, timezoneOverride: string | null, email: string | null, phone: string | null, parentPhone: string | null, version: number | null, updatedAt: string | null };

export type RecordStudentProfileEditMutation = { recordStudentProfileEdit: RecordStudentProfileEditMutation_recordStudentProfileEdit | null };


export type RecordStudentProfileEditMutationVariables = Exact<{
  input: StudentProfileEditInput;
}>;

export type StudentUpcomingClassesQuery_studentUpcomingClasses_classes_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type StudentUpcomingClassesQuery_studentUpcomingClasses_classes = { id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StudentUpcomingClassesQuery_studentUpcomingClasses_classes_effectiveMeeting | null };

export type StudentUpcomingClassesQuery_studentUpcomingClasses = { id: string | null, studentId: string | null, studentName: string | null, status: StudentStatus | null, classes: Array<StudentUpcomingClassesQuery_studentUpcomingClasses_classes> | null };

export type StudentUpcomingClassesQuery = { studentUpcomingClasses: StudentUpcomingClassesQuery_studentUpcomingClasses | null };


export type StudentUpcomingClassesQueryVariables = Exact<{
  studentId: string;
}>;

export type StudentsQuery_students_data = { id: string, name: string, avatarUrl: string | null };

export type StudentsQuery_students_pageInfo = { total: number };

export type StudentsQuery_students = { data: Array<StudentsQuery_students_data>, pageInfo: StudentsQuery_students_pageInfo };

export type StudentsQuery = { students: StudentsQuery_students };


export type StudentsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  orderBy: Array<StudentsOrderByClause> | StudentsOrderByClause | null | undefined;
  filterArgs: StudentFilterArgs | null | undefined;
}>;

export type StudentByIdQuery_studentById = { id: string | null, name: string | null, avatarUrl: string | null, status: StudentStatus | null, primaryTeacherId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, version: number | null, updatedAt: string | null };

export type StudentByIdQuery = { studentById: StudentByIdQuery_studentById | null };


export type StudentByIdQueryVariables = Exact<{
  studentId: string;
}>;

export type AdminSuggestionsQuery_adminSuggestions_rows = { id: string | null, parentId: string | null, parentUserId: string | null, submitterName: string | null, body: string | null, status: SuggestionStatus | null, adminResponse: string | null, duplicateOfId: string | null, duplicateOfBody: string | null, duplicateOfSubmitterName: string | null, responseCount: number | null, emailSentAt: string | null, createdAt: string | null, parentName: string | null };

export type AdminSuggestionsQuery_adminSuggestions_metrics = { id: string | null, pending: number | null, reviewed: number | null, duplicate: number | null, avgResponseTime: string | null, totalCount: number | null };

export type AdminSuggestionsQuery_adminSuggestions = { id: string | null, rows: Array<AdminSuggestionsQuery_adminSuggestions_rows> | null, metrics: AdminSuggestionsQuery_adminSuggestions_metrics | null };

export type AdminSuggestionsQuery = { adminSuggestions: AdminSuggestionsQuery_adminSuggestions | null };


export type AdminSuggestionsQueryVariables = Exact<{
  filter: SuggestionFilter;
}>;

export type SearchSuggestionsQuery_searchSuggestions = { id: string | null, submitterName: string | null, body: string | null, status: SuggestionStatus | null, parentName: string | null, createdAt: string | null };

export type SearchSuggestionsQuery = { searchSuggestions: Array<SearchSuggestionsQuery_searchSuggestions> | null };


export type SearchSuggestionsQueryVariables = Exact<{
  query: string;
  excludeId: string;
}>;

export type SubmitSuggestionMutation_submitSuggestion = { id: string | null, submitterName: string | null, body: string | null, createdAt: string | null };

export type SubmitSuggestionMutation = { submitSuggestion: SubmitSuggestionMutation_submitSuggestion | null };


export type SubmitSuggestionMutationVariables = Exact<{
  input: SubmitSuggestionInput;
}>;

export type MarkSuggestionReviewedMutation_markSuggestionReviewed = { id: string | null, emailSentAt: string | null };

export type MarkSuggestionReviewedMutation = { markSuggestionReviewed: MarkSuggestionReviewedMutation_markSuggestionReviewed | null };


export type MarkSuggestionReviewedMutationVariables = Exact<{
  suggestionId: string;
}>;

export type RespondToSuggestionMutation_respondToSuggestion = { id: string | null, adminResponse: string | null };

export type RespondToSuggestionMutation = { respondToSuggestion: RespondToSuggestionMutation_respondToSuggestion | null };


export type RespondToSuggestionMutationVariables = Exact<{
  input: RespondToSuggestionInput;
}>;

export type MarkSuggestionDuplicateMutation_markSuggestionDuplicate = { id: string | null, duplicateOfId: string | null };

export type MarkSuggestionDuplicateMutation = { markSuggestionDuplicate: MarkSuggestionDuplicateMutation_markSuggestionDuplicate | null };


export type MarkSuggestionDuplicateMutationVariables = Exact<{
  input: MarkSuggestionDuplicateInput;
}>;

export type DeleteSuggestionMutation = { deleteSuggestion: boolean | null };


export type DeleteSuggestionMutationVariables = Exact<{
  suggestionId: string;
}>;

export type SuggestionContributorStatsQuery_suggestionContributorStats_contributors = { id: string | null, name: string | null, suggestionCount: number | null };

export type SuggestionContributorStatsQuery_suggestionContributorStats = { id: string | null, uniqueContributorCount: number | null, contributors: Array<SuggestionContributorStatsQuery_suggestionContributorStats_contributors> | null };

export type SuggestionContributorStatsQuery = { suggestionContributorStats: SuggestionContributorStatsQuery_suggestionContributorStats | null };


export type SuggestionContributorStatsQueryVariables = Exact<{
  days: number;
}>;

export type SupervisorDashboardQuery_supervisorDashboard_pendingDuesSummary = { totalCount: number | null, totalAmount: number | null, currency: CurrencyCode | null };

export type SupervisorDashboardQuery_supervisorDashboard_monthlySnapshot = { year: number | null, month: number | null, label: string | null };

export type SupervisorDashboardQuery_supervisorDashboard = { supervisorName: string | null, pendingReviewCount: number | null, pendingDuesSummary: SupervisorDashboardQuery_supervisorDashboard_pendingDuesSummary | null, monthlySnapshot: SupervisorDashboardQuery_supervisorDashboard_monthlySnapshot | null };

export type SupervisorDashboardQuery = { supervisorDashboard: SupervisorDashboardQuery_supervisorDashboard | null };


export type SupervisorDashboardQueryVariables = Exact<{ [key: string]: never; }>;

export type TeacherDirectoryQuery_teacherDirectory_metrics = { id: string | null, activated: number | null, deactivated: number | null };

export type TeacherDirectoryQuery_teacherDirectory_rows = { id: string | null, userId: string | null, index: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: AccountStatus | null };

export type TeacherDirectoryQuery_teacherDirectory_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type TeacherDirectoryQuery_teacherDirectory = { id: string | null, totalTeachers: number | null, metrics: TeacherDirectoryQuery_teacherDirectory_metrics | null, rows: Array<TeacherDirectoryQuery_teacherDirectory_rows> | null, pageInfo: TeacherDirectoryQuery_teacherDirectory_pageInfo | null };

export type TeacherDirectoryQuery = { teacherDirectory: TeacherDirectoryQuery_teacherDirectory | null };


export type TeacherDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;

export type ManagerDirectoryQuery_managerDirectory_metrics = { id: string | null, totalAdmin: number | null, systemStaff: number | null, activeNow: number | null, alerts: number | null };

export type ManagerDirectoryQuery_managerDirectory_rows = { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null };

export type ManagerDirectoryQuery_managerDirectory_pageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ManagerDirectoryQuery_managerDirectory = { id: string | null, totalCount: number | null, metrics: ManagerDirectoryQuery_managerDirectory_metrics | null, rows: Array<ManagerDirectoryQuery_managerDirectory_rows> | null, pageInfo: ManagerDirectoryQuery_managerDirectory_pageInfo | null };

export type ManagerDirectoryQuery = { managerDirectory: ManagerDirectoryQuery_managerDirectory | null };


export type ManagerDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  roleFilter: string | null | undefined;
  statusFilter: string | null | undefined;
}>;

export type UpdateManagerProfileMutation_updateManagerProfile = { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null };

export type UpdateManagerProfileMutation = { updateManagerProfile: UpdateManagerProfileMutation_updateManagerProfile | null };


export type UpdateManagerProfileMutationVariables = Exact<{
  staffProfileId: string | number;
  input: UpdateManagerProfileInput;
}>;

export type OnboardingMetricsQuery_onboardingMetrics = { id: string | null, activeStaff: number | null, pendingApproval: number | null, avgOnboardingDays: number | null };

export type OnboardingMetricsQuery = { onboardingMetrics: OnboardingMetricsQuery_onboardingMetrics | null };


export type OnboardingMetricsQueryVariables = Exact<{ [key: string]: never; }>;

export type StaffDirectoryAutocompleteRowFragment = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type StaffDirectoryQuery_staffDirectory = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type StaffDirectoryQuery = { staffDirectory: Array<StaffDirectoryQuery_staffDirectory> };


export type StaffDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
  permissionGroupFilter: string | null | undefined;
}>;

export type CreateManagerMutation_createManager = { id: string | null, userId: string | null, staffProfileId: string | null, name: string | null, email: string | null, status: string | null, assignedGroupSlug: string | null };

export type CreateManagerMutation = { createManager: CreateManagerMutation_createManager | null };


export type CreateManagerMutationVariables = Exact<{
  input: ManagerOnboardingInput;
}>;

export type TeacherProfileForEditQuery_teacherProfileForEdit = { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null };

export type TeacherProfileForEditQuery = { teacherProfileForEdit: TeacherProfileForEditQuery_teacherProfileForEdit | null };


export type TeacherProfileForEditQueryVariables = Exact<{
  teacherId: string | number;
}>;

export type UpdateTeacherProfileMutation_updateTeacherProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, nationalId: string | null, nationality: string | null, countryCode: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null };

export type UpdateTeacherProfileMutation = { updateTeacherProfile: UpdateTeacherProfileMutation_updateTeacherProfile | null };


export type UpdateTeacherProfileMutationVariables = Exact<{
  teacherId: string | number;
  input: TeacherProfileUpdateInput;
}>;

export type TeacherDashboardQuery_teacherDashboard_metrics = { total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type TeacherDashboardQuery_teacherDashboard_scheduleRows_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type TeacherDashboardQuery_teacherDashboard_scheduleRows = { id: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, yourTimeFormatted: string | null, effectiveMeeting: TeacherDashboardQuery_teacherDashboard_scheduleRows_effectiveMeeting | null };

export type TeacherDashboardQuery_teacherDashboard_progressFeed = { id: string | null, studentId: string | null, studentName: string | null, scheduledTimeFormatted: string | null, durationMinutes: number | null, eventKind: TeacherProgressFeedEventKind | null, occurredAt: string | null };

export type TeacherDashboardQuery_teacherDashboard_pageInfo = { count: number, currentPage: number, firstItem: number | null, lastItem: number | null, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type TeacherDashboardQuery_teacherDashboard = { id: string | null, totalCount: number | null, metrics: TeacherDashboardQuery_teacherDashboard_metrics | null, scheduleRows: Array<TeacherDashboardQuery_teacherDashboard_scheduleRows> | null, progressFeed: Array<TeacherDashboardQuery_teacherDashboard_progressFeed> | null, pageInfo: TeacherDashboardQuery_teacherDashboard_pageInfo | null };

export type TeacherDashboardQuery = { teacherDashboard: TeacherDashboardQuery_teacherDashboard | null };


export type TeacherDashboardQueryVariables = Exact<{
  date: string;
  pagination: PaginationArgs | null | undefined;
}>;

export type CreateTeacherManualClassEntryMutation_createTeacherManualClassEntry = { id: string | null, status: ClassExecutionState | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null };

export type CreateTeacherManualClassEntryMutation = { createTeacherManualClassEntry: CreateTeacherManualClassEntryMutation_createTeacherManualClassEntry | null };


export type CreateTeacherManualClassEntryMutationVariables = Exact<{
  input: CreateManualClassEntryInput;
}>;

export type LogTeacherSupportRequestMutation_logTeacherSupportRequest = { id: string | null, success: boolean | null };

export type LogTeacherSupportRequestMutation = { logTeacherSupportRequest: LogTeacherSupportRequestMutation_logTeacherSupportRequest | null };


export type LogTeacherSupportRequestMutationVariables = Exact<{
  input: LogSupportRequestInput;
}>;

export type TeacherFutureScheduleQuery_teacherFutureSchedule_classes_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_classes = { id: string | null, courseName: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, isRescheduled: boolean | null, leaveRequestDisabled: boolean | null, leaveRequestDisabledReason: string | null, studentCount: number | null, location: string | null, subjectId: string | null, subjectName: string | null, classType: ClassType | null, executionState: string | null, outcome: string | null, avatarUrl: string | null, effectiveMeeting: TeacherFutureScheduleQuery_teacherFutureSchedule_classes_effectiveMeeting | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_importantNotes = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_supportContact = { id: string | null, name: string | null, role: string | null, avatarUrl: string | null, phone: string | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule = { id: string | null, leaveQuotaUsed: number | null, leaveQuotaTotal: number | null, totalClasses: number | null, classes: Array<TeacherFutureScheduleQuery_teacherFutureSchedule_classes> | null, importantNotes: Array<TeacherFutureScheduleQuery_teacherFutureSchedule_importantNotes> | null, supportContact: TeacherFutureScheduleQuery_teacherFutureSchedule_supportContact | null };

export type TeacherFutureScheduleQuery = { teacherFutureSchedule: TeacherFutureScheduleQuery_teacherFutureSchedule | null };


export type TeacherFutureScheduleQueryVariables = Exact<{
  teacherId: string | null | undefined;
}>;

export type TeacherHandbookUrlQuery_teacherHandbookUrl = { id: string | null, url: string | null };

export type TeacherHandbookUrlQuery = { teacherHandbookUrl: TeacherHandbookUrlQuery_teacherHandbookUrl | null };


export type TeacherHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;

export type TeacherPendingDuesQuery_teacherPendingDues = { id: string | null, teacherId: string | null, teacherName: string | null, teacherUserId: string | null, teacherAvatarUrl: string | null, classInstanceId: string | null, studentId: string | null, studentName: string | null, studentAvatarUrl: string | null, classDate: string | null, hours: string | null, amount: string | null, currency: CurrencyCode | null, status: TeacherDueStatus | null, approvedByUserId: string | null, approvedAt: string | null, teacherPaymentId: string | null, createdAt: string | null, updatedAt: string | null, rateSource: RateSource | null };

export type TeacherPendingDuesQuery = { teacherPendingDues: Array<TeacherPendingDuesQuery_teacherPendingDues> | null };


export type TeacherPendingDuesQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
}>;

export type TeacherPendingDuesSummaryQuery_teacherPendingDuesSummary = { totalCount: number | null, totalAmount: number | null, currency: CurrencyCode | null };

export type TeacherPendingDuesSummaryQuery = { teacherPendingDuesSummary: TeacherPendingDuesSummaryQuery_teacherPendingDuesSummary | null };


export type TeacherPendingDuesSummaryQueryVariables = Exact<{ [key: string]: never; }>;

export type TeacherMonthlyReportQuery_teacherMonthlyReport = { id: string | null, teacherId: string | null, teacherName: string | null, year: number | null, month: number | null, lessonsTaught: number | null, approvedCount: number | null, cancelledCount: number | null, totalAccruedHours: number | null, totalDueAmount: number | null, totalPaidAmount: number | null, currency: CurrencyCode | null };

export type TeacherMonthlyReportQuery = { teacherMonthlyReport: TeacherMonthlyReportQuery_teacherMonthlyReport };


export type TeacherMonthlyReportQueryVariables = Exact<{
  teacherId: string | number;
  year: number;
  month: number;
}>;

export type MarkTeacherDuesPaidMutation_markTeacherDuesPaid = { id: string | null, teacherId: string | null, teacherName: string | null, teacherUserId: string | null, teacherAvatarUrl: string | null, classInstanceId: string | null, studentId: string | null, studentName: string | null, studentAvatarUrl: string | null, classDate: string | null, hours: string | null, amount: string | null, currency: CurrencyCode | null, status: TeacherDueStatus | null, approvedByUserId: string | null, approvedAt: string | null, teacherPaymentId: string | null, createdAt: string | null, updatedAt: string | null };

export type MarkTeacherDuesPaidMutation = { markTeacherDuesPaid: Array<MarkTeacherDuesPaidMutation_markTeacherDuesPaid> | null };


export type MarkTeacherDuesPaidMutationVariables = Exact<{
  dueIds: Array<string | number> | string | number;
  teacherPaymentId: string | number;
}>;

export type TeacherImportantNoteFieldsFragment = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type CreateTeacherImportantNoteMutation_createTeacherImportantNote = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type CreateTeacherImportantNoteMutation = { createTeacherImportantNote: CreateTeacherImportantNoteMutation_createTeacherImportantNote | null };


export type CreateTeacherImportantNoteMutationVariables = Exact<{
  input: CreateTeacherNoteInput;
}>;

export type UpdateTeacherImportantNoteMutation_updateTeacherImportantNote = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type UpdateTeacherImportantNoteMutation = { updateTeacherImportantNote: UpdateTeacherImportantNoteMutation_updateTeacherImportantNote | null };


export type UpdateTeacherImportantNoteMutationVariables = Exact<{
  id: string | number;
  input: UpdateTeacherNoteInput;
}>;

export type DeleteTeacherImportantNoteMutation = { deleteTeacherImportantNote: boolean | null };


export type DeleteTeacherImportantNoteMutationVariables = Exact<{
  id: string | number;
}>;

export type CreateTeacherMutation_createTeacher = { userId: string | null, id: string | null, name: string | null, email: string | null, phone: string | null, status: string | null, gender: Gender | null, timezoneDisplay: string | null };

export type CreateTeacherMutation = { createTeacher: CreateTeacherMutation_createTeacher | null };


export type CreateTeacherMutationVariables = Exact<{
  input: TeacherOnboardingInput;
}>;

export type TeacherAssignedStudentsQuery_teacherAssignedStudents_rows = { id: string | null, name: string | null, status: StudentStatus | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null };

export type TeacherAssignedStudentsQuery_teacherAssignedStudents = { id: string | null, totalCount: number | null, rows: Array<TeacherAssignedStudentsQuery_teacherAssignedStudents_rows> | null };

export type TeacherAssignedStudentsQuery = { teacherAssignedStudents: TeacherAssignedStudentsQuery_teacherAssignedStudents | null };


export type TeacherAssignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;

export type TeacherOwnProfileQuery_teacherOwnProfile_displayAmount = { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null };

export type TeacherOwnProfileQuery_teacherOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: TeacherOwnProfileQuery_teacherOwnProfile_displayAmount | null };

export type TeacherOwnProfileQuery = { teacherOwnProfile: TeacherOwnProfileQuery_teacherOwnProfile | null };


export type TeacherOwnProfileQueryVariables = Exact<{ [key: string]: never; }>;

export type TeacherAssignedClassesQuery_teacherAssignedClasses_rows_effectiveMeeting = { id: string | null, joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null, supportsAutoGeneration: boolean | null };

export type TeacherAssignedClassesQuery_teacherAssignedClasses_rows = { id: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: TeacherAssignedClassesQuery_teacherAssignedClasses_rows_effectiveMeeting | null };

export type TeacherAssignedClassesQuery_teacherAssignedClasses = { id: string | null, totalCount: number | null, rows: Array<TeacherAssignedClassesQuery_teacherAssignedClasses_rows> | null };

export type TeacherAssignedClassesQuery = { teacherAssignedClasses: TeacherAssignedClassesQuery_teacherAssignedClasses | null };


export type TeacherAssignedClassesQueryVariables = Exact<{ [key: string]: never; }>;

export type TeachersQuery_teachers = { id: string | null, name: string | null, avatarUrl: string | null };

export type TeachersQuery = { teachers: Array<TeachersQuery_teachers> | null };


export type TeachersQueryVariables = Exact<{
  search: string;
  limit: number;
}>;

export type CreateGeneralUserMutation_createGeneralUser_user = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type CreateGeneralUserMutation_createGeneralUser = { id: string | null, assignedGroupSlug: string | null, user: CreateGeneralUserMutation_createGeneralUser_user | null };

export type CreateGeneralUserMutation = { createGeneralUser: CreateGeneralUserMutation_createGeneralUser | null };


export type CreateGeneralUserMutationVariables = Exact<{
  input: GeneralUserCreateInput;
}>;

export type UserFieldsFragment = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export type WhatsappAccountFieldsFragment = { id: string | null, wabaId: string | null, phoneNumberId: string | null, displayPhoneNumber: string | null, displayName: Partial<Record<'ar' | 'en', string>> | null, isActive: boolean | null, qualityRating: WhatsappQualityRating | null, portfolioMessagingLimitTier: WhatsappLimitTier | null, throughputLevel: string | null, maxPhoneNumbersPerBusiness: string | null, lastWebhookAt: string | null, createdAt: string | null, updatedAt: string | null };

export type WhatsappTemplateSnapshotFieldsFragment = { id: string | null, name: string | null, language: string | null, status: WhatsappTemplateStatus | null, category: WhatsappTemplateCategory | null, lastSyncedAt: string | null };

export type WhatsappAccountsQuery_whatsappAccounts = { id: string | null, wabaId: string | null, phoneNumberId: string | null, displayPhoneNumber: string | null, displayName: Partial<Record<'ar' | 'en', string>> | null, isActive: boolean | null, qualityRating: WhatsappQualityRating | null, portfolioMessagingLimitTier: WhatsappLimitTier | null, throughputLevel: string | null, maxPhoneNumbersPerBusiness: string | null, lastWebhookAt: string | null, createdAt: string | null, updatedAt: string | null };

export type WhatsappAccountsQuery = { whatsappAccounts: Array<WhatsappAccountsQuery_whatsappAccounts> | null };


export type WhatsappAccountsQueryVariables = Exact<{ [key: string]: never; }>;

export type IsUserWhatsappOptInQuery = { isUserWhatsappOptIn: boolean };


export type IsUserWhatsappOptInQueryVariables = Exact<{
  userId: string;
}>;

export type CreateWhatsappAccountMutation_createWhatsappAccount = { id: string | null, wabaId: string | null, phoneNumberId: string | null, displayPhoneNumber: string | null, displayName: Partial<Record<'ar' | 'en', string>> | null, isActive: boolean | null, qualityRating: WhatsappQualityRating | null, portfolioMessagingLimitTier: WhatsappLimitTier | null, throughputLevel: string | null, maxPhoneNumbersPerBusiness: string | null, lastWebhookAt: string | null, createdAt: string | null, updatedAt: string | null };

export type CreateWhatsappAccountMutation = { createWhatsappAccount: CreateWhatsappAccountMutation_createWhatsappAccount | null };


export type CreateWhatsappAccountMutationVariables = Exact<{
  input: WhatsappAccountCreateInput;
}>;

export type UpdateWhatsappAccountMutation_updateWhatsappAccount = { id: string | null };

export type UpdateWhatsappAccountMutation = { updateWhatsappAccount: UpdateWhatsappAccountMutation_updateWhatsappAccount | null };


export type UpdateWhatsappAccountMutationVariables = Exact<{
  id: string;
  input: WhatsappAccountUpdateInput;
}>;

export type DeleteWhatsappAccountMutation_deleteWhatsappAccount = { id: string | null };

export type DeleteWhatsappAccountMutation = { deleteWhatsappAccount: DeleteWhatsappAccountMutation_deleteWhatsappAccount | null };


export type DeleteWhatsappAccountMutationVariables = Exact<{
  id: string;
}>;

export type SetWhatsappAccessTokenMutation_setWhatsappAccessToken = { id: string | null };

export type SetWhatsappAccessTokenMutation = { setWhatsappAccessToken: SetWhatsappAccessTokenMutation_setWhatsappAccessToken | null };


export type SetWhatsappAccessTokenMutationVariables = Exact<{
  id: string;
  accessToken: string;
}>;

export type SetWhatsappTwoStepPinMutation_setWhatsappTwoStepPin = { id: string | null };

export type SetWhatsappTwoStepPinMutation = { setWhatsappTwoStepPin: SetWhatsappTwoStepPinMutation_setWhatsappTwoStepPin | null };


export type SetWhatsappTwoStepPinMutationVariables = Exact<{
  id: string;
  twoStepPin: string;
}>;

export type SetUserWhatsappOptInMutation_setUserWhatsappOptIn = { id: string | null };

export type SetUserWhatsappOptInMutation = { setUserWhatsappOptIn: SetUserWhatsappOptInMutation_setUserWhatsappOptIn | null };


export type SetUserWhatsappOptInMutationVariables = Exact<{
  userId: string;
  enabled: boolean;
  source: string | null | undefined;
}>;

export type SyncWhatsappAccountsFromMetaMutation_syncWhatsappAccountsFromMeta_accounts = { id: string | null, wabaId: string | null, phoneNumberId: string | null, displayPhoneNumber: string | null, displayName: Partial<Record<'ar' | 'en', string>> | null, isActive: boolean | null, qualityRating: WhatsappQualityRating | null, portfolioMessagingLimitTier: WhatsappLimitTier | null, throughputLevel: string | null, maxPhoneNumbersPerBusiness: string | null, lastWebhookAt: string | null, createdAt: string | null, updatedAt: string | null };

export type SyncWhatsappAccountsFromMetaMutation_syncWhatsappAccountsFromMeta_templates = { id: string | null, name: string | null, language: string | null, status: WhatsappTemplateStatus | null, category: WhatsappTemplateCategory | null, lastSyncedAt: string | null };

export type SyncWhatsappAccountsFromMetaMutation_syncWhatsappAccountsFromMeta = { id: string | null, accounts: Array<SyncWhatsappAccountsFromMetaMutation_syncWhatsappAccountsFromMeta_accounts> | null, templates: Array<SyncWhatsappAccountsFromMetaMutation_syncWhatsappAccountsFromMeta_templates> | null };

export type SyncWhatsappAccountsFromMetaMutation = { syncWhatsappAccountsFromMeta: SyncWhatsappAccountsFromMetaMutation_syncWhatsappAccountsFromMeta | null };


export type SyncWhatsappAccountsFromMetaMutationVariables = Exact<{ [key: string]: never; }>;

export type IsWhatsappConfiguredQuery = { isWhatsappConfigured: boolean };


export type IsWhatsappConfiguredQueryVariables = Exact<{ [key: string]: never; }>;

export const SupportedCurrencyFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedCurrencyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"decimals"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<SupportedCurrencyFieldsFragment, unknown>;
export const PaymentMethodDetailsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<PaymentMethodDetailsFieldsFragment, unknown>;
export const PaymentMethodTransactionSnapshotFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<PaymentMethodTransactionSnapshotFieldsFragment, unknown>;
export const UserPaymentMethodFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<UserPaymentMethodFieldsFragment, unknown>;
export const PaymentMethodDefaultsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDefaults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"payinDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<PaymentMethodDefaultsFieldsFragment, unknown>;
export const SupportedMobileWalletFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedMobileWalletFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWallet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"phoneRegion"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedMobileWalletFieldsFragment, unknown>;
export const SupportedPaymentLinkFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedPaymentLinkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedPaymentLinkFieldsFragment, unknown>;
export const SupportedOnlineAccountFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedOnlineAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"identifierKind"}},{"kind":"Field","name":{"kind":"Name","value":"identifierLabel"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedOnlineAccountFieldsFragment, unknown>;
export const QuotaFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QuotaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Quota"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"reservedClasses"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodType"}},{"kind":"Field","name":{"kind":"Name","value":"periodDays"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<QuotaFieldsFragment, unknown>;
export const ClassCategoryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<ClassCategoryFieldsFragment, unknown>;
export const ClassSubjectFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<ClassSubjectFieldsFragment, unknown>;
export const SubjectResourceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<SubjectResourceFieldsFragment, unknown>;
export const CronScheduleFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"concurrencyPolicy"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"retryBackoffSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronScheduleFieldsFragment, unknown>;
export const CronRunFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronRunFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"triggerSource"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"attempt"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"workerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronRunFieldsFragment, unknown>;
export const CronQueueStatsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronQueueStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronQueueStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"backend"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"inFlight"}},{"kind":"Field","name":{"kind":"Name","value":"failed"}},{"kind":"Field","name":{"kind":"Name","value":"byJobKind"}}]}}]} as unknown as DocumentNode<CronQueueStatsFieldsFragment, unknown>;
export const MeetingProviderFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MeetingProviderFieldsFragment, unknown>;
export const UserMeetingConfigFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"oauthTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserMeetingConfigFieldsFragment, unknown>;
export const ClassMeetingConfigFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ClassMeetingConfigFieldsFragment, unknown>;
export const ParentDirectoryAutocompleteRowFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<ParentDirectoryAutocompleteRowFragment, unknown>;
export const PermissionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Permission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]} as unknown as DocumentNode<PermissionFieldsFragment, unknown>;
export const PermissionGroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}}]}}]} as unknown as DocumentNode<PermissionGroupFieldsFragment, unknown>;
export const PermissionGroupDetailFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<PermissionGroupDetailFieldsFragment, unknown>;
export const UserOverrideFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserOverrideFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserOverride"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"permissionId"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedBy"}}]}}]} as unknown as DocumentNode<UserOverrideFieldsFragment, unknown>;
export const LearningResourceRowFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LearningResourceRowFragment, unknown>;
export const EnvConfigEntryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"displayStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSecret"}},{"kind":"Field","name":{"kind":"Name","value":"excludeFromDb"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}}]} as unknown as DocumentNode<EnvConfigEntryFieldsFragment, unknown>;
export const EnvConfigUpsertResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigUpsertResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigUpsertResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<EnvConfigUpsertResultFieldsFragment, unknown>;
export const EnvConfigDeleteResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigDeleteResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigDeleteResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]} as unknown as DocumentNode<EnvConfigDeleteResultFieldsFragment, unknown>;
export const SystemSettingFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SystemSettingFieldsFragment, unknown>;
export const MeetingIntegrationProviderFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingIntegrationProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingIntegrationProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"credentialsHealthy"}},{"kind":"Field","name":{"kind":"Name","value":"lastTestedAt"}},{"kind":"Field","name":{"kind":"Name","value":"connectedTeacherCount"}},{"kind":"Field","name":{"kind":"Name","value":"reauthNeededCount"}},{"kind":"Field","name":{"kind":"Name","value":"endpoints"}}]}}]} as unknown as DocumentNode<MeetingIntegrationProviderFieldsFragment, unknown>;
export const MeetingIntegrationConnectedAccountFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingIntegrationConnectedAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingIntegrationConnectedAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRefreshedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}}]} as unknown as DocumentNode<MeetingIntegrationConnectedAccountFieldsFragment, unknown>;
export const TestMeetingConnectionResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestMeetingConnectionResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TestMeetingConnectionResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"latencyMs"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"testJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamResponseSummary"}},{"kind":"Field","name":{"kind":"Name","value":"errorCode"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"rawUpstreamPayload"}},{"kind":"Field","name":{"kind":"Name","value":"requiredScopes"}},{"kind":"Field","name":{"kind":"Name","value":"grantedScopes"}}]}}]} as unknown as DocumentNode<TestMeetingConnectionResultFieldsFragment, unknown>;
export const AdminRevokeTokenResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminRevokeTokenResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminRevokeTokenResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"revoked"}}]}}]} as unknown as DocumentNode<AdminRevokeTokenResultFieldsFragment, unknown>;
export const SessionConfigFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SessionConfigFieldsFragment, unknown>;
export const AuditLogFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuditLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuditLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"actorUserId"}},{"kind":"Field","name":{"kind":"Name","value":"actorType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"previousState"}},{"kind":"Field","name":{"kind":"Name","value":"newState"}},{"kind":"Field","name":{"kind":"Name","value":"changes"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AuditLogFieldsFragment, unknown>;
export const AppearanceFieldsSelectionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceFields"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"colors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"light"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dark"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}}]}}]} as unknown as DocumentNode<AppearanceFieldsSelectionFragment, unknown>;
export const AppearanceSettingsFieldsSelectionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}},{"kind":"Field","name":{"kind":"Name","value":"draftFields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceFieldsSelection"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceFields"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"colors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"light"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dark"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}}]}}]} as unknown as DocumentNode<AppearanceSettingsFieldsSelectionFragment, unknown>;
export const SiteContentEntryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SiteContentEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SiteContentEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"isPublished"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SiteContentEntryFieldsFragment, unknown>;
export const SettingsTimezoneFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SettingsTimezoneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SettingsTimezone"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ianaId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseOffsetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"offsetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDstSupported"}}]}}]} as unknown as DocumentNode<SettingsTimezoneFieldsFragment, unknown>;
export const StudentDirectoryRowFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryRowFragment, unknown>;
export const EffectiveMeetingFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<EffectiveMeetingFieldsFragment, unknown>;
export const StudentUpcomingClassFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentUpcomingClassFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentUpcomingClass"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<StudentUpcomingClassFieldsFragment, unknown>;
export const StudentHistoryMetricsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistoryMetricsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistoryMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"hoursStudied"}},{"kind":"Field","name":{"kind":"Name","value":"performance"}}]}}]} as unknown as DocumentNode<StudentHistoryMetricsFieldsFragment, unknown>;
export const StudentHistorySessionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistorySessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistorySession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<StudentHistorySessionFieldsFragment, unknown>;
export const StaffDirectoryAutocompleteRowFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<StaffDirectoryAutocompleteRowFragment, unknown>;
export const TeacherImportantNoteFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<TeacherImportantNoteFieldsFragment, unknown>;
export const UserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
export const WhatsappAccountFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WhatsappAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wabaId"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumberId"}},{"kind":"Field","name":{"kind":"Name","value":"displayPhoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"qualityRating"}},{"kind":"Field","name":{"kind":"Name","value":"portfolioMessagingLimitTier"}},{"kind":"Field","name":{"kind":"Name","value":"throughputLevel"}},{"kind":"Field","name":{"kind":"Name","value":"maxPhoneNumbersPerBusiness"}},{"kind":"Field","name":{"kind":"Name","value":"lastWebhookAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<WhatsappAccountFieldsFragment, unknown>;
export const WhatsappTemplateSnapshotFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WhatsappTemplateSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappTemplateSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"}}]}}]} as unknown as DocumentNode<WhatsappTemplateSnapshotFieldsFragment, unknown>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const UserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"user"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<UserQuery, UserQueryVariables>;
export const UsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"users"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<UsersQuery, UsersQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const DemoLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"demoLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DemoLoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"demoLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<DemoLoginMutation, DemoLoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"refreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const ImpersonationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"impersonationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"impersonationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"targetUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<ImpersonationStatusQuery, ImpersonationStatusQueryVariables>;
export const StartImpersonationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"startImpersonation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startImpersonation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targetUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"impersonationSessionId"}},{"kind":"Field","name":{"kind":"Name","value":"targetUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]}}]}}]} as unknown as DocumentNode<StartImpersonationMutation, StartImpersonationMutationVariables>;
export const EndImpersonationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"endImpersonation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endImpersonation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<EndImpersonationMutation, EndImpersonationMutationVariables>;
export const PermissionGroupSimulationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"permissionGroupSimulationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionGroupSimulationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"groupSlug"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<PermissionGroupSimulationStatusQuery, PermissionGroupSimulationStatusQueryVariables>;
export const SimulatablePermissionGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"simulatablePermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulatablePermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<SimulatablePermissionGroupsQuery, SimulatablePermissionGroupsQueryVariables>;
export const StartPermissionGroupSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"startPermissionGroupSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startPermissionGroupSimulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"groupSlug"}}]}}]}}]} as unknown as DocumentNode<StartPermissionGroupSimulationMutation, StartPermissionGroupSimulationMutationVariables>;
export const EndPermissionGroupSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"endPermissionGroupSimulation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endPermissionGroupSimulation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<EndPermissionGroupSimulationMutation, EndPermissionGroupSimulationMutationVariables>;
export const ChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"changePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const AdminResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"adminResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminResetPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminResetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<AdminResetPasswordMutation, AdminResetPasswordMutationVariables>;
export const UnpaidInvoicesAlertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"unpaidInvoicesAlert"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpaidInvoicesAlert"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalOverdueInvoices"}},{"kind":"Field","name":{"kind":"Name","value":"totalOverdueAmount"}},{"kind":"Field","name":{"kind":"Name","value":"overdueAmountsByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalUnpaidAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"overdueCount"}},{"kind":"Field","name":{"kind":"Name","value":"oldestDueDate"}},{"kind":"Field","name":{"kind":"Name","value":"amountsByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<UnpaidInvoicesAlertQuery, UnpaidInvoicesAlertQueryVariables>;
export const CreateManualInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateManualInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InvoiceType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"issueDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dueDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSnapshot"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSource"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"billingMonths"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BillingMonthInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sendEmail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createManualInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"invoiceType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceType"}}},{"kind":"Argument","name":{"kind":"Name","value":"issueDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"issueDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"dueDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dueDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"exchangeRateSnapshot"},"value":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSnapshot"}}},{"kind":"Argument","name":{"kind":"Name","value":"exchangeRateSource"},"value":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSource"}}},{"kind":"Argument","name":{"kind":"Name","value":"billingMonths"},"value":{"kind":"Variable","name":{"kind":"Name","value":"billingMonths"}}},{"kind":"Argument","name":{"kind":"Name","value":"sendEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sendEmail"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]} as unknown as DocumentNode<CreateManualInvoiceMutation, CreateManualInvoiceMutationVariables>;
export const MarkInvoicePaidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkInvoicePaid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markInvoicePaid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"proofFileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<MarkInvoicePaidMutation, MarkInvoicePaidMutationVariables>;
export const SubmitPaymentProofDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitPaymentProof"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitPaymentProof"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"proofFileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<SubmitPaymentProofMutation, SubmitPaymentProofMutationVariables>;
export const ApprovePaymentProofDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApprovePaymentProof"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvePaymentProof"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<ApprovePaymentProofMutation, ApprovePaymentProofMutationVariables>;
export const RejectPaymentProofDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectPaymentProof"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rejectionReason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectPaymentProof"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rejectionReason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rejectionReason"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<RejectPaymentProofMutation, RejectPaymentProofMutationVariables>;
export const InvoicePaymentSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InvoicePaymentSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoicePaymentSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceId"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}}]}}]}}]} as unknown as DocumentNode<InvoicePaymentSubmissionQuery, InvoicePaymentSubmissionQueryVariables>;
export const DeleteInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>;
export const SendPaymentReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendPaymentReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendPaymentReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<SendPaymentReminderMutation, SendPaymentReminderMutationVariables>;
export const InvoicePaymentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InvoicePayments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoicePayments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentDate"}},{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodType"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodSnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transactionId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}}]} as unknown as DocumentNode<InvoicePaymentsQuery, InvoicePaymentsQueryVariables>;
export const RecordPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordPayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordPayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"userPaymentMethodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}}},{"kind":"Argument","name":{"kind":"Name","value":"transactionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentDate"}},{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodType"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodSnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}}]} as unknown as DocumentNode<RecordPaymentMutation, RecordPaymentMutationVariables>;
export const CreateTeacherPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTeacherPayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paymentDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isTestPayment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherPayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"userPaymentMethodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paymentDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paymentDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"isTestPayment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isTestPayment"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"paymentDate"}},{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodType"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodSnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isTestPayment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}}]} as unknown as DocumentNode<CreateTeacherPaymentMutation, CreateTeacherPaymentMutationVariables>;
export const StudentCreditBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentCreditBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentCreditBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]} as unknown as DocumentNode<StudentCreditBalanceQuery, StudentCreditBalanceQueryVariables>;
export const StudentCreditTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentCreditTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentCreditTransactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"changeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"creditedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<StudentCreditTransactionsQuery, StudentCreditTransactionsQueryVariables>;
export const RecordCreditPurchaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordCreditPurchase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hours"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordCreditPurchase"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"hours"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hours"}}},{"kind":"Argument","name":{"kind":"Name","value":"notes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"changeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"creditedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RecordCreditPurchaseMutation, RecordCreditPurchaseMutationVariables>;
export const SupportedCurrenciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SupportedCurrencies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportedCurrencies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedCurrencyFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedCurrencyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"decimals"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<SupportedCurrenciesQuery, SupportedCurrenciesQueryVariables>;
export const ActivateSupportedCurrencyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateSupportedCurrency"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrencyUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateSupportedCurrency"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedCurrencyFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedCurrencyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"decimals"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<ActivateSupportedCurrencyMutation, ActivateSupportedCurrencyMutationVariables>;
export const DeactivateSupportedCurrencyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateSupportedCurrency"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateSupportedCurrency"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}]}]}}]} as unknown as DocumentNode<DeactivateSupportedCurrencyMutation, DeactivateSupportedCurrencyMutationVariables>;
export const LatestExchangeRatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LatestExchangeRates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latestExchangeRates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"toCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveDate"}}]}}]}}]} as unknown as DocumentNode<LatestExchangeRatesQuery, LatestExchangeRatesQueryVariables>;
export const ExchangeRateHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExchangeRateHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"maxDays"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exchangeRateHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"maxDays"},"value":{"kind":"Variable","name":{"kind":"Name","value":"maxDays"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"toCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ExchangeRateHistoryQuery, ExchangeRateHistoryQueryVariables>;
export const LatestFxSyncRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LatestFxSyncRun"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latestFxSyncRun"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pairsWritten"}},{"kind":"Field","name":{"kind":"Name","value":"pairsFailed"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"triggerType"}},{"kind":"Field","name":{"kind":"Name","value":"triggeredByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}}]}}]}}]} as unknown as DocumentNode<LatestFxSyncRunQuery, LatestFxSyncRunQueryVariables>;
export const RefreshExchangeRatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshExchangeRates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"force"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshExchangeRates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"force"},"value":{"kind":"Variable","name":{"kind":"Name","value":"force"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"pairsWritten"}},{"kind":"Field","name":{"kind":"Name","value":"pairsFailed"}},{"kind":"Field","name":{"kind":"Name","value":"syncRunId"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}}]}}]}}]} as unknown as DocumentNode<RefreshExchangeRatesMutation, RefreshExchangeRatesMutationVariables>;
export const FxSyncHealthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FxSyncHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fxSyncHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isStale"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}}]}}]}}]} as unknown as DocumentNode<FxSyncHealthQuery, FxSyncHealthQueryVariables>;
export const FxProviderConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FxProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fxProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activeProvider"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByName"}}]}}]}}]} as unknown as DocumentNode<FxProviderConfigQuery, FxProviderConfigQueryVariables>;
export const UpdateFxProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFxProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FxProvider"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFxProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activeProvider"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByName"}}]}}]}}]} as unknown as DocumentNode<UpdateFxProviderMutation, UpdateFxProviderMutationVariables>;
export const UpsertManualExchangeRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertManualExchangeRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromCurrency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toCurrency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectiveDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertManualExchangeRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fromCurrency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromCurrency"}}},{"kind":"Argument","name":{"kind":"Name","value":"toCurrency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toCurrency"}}},{"kind":"Argument","name":{"kind":"Name","value":"rate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rate"}}},{"kind":"Argument","name":{"kind":"Name","value":"effectiveDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectiveDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fromCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"toCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveDate"}}]}}]}}]}}]} as unknown as DocumentNode<UpsertManualExchangeRateMutation, UpsertManualExchangeRateMutationVariables>;
export const CurrencyHedgesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrencyHedges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencyHedges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"hedgeType"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CurrencyHedgesQuery, CurrencyHedgesQueryVariables>;
export const CreateCurrencyHedgeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCurrencyHedge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hedgeType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCurrencyHedge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"hedgeType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hedgeType"}}},{"kind":"Argument","name":{"kind":"Name","value":"notes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"hedgeType"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateCurrencyHedgeMutation, CreateCurrencyHedgeMutationVariables>;
export const UpdateCurrencyHedgeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCurrencyHedge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hedgeType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrencyHedge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"hedgeType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hedgeType"}}},{"kind":"Argument","name":{"kind":"Name","value":"notes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"hedgeType"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateCurrencyHedgeMutation, UpdateCurrencyHedgeMutationVariables>;
export const DeleteCurrencyHedgeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCurrencyHedge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCurrencyHedge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCurrencyHedgeMutation, DeleteCurrencyHedgeMutationVariables>;
export const UserPaymentMethodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userPaymentMethods"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"direction"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethods"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"direction"},"value":{"kind":"Variable","name":{"kind":"Name","value":"direction"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserPaymentMethodsQuery, UserPaymentMethodsQueryVariables>;
export const UserPaymentMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userPaymentMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserPaymentMethodQuery, UserPaymentMethodQueryVariables>;
export const SupportedMobileWalletsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"supportedMobileWallets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CountryCode"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"direction"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportedMobileWallets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"direction"},"value":{"kind":"Variable","name":{"kind":"Name","value":"direction"}}},{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedMobileWalletFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedMobileWalletFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWallet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"phoneRegion"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedMobileWalletsQuery, SupportedMobileWalletsQueryVariables>;
export const SupportedPaymentLinksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"supportedPaymentLinks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"direction"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportedPaymentLinks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"direction"},"value":{"kind":"Variable","name":{"kind":"Name","value":"direction"}}},{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedPaymentLinkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedPaymentLinkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedPaymentLinksQuery, SupportedPaymentLinksQueryVariables>;
export const SupportedOnlineAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"supportedOnlineAccounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"direction"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportedOnlineAccounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"direction"},"value":{"kind":"Variable","name":{"kind":"Name","value":"direction"}}},{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedOnlineAccountFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedOnlineAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"identifierKind"}},{"kind":"Field","name":{"kind":"Name","value":"identifierLabel"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedOnlineAccountsQuery, SupportedOnlineAccountsQueryVariables>;
export const CreateUserPaymentMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createUserPaymentMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethodCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUserPaymentMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateUserPaymentMethodMutation, CreateUserPaymentMethodMutationVariables>;
export const UpdateUserPaymentMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateUserPaymentMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethodUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserPaymentMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateUserPaymentMethodMutation, UpdateUserPaymentMethodMutationVariables>;
export const DeleteUserPaymentMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteUserPaymentMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUserPaymentMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteUserPaymentMethodMutation, DeleteUserPaymentMethodMutationVariables>;
export const SetDefaultUserPaymentMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setDefaultUserPaymentMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultUserPaymentMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SetDefaultUserPaymentMethodMutation, SetDefaultUserPaymentMethodMutationVariables>;
export const VerifyBankTransferPaymentMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"verifyBankTransferPaymentMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyBankTransferPaymentMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<VerifyBankTransferPaymentMethodMutation, VerifyBankTransferPaymentMethodMutationVariables>;
export const CreateSupportedMobileWalletDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSupportedMobileWallet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWalletCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSupportedMobileWallet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedMobileWalletFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedMobileWalletFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWallet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"phoneRegion"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateSupportedMobileWalletMutation, CreateSupportedMobileWalletMutationVariables>;
export const UpdateSupportedMobileWalletDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSupportedMobileWallet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWalletUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSupportedMobileWallet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedMobileWalletFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedMobileWalletFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWallet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"phoneRegion"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateSupportedMobileWalletMutation, UpdateSupportedMobileWalletMutationVariables>;
export const DeactivateSupportedMobileWalletDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deactivateSupportedMobileWallet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateSupportedMobileWallet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedMobileWalletFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedMobileWalletFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWallet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"phoneRegion"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<DeactivateSupportedMobileWalletMutation, DeactivateSupportedMobileWalletMutationVariables>;
export const CreateSupportedPaymentLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSupportedPaymentLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLinkCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSupportedPaymentLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedPaymentLinkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedPaymentLinkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateSupportedPaymentLinkMutation, CreateSupportedPaymentLinkMutationVariables>;
export const UpdateSupportedPaymentLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSupportedPaymentLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLinkUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSupportedPaymentLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedPaymentLinkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedPaymentLinkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateSupportedPaymentLinkMutation, UpdateSupportedPaymentLinkMutationVariables>;
export const DeactivateSupportedPaymentLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deactivateSupportedPaymentLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateSupportedPaymentLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedPaymentLinkFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedPaymentLinkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<DeactivateSupportedPaymentLinkMutation, DeactivateSupportedPaymentLinkMutationVariables>;
export const CreateSupportedOnlineAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSupportedOnlineAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccountCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSupportedOnlineAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedOnlineAccountFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedOnlineAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"identifierKind"}},{"kind":"Field","name":{"kind":"Name","value":"identifierLabel"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateSupportedOnlineAccountMutation, CreateSupportedOnlineAccountMutationVariables>;
export const UpdateSupportedOnlineAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSupportedOnlineAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccountUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSupportedOnlineAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedOnlineAccountFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedOnlineAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"identifierKind"}},{"kind":"Field","name":{"kind":"Name","value":"identifierLabel"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateSupportedOnlineAccountMutation, UpdateSupportedOnlineAccountMutationVariables>;
export const DeactivateSupportedOnlineAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deactivateSupportedOnlineAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateSupportedOnlineAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedOnlineAccountFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedOnlineAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"identifierKind"}},{"kind":"Field","name":{"kind":"Name","value":"identifierLabel"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<DeactivateSupportedOnlineAccountMutation, DeactivateSupportedOnlineAccountMutationVariables>;
export const QuotaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Quota"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quota"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QuotaFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QuotaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Quota"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"reservedClasses"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodType"}},{"kind":"Field","name":{"kind":"Name","value":"periodDays"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<QuotaQuery, QuotaQueryVariables>;
export const QuotasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Quotas"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"QuotaPaginatedFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quotas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QuotaFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QuotaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Quota"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"reservedClasses"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodType"}},{"kind":"Field","name":{"kind":"Name","value":"periodDays"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<QuotasQuery, QuotasQueryVariables>;
export const QuotaLedgerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuotaLedger"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"quotaId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quotaLedger"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"quotaId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"quotaId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quotaId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"delta"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonNote"}},{"kind":"Field","name":{"kind":"Name","value":"actorUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<QuotaLedgerQuery, QuotaLedgerQueryVariables>;
export const CreateQuotaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateQuota"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QuotaSubmitInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createQuota"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QuotaFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QuotaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Quota"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"reservedClasses"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodType"}},{"kind":"Field","name":{"kind":"Name","value":"periodDays"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateQuotaMutation, CreateQuotaMutationVariables>;
export const UpdateQuotaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateQuota"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QuotaUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateQuota"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QuotaFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QuotaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Quota"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"reservedClasses"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodType"}},{"kind":"Field","name":{"kind":"Name","value":"periodDays"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateQuotaMutation, UpdateQuotaMutationVariables>;
export const DeleteQuotaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteQuota"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteQuota"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<DeleteQuotaMutation, DeleteQuotaMutationVariables>;
export const StudentQuotasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentQuotas"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentQuotas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QuotaFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QuotaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Quota"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"reservedClasses"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodType"}},{"kind":"Field","name":{"kind":"Name","value":"periodDays"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentQuotasQuery, StudentQuotasQueryVariables>;
export const StudentOpenQuotasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentOpenQuotas"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentOpenQuotas"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QuotaFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QuotaFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Quota"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"reservedClasses"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodType"}},{"kind":"Field","name":{"kind":"Name","value":"periodDays"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentOpenQuotasQuery, StudentOpenQuotasQueryVariables>;
export const QuotaBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuotaBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quotaBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"totalActiveClasses"}},{"kind":"Field","name":{"kind":"Name","value":"totalRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"totalReserved"}},{"kind":"Field","name":{"kind":"Name","value":"breakdownByExpiration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quotaId"}},{"kind":"Field","name":{"kind":"Name","value":"quotaName"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}}]}}]}}]}}]} as unknown as DocumentNode<QuotaBalanceQuery, QuotaBalanceQueryVariables>;
export const UserBillingProfileSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserBillingProfileSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentBillingSummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingBalance"}},{"kind":"Field","name":{"kind":"Name","value":"paidThisTerm"}},{"kind":"Field","name":{"kind":"Name","value":"nextDueDate"}},{"kind":"Field","name":{"kind":"Name","value":"activeStudents"}},{"kind":"Field","name":{"kind":"Name","value":"pendingPaymentCount"}},{"kind":"Field","name":{"kind":"Name","value":"nextUnpaidInvoice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"outstandingByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paidThisTermByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UserBillingProfileSummaryQuery, UserBillingProfileSummaryQueryVariables>;
export const UserBillingProfileInvoiceHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserBillingProfileInvoiceHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentInvoiceHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"hasPaymentProof"}},{"kind":"Field","name":{"kind":"Name","value":"hasRejectedSubmission"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<UserBillingProfileInvoiceHistoryQuery, UserBillingProfileInvoiceHistoryQueryVariables>;
export const ClassCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<ClassCategoriesQuery, ClassCategoriesQueryVariables>;
export const CreateClassCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createClassCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategoryCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<CreateClassCategoryMutation, CreateClassCategoryMutationVariables>;
export const UpdateClassCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategoryUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<UpdateClassCategoryMutation, UpdateClassCategoryMutationVariables>;
export const DeleteClassCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteClassCategoryMutation, DeleteClassCategoryMutationVariables>;
export const ClassSubjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classSubjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classSubjects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"categoryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubjectResourceFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<ClassSubjectsQuery, ClassSubjectsQueryVariables>;
export const ClassSubjectByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classSubjectById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubjectResourceFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<ClassSubjectByIdQuery, ClassSubjectByIdQueryVariables>;
export const CreateClassSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createClassSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubjectCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<CreateClassSubjectMutation, CreateClassSubjectMutationVariables>;
export const UpdateClassSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubjectUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<UpdateClassSubjectMutation, UpdateClassSubjectMutationVariables>;
export const DeleteClassSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteClassSubjectMutation, DeleteClassSubjectMutationVariables>;
export const AttachSubjectResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"attachSubjectResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttachSubjectResourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachSubjectResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubjectResourceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<AttachSubjectResourceMutation, AttachSubjectResourceMutationVariables>;
export const DetachSubjectResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"detachSubjectResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"learningResourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"detachSubjectResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"subjectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"learningResourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"learningResourceId"}}}]}]}}]} as unknown as DocumentNode<DetachSubjectResourceMutation, DetachSubjectResourceMutationVariables>;
export const GroupClassAuditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"groupClassAudit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupClassAudit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"courseCode"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"originalDate"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"auditRemark"}},{"kind":"Field","name":{"kind":"Name","value":"auditLoggedAt"}},{"kind":"Field","name":{"kind":"Name","value":"registeredStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"students"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceStatus"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetingInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}},{"kind":"Field","name":{"kind":"Name","value":"communications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adminNote"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]}}]} as unknown as DocumentNode<GroupClassAuditQuery, GroupClassAuditQueryVariables>;
export const UpdateClassAdminNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassAdminNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassAdminNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"courseCode"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"originalDate"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"auditRemark"}},{"kind":"Field","name":{"kind":"Name","value":"auditLoggedAt"}},{"kind":"Field","name":{"kind":"Name","value":"registeredStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"students"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceStatus"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetingInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}},{"kind":"Field","name":{"kind":"Name","value":"communications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adminNote"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateClassAdminNoteMutation, UpdateClassAdminNoteMutationVariables>;
export const ResendClassNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"resendClassNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendClassNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<ResendClassNotificationsMutation, ResendClassNotificationsMutationVariables>;
export const LessonReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LessonReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<LessonReportQuery, LessonReportQueryVariables>;
export const LessonReportByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LessonReportById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonReportById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"reportId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<LessonReportByIdQuery, LessonReportByIdQueryVariables>;
export const PendingLessonReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PendingLessonReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingLessonReports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<PendingLessonReportsQuery, PendingLessonReportsQueryVariables>;
export const RecentApprovedLessonReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentApprovedLessonReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentApprovedLessonReports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<RecentApprovedLessonReportsQuery, RecentApprovedLessonReportsQueryVariables>;
export const StudentRecentLessonReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentRecentLessonReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentRecentLessonReports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<StudentRecentLessonReportsQuery, StudentRecentLessonReportsQueryVariables>;
export const LessonReportCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LessonReportCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lessonReportCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingCount"}}]}}]}}]} as unknown as DocumentNode<LessonReportCountQuery, LessonReportCountQueryVariables>;
export const SubmitLessonReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitLessonReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LessonReportSubmitInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitLessonReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubmitLessonReportMutation, SubmitLessonReportMutationVariables>;
export const ApproveLessonReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveLessonReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveLessonReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"reportId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ApproveLessonReportMutation, ApproveLessonReportMutationVariables>;
export const RejectLessonReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectLessonReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rejectionReason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectLessonReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"reportId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rejectionReason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rejectionReason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RejectLessonReportMutation, RejectLessonReportMutationVariables>;
export const SubmitStudentLessonReportReflectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitStudentLessonReportReflection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentNotes"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitStudentLessonReportReflection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentNotes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentNotes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubmitStudentLessonReportReflectionMutation, SubmitStudentLessonReportReflectionMutationVariables>;
export const ParentComplaintsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentComplaints"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentComplaints"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"complaints"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"responses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"emailSent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"responderName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentComplaintsQuery, ParentComplaintsQueryVariables>;
export const AdminComplaintQueueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminComplaintQueue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ComplaintQueueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminComplaintQueue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"responses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"responderName"}},{"kind":"Field","name":{"kind":"Name","value":"emailSent"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"unanswered"}},{"kind":"Field","name":{"kind":"Name","value":"answered"}},{"kind":"Field","name":{"kind":"Name","value":"avgResolutionTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<AdminComplaintQueueQuery, AdminComplaintQueueQueryVariables>;
export const SubmitComplaintDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitComplaint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ComplaintSubmitInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitComplaint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SubmitComplaintMutation, SubmitComplaintMutationVariables>;
export const RespondToComplaintDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RespondToComplaint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RespondToComplaintInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondToComplaint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"emailSent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"responderName"}}]}}]}}]} as unknown as DocumentNode<RespondToComplaintMutation, RespondToComplaintMutationVariables>;
export const DeleteComplaintDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteComplaint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complaintId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteComplaint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complaintId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complaintId"}}}]}]}}]} as unknown as DocumentNode<DeleteComplaintMutation, DeleteComplaintMutationVariables>;
export const CronSchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"cronSchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CronScheduleListInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronSchedules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronScheduleFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"concurrencyPolicy"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"retryBackoffSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronSchedulesQuery, CronSchedulesQueryVariables>;
export const CronRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"cronRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CronRunListInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronRunFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronRunFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"triggerSource"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"attempt"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"workerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronRunsQuery, CronRunsQueryVariables>;
export const CronQueueStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"cronQueueStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronQueueStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronQueueStatsFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronQueueStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronQueueStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"backend"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"inFlight"}},{"kind":"Field","name":{"kind":"Name","value":"failed"}},{"kind":"Field","name":{"kind":"Name","value":"byJobKind"}}]}}]} as unknown as DocumentNode<CronQueueStatsQuery, CronQueueStatsQueryVariables>;
export const CronScheduleCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cronScheduleCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CronScheduleSubmitInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronScheduleCreate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"concurrencyPolicy"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"retryBackoffSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronScheduleCreateMutation, CronScheduleCreateMutationVariables>;
export const CronScheduleUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cronScheduleUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CronScheduleUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronScheduleUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"concurrencyPolicy"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"retryBackoffSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronScheduleUpdateMutation, CronScheduleUpdateMutationVariables>;
export const CronSchedulePauseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cronSchedulePause"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronSchedulePause"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"concurrencyPolicy"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"retryBackoffSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronSchedulePauseMutation, CronSchedulePauseMutationVariables>;
export const CronScheduleResumeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cronScheduleResume"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronScheduleResume"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"concurrencyPolicy"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"retryBackoffSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronScheduleResumeMutation, CronScheduleResumeMutationVariables>;
export const CronScheduleDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cronScheduleDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CronScheduleDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronScheduleDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<CronScheduleDeleteMutation, CronScheduleDeleteMutationVariables>;
export const CronRunTriggerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cronRunTrigger"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CronRunTriggerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cronRunTrigger"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CronRunFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CronRunFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CronRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"jobKind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"triggerSource"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"attempt"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"workerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CronRunTriggerMutation, CronRunTriggerMutationVariables>;
export const MeetingProvidersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meetingProviders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingProviders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MeetingProvidersQuery, MeetingProvidersQueryVariables>;
export const MeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MeetingProviderQuery, MeetingProviderQueryVariables>;
export const UserMeetingConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userMeetingConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userMeetingConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"oauthTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserMeetingConfigsQuery, UserMeetingConfigsQueryVariables>;
export const UserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"oauthTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserMeetingConfigQuery, UserMeetingConfigQueryVariables>;
export const CreateMeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createMeetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProviderCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMeetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateMeetingProviderMutation, CreateMeetingProviderMutationVariables>;
export const UpdateMeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateMeetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProviderUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMeetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateMeetingProviderMutation, UpdateMeetingProviderMutationVariables>;
export const DeleteMeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteMeetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMeetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteMeetingProviderMutation, DeleteMeetingProviderMutationVariables>;
export const CreateUserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createUserMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfigCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUserMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"oauthTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateUserMeetingConfigMutation, CreateUserMeetingConfigMutationVariables>;
export const UpdateUserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateUserMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfigUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"oauthTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateUserMeetingConfigMutation, UpdateUserMeetingConfigMutationVariables>;
export const DeleteUserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteUserMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUserMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteUserMeetingConfigMutation, DeleteUserMeetingConfigMutationVariables>;
export const SetDefaultMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setDefaultMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"oauthTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SetDefaultMeetingConfigMutation, SetDefaultMeetingConfigMutationVariables>;
export const ClassMeetingConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classMeetingConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classMeetingConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ClassMeetingConfigsQuery, ClassMeetingConfigsQueryVariables>;
export const ClassMeetingConfigsWithStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classMeetingConfigsWithStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classMeetingConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrlStatus"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrlExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrlError"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ClassMeetingConfigsWithStatusQuery, ClassMeetingConfigsWithStatusQueryVariables>;
export const RecurringMeetingConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"recurringMeetingConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recurringScheduleId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recurringMeetingConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"recurringScheduleId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recurringScheduleId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<RecurringMeetingConfigsQuery, RecurringMeetingConfigsQueryVariables>;
export const CreateClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfigCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateClassMeetingConfigMutation, CreateClassMeetingConfigMutationVariables>;
export const UpdateClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfigUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateClassMeetingConfigMutation, UpdateClassMeetingConfigMutationVariables>;
export const DeleteClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteClassMeetingConfigMutation, DeleteClassMeetingConfigMutationVariables>;
export const SetDefaultClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setDefaultClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerKind"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerMetadata"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SetDefaultClassMeetingConfigMutation, SetDefaultClassMeetingConfigMutationVariables>;
export const GenerateMeetingUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"generateMeetingUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateMeetingUrlInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateMeetingUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<GenerateMeetingUrlMutation, GenerateMeetingUrlMutationVariables>;
export const ConnectMeetingProviderOAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"connectMeetingProviderOAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConnectMeetingProviderOAuthInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectMeetingProviderOAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorizeUrl"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]} as unknown as DocumentNode<ConnectMeetingProviderOAuthMutation, ConnectMeetingProviderOAuthMutationVariables>;
export const DisconnectMeetingProviderOAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"disconnectMeetingProviderOAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DisconnectMeetingProviderOAuthInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disconnectMeetingProviderOAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}}]}}]}}]} as unknown as DocumentNode<DisconnectMeetingProviderOAuthMutation, DisconnectMeetingProviderOAuthMutationVariables>;
export const MyConnectedMeetingProvidersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"myConnectedMeetingProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myConnectedMeetingProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<MyConnectedMeetingProvidersQuery, MyConnectedMeetingProvidersQueryVariables>;
export const NotificationAlertsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"notificationAlerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationAlerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"alerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]}}]} as unknown as DocumentNode<NotificationAlertsQuery, NotificationAlertsQueryVariables>;
export const MarkNotificationsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationsRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationsRead"}}]}}]} as unknown as DocumentNode<MarkNotificationsReadMutation, MarkNotificationsReadMutationVariables>;
export const MarkNotificationReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deliveryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deliveryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deliveryId"}}}]}]}}]} as unknown as DocumentNode<MarkNotificationReadMutation, MarkNotificationReadMutationVariables>;
export const NotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NotificationPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<NotificationPreferencesQuery, NotificationPreferencesQueryVariables>;
export const UpdateNotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNotificationPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPreferenceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotificationPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<UpdateNotificationPreferencesMutation, UpdateNotificationPreferencesMutationVariables>;
export const ParentInvoiceHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentInvoiceHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentInvoiceHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"hasPaymentProof"}},{"kind":"Field","name":{"kind":"Name","value":"hasRejectedSubmission"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentInvoiceHistoryQuery, ParentInvoiceHistoryQueryVariables>;
export const AdminInvoicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminInvoices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminInvoices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"hasPaymentProof"}},{"kind":"Field","name":{"kind":"Name","value":"hasRejectedSubmission"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<AdminInvoicesQuery, AdminInvoicesQueryVariables>;
export const AdminBillingSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminBillingSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminBillingSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalOutstanding"}},{"kind":"Field","name":{"kind":"Name","value":"pendingCount"}},{"kind":"Field","name":{"kind":"Name","value":"mtdRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"negativeBalanceCount"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"mtdRevenueByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminBillingSummaryQuery, AdminBillingSummaryQueryVariables>;
export const StudentCreditStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentCreditStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentCreditStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentEmail"}},{"kind":"Field","name":{"kind":"Name","value":"planType"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<StudentCreditStatusQuery, StudentCreditStatusQueryVariables>;
export const ParentBillingSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentBillingSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentBillingSummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingBalance"}},{"kind":"Field","name":{"kind":"Name","value":"paidThisTerm"}},{"kind":"Field","name":{"kind":"Name","value":"nextDueDate"}},{"kind":"Field","name":{"kind":"Name","value":"activeStudents"}},{"kind":"Field","name":{"kind":"Name","value":"pendingPaymentCount"}},{"kind":"Field","name":{"kind":"Name","value":"nextUnpaidInvoice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"outstandingByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paidThisTermByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ParentBillingSummaryQuery, ParentBillingSummaryQueryVariables>;
export const ParentDashboardScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDashboardSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDashboardSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentInitials"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"bookingStatus"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"classTimeFormatted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<ParentDashboardScheduleQuery, ParentDashboardScheduleQueryVariables>;
export const ParentDashboardMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDashboardMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDashboardMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalStudents"}},{"kind":"Field","name":{"kind":"Name","value":"todaysClasses"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvoicesCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvoicesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"performanceAvg"}},{"kind":"Field","name":{"kind":"Name","value":"performanceAvgMobile"}},{"kind":"Field","name":{"kind":"Name","value":"pendingMessages"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studentProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workshopPromo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}}]} as unknown as DocumentNode<ParentDashboardMetricsQuery, ParentDashboardMetricsQueryVariables>;
export const ParentDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lifecycleStatusFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"lifecycleStatusFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lifecycleStatusFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"onLeave"}},{"kind":"Field","name":{"kind":"Name","value":"onTrial"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"guardianOf"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidInvoices"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentDirectoryQuery, ParentDirectoryQueryVariables>;
export const ParentsDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentsDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentsDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRow"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<ParentsDirectoryQuery, ParentsDirectoryQueryVariables>;
export const ParentDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentDocuments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDocuments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"isProtected"}},{"kind":"Field","name":{"kind":"Name","value":"usageType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ParentDocumentsQuery, ParentDocumentsQueryVariables>;
export const LinkDocumentToParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkDocumentToParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"usageType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkDocumentToParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"usageType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"usageType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"isProtected"}},{"kind":"Field","name":{"kind":"Name","value":"usageType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<LinkDocumentToParentMutation, LinkDocumentToParentMutationVariables>;
export const ChangeParentLifecycleStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeParentLifecycleStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeParentLifecycleStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}}]}}]}}]} as unknown as DocumentNode<ChangeParentLifecycleStatusMutation, ChangeParentLifecycleStatusMutationVariables>;
export const CreateParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<CreateParentMutation, CreateParentMutationVariables>;
export const ParentAssignedStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]}}]} as unknown as DocumentNode<ParentAssignedStudentsQuery, ParentAssignedStudentsQueryVariables>;
export const ParentOwnProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}}]}}]}}]} as unknown as DocumentNode<ParentOwnProfileQuery, ParentOwnProfileQueryVariables>;
export const ParentHandbookUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<ParentHandbookUrlQuery, ParentHandbookUrlQueryVariables>;
export const ParentProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ParentProfileQuery, ParentProfileQueryVariables>;
export const ParentAssociatedStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentAssociatedStudents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentAssociatedStudents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ParentAssociatedStudentsQuery, ParentAssociatedStudentsQueryVariables>;
export const DeactivateParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}}]}}]}}]} as unknown as DocumentNode<DeactivateParentMutation, DeactivateParentMutationVariables>;
export const ReactivateParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReactivateParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reactivateParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}}]}}]}}]} as unknown as DocumentNode<ReactivateParentMutation, ReactivateParentMutationVariables>;
export const UpdateStudentQuotaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStudentQuota"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newClassesRemaining"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudentQuota"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newClassesRemaining"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newClassesRemaining"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<UpdateStudentQuotaMutation, UpdateStudentQuotaMutationVariables>;
export const PermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Permission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]} as unknown as DocumentNode<PermissionsQuery, PermissionsQueryVariables>;
export const PermissionGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"permissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionGroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}}]}}]} as unknown as DocumentNode<PermissionGroupsQuery, PermissionGroupsQueryVariables>;
export const PermissionGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"permissionGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionGroupDetailFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<PermissionGroupQuery, PermissionGroupQueryVariables>;
export const UserPermissionGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userPermissionGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPermissionGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<UserPermissionGroupsQuery, UserPermissionGroupsQueryVariables>;
export const UserOverridesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userOverrides"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userOverrides"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserOverrideFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserOverrideFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserOverride"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"permissionId"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedBy"}}]}}]} as unknown as DocumentNode<UserOverridesQuery, UserOverridesQueryVariables>;
export const EffectiveUserPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"effectiveUserPermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effectiveUserPermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<EffectiveUserPermissionsQuery, EffectiveUserPermissionsQueryVariables>;
export const CreatePermissionGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createPermissionGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePermissionGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPermissionGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionGroupDetailFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreatePermissionGroupMutation, CreatePermissionGroupMutationVariables>;
export const UpdatePermissionGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updatePermissionGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePermissionGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePermissionGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionGroupDetailFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<UpdatePermissionGroupMutation, UpdatePermissionGroupMutationVariables>;
export const DeletePermissionGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deletePermissionGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePermissionGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}]}]}}]} as unknown as DocumentNode<DeletePermissionGroupMutation, DeletePermissionGroupMutationVariables>;
export const AssignPermissionGroupToUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"assignPermissionGroupToUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AssignPermissionGroupToUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignPermissionGroupToUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<AssignPermissionGroupToUserMutation, AssignPermissionGroupToUserMutationVariables>;
export const RevokePermissionGroupFromUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"revokePermissionGroupFromUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RevokePermissionGroupFromUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokePermissionGroupFromUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<RevokePermissionGroupFromUserMutation, RevokePermissionGroupFromUserMutationVariables>;
export const BulkAssignUsersToGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"bulkAssignUsersToGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkAssignUsersToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}}}]}]}}]} as unknown as DocumentNode<BulkAssignUsersToGroupMutation, BulkAssignUsersToGroupMutationVariables>;
export const BulkRevokeUsersFromGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"bulkRevokeUsersFromGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkRevokeUsersFromGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}}}]}]}}]} as unknown as DocumentNode<BulkRevokeUsersFromGroupMutation, BulkRevokeUsersFromGroupMutationVariables>;
export const UpdateUserOverridesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateUserOverrides"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"overrides"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserOverrideInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserOverrides"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"overrides"},"value":{"kind":"Variable","name":{"kind":"Name","value":"overrides"}}}]}]}}]} as unknown as DocumentNode<UpdateUserOverridesMutation, UpdateUserOverridesMutationVariables>;
export const ProfileByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileByUserId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profileByUserId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacherAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodDefaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"associatedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffPermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffPermissionOverrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"permissionId"}},{"kind":"Field","name":{"kind":"Name","value":"permissionKey"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetingConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDefaults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"payinDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}}]} as unknown as DocumentNode<ProfileByUserIdQuery, ProfileByUserIdQueryVariables>;
export const UpdateOwnProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOwnProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOwnProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOwnProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOwnProfileMutation, UpdateOwnProfileMutationVariables>;
export const UpdateUserProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodDefaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDefaults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"payinDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}}]} as unknown as DocumentNode<UpdateUserProfileMutation, UpdateUserProfileMutationVariables>;
export const StudentMonthlyReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentMonthlyReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentMonthlyReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"totalLessons"}},{"kind":"Field","name":{"kind":"Name","value":"completedLessons"}},{"kind":"Field","name":{"kind":"Name","value":"cancelledLessons"}},{"kind":"Field","name":{"kind":"Name","value":"presentCount"}},{"kind":"Field","name":{"kind":"Name","value":"absentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lateCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalHours"}},{"kind":"Field","name":{"kind":"Name","value":"creditsPurchased"}},{"kind":"Field","name":{"kind":"Name","value":"creditsDeducted"}},{"kind":"Field","name":{"kind":"Name","value":"creditsRefunded"}},{"kind":"Field","name":{"kind":"Name","value":"creditsBalance"}}]}}]}}]} as unknown as DocumentNode<StudentMonthlyReportQuery, StudentMonthlyReportQueryVariables>;
export const GenerateAttendanceReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GenerateAttendanceReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttendanceReportFiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateAttendanceReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"groupKey"}},{"kind":"Field","name":{"kind":"Name","value":"groupLabel"}},{"kind":"Field","name":{"kind":"Name","value":"takenClasses"}},{"kind":"Field","name":{"kind":"Name","value":"absentClasses"}},{"kind":"Field","name":{"kind":"Name","value":"leaveClasses"}},{"kind":"Field","name":{"kind":"Name","value":"pendingClasses"}},{"kind":"Field","name":{"kind":"Name","value":"totalHours"}},{"kind":"Field","name":{"kind":"Name","value":"paidAmounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"engagementGrowth"}}]}},{"kind":"Field","name":{"kind":"Name","value":"engagementGrowth"}}]}}]}}]} as unknown as DocumentNode<GenerateAttendanceReportQuery, GenerateAttendanceReportQueryVariables>;
export const DeleteBookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteBookMutation, DeleteBookMutationVariables>;
export const LearningResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"learningResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"learningResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LearningResourceRow"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LearningResourcesQuery, LearningResourcesQueryVariables>;
export const UploadLearningResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"uploadLearningResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResourceUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadLearningResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LearningResourceRow"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UploadLearningResourceMutation, UploadLearningResourceMutationVariables>;
export const PrepareUploadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"prepareUpload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UploadPreparationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"prepareUpload"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"uploadType"}}]}}]}}]} as unknown as DocumentNode<PrepareUploadMutation, PrepareUploadMutationVariables>;
export const DeleteLearningResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLearningResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLearningResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteLearningResourceMutation, DeleteLearningResourceMutationVariables>;
export const SearchTeacherAvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchTeacherAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AvailabilitySearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchTeacherAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalGaps"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"availableDaysCount"}},{"kind":"Field","name":{"kind":"Name","value":"gaps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherGender"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"calendarDate"}},{"kind":"Field","name":{"kind":"Name","value":"gapStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"gapEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SearchTeacherAvailabilityQuery, SearchTeacherAvailabilityQueryVariables>;
export const AvailableClassSlotsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailableClassSlots"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"durationMinutes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableClassSlots"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"durationMinutes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"durationMinutes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"available"}}]}}]}}]} as unknown as DocumentNode<AvailableClassSlotsQuery, AvailableClassSlotsQueryVariables>;
export const ClassInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"hasTimezoneMismatch"}},{"kind":"Field","name":{"kind":"Name","value":"studentTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payrollCredited"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"rateAmount"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"isRateOverridden"}},{"kind":"Field","name":{"kind":"Name","value":"rateSource"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"grade"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"performance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"engagementScore"}},{"kind":"Field","name":{"kind":"Name","value":"assessmentProgress"}},{"kind":"Field","name":{"kind":"Name","value":"assessmentTotal"}},{"kind":"Field","name":{"kind":"Name","value":"focusLevel"}},{"kind":"Field","name":{"kind":"Name","value":"sessionHealth"}},{"kind":"Field","name":{"kind":"Name","value":"heatmapData"}},{"kind":"Field","name":{"kind":"Name","value":"latencyMs"}},{"kind":"Field","name":{"kind":"Name","value":"authorizationLabel"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgGrade"}},{"kind":"Field","name":{"kind":"Name","value":"lastClassDaysAgo"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<ClassInstanceQuery, ClassInstanceQueryVariables>;
export const ClassStatusEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classStatusEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classStatusEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ClassStatusEventsQuery, ClassStatusEventsQueryVariables>;
export const ActivateClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"activateClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<ActivateClassMutation, ActivateClassMutationVariables>;
export const ActivateOverrideClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"activateOverrideClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateOverrideClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<ActivateOverrideClassMutation, ActivateOverrideClassMutationVariables>;
export const ResetClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"resetClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<ResetClassMutation, ResetClassMutationVariables>;
export const UpdateSessionStatusStartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusStart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusStart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusStartMutation, UpdateSessionStatusStartMutationVariables>;
export const UpdateSessionStatusAbsentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusAbsent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusAbsent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"payrollCredited"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusAbsentMutation, UpdateSessionStatusAbsentMutationVariables>;
export const UpdateSessionStatusLeaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusLeave"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"leaveReason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusLeave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"leaveReason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"leaveReason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"completedInstance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledInstance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusLeaveMutation, UpdateSessionStatusLeaveMutationVariables>;
export const StopClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"stopClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<StopClassMutation, StopClassMutationVariables>;
export const RescheduleClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"rescheduleClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RescheduleClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}}]}}]} as unknown as DocumentNode<RescheduleClassMutation, RescheduleClassMutationVariables>;
export const DeleteClassInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"warnings"}}]}}]}}]} as unknown as DocumentNode<DeleteClassInstanceMutation, DeleteClassInstanceMutationVariables>;
export const OverrideClassInstanceRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"overrideClassInstanceRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rateAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rateCurrency"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overrideClassInstanceRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rateAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rateAmount"}}},{"kind":"Argument","name":{"kind":"Name","value":"rateCurrency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rateCurrency"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rateAmount"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"isRateOverridden"}},{"kind":"Field","name":{"kind":"Name","value":"rateSource"}}]}}]}}]} as unknown as DocumentNode<OverrideClassInstanceRateMutation, OverrideClassInstanceRateMutationVariables>;
export const ExecuteDstBulkUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"executeDstBulkUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offsetMinutes"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executeDstBulkUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"offsetMinutes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offsetMinutes"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"updated"}},{"kind":"Field","name":{"kind":"Name","value":"conflicts"}},{"kind":"Field","name":{"kind":"Name","value":"unchanged"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"fromTime"}},{"kind":"Field","name":{"kind":"Name","value":"toTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conflictGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"conflicts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"checkedEmptyItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}}]}}]}}]} as unknown as DocumentNode<ExecuteDstBulkUpdateMutation, ExecuteDstBulkUpdateMutationVariables>;
export const CreateRecurringClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createRecurringClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRecurringClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRecurringClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceIds"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceCount"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}}]}}]}}]} as unknown as DocumentNode<CreateRecurringClassMutation, CreateRecurringClassMutationVariables>;
export const RecurringScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"recurringSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recurringSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"defaultStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]} as unknown as DocumentNode<RecurringScheduleQuery, RecurringScheduleQueryVariables>;
export const RecurringSchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"recurringSchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recurringSchedules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"defaultStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<RecurringSchedulesQuery, RecurringSchedulesQueryVariables>;
export const UpdateRecurringClassRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateRecurringClassRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRecurringClassRateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecurringClassRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}}]}}]}}]} as unknown as DocumentNode<UpdateRecurringClassRateMutation, UpdateRecurringClassRateMutationVariables>;
export const DeleteRecurringClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteRecurringClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRecurringClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<DeleteRecurringClassMutation, DeleteRecurringClassMutationVariables>;
export const ClearWeeklyScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"clearWeeklySchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearWeeklySchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}]}]}}]} as unknown as DocumentNode<ClearWeeklyScheduleMutation, ClearWeeklyScheduleMutationVariables>;
export const AdminDashboardScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"adminDashboardSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminDashboardScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"yourTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTime"}},{"kind":"Field","name":{"kind":"Name","value":"studentTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"studentTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<AdminDashboardScheduleQuery, AdminDashboardScheduleQueryVariables>;
export const DailyScheduleMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dailyScheduleMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyScheduleMetrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}}]}}]} as unknown as DocumentNode<DailyScheduleMetricsQuery, DailyScheduleMetricsQueryVariables>;
export const DailyScheduleListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dailyScheduleList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metricFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyScheduleList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"metricFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metricFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"yourTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTime"}},{"kind":"Field","name":{"kind":"Name","value":"studentTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"studentTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<DailyScheduleListQuery, DailyScheduleListQueryVariables>;
export const RescheduleTrackingRowsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"rescheduleTrackingRows"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LeaveRequestStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleTrackingRows"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"originalClassId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dateLabel"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<RescheduleTrackingRowsQuery, RescheduleTrackingRowsQueryVariables>;
export const RescheduleTrackingMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"rescheduleTrackingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleTrackingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"approved"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"cancelled"}}]}}]}}]} as unknown as DocumentNode<RescheduleTrackingMetricsQuery, RescheduleTrackingMetricsQueryVariables>;
export const StatusTrackingScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"statusTrackingSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"viewerTimezone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"IanaTimezone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statusTrackingSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"viewerTimezone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"viewerTimezone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentInitials"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<StatusTrackingScheduleQuery, StatusTrackingScheduleQueryVariables>;
export const TeacherWeeklyScheduleGridDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherWeeklyScheduleGrid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherWeeklyScheduleGrid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<TeacherWeeklyScheduleGridQuery, TeacherWeeklyScheduleGridQueryVariables>;
export const TeacherWorkloadMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherWorkloadMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherWorkloadMetrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weeklyHoursWorked"}},{"kind":"Field","name":{"kind":"Name","value":"totalMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"classCount"}}]}}]}}]} as unknown as DocumentNode<TeacherWorkloadMetricsQuery, TeacherWorkloadMetricsQueryVariables>;
export const EnvConfigEntriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"envConfigEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"envConfigEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvConfigEntryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"displayStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSecret"}},{"kind":"Field","name":{"kind":"Name","value":"excludeFromDb"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}}]} as unknown as DocumentNode<EnvConfigEntriesQuery, EnvConfigEntriesQueryVariables>;
export const UpsertEnvConfigEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertEnvConfigEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEnvConfigEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvConfigUpsertResultFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigUpsertResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigUpsertResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpsertEnvConfigEntryMutation, UpsertEnvConfigEntryMutationVariables>;
export const DeleteEnvConfigEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteEnvConfigEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEnvConfigEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvConfigDeleteResultFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigDeleteResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigDeleteResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]} as unknown as DocumentNode<DeleteEnvConfigEntryMutation, DeleteEnvConfigEntryMutationVariables>;
export const SystemSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"systemSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SystemSettingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SystemSettingsQuery, SystemSettingsQueryVariables>;
export const SystemSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"systemSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SystemSettingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SystemSettingQuery, SystemSettingQueryVariables>;
export const UpsertSystemSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertSystemSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSettingUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSystemSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SystemSettingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpsertSystemSettingMutation, UpsertSystemSettingMutationVariables>;
export const DeleteSystemSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteSystemSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSystemSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}]}]}}]} as unknown as DocumentNode<DeleteSystemSettingMutation, DeleteSystemSettingMutationVariables>;
export const MeetingIntegrationProvidersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meetingIntegrationProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingIntegrationProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingIntegrationProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingIntegrationProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingIntegrationProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"credentialsHealthy"}},{"kind":"Field","name":{"kind":"Name","value":"lastTestedAt"}},{"kind":"Field","name":{"kind":"Name","value":"connectedTeacherCount"}},{"kind":"Field","name":{"kind":"Name","value":"reauthNeededCount"}},{"kind":"Field","name":{"kind":"Name","value":"endpoints"}}]}}]} as unknown as DocumentNode<MeetingIntegrationProvidersQuery, MeetingIntegrationProvidersQueryVariables>;
export const MeetingIntegrationConnectedAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meetingIntegrationConnectedAccounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingIntegrationConnectedAccounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingIntegrationConnectedAccountFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingIntegrationConnectedAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingIntegrationConnectedAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRefreshedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}}]}}]} as unknown as DocumentNode<MeetingIntegrationConnectedAccountsQuery, MeetingIntegrationConnectedAccountsQueryVariables>;
export const TestMeetingProviderConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"testMeetingProviderConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestMeetingConnectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testMeetingProviderConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestMeetingConnectionResultFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestMeetingConnectionResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TestMeetingConnectionResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"latencyMs"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"testJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamResponseSummary"}},{"kind":"Field","name":{"kind":"Name","value":"errorCode"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"rawUpstreamPayload"}},{"kind":"Field","name":{"kind":"Name","value":"requiredScopes"}},{"kind":"Field","name":{"kind":"Name","value":"grantedScopes"}}]}}]} as unknown as DocumentNode<TestMeetingProviderConnectionMutation, TestMeetingProviderConnectionMutationVariables>;
export const AdminRevokeMeetingProviderTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"adminRevokeMeetingProviderToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminRevokeTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminRevokeMeetingProviderToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminRevokeTokenResultFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminRevokeTokenResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminRevokeTokenResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"revoked"}}]}}]} as unknown as DocumentNode<AdminRevokeMeetingProviderTokenMutation, AdminRevokeMeetingProviderTokenMutationVariables>;
export const SessionConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"sessionConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SessionConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SessionConfigsQuery, SessionConfigsQueryVariables>;
export const SessionConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"sessionConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roleName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SessionConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SessionConfigQuery, SessionConfigQueryVariables>;
export const UpsertSessionConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertSessionConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfigUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSessionConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SessionConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpsertSessionConfigMutation, UpsertSessionConfigMutationVariables>;
export const DeleteSessionConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteSessionConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSessionConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roleName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}}}]}]}}]} as unknown as DocumentNode<DeleteSessionConfigMutation, DeleteSessionConfigMutationVariables>;
export const SettingsAuditLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"settingsAuditLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SettingsAuditLogFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settingsAuditLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"logs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuditLogFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuditLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuditLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"actorUserId"}},{"kind":"Field","name":{"kind":"Name","value":"actorType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"previousState"}},{"kind":"Field","name":{"kind":"Name","value":"newState"}},{"kind":"Field","name":{"kind":"Name","value":"changes"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<SettingsAuditLogsQuery, SettingsAuditLogsQueryVariables>;
export const AppearanceSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"appearanceSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"draft"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appearanceSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"draft"},"value":{"kind":"Variable","name":{"kind":"Name","value":"draft"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceFields"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"colors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"light"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dark"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}},{"kind":"Field","name":{"kind":"Name","value":"draftFields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceFieldsSelection"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AppearanceSettingsQuery, AppearanceSettingsQueryVariables>;
export const SaveAppearanceDraftDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"saveAppearanceDraft"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceDraftInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedUpdatedAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveAppearanceDraft"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedUpdatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedUpdatedAt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceFields"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"colors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"light"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dark"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}},{"kind":"Field","name":{"kind":"Name","value":"draftFields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceFieldsSelection"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<SaveAppearanceDraftMutation, SaveAppearanceDraftMutationVariables>;
export const PublishAppearanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"publishAppearance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedUpdatedAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishAppearance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"expectedUpdatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedUpdatedAt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceFields"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"colors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"light"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dark"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}},{"kind":"Field","name":{"kind":"Name","value":"draftFields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceFieldsSelection"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<PublishAppearanceMutation, PublishAppearanceMutationVariables>;
export const ResetAppearanceDraftDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"resetAppearanceDraft"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetAppearanceDraft"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceFields"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"colors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"light"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dark"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AppearanceSettingsFieldsSelection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AppearanceSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryMain"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"siteName"}},{"kind":"Field","name":{"kind":"Name","value":"siteTitle"}},{"kind":"Field","name":{"kind":"Name","value":"siteDescription"}},{"kind":"Field","name":{"kind":"Name","value":"defaultColorScheme"}},{"kind":"Field","name":{"kind":"Name","value":"draftFields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AppearanceFieldsSelection"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<ResetAppearanceDraftMutation, ResetAppearanceDraftMutationVariables>;
export const SiteContentEntriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"siteContentEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteContentEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SiteContentEntryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SiteContentEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SiteContentEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"isPublished"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SiteContentEntriesQuery, SiteContentEntriesQueryVariables>;
export const SiteContentEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"siteContentEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteContentEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SiteContentEntryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SiteContentEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SiteContentEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"isPublished"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SiteContentEntryQuery, SiteContentEntryQueryVariables>;
export const UpsertSiteContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertSiteContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SiteContentUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSiteContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SiteContentEntryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SiteContentEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SiteContentEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"isPublished"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpsertSiteContentMutation, UpsertSiteContentMutationVariables>;
export const UpdateSiteContentPublishStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSiteContentPublishState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPublished"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSiteContentPublishState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"isPublished"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPublished"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SiteContentEntryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SiteContentEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SiteContentEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"isPublished"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateSiteContentPublishStateMutation, UpdateSiteContentPublishStateMutationVariables>;
export const DeleteSiteContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteSiteContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSiteContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSiteContentMutation, DeleteSiteContentMutationVariables>;
export const SettingsTimezonesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"settingsTimezones"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settingsTimezones"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SettingsTimezoneFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SettingsTimezoneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SettingsTimezone"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ianaId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseOffsetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"offsetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDstSupported"}}]}}]} as unknown as DocumentNode<SettingsTimezonesQuery, SettingsTimezonesQueryVariables>;
export const EnsureDemoUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ensureDemoUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ensureDemoUsers"}}]}}]} as unknown as DocumentNode<EnsureDemoUsersMutation, EnsureDemoUsersMutationVariables>;
export const CreateTestEntitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTestEntities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classesRemaining"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTestEntities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"prefix"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}}},{"kind":"Argument","name":{"kind":"Name","value":"classesRemaining"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classesRemaining"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentUserEmail"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserEmail"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserEmail"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}}]}}]}}]} as unknown as DocumentNode<CreateTestEntitiesMutation, CreateTestEntitiesMutationVariables>;
export const CleanupTestEntitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestEntities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestEntities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestEntitiesMutation, CleanupTestEntitiesMutationVariables>;
export const CreateTestGroupClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTestGroupClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTestGroupClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupClassId"}}]}}]}}]} as unknown as DocumentNode<CreateTestGroupClassMutation, CreateTestGroupClassMutationVariables>;
export const CleanupTestGroupClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestGroupClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestGroupClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupClassId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestGroupClassMutation, CleanupTestGroupClassMutationVariables>;
export const CleanupTestManagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestManager"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestManager"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestManagerMutation, CleanupTestManagerMutationVariables>;
export const CreateTestSuperAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTestSuperAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTestSuperAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"prefix"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreateTestSuperAdminMutation, CreateTestSuperAdminMutationVariables>;
export const CleanupTestSuperAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestSuperAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestSuperAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestSuperAdminMutation, CleanupTestSuperAdminMutationVariables>;
export const WelcomeMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"welcomeMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"welcomeMessage"}}]}}]} as unknown as DocumentNode<WelcomeMessageQuery, WelcomeMessageQueryVariables>;
export const TranslatedMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"translatedMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"translatedMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}}]}]}}]} as unknown as DocumentNode<TranslatedMessageQuery, TranslatedMessageQueryVariables>;
export const StudentDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentsOrderByClause"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentFilterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentDirectoryRow"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryQuery, StudentDirectoryQueryVariables>;
export const StudentsDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentsDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentDirectoryRow"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentsDirectoryQuery, StudentsDirectoryQueryVariables>;
export const StudentClassHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentClassHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentClassHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"hoursStudied"}},{"kind":"Field","name":{"kind":"Name","value":"performance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<StudentClassHistoryQuery, StudentClassHistoryQueryVariables>;
export const StudentClassSessionDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentClassSessionDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentClassSessionDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<StudentClassSessionDetailQuery, StudentClassSessionDetailQueryVariables>;
export const ReassignStudentTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReassignStudentTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newTeacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reassignStudentTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newTeacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newTeacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ReassignStudentTeacherMutation, ReassignStudentTeacherMutationVariables>;
export const ChangeStudentStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeStudentStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeStudentStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ChangeStudentStatusMutation, ChangeStudentStatusMutationVariables>;
export const CreateStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}}]}}]}}]} as unknown as DocumentNode<CreateStudentMutation, CreateStudentMutationVariables>;
export const StudentProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeUpcomingClasses"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeUpcomingClasses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeUpcomingClasses"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"timezoneOverride"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentEmail"}},{"kind":"Field","name":{"kind":"Name","value":"parentPhone"}},{"kind":"Field","name":{"kind":"Name","value":"isAssociatedViewer"}},{"kind":"Field","name":{"kind":"Name","value":"isOwnStudentProfile"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"upcomingClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentUpcomingClassFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"classHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentHistoryMetricsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentHistorySessionFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentUpcomingClassFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentUpcomingClass"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistoryMetricsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistoryMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"hoursStudied"}},{"kind":"Field","name":{"kind":"Name","value":"performance"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistorySessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistorySession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]} as unknown as DocumentNode<StudentProfileQuery, StudentProfileQueryVariables>;
export const RecordStudentProfileEditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordStudentProfileEdit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentProfileEditInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordStudentProfileEdit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"timezoneOverride"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"parentPhone"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RecordStudentProfileEditMutation, RecordStudentProfileEditMutationVariables>;
export const StudentUpcomingClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentUpcomingClasses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentUpcomingClasses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<StudentUpcomingClassesQuery, StudentUpcomingClassesQueryVariables>;
export const StudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"students"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentsOrderByClause"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentFilterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"students"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<StudentsQuery, StudentsQueryVariables>;
export const StudentByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<StudentByIdQuery, StudentByIdQueryVariables>;
export const AdminSuggestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SuggestionFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submitterName"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"adminResponse"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfId"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfBody"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfSubmitterName"}},{"kind":"Field","name":{"kind":"Name","value":"responseCount"}},{"kind":"Field","name":{"kind":"Name","value":"emailSentAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"reviewed"}},{"kind":"Field","name":{"kind":"Name","value":"duplicate"}},{"kind":"Field","name":{"kind":"Name","value":"avgResponseTime"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<AdminSuggestionsQuery, AdminSuggestionsQueryVariables>;
export const SearchSuggestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitterName"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SearchSuggestionsQuery, SearchSuggestionsQueryVariables>;
export const SubmitSuggestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitSuggestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitSuggestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitSuggestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitterName"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SubmitSuggestionMutation, SubmitSuggestionMutationVariables>;
export const MarkSuggestionReviewedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkSuggestionReviewed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markSuggestionReviewed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"suggestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"emailSentAt"}}]}}]}}]} as unknown as DocumentNode<MarkSuggestionReviewedMutation, MarkSuggestionReviewedMutationVariables>;
export const RespondToSuggestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RespondToSuggestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RespondToSuggestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondToSuggestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"adminResponse"}}]}}]}}]} as unknown as DocumentNode<RespondToSuggestionMutation, RespondToSuggestionMutationVariables>;
export const MarkSuggestionDuplicateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkSuggestionDuplicate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkSuggestionDuplicateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markSuggestionDuplicate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfId"}}]}}]}}]} as unknown as DocumentNode<MarkSuggestionDuplicateMutation, MarkSuggestionDuplicateMutationVariables>;
export const DeleteSuggestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSuggestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSuggestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"suggestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}}}]}]}}]} as unknown as DocumentNode<DeleteSuggestionMutation, DeleteSuggestionMutationVariables>;
export const SuggestionContributorStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SuggestionContributorStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"days"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suggestionContributorStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"days"},"value":{"kind":"Variable","name":{"kind":"Name","value":"days"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueContributorCount"}},{"kind":"Field","name":{"kind":"Name","value":"contributors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"suggestionCount"}}]}}]}}]}}]} as unknown as DocumentNode<SuggestionContributorStatsQuery, SuggestionContributorStatsQueryVariables>;
export const SupervisorDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"supervisorDashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supervisorDashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supervisorName"}},{"kind":"Field","name":{"kind":"Name","value":"pendingReviewCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingDuesSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"monthlySnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<SupervisorDashboardQuery, SupervisorDashboardQueryVariables>;
export const TeacherDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"deactivated"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalTeachers"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherDirectoryQuery, TeacherDirectoryQueryVariables>;
export const ManagerDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"managerDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"managerDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"roleFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleFilter"}}},{"kind":"Argument","name":{"kind":"Name","value":"statusFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"systemStaff"}},{"kind":"Field","name":{"kind":"Name","value":"activeNow"}},{"kind":"Field","name":{"kind":"Name","value":"alerts"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ManagerDirectoryQuery, ManagerDirectoryQueryVariables>;
export const UpdateManagerProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateManagerProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"staffProfileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateManagerProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateManagerProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"staffProfileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"staffProfileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}}]}}]}}]} as unknown as DocumentNode<UpdateManagerProfileMutation, UpdateManagerProfileMutationVariables>;
export const OnboardingMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onboardingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activeStaff"}},{"kind":"Field","name":{"kind":"Name","value":"pendingApproval"}},{"kind":"Field","name":{"kind":"Name","value":"avgOnboardingDays"}}]}}]}}]} as unknown as DocumentNode<OnboardingMetricsQuery, OnboardingMetricsQueryVariables>;
export const StaffDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"staffDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"permissionGroupFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"staffDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"permissionGroupFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"permissionGroupFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRow"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRow"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<StaffDirectoryQuery, StaffDirectoryQueryVariables>;
export const CreateManagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createManager"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ManagerOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createManager"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignedGroupSlug"}}]}}]}}]} as unknown as DocumentNode<CreateManagerMutation, CreateManagerMutationVariables>;
export const TeacherProfileForEditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherProfileForEdit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherProfileForEdit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}}]}}]} as unknown as DocumentNode<TeacherProfileForEditQuery, TeacherProfileForEditQueryVariables>;
export const UpdateTeacherProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateTeacherProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherProfileUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeacherProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}}]}}]} as unknown as DocumentNode<UpdateTeacherProfileMutation, UpdateTeacherProfileMutationVariables>;
export const TeacherDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scheduleRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yourTimeFormatted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"progressFeed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTimeFormatted"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"eventKind"}},{"kind":"Field","name":{"kind":"Name","value":"occurredAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<TeacherDashboardQuery, TeacherDashboardQueryVariables>;
export const CreateTeacherManualClassEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacherManualClassEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateManualClassEntryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherManualClassEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}}]}}]} as unknown as DocumentNode<CreateTeacherManualClassEntryMutation, CreateTeacherManualClassEntryMutationVariables>;
export const LogTeacherSupportRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"logTeacherSupportRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogSupportRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logTeacherSupportRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<LogTeacherSupportRequestMutation, LogTeacherSupportRequestMutationVariables>;
export const TeacherFutureScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherFutureSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherFutureSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"leaveQuotaUsed"}},{"kind":"Field","name":{"kind":"Name","value":"leaveQuotaTotal"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"leaveRequestDisabled"}},{"kind":"Field","name":{"kind":"Name","value":"leaveRequestDisabledReason"}},{"kind":"Field","name":{"kind":"Name","value":"studentCount"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"importantNotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportContact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<TeacherFutureScheduleQuery, TeacherFutureScheduleQueryVariables>;
export const TeacherHandbookUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<TeacherHandbookUrlQuery, TeacherHandbookUrlQueryVariables>;
export const TeacherPendingDuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherPendingDues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherPendingDues"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classDate"}},{"kind":"Field","name":{"kind":"Name","value":"hours"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"approvedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teacherPaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rateSource"}}]}}]}}]} as unknown as DocumentNode<TeacherPendingDuesQuery, TeacherPendingDuesQueryVariables>;
export const TeacherPendingDuesSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherPendingDuesSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherPendingDuesSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<TeacherPendingDuesSummaryQuery, TeacherPendingDuesSummaryQueryVariables>;
export const TeacherMonthlyReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherMonthlyReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherMonthlyReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"lessonsTaught"}},{"kind":"Field","name":{"kind":"Name","value":"approvedCount"}},{"kind":"Field","name":{"kind":"Name","value":"cancelledCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAccruedHours"}},{"kind":"Field","name":{"kind":"Name","value":"totalDueAmount"}},{"kind":"Field","name":{"kind":"Name","value":"totalPaidAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<TeacherMonthlyReportQuery, TeacherMonthlyReportQueryVariables>;
export const MarkTeacherDuesPaidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkTeacherDuesPaid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dueIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherPaymentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markTeacherDuesPaid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dueIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dueIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherPaymentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherPaymentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classDate"}},{"kind":"Field","name":{"kind":"Name","value":"hours"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"approvedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teacherPaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MarkTeacherDuesPaidMutation, MarkTeacherDuesPaidMutationVariables>;
export const CreateTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeacherNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TeacherImportantNoteFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<CreateTeacherImportantNoteMutation, CreateTeacherImportantNoteMutationVariables>;
export const UpdateTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeacherNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TeacherImportantNoteFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<UpdateTeacherImportantNoteMutation, UpdateTeacherImportantNoteMutationVariables>;
export const DeleteTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTeacherImportantNoteMutation, DeleteTeacherImportantNoteMutationVariables>;
export const CreateTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"timezoneDisplay"}}]}}]}}]} as unknown as DocumentNode<CreateTeacherMutation, CreateTeacherMutationVariables>;
export const TeacherAssignedStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherAssignedStudentsQuery, TeacherAssignedStudentsQueryVariables>;
export const TeacherOwnProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherOwnProfileQuery, TeacherOwnProfileQueryVariables>;
export const TeacherAssignedClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherAssignedClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherAssignedClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"supportsAutoGeneration"}}]}}]} as unknown as DocumentNode<TeacherAssignedClassesQuery, TeacherAssignedClassesQueryVariables>;
export const TeachersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teachers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<TeachersQuery, TeachersQueryVariables>;
export const CreateGeneralUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGeneralUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralUserCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGeneralUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedGroupSlug"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<CreateGeneralUserMutation, CreateGeneralUserMutationVariables>;
export const WhatsappAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"whatsappAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"whatsappAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WhatsappAccountFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WhatsappAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wabaId"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumberId"}},{"kind":"Field","name":{"kind":"Name","value":"displayPhoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"qualityRating"}},{"kind":"Field","name":{"kind":"Name","value":"portfolioMessagingLimitTier"}},{"kind":"Field","name":{"kind":"Name","value":"throughputLevel"}},{"kind":"Field","name":{"kind":"Name","value":"maxPhoneNumbersPerBusiness"}},{"kind":"Field","name":{"kind":"Name","value":"lastWebhookAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<WhatsappAccountsQuery, WhatsappAccountsQueryVariables>;
export const IsUserWhatsappOptInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"isUserWhatsappOptIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isUserWhatsappOptIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<IsUserWhatsappOptInQuery, IsUserWhatsappOptInQueryVariables>;
export const CreateWhatsappAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createWhatsappAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappAccountCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWhatsappAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WhatsappAccountFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WhatsappAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wabaId"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumberId"}},{"kind":"Field","name":{"kind":"Name","value":"displayPhoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"qualityRating"}},{"kind":"Field","name":{"kind":"Name","value":"portfolioMessagingLimitTier"}},{"kind":"Field","name":{"kind":"Name","value":"throughputLevel"}},{"kind":"Field","name":{"kind":"Name","value":"maxPhoneNumbersPerBusiness"}},{"kind":"Field","name":{"kind":"Name","value":"lastWebhookAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateWhatsappAccountMutation, CreateWhatsappAccountMutationVariables>;
export const UpdateWhatsappAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateWhatsappAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappAccountUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWhatsappAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateWhatsappAccountMutation, UpdateWhatsappAccountMutationVariables>;
export const DeleteWhatsappAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteWhatsappAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWhatsappAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteWhatsappAccountMutation, DeleteWhatsappAccountMutationVariables>;
export const SetWhatsappAccessTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setWhatsappAccessToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accessToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setWhatsappAccessToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"accessToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accessToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SetWhatsappAccessTokenMutation, SetWhatsappAccessTokenMutationVariables>;
export const SetWhatsappTwoStepPinDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setWhatsappTwoStepPin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"twoStepPin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setWhatsappTwoStepPin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"twoStepPin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"twoStepPin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SetWhatsappTwoStepPinMutation, SetWhatsappTwoStepPinMutationVariables>;
export const SetUserWhatsappOptInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setUserWhatsappOptIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"source"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setUserWhatsappOptIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"source"},"value":{"kind":"Variable","name":{"kind":"Name","value":"source"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SetUserWhatsappOptInMutation, SetUserWhatsappOptInMutationVariables>;
export const SyncWhatsappAccountsFromMetaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"syncWhatsappAccountsFromMeta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncWhatsappAccountsFromMeta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"accounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WhatsappAccountFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"templates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WhatsappTemplateSnapshotFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WhatsappAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wabaId"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumberId"}},{"kind":"Field","name":{"kind":"Name","value":"displayPhoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"qualityRating"}},{"kind":"Field","name":{"kind":"Name","value":"portfolioMessagingLimitTier"}},{"kind":"Field","name":{"kind":"Name","value":"throughputLevel"}},{"kind":"Field","name":{"kind":"Name","value":"maxPhoneNumbersPerBusiness"}},{"kind":"Field","name":{"kind":"Name","value":"lastWebhookAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WhatsappTemplateSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WhatsappTemplateSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"}}]}}]} as unknown as DocumentNode<SyncWhatsappAccountsFromMetaMutation, SyncWhatsappAccountsFromMetaMutationVariables>;
export const IsWhatsappConfiguredDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"isWhatsappConfigured"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isWhatsappConfigured"}}]}}]} as unknown as DocumentNode<IsWhatsappConfiguredQuery, IsWhatsappConfiguredQueryVariables>;