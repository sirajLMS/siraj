export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: string; output: string; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string; }
  /** A type representing a validated email address */
  Email: { input: string; output: string; }
  /** A type representing arbitrary JSON values */
  JSON: { input: unknown; output: unknown; }
  /** A JSONB map of AppLocale → string (e.g. { ar: "فودافون كاش", en: "Vodafone Cash" }). Keys are restricted to the app locales from @/shared/i18n/routing. */
  LocalizedString: { input: Partial<Record<'ar' | 'en', string>>; output: Partial<Record<'ar' | 'en', string>>; }
  /** A type representing a validated phone number */
  PhoneNumber: { input: string; output: string; }
  /** A map of string keys to string values (Record<string, string>). Limits: max 100 entries, keys up to 64 chars, values up to 1024 chars. */
  StringMap: { input: Record<string, string>; output: Record<string, string>; }
};

export enum AccountStatus {
  Activated = 'ACTIVATED',
  Deactivated = 'DEACTIVATED'
}

export type AdminBillingSummary = {
  __typename?: 'AdminBillingSummary';
  id: Maybe<Scalars['String']['output']>;
  mtdRevenue: Maybe<Scalars['String']['output']>;
  mtdRevenueByCurrency: Maybe<Array<BillingCurrencyTotal>>;
  negativeBalanceCount: Maybe<Scalars['Int']['output']>;
  outstandingByCurrency: Maybe<Array<BillingCurrencyTotal>>;
  pendingCount: Maybe<Scalars['Int']['output']>;
  totalOutstanding: Maybe<Scalars['String']['output']>;
};

export type AdminDashboardScheduleInput = {
  date: Scalars['String']['input'];
  metricFilter: InputMaybe<Scalars['String']['input']>;
  paginationArgs: InputMaybe<PaginationArgs>;
  search: InputMaybe<Scalars['String']['input']>;
  teacherId: InputMaybe<Scalars['String']['input']>;
};

export type AdminDashboardScheduleResult = {
  __typename?: 'AdminDashboardScheduleResult';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<DailyScheduleMetrics>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<DailyScheduleList>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type AdminInvoiceHistoryResult = {
  __typename?: 'AdminInvoiceHistoryResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<ParentInvoiceRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type AdminNoteInfo = {
  __typename?: 'AdminNoteInfo';
  content: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['String']['output']>;
};

export type AdminResetPasswordInput = {
  newPassword: Scalars['String']['input'];
  sendNotificationEmail: InputMaybe<Scalars['Boolean']['input']>;
  userId: Scalars['ID']['input'];
};

export type AdminResetPasswordResult = {
  __typename?: 'AdminResetPasswordResult';
  emailSent: Maybe<Scalars['Boolean']['output']>;
  message: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
  userId: Maybe<Scalars['ID']['output']>;
};

export type AdminRevokeTokenInput = {
  providerSlug: MeetingIntegrationProviderSlug;
  userId: Scalars['String']['input'];
};

export type AdminRevokeTokenResult = {
  __typename?: 'AdminRevokeTokenResult';
  id: Maybe<Scalars['String']['output']>;
  providerSlug: Maybe<Scalars['String']['output']>;
  revoked: Maybe<Scalars['Boolean']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

/** Paginated admin suggestion list with metrics. */
export type AdminSuggestionResult = {
  __typename?: 'AdminSuggestionResult';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<SuggestionMetrics>;
  rows: Maybe<Array<Suggestion>>;
  suggestions: Maybe<Array<Suggestion>>;
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

export type AssignPermissionGroupToUserInput = {
  groupId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type AssociatedStudent = {
  __typename?: 'AssociatedStudent';
  avatarUrl: Maybe<Scalars['String']['output']>;
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  gender: Maybe<Scalars['String']['output']>;
  hoursPerWeek: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  language: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  status: Maybe<StudentStatus>;
  teacherName: Maybe<Scalars['String']['output']>;
  teacherUserId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type AttachSubjectResourceInput = {
  learningResourceId: Scalars['String']['input'];
  resourceType: InputMaybe<Scalars['String']['input']>;
  sortOrder: InputMaybe<Scalars['Int']['input']>;
  subjectId: Scalars['String']['input'];
};

export enum AttendanceEvaluation {
  Absent = 'ABSENT',
  Late = 'LATE',
  Present = 'PRESENT'
}

/** Filters applied to the dynamic attendance query engine. */
export type AttendanceReportFiltersInput = {
  /** ISO Date String representing start bound */
  fromDate: Scalars['String']['input'];
  groupBy: ReportGroupingMode;
  /** Optional UUID to filter by a specific teacher */
  teacherId: InputMaybe<Scalars['String']['input']>;
  /** ISO Date String representing end bound */
  toDate: Scalars['String']['input'];
};

/** Locked paid amount for a report row in a specific currency. */
export type AttendanceReportPaidAmount = {
  __typename?: 'AttendanceReportPaidAmount';
  amount: Maybe<Scalars['String']['output']>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  id: Maybe<Scalars['ID']['output']>;
};

/** The full attendance report result including rows and growth metric. */
export type AttendanceReportPayload = {
  __typename?: 'AttendanceReportPayload';
  /** Period-over-period engagement growth percentage, or null if unavailable. */
  engagementGrowth: Maybe<Scalars['Float']['output']>;
  /** The aggregated attendance report rows. */
  rows: Maybe<Array<AttendanceReportRow>>;
};

/** A single row of the aggregated attendance report. */
export type AttendanceReportRow = {
  __typename?: 'AttendanceReportRow';
  absentClasses: Maybe<Scalars['Int']['output']>;
  engagementGrowth: Maybe<Scalars['Float']['output']>;
  groupKey: Maybe<Scalars['String']['output']>;
  groupLabel: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  leaveClasses: Maybe<Scalars['Int']['output']>;
  paidAmounts: Maybe<Array<AttendanceReportPaidAmount>>;
  pendingClasses: Maybe<Scalars['Int']['output']>;
  takenClasses: Maybe<Scalars['Int']['output']>;
  totalHours: Maybe<Scalars['Float']['output']>;
};

export enum AttendanceStatus {
  Absent = 'ABSENT',
  Late = 'LATE',
  Present = 'PRESENT'
}

/** An immutable audit log entry recording a system change. */
export type AuditLog = {
  __typename?: 'AuditLog';
  action: Maybe<Scalars['String']['output']>;
  actorType: Maybe<Scalars['String']['output']>;
  actorUserId: Maybe<Scalars['String']['output']>;
  changes: Maybe<Scalars['JSON']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['String']['output']>;
  entityId: Maybe<Scalars['String']['output']>;
  entityType: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  ipAddress: Maybe<Scalars['String']['output']>;
  metadata: Maybe<Scalars['JSON']['output']>;
  newState: Maybe<Scalars['JSON']['output']>;
  previousState: Maybe<Scalars['JSON']['output']>;
  userAgent: Maybe<Scalars['String']['output']>;
};

export type AvailabilitySearchInput = {
  daysOfWeek: InputMaybe<Array<DayOfWeek>>;
  fromDate: InputMaybe<Scalars['String']['input']>;
  fromTime: Scalars['String']['input'];
  gender: InputMaybe<Gender>;
  minAvailableDays: InputMaybe<Scalars['Int']['input']>;
  minTotalGaps: InputMaybe<Scalars['Int']['input']>;
  paginationArgs: InputMaybe<PaginationArgs>;
  sortBy: InputMaybe<AvailabilitySearchSortBy>;
  teacherNameSearch: InputMaybe<Scalars['String']['input']>;
  toDate: InputMaybe<Scalars['String']['input']>;
  toTime: Scalars['String']['input'];
};

export type AvailabilitySearchResult = {
  __typename?: 'AvailabilitySearchResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  teachers: Maybe<Array<AvailabilitySearchTeacher>>;
  totalCount: Maybe<Scalars['Int']['output']>;
  totalGaps: Maybe<Scalars['Int']['output']>;
};

export enum AvailabilitySearchSortBy {
  MostAvailableDays = 'MOST_AVAILABLE_DAYS',
  MostGaps = 'MOST_GAPS',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC',
  TimezoneAsc = 'TIMEZONE_ASC'
}

export type AvailabilitySearchTeacher = {
  __typename?: 'AvailabilitySearchTeacher';
  availableDaysCount: Maybe<Scalars['Int']['output']>;
  gaps: Maybe<Array<TeacherAvailabilityGap>>;
  gender: Maybe<Gender>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  timezone: Maybe<IanaTimezone>;
};

export enum AvailabilityStatus {
  Available = 'AVAILABLE',
  OutOfStock = 'OUT_OF_STOCK'
}

/** An available class slot for a student on a given date */
export type AvailableClassSlot = {
  __typename?: 'AvailableClassSlot';
  available: Maybe<Scalars['Boolean']['output']>;
  endAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  startAt: Maybe<Scalars['DateTime']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
};

export type BillingCurrencyTotal = {
  __typename?: 'BillingCurrencyTotal';
  amount: Maybe<Scalars['String']['output']>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  id: Maybe<Scalars['String']['output']>;
};

export type BillingMonthInput = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};

export type Book = {
  __typename?: 'Book';
  availabilityStatus: Maybe<AvailabilityStatus>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export enum BookingStatus {
  Confirmed = 'CONFIRMED',
  Rescheduled = 'RESCHEDULED'
}

export type BulkOperationFailure = {
  __typename?: 'BulkOperationFailure';
  error: Maybe<Scalars['String']['output']>;
  path: Maybe<Scalars['String']['output']>;
};

export type BulkOperationResult = {
  __typename?: 'BulkOperationResult';
  failureCount: Maybe<Scalars['Int']['output']>;
  failures: Maybe<Array<BulkOperationFailure>>;
  message: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
  successCount: Maybe<Scalars['Int']['output']>;
  successfulItems: Maybe<Array<StorageObject>>;
};

export type ChangeParentLifecycleResult = {
  __typename?: 'ChangeParentLifecycleResult';
  id: Maybe<Scalars['String']['output']>;
  lifecycleStatus: Maybe<ParentStatus>;
};

export type ChangePasswordInput = {
  confirmPassword: Scalars['String']['input'];
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type ChangeStudentStatusResult = {
  __typename?: 'ChangeStudentStatusResult';
  id: Maybe<Scalars['String']['output']>;
  status: Maybe<StudentStatus>;
  version: Maybe<Scalars['Int']['output']>;
};

export type ClassCategory = {
  __typename?: 'ClassCategory';
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  sortOrder: Maybe<Scalars['Int']['output']>;
};

export type ClassCategoryCreateInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  sortOrder: InputMaybe<Scalars['Int']['input']>;
};

export type ClassCategoryUpdateInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  sortOrder: InputMaybe<Scalars['Int']['input']>;
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

export type ClassInstanceDetail = {
  __typename?: 'ClassInstanceDetail';
  avatarUrl: Maybe<Scalars['String']['output']>;
  classType: Maybe<ClassType>;
  courseName: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  endTime: Maybe<Scalars['String']['output']>;
  executionState: Maybe<ClassExecutionState>;
  hasTimezoneMismatch: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  instanceId: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  isRateOverridden: Maybe<Scalars['Boolean']['output']>;
  isRescheduled: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated Use effectiveMeeting.joinUrl */
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  payrollCredited: Maybe<Scalars['Boolean']['output']>;
  performance: Maybe<ClassInstancePerformance>;
  rateAmount: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<CurrencyCode>;
  rateSource: Maybe<RateSource>;
  recurringScheduleId: Maybe<Scalars['String']['output']>;
  remarks: Maybe<Scalars['String']['output']>;
  scheduledDate: Maybe<Scalars['String']['output']>;
  startTime: Maybe<Scalars['String']['output']>;
  status: Maybe<ClassExecutionState>;
  student: Maybe<ClassInstanceStudentInfo>;
  studentTimezone: Maybe<IanaTimezone>;
  subjectAvatarUrl: Maybe<Scalars['String']['output']>;
  subjectId: Maybe<Scalars['String']['output']>;
  subjectName: Maybe<Scalars['String']['output']>;
  teacher: Maybe<ClassInstanceTeacherInfo>;
  teacherTimezone: Maybe<IanaTimezone>;
};

export type ClassInstancePerformance = {
  __typename?: 'ClassInstancePerformance';
  assessmentProgress: Maybe<Scalars['Int']['output']>;
  assessmentTotal: Maybe<Scalars['Int']['output']>;
  attendanceRate: Maybe<Scalars['Int']['output']>;
  authorizationLabel: Maybe<Scalars['String']['output']>;
  avgGrade: Maybe<Scalars['String']['output']>;
  engagementScore: Maybe<Scalars['Int']['output']>;
  focusLevel: Maybe<Scalars['String']['output']>;
  heatmapData: Maybe<Array<Scalars['JSON']['output']>>;
  id: Maybe<Scalars['String']['output']>;
  lastClassDaysAgo: Maybe<Scalars['Int']['output']>;
  latencyMs: Maybe<Scalars['Int']['output']>;
  sessionHealth: Maybe<Scalars['String']['output']>;
};

export type ClassInstanceStudentInfo = {
  __typename?: 'ClassInstanceStudentInfo';
  avatarUrl: Maybe<Scalars['String']['output']>;
  grade: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  level: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type ClassInstanceTeacherInfo = {
  __typename?: 'ClassInstanceTeacherInfo';
  avatarUrl: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type ClassMeetingConfig = {
  __typename?: 'ClassMeetingConfig';
  classInstanceId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  details: Maybe<MeetingConfigDetails>;
  hasSecret: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isDefault: Maybe<Scalars['Boolean']['output']>;
  label: Maybe<Scalars['String']['output']>;
  meetingUrlError: Maybe<Scalars['String']['output']>;
  meetingUrlExpiresAt: Maybe<Scalars['DateTime']['output']>;
  meetingUrlStatus: Maybe<Scalars['String']['output']>;
  provider: Maybe<MeetingProvider>;
  providerId: Maybe<Scalars['String']['output']>;
  providerMetadata: Maybe<Scalars['JSON']['output']>;
  recurringScheduleId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type ClassMeetingConfigCreateInput = {
  classInstanceId: InputMaybe<Scalars['String']['input']>;
  details: MeetingConfigDetailsInput;
  isDefault: Scalars['Boolean']['input'];
  label: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  providerId: Scalars['String']['input'];
  recurringScheduleId: InputMaybe<Scalars['String']['input']>;
};

export type ClassMeetingConfigUpdateInput = {
  details: InputMaybe<MeetingConfigDetailsInput>;
  isDefault: InputMaybe<Scalars['Boolean']['input']>;
  label: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  providerId: InputMaybe<Scalars['String']['input']>;
};

export enum ClassOutcome {
  Absent = 'ABSENT',
  Leave = 'LEAVE',
  Pending = 'PENDING',
  Taken = 'TAKEN'
}

export type ClassStatusEvent = {
  __typename?: 'ClassStatusEvent';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['String']['output']>;
  eventType: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
};

export type ClassSubject = {
  __typename?: 'ClassSubject';
  avatarUrl: Maybe<Scalars['String']['output']>;
  category: Maybe<ClassCategory>;
  categoryId: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  hourlyRate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<CurrencyCode>;
  resources: Maybe<Array<SubjectResource>>;
  slug: Maybe<Scalars['String']['output']>;
  sortOrder: Maybe<Scalars['Int']['output']>;
};

export type ClassSubjectCreateInput = {
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  categoryId: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  rateCurrency: InputMaybe<CurrencyCode>;
  slug: Scalars['String']['input'];
  sortOrder: InputMaybe<Scalars['Int']['input']>;
};

export type ClassSubjectUpdateInput = {
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  categoryId: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  rateCurrency: InputMaybe<CurrencyCode>;
  slug: InputMaybe<Scalars['String']['input']>;
  sortOrder: InputMaybe<Scalars['Int']['input']>;
};

export enum ClassType {
  Advance = 'ADVANCE',
  Regular = 'REGULAR',
  Trial = 'TRIAL'
}

export type CommunicationLogEntry = {
  __typename?: 'CommunicationLogEntry';
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  isDelivered: Maybe<Scalars['Boolean']['output']>;
  timestamp: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

/** A parent complaint with full details and responses. */
export type Complaint = {
  __typename?: 'Complaint';
  body: Maybe<Scalars['String']['output']>;
  category: Maybe<ComplaintCategory>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  files: Maybe<Array<ComplaintFile>>;
  id: Maybe<Scalars['String']['output']>;
  parentAvatarUrl: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  responses: Maybe<Array<ComplaintResponse>>;
  status: Maybe<ComplaintStatus>;
  studentName: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

/** Categories for parent complaints. */
export enum ComplaintCategory {
  Other = 'OTHER',
  RegardingSystem = 'REGARDING_SYSTEM',
  RegardingTeacher = 'REGARDING_TEACHER'
}

/** A file attached to a complaint. */
export type ComplaintFile = {
  __typename?: 'ComplaintFile';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  fileId: Maybe<Scalars['String']['output']>;
  isProtected: Maybe<Scalars['Boolean']['output']>;
  publicUrl: Maybe<Scalars['String']['output']>;
  usageType: Maybe<Scalars['String']['output']>;
};

/** Input metadata for a pre-uploaded complaint attachment. */
export type ComplaintFileMetadataInput = {
  mimeType: Scalars['String']['input'];
  path: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
};

/** Aggregate metrics for the complaint queue. */
export type ComplaintMetrics = {
  __typename?: 'ComplaintMetrics';
  answered: Maybe<Scalars['Int']['output']>;
  avgResolutionHours: Maybe<Scalars['Int']['output']>;
  avgResolutionTime: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  totalCount: Maybe<Scalars['Int']['output']>;
  unanswered: Maybe<Scalars['Int']['output']>;
};

/** Filter options for the admin complaint queue. */
export type ComplaintQueueFilter = {
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<ComplaintStatus>;
};

/** Paginated result for the admin complaint queue. */
export type ComplaintQueuePaginatedResult = {
  __typename?: 'ComplaintQueuePaginatedResult';
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<Complaint>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

/** Paginated admin complaint queue with metrics. */
export type ComplaintQueueResult = {
  __typename?: 'ComplaintQueueResult';
  complaints: Maybe<Array<Complaint>>;
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<ComplaintMetrics>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<Complaint>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

/** A single response to a complaint. */
export type ComplaintResponse = {
  __typename?: 'ComplaintResponse';
  body: Maybe<Scalars['String']['output']>;
  complaintId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  emailSent: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  responderName: Maybe<Scalars['String']['output']>;
};

/** Status of a complaint in the support queue. */
export enum ComplaintStatus {
  Answered = 'ANSWERED',
  Unanswered = 'UNANSWERED'
}

/** Input for submitting a new complaint. */
export type ComplaintSubmitInput = {
  body: Scalars['String']['input'];
  category: ComplaintCategory;
  files: InputMaybe<Array<ComplaintFileMetadataInput>>;
  studentId: InputMaybe<Scalars['String']['input']>;
  submitterEmail: Scalars['String']['input'];
};

export type ConnectMeetingProviderOAuthInput = {
  providerSlug: MeetingIntegrationProviderSlug;
  returnPath: Scalars['String']['input'];
};

export type ConnectMeetingProviderOAuthResult = {
  __typename?: 'ConnectMeetingProviderOAuthResult';
  authorizeUrl: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  state: Maybe<Scalars['String']['output']>;
};

export type CoreUserProfileFieldsInput = {
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  displayCurrency: InputMaybe<CurrencyCode>;
  email: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  /** User account status (super admin only) */
  status: InputMaybe<AccountStatus>;
  timezone: InputMaybe<IanaTimezone>;
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
  classType: InputMaybe<ClassType>;
  durationMinutes: Scalars['Int']['input'];
  scheduledEndAt: Scalars['String']['input'];
  scheduledStartAt: Scalars['String']['input'];
  studentId: Scalars['ID']['input'];
  subjectId: Scalars['ID']['input'];
  teacherId: Scalars['ID']['input'];
};

export type CreatePermissionGroupInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  name: Scalars['LocalizedString']['input'];
  permissionIds: Array<Scalars['String']['input']>;
};

export type CreateRecurringClassInput = {
  classType: InputMaybe<ClassType>;
  days: Array<RecurringClassDayInput>;
  defaultStartTime: Scalars['String']['input'];
  durationMinutes: Scalars['Int']['input'];
  earmarkedClasses: InputMaybe<Scalars['Int']['input']>;
  effectiveFrom: InputMaybe<Scalars['String']['input']>;
  effectiveUntil: InputMaybe<Scalars['String']['input']>;
  generateInstancesForWeeks: InputMaybe<Scalars['Int']['input']>;
  generationHorizonWeeks: InputMaybe<Scalars['Int']['input']>;
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  ondemandNoCreditsOutcome: InputMaybe<OnDemandNoCreditsOutcome>;
  quotaId: InputMaybe<Scalars['String']['input']>;
  rateCurrency: InputMaybe<CurrencyCode>;
  schedulingMode: InputMaybe<SchedulingMode>;
  studentId: Scalars['String']['input'];
  subjectId: Scalars['String']['input'];
  teacherId: Scalars['String']['input'];
  timezone: IanaTimezone;
};

export type CreateRecurringClassResult = {
  __typename?: 'CreateRecurringClassResult';
  classInstanceCount: Maybe<Scalars['Int']['output']>;
  classInstanceIds: Maybe<Array<Scalars['String']['output']>>;
  id: Maybe<Scalars['String']['output']>;
  recurringScheduleId: Maybe<Scalars['String']['output']>;
};

export type CreateTeacherNoteInput = {
  body: InputMaybe<Scalars['String']['input']>;
  expiresAt: InputMaybe<Scalars['DateTime']['input']>;
  isPublished: InputMaybe<Scalars['Boolean']['input']>;
  priority: InputMaybe<Scalars['Int']['input']>;
  startsAt: InputMaybe<Scalars['DateTime']['input']>;
  title: Scalars['String']['input'];
};

/** Credit balance summary for a student (total classes purchased and remaining) */
export type CreditBalance = {
  __typename?: 'CreditBalance';
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
};

/** Result of recording a credit purchase for a student */
export type CreditPurchaseResult = {
  __typename?: 'CreditPurchaseResult';
  changeAmount: Maybe<Scalars['Int']['output']>;
  classInstanceId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  creditedByUserId: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  idempotencyKey: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  reason: Maybe<CreditReason>;
  sourcePaymentId: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export enum CreditReason {
  Adjustment = 'ADJUSTMENT',
  Deduction = 'DEDUCTION',
  Purchase = 'PURCHASE',
  Refund = 'REFUND'
}

/** A credit ledger transaction for a student (purchase, deduction, refund, or adjustment) */
export type CreditTransaction = {
  __typename?: 'CreditTransaction';
  changeAmount: Maybe<Scalars['Int']['output']>;
  classInstanceId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  creditedByUserId: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  idempotencyKey: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  reason: Maybe<CreditReason>;
  sourcePaymentId: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export enum CronConcurrencyPolicy {
  Allow = 'ALLOW',
  Replace = 'REPLACE',
  Skip = 'SKIP'
}

export enum CronJobKind {
  Noop = 'NOOP'
}

export type CronPaginatedRuns = {
  __typename?: 'CronPaginatedRuns';
  rows: Maybe<Array<CronRun>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CronPaginatedSchedules = {
  __typename?: 'CronPaginatedSchedules';
  rows: Maybe<Array<CronSchedule>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CronQueueStats = {
  __typename?: 'CronQueueStats';
  backend: Maybe<Scalars['String']['output']>;
  byJobKind: Maybe<Scalars['JSON']['output']>;
  failed: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  inFlight: Maybe<Scalars['Int']['output']>;
  pending: Maybe<Scalars['Int']['output']>;
};

export type CronRun = {
  __typename?: 'CronRun';
  attempt: Maybe<Scalars['Int']['output']>;
  completedAt: Maybe<Scalars['DateTime']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  durationMs: Maybe<Scalars['Int']['output']>;
  errorMessage: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  jobKind: Maybe<CronJobKind>;
  payload: Maybe<Scalars['JSON']['output']>;
  scheduleId: Maybe<Scalars['String']['output']>;
  startedAt: Maybe<Scalars['DateTime']['output']>;
  status: Maybe<CronRunStatus>;
  triggerSource: Maybe<CronTriggerSource>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  workerId: Maybe<Scalars['String']['output']>;
};

export type CronRunListInput = {
  from: InputMaybe<Scalars['DateTime']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  scheduleId: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<CronRunStatus>;
  statuses: InputMaybe<Array<CronRunStatus>>;
  to: InputMaybe<Scalars['DateTime']['input']>;
};

export type CronRunRetryInput = {
  attempt: InputMaybe<Scalars['Int']['input']>;
  runId: Scalars['String']['input'];
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
  id: Scalars['String']['input'];
  payload: InputMaybe<Scalars['JSON']['input']>;
};

export type CronSchedule = {
  __typename?: 'CronSchedule';
  concurrencyPolicy: Maybe<CronConcurrencyPolicy>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  cronExpression: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  jobKind: Maybe<CronJobKind>;
  lastRunAt: Maybe<Scalars['DateTime']['output']>;
  maxRetries: Maybe<Scalars['Int']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nextRunAt: Maybe<Scalars['DateTime']['output']>;
  payload: Maybe<Scalars['JSON']['output']>;
  retryBackoffSeconds: Maybe<Scalars['Int']['output']>;
  status: Maybe<CronScheduleStatus>;
  timeoutSeconds: Maybe<Scalars['Int']['output']>;
  timezone: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type CronScheduleDeleteInput = {
  hard: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
};

export type CronScheduleListInput = {
  jobKind: InputMaybe<CronJobKind>;
  limit: InputMaybe<Scalars['Int']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  status: InputMaybe<CronScheduleStatus>;
};

export enum CronScheduleStatus {
  Active = 'ACTIVE',
  Disabled = 'DISABLED',
  Paused = 'PAUSED'
}

export type CronScheduleSubmitInput = {
  concurrencyPolicy: InputMaybe<CronConcurrencyPolicy>;
  cronExpression: Scalars['String']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  jobKind: CronJobKind;
  maxRetries: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  payload: InputMaybe<Scalars['JSON']['input']>;
  retryBackoffSeconds: InputMaybe<Scalars['Int']['input']>;
  timeoutSeconds: InputMaybe<Scalars['Int']['input']>;
  timezone: InputMaybe<Scalars['String']['input']>;
};

export type CronScheduleUpdateInput = {
  concurrencyPolicy: InputMaybe<CronConcurrencyPolicy>;
  cronExpression: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  jobKind: InputMaybe<CronJobKind>;
  maxRetries: InputMaybe<Scalars['Int']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  payload: InputMaybe<Scalars['JSON']['input']>;
  retryBackoffSeconds: InputMaybe<Scalars['Int']['input']>;
  timeoutSeconds: InputMaybe<Scalars['Int']['input']>;
  timezone: InputMaybe<Scalars['String']['input']>;
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

export type CurrencyHedge = {
  __typename?: 'CurrencyHedge';
  amount: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<CurrencyCode>;
  hedgeType: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type DailyScheduleList = {
  __typename?: 'DailyScheduleList';
  avatarUrl: Maybe<Scalars['String']['output']>;
  courseName: Maybe<Scalars['String']['output']>;
  duration: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<ClassExecutionState>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  status: Maybe<ClassExecutionState>;
  student: Maybe<DailyScheduleListUserItem>;
  studentTime: Maybe<Scalars['String']['output']>;
  studentTimezone: Maybe<IanaTimezone>;
  teacher: Maybe<DailyScheduleListUserItem>;
  teacherTime: Maybe<Scalars['String']['output']>;
  teacherTimezone: Maybe<IanaTimezone>;
  yourTime: Maybe<Scalars['String']['output']>;
};

export type DailyScheduleListUserItem = {
  __typename?: 'DailyScheduleListUserItem';
  avatarUrl: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type DailyScheduleMetrics = {
  __typename?: 'DailyScheduleMetrics';
  absent: Maybe<Scalars['Int']['output']>;
  activated: Maybe<Scalars['Int']['output']>;
  advance: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  leave: Maybe<Scalars['Int']['output']>;
  pending: Maybe<Scalars['Int']['output']>;
  regular: Maybe<Scalars['Int']['output']>;
  rescheduled: Maybe<Scalars['Int']['output']>;
  running: Maybe<Scalars['Int']['output']>;
  suspended: Maybe<Scalars['Int']['output']>;
  taken: Maybe<Scalars['Int']['output']>;
  total: Maybe<Scalars['Int']['output']>;
  trial: Maybe<Scalars['Int']['output']>;
};

export enum DayOfWeek {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

export type DeactivateParentResult = {
  __typename?: 'DeactivateParentResult';
  accountStatus: Maybe<AccountStatus>;
  id: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type DeleteInvoiceResult = {
  __typename?: 'DeleteInvoiceResult';
  id: Maybe<Scalars['String']['output']>;
  notificationSummaryUpdated: Maybe<Scalars['Boolean']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

/** Input for the demo fast login mutation. */
export type DemoLoginInput = {
  /** The unique slug of the permission group to authenticate as. */
  groupSlug: Scalars['String']['input'];
};

export type DirectoryInfo = StorageObject & {
  __typename?: 'DirectoryInfo';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  fileCount: Maybe<Scalars['Int']['output']>;
  folderCount: Maybe<Scalars['Int']['output']>;
  isFromBucket: Maybe<Scalars['Boolean']['output']>;
  isProtected: Maybe<Scalars['Boolean']['output']>;
  lastModified: Maybe<Scalars['DateTime']['output']>;
  name: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
  permissions: Maybe<DirectoryPermissions>;
  protectChildren: Maybe<Scalars['Boolean']['output']>;
  totalSize: Maybe<Scalars['Int']['output']>;
};

export type DirectoryPermissions = {
  __typename?: 'DirectoryPermissions';
  allowCreateSubDirs: Maybe<Scalars['Boolean']['output']>;
  allowDelete: Maybe<Scalars['Boolean']['output']>;
  allowDeleteFiles: Maybe<Scalars['Boolean']['output']>;
  allowMove: Maybe<Scalars['Boolean']['output']>;
  allowMoveFiles: Maybe<Scalars['Boolean']['output']>;
  allowUploads: Maybe<Scalars['Boolean']['output']>;
};

export type DirectoryPermissionsInput = {
  allowCreateSubDirs: Scalars['Boolean']['input'];
  allowDelete: Scalars['Boolean']['input'];
  allowDeleteFiles: Scalars['Boolean']['input'];
  allowMove: Scalars['Boolean']['input'];
  allowMoveFiles: Scalars['Boolean']['input'];
  allowUploads: Scalars['Boolean']['input'];
};

export type DirectoryPermissionsUpdateInput = {
  path: Scalars['String']['input'];
  permissions: DirectoryPermissionsInput;
};

export type DisconnectMeetingProviderOAuthInput = {
  providerSlug: MeetingIntegrationProviderSlug;
};

export type DisconnectMeetingProviderOAuthResult = {
  __typename?: 'DisconnectMeetingProviderOAuthResult';
  id: Maybe<Scalars['String']['output']>;
  ok: Maybe<Scalars['Boolean']['output']>;
  providerSlug: Maybe<Scalars['String']['output']>;
};

export type DisplayAmount = {
  __typename?: 'DisplayAmount';
  amount: Maybe<Scalars['String']['output']>;
  currency: Maybe<CurrencyCode>;
  id: Maybe<Scalars['ID']['output']>;
  stale: Maybe<Scalars['Boolean']['output']>;
};

export type DstCheckedEmptyItem = {
  __typename?: 'DstCheckedEmptyItem';
  id: Maybe<Scalars['String']['output']>;
  reason: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type DstConflictGroup = {
  __typename?: 'DstConflictGroup';
  conflicts: Maybe<Array<DstConflictItem>>;
  id: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
};

export type DstConflictItem = {
  __typename?: 'DstConflictItem';
  id: Maybe<Scalars['String']['output']>;
  message: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type DstMigrationReport = {
  __typename?: 'DstMigrationReport';
  checkedEmptyItems: Maybe<Array<DstCheckedEmptyItem>>;
  conflictGroups: Maybe<Array<DstConflictGroup>>;
  conflicts: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  runId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  total: Maybe<Scalars['Int']['output']>;
  unchanged: Maybe<Scalars['Int']['output']>;
  updated: Maybe<Scalars['Int']['output']>;
  updatedSessions: Maybe<Array<DstUpdatedSession>>;
};

export type DstUpdatedSession = {
  __typename?: 'DstUpdatedSession';
  fromTime: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  toTime: Maybe<Scalars['String']['output']>;
};

export type EditQuotaResult = {
  __typename?: 'EditQuotaResult';
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type EffectiveMeeting = {
  __typename?: 'EffectiveMeeting';
  configId: Maybe<Scalars['String']['output']>;
  joinUrl: Maybe<Scalars['String']['output']>;
  logoUrl: Maybe<Scalars['String']['output']>;
  meetingId: Maybe<Scalars['String']['output']>;
  providerId: Maybe<Scalars['String']['output']>;
  providerName: Maybe<Scalars['LocalizedString']['output']>;
  providerSlug: Maybe<Scalars['String']['output']>;
  source: Maybe<EffectiveMeetingSource>;
  supportsAutoGeneration: Maybe<Scalars['Boolean']['output']>;
};

export enum EffectiveMeetingSource {
  Class = 'class',
  None = 'none',
  Recurring = 'recurring',
  Teacher = 'teacher'
}

export type EndImpersonationResponse = {
  __typename?: 'EndImpersonationResponse';
  token: Maybe<Scalars['String']['output']>;
};

export type EndPermissionGroupSimulationResponse = {
  __typename?: 'EndPermissionGroupSimulationResponse';
  token: Maybe<Scalars['String']['output']>;
};

export type EnvConfigDeleteResult = {
  __typename?: 'EnvConfigDeleteResult';
  deleted: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  key: Maybe<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
};

export type EnvConfigEntry = {
  __typename?: 'EnvConfigEntry';
  category: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['LocalizedString']['output']>;
  displayStrategy: Maybe<Scalars['String']['output']>;
  editable: Maybe<Scalars['Boolean']['output']>;
  excludeFromDb: Maybe<Scalars['Boolean']['output']>;
  hasDbOverride: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isSecret: Maybe<Scalars['Boolean']['output']>;
  key: Maybe<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  value: Maybe<Scalars['String']['output']>;
};

export type EnvConfigUpsertInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type EnvConfigUpsertResult = {
  __typename?: 'EnvConfigUpsertResult';
  hasDbOverride: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  key: Maybe<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type ExchangeRate = {
  __typename?: 'ExchangeRate';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  effectiveDate: Maybe<Scalars['DateTime']['output']>;
  fromCurrency: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  rate: Maybe<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  toCurrency: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type ExchangeRateHistoryResult = {
  __typename?: 'ExchangeRateHistoryResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<ExchangeRateHistoryRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ExchangeRateHistoryRow = {
  __typename?: 'ExchangeRateHistoryRow';
  effectiveDate: Maybe<Scalars['DateTime']['output']>;
  fromCurrency: Maybe<CurrencyCode>;
  id: Maybe<Scalars['String']['output']>;
  rate: Maybe<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  toCurrency: Maybe<CurrencyCode>;
};

export type FileInfo = StorageObject & {
  __typename?: 'FileInfo';
  contentHash: Maybe<Scalars['String']['output']>;
  contentType: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  directoryPath: Maybe<Scalars['String']['output']>;
  fileType: Maybe<FileType>;
  isFromBucket: Maybe<Scalars['Boolean']['output']>;
  isInUse: Maybe<Scalars['Boolean']['output']>;
  isProtected: Maybe<Scalars['Boolean']['output']>;
  isPublic: Maybe<Scalars['Boolean']['output']>;
  lastModified: Maybe<Scalars['DateTime']['output']>;
  mediaLink: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
  usages: Maybe<Array<FileUsageInfo>>;
};

export type FileOperationResult = {
  __typename?: 'FileOperationResult';
  data: Maybe<StorageObject>;
  message: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
};

export type FileRenameInput = {
  currentPath: Scalars['String']['input'];
  newName: Scalars['String']['input'];
};

export enum FileSortField {
  Created = 'CREATED',
  Modified = 'MODIFIED',
  Name = 'NAME',
  Size = 'SIZE',
  Type = 'TYPE'
}

export enum FileType {
  Archive = 'ARCHIVE',
  Audio = 'AUDIO',
  Document = 'DOCUMENT',
  Font = 'FONT',
  Image = 'IMAGE',
  Other = 'OTHER',
  Video = 'VIDEO'
}

export type FileTypeBreakdown = {
  __typename?: 'FileTypeBreakdown';
  count: Maybe<Scalars['Int']['output']>;
  size: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export type FileUsageCheckInput = {
  path: Scalars['String']['input'];
};

export type FileUsageInfo = {
  __typename?: 'FileUsageInfo';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  filePath: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  referenceId: Maybe<Scalars['String']['output']>;
  referenceTable: Maybe<Scalars['String']['output']>;
  usageType: Maybe<Scalars['String']['output']>;
};

export type FileUsageResult = {
  __typename?: 'FileUsageResult';
  canDelete: Maybe<Scalars['Boolean']['output']>;
  deleteBlockReason: Maybe<Scalars['String']['output']>;
  isInUse: Maybe<Scalars['Boolean']['output']>;
  usages: Maybe<Array<FileUsageInfo>>;
};

export type FilesListInput = {
  contentTypes: InputMaybe<Array<Scalars['String']['input']>>;
  fileType: InputMaybe<Scalars['String']['input']>;
  fileTypes: InputMaybe<Array<FileType>>;
  includeDirectories: InputMaybe<Scalars['Boolean']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  path: Scalars['String']['input'];
  searchTerm: InputMaybe<Scalars['String']['input']>;
  sortBy: InputMaybe<FileSortField>;
  sortDirection: InputMaybe<OrderSortDirection>;
};

export type FolderCreateInput = {
  path: Scalars['String']['input'];
  permissions: InputMaybe<DirectoryPermissionsInput>;
  protectChildren: InputMaybe<Scalars['Boolean']['input']>;
  protected: InputMaybe<Scalars['Boolean']['input']>;
};

export type FutureClass = {
  __typename?: 'FutureClass';
  avatarUrl: Maybe<Scalars['String']['output']>;
  classType: Maybe<ClassType>;
  courseName: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  endTime: Maybe<Scalars['String']['output']>;
  executionState: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isRescheduled: Maybe<Scalars['Boolean']['output']>;
  leaveRequestDisabled: Maybe<Scalars['Boolean']['output']>;
  leaveRequestDisabledReason: Maybe<Scalars['String']['output']>;
  location: Maybe<Scalars['String']['output']>;
  /** @deprecated Use effectiveMeeting.joinUrl */
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  scheduledDate: Maybe<Scalars['String']['output']>;
  startTime: Maybe<Scalars['String']['output']>;
  studentCount: Maybe<Scalars['Int']['output']>;
  subjectId: Maybe<Scalars['String']['output']>;
  subjectName: Maybe<Scalars['String']['output']>;
};

export enum FxProvider {
  Fixer = 'Fixer',
  OpenExchangeRates = 'OpenExchangeRates'
}

export type FxProviderConfig = {
  __typename?: 'FxProviderConfig';
  activeProvider: Maybe<FxProvider>;
  id: Maybe<Scalars['String']['output']>;
  source: Maybe<FxProviderConfigSource>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  updatedByName: Maybe<Scalars['String']['output']>;
  updatedByUserId: Maybe<Scalars['String']['output']>;
};

export enum FxProviderConfigSource {
  Database = 'DATABASE',
  Env = 'ENV'
}

export type FxSyncHealth = {
  __typename?: 'FxSyncHealth';
  finishedAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isStale: Maybe<Scalars['Boolean']['output']>;
  status: Maybe<FxSyncStatus>;
};

export type FxSyncRun = {
  __typename?: 'FxSyncRun';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  errorMessage: Maybe<Scalars['String']['output']>;
  finishedAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  pairsFailed: Maybe<Scalars['String']['output']>;
  pairsWritten: Maybe<Scalars['String']['output']>;
  provider: Maybe<FxProvider>;
  startedAt: Maybe<Scalars['DateTime']['output']>;
  status: Maybe<FxSyncStatus>;
  triggerType: Maybe<Scalars['String']['output']>;
  triggeredByUserId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

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
  email: Scalars['String']['input'];
  groupSlug: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<AccountStatus>;
};

/** Result of general user creation with assigned permission group */
export type GeneralUserCreateResult = {
  __typename?: 'GeneralUserCreateResult';
  assignedGroupSlug: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
};

export type GenerateMeetingUrlInput = {
  durationMinutes: InputMaybe<Scalars['Int']['input']>;
  providerId: Scalars['String']['input'];
  startDateTime: InputMaybe<Scalars['String']['input']>;
  topic: Scalars['String']['input'];
};

export type GenerateMeetingUrlResult = {
  __typename?: 'GenerateMeetingUrlResult';
  expiresAt: Maybe<Scalars['String']['output']>;
  joinUrl: Maybe<Scalars['String']['output']>;
  meetingId: Maybe<Scalars['String']['output']>;
};

export enum GroupClassAttendanceStatus {
  Absent = 'ABSENT',
  Late = 'LATE',
  Pending = 'PENDING',
  Present = 'PRESENT'
}

export type GroupClassAudit = {
  __typename?: 'GroupClassAudit';
  adminNote: Maybe<AdminNoteInfo>;
  auditLoggedAt: Maybe<Scalars['String']['output']>;
  auditRemark: Maybe<Scalars['String']['output']>;
  className: Maybe<Scalars['String']['output']>;
  communications: Maybe<Array<CommunicationLogEntry>>;
  courseCode: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  meetingInfo: Maybe<OnlineMeetingInfo>;
  originalDate: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  registeredStudentCount: Maybe<Scalars['Int']['output']>;
  rescheduledDate: Maybe<Scalars['String']['output']>;
  status: Maybe<ClassExecutionState>;
  students: Maybe<Array<GroupClassStudent>>;
  teacherName: Maybe<Scalars['String']['output']>;
  timeSlot: Maybe<Scalars['String']['output']>;
  totalStudentCount: Maybe<Scalars['Int']['output']>;
  venue: Maybe<Scalars['String']['output']>;
};

export type GroupClassStudent = {
  __typename?: 'GroupClassStudent';
  attendanceStatus: Maybe<GroupClassAttendanceStatus>;
  avatarUrl: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  initials: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
};

export type GroupUser = {
  __typename?: 'GroupUser';
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export enum IanaTimezone {
  AfricaAbidjan = 'Africa_Abidjan',
  AfricaAccra = 'Africa_Accra',
  AfricaAddisAbaba = 'Africa_Addis_Ababa',
  AfricaAlgiers = 'Africa_Algiers',
  AfricaAsmara = 'Africa_Asmara',
  AfricaBamako = 'Africa_Bamako',
  AfricaBangui = 'Africa_Bangui',
  AfricaBanjul = 'Africa_Banjul',
  AfricaBissau = 'Africa_Bissau',
  AfricaBlantyre = 'Africa_Blantyre',
  AfricaBrazzaville = 'Africa_Brazzaville',
  AfricaBujumbura = 'Africa_Bujumbura',
  AfricaCairo = 'Africa_Cairo',
  AfricaCasablanca = 'Africa_Casablanca',
  AfricaCeuta = 'Africa_Ceuta',
  AfricaConakry = 'Africa_Conakry',
  AfricaDakar = 'Africa_Dakar',
  AfricaDarEsSalaam = 'Africa_Dar_es_Salaam',
  AfricaDjibouti = 'Africa_Djibouti',
  AfricaDouala = 'Africa_Douala',
  AfricaElAaiun = 'Africa_El_Aaiun',
  AfricaFreetown = 'Africa_Freetown',
  AfricaGaborone = 'Africa_Gaborone',
  AfricaHarare = 'Africa_Harare',
  AfricaJohannesburg = 'Africa_Johannesburg',
  AfricaJuba = 'Africa_Juba',
  AfricaKampala = 'Africa_Kampala',
  AfricaKhartoum = 'Africa_Khartoum',
  AfricaKigali = 'Africa_Kigali',
  AfricaKinshasa = 'Africa_Kinshasa',
  AfricaLagos = 'Africa_Lagos',
  AfricaLibreville = 'Africa_Libreville',
  AfricaLome = 'Africa_Lome',
  AfricaLuanda = 'Africa_Luanda',
  AfricaLubumbashi = 'Africa_Lubumbashi',
  AfricaLusaka = 'Africa_Lusaka',
  AfricaMalabo = 'Africa_Malabo',
  AfricaMaputo = 'Africa_Maputo',
  AfricaMaseru = 'Africa_Maseru',
  AfricaMbabane = 'Africa_Mbabane',
  AfricaMogadishu = 'Africa_Mogadishu',
  AfricaMonrovia = 'Africa_Monrovia',
  AfricaNairobi = 'Africa_Nairobi',
  AfricaNdjamena = 'Africa_Ndjamena',
  AfricaNiamey = 'Africa_Niamey',
  AfricaNouakchott = 'Africa_Nouakchott',
  AfricaOuagadougou = 'Africa_Ouagadougou',
  AfricaPortoNovo = 'Africa_Porto_Novo',
  AfricaSaoTome = 'Africa_Sao_Tome',
  AfricaTripoli = 'Africa_Tripoli',
  AfricaTunis = 'Africa_Tunis',
  AfricaWindhoek = 'Africa_Windhoek',
  AmericaAdak = 'America_Adak',
  AmericaAnchorage = 'America_Anchorage',
  AmericaAnguilla = 'America_Anguilla',
  AmericaAntigua = 'America_Antigua',
  AmericaAraguaina = 'America_Araguaina',
  AmericaArgentinaBuenosAires = 'America_Argentina_Buenos_Aires',
  AmericaArgentinaCatamarca = 'America_Argentina_Catamarca',
  AmericaArgentinaCordoba = 'America_Argentina_Cordoba',
  AmericaArgentinaJujuy = 'America_Argentina_Jujuy',
  AmericaArgentinaLaRioja = 'America_Argentina_La_Rioja',
  AmericaArgentinaMendoza = 'America_Argentina_Mendoza',
  AmericaArgentinaRioGallegos = 'America_Argentina_Rio_Gallegos',
  AmericaArgentinaSalta = 'America_Argentina_Salta',
  AmericaArgentinaSanJuan = 'America_Argentina_San_Juan',
  AmericaArgentinaSanLuis = 'America_Argentina_San_Luis',
  AmericaArgentinaTucuman = 'America_Argentina_Tucuman',
  AmericaArgentinaUshuaia = 'America_Argentina_Ushuaia',
  AmericaAruba = 'America_Aruba',
  AmericaAsuncion = 'America_Asuncion',
  AmericaAtikokan = 'America_Atikokan',
  AmericaBahia = 'America_Bahia',
  AmericaBahiaBanderas = 'America_Bahia_Banderas',
  AmericaBarbados = 'America_Barbados',
  AmericaBelem = 'America_Belem',
  AmericaBelize = 'America_Belize',
  AmericaBlancSablon = 'America_Blanc_Sablon',
  AmericaBoaVista = 'America_Boa_Vista',
  AmericaBogota = 'America_Bogota',
  AmericaBoise = 'America_Boise',
  AmericaCambridgeBay = 'America_Cambridge_Bay',
  AmericaCampoGrande = 'America_Campo_Grande',
  AmericaCancun = 'America_Cancun',
  AmericaCaracas = 'America_Caracas',
  AmericaCayenne = 'America_Cayenne',
  AmericaCayman = 'America_Cayman',
  AmericaChicago = 'America_Chicago',
  AmericaChihuahua = 'America_Chihuahua',
  AmericaCiudadJuarez = 'America_Ciudad_Juarez',
  AmericaCostaRica = 'America_Costa_Rica',
  AmericaCreston = 'America_Creston',
  AmericaCuiaba = 'America_Cuiaba',
  AmericaCuracao = 'America_Curacao',
  AmericaDanmarkshavn = 'America_Danmarkshavn',
  AmericaDawson = 'America_Dawson',
  AmericaDawsonCreek = 'America_Dawson_Creek',
  AmericaDenver = 'America_Denver',
  AmericaDetroit = 'America_Detroit',
  AmericaDominica = 'America_Dominica',
  AmericaEdmonton = 'America_Edmonton',
  AmericaEirunepe = 'America_Eirunepe',
  AmericaElSalvador = 'America_El_Salvador',
  AmericaFortNelson = 'America_Fort_Nelson',
  AmericaFortaleza = 'America_Fortaleza',
  AmericaGlaceBay = 'America_Glace_Bay',
  AmericaGooseBay = 'America_Goose_Bay',
  AmericaGrandTurk = 'America_Grand_Turk',
  AmericaGrenada = 'America_Grenada',
  AmericaGuadeloupe = 'America_Guadeloupe',
  AmericaGuatemala = 'America_Guatemala',
  AmericaGuayaquil = 'America_Guayaquil',
  AmericaGuyana = 'America_Guyana',
  AmericaHalifax = 'America_Halifax',
  AmericaHavana = 'America_Havana',
  AmericaHermosillo = 'America_Hermosillo',
  AmericaIndianaIndianapolis = 'America_Indiana_Indianapolis',
  AmericaIndianaKnox = 'America_Indiana_Knox',
  AmericaIndianaMarengo = 'America_Indiana_Marengo',
  AmericaIndianaPetersburg = 'America_Indiana_Petersburg',
  AmericaIndianaTellCity = 'America_Indiana_Tell_City',
  AmericaIndianaVevay = 'America_Indiana_Vevay',
  AmericaIndianaVincennes = 'America_Indiana_Vincennes',
  AmericaIndianaWinamac = 'America_Indiana_Winamac',
  AmericaInuvik = 'America_Inuvik',
  AmericaIqaluit = 'America_Iqaluit',
  AmericaJamaica = 'America_Jamaica',
  AmericaJuneau = 'America_Juneau',
  AmericaKentuckyLouisville = 'America_Kentucky_Louisville',
  AmericaKentuckyMonticello = 'America_Kentucky_Monticello',
  AmericaKralendijk = 'America_Kralendijk',
  AmericaLaPaz = 'America_La_Paz',
  AmericaLima = 'America_Lima',
  AmericaLosAngeles = 'America_Los_Angeles',
  AmericaLowerPrinces = 'America_Lower_Princes',
  AmericaMaceio = 'America_Maceio',
  AmericaManagua = 'America_Managua',
  AmericaManaus = 'America_Manaus',
  AmericaMarigot = 'America_Marigot',
  AmericaMartinique = 'America_Martinique',
  AmericaMatamoros = 'America_Matamoros',
  AmericaMazatlan = 'America_Mazatlan',
  AmericaMenominee = 'America_Menominee',
  AmericaMerida = 'America_Merida',
  AmericaMetlakatla = 'America_Metlakatla',
  AmericaMexicoCity = 'America_Mexico_City',
  AmericaMiquelon = 'America_Miquelon',
  AmericaMoncton = 'America_Moncton',
  AmericaMonterrey = 'America_Monterrey',
  AmericaMontevideo = 'America_Montevideo',
  AmericaMontserrat = 'America_Montserrat',
  AmericaNassau = 'America_Nassau',
  AmericaNewYork = 'America_New_York',
  AmericaNome = 'America_Nome',
  AmericaNoronha = 'America_Noronha',
  AmericaNorthDakotaBeulah = 'America_North_Dakota_Beulah',
  AmericaNorthDakotaCenter = 'America_North_Dakota_Center',
  AmericaNorthDakotaNewSalem = 'America_North_Dakota_New_Salem',
  AmericaNuuk = 'America_Nuuk',
  AmericaOjinaga = 'America_Ojinaga',
  AmericaPanama = 'America_Panama',
  AmericaParamaribo = 'America_Paramaribo',
  AmericaPhoenix = 'America_Phoenix',
  AmericaPortAuPrince = 'America_Port_au_Prince',
  AmericaPortOfSpain = 'America_Port_of_Spain',
  AmericaPortoVelho = 'America_Porto_Velho',
  AmericaPuertoRico = 'America_Puerto_Rico',
  AmericaPuntaArenas = 'America_Punta_Arenas',
  AmericaRankinInlet = 'America_Rankin_Inlet',
  AmericaRecife = 'America_Recife',
  AmericaRegina = 'America_Regina',
  AmericaResolute = 'America_Resolute',
  AmericaRioBranco = 'America_Rio_Branco',
  AmericaSantarem = 'America_Santarem',
  AmericaSantiago = 'America_Santiago',
  AmericaSantoDomingo = 'America_Santo_Domingo',
  AmericaSaoPaulo = 'America_Sao_Paulo',
  AmericaScoresbysund = 'America_Scoresbysund',
  AmericaSitka = 'America_Sitka',
  AmericaStBarthelemy = 'America_St_Barthelemy',
  AmericaStJohns = 'America_St_Johns',
  AmericaStKitts = 'America_St_Kitts',
  AmericaStLucia = 'America_St_Lucia',
  AmericaStThomas = 'America_St_Thomas',
  AmericaStVincent = 'America_St_Vincent',
  AmericaSwiftCurrent = 'America_Swift_Current',
  AmericaTegucigalpa = 'America_Tegucigalpa',
  AmericaThule = 'America_Thule',
  AmericaTijuana = 'America_Tijuana',
  AmericaToronto = 'America_Toronto',
  AmericaTortola = 'America_Tortola',
  AmericaVancouver = 'America_Vancouver',
  AmericaWhitehorse = 'America_Whitehorse',
  AmericaWinnipeg = 'America_Winnipeg',
  AmericaYakutat = 'America_Yakutat',
  AntarcticaCasey = 'Antarctica_Casey',
  AntarcticaDavis = 'Antarctica_Davis',
  AntarcticaDumontDUrville = 'Antarctica_DumontDUrville',
  AntarcticaMacquarie = 'Antarctica_Macquarie',
  AntarcticaMawson = 'Antarctica_Mawson',
  AntarcticaMcMurdo = 'Antarctica_McMurdo',
  AntarcticaPalmer = 'Antarctica_Palmer',
  AntarcticaRothera = 'Antarctica_Rothera',
  AntarcticaSyowa = 'Antarctica_Syowa',
  AntarcticaTroll = 'Antarctica_Troll',
  AntarcticaVostok = 'Antarctica_Vostok',
  ArcticLongyearbyen = 'Arctic_Longyearbyen',
  AsiaAden = 'Asia_Aden',
  AsiaAlmaty = 'Asia_Almaty',
  AsiaAmman = 'Asia_Amman',
  AsiaAnadyr = 'Asia_Anadyr',
  AsiaAqtau = 'Asia_Aqtau',
  AsiaAqtobe = 'Asia_Aqtobe',
  AsiaAshgabat = 'Asia_Ashgabat',
  AsiaAtyrau = 'Asia_Atyrau',
  AsiaBaghdad = 'Asia_Baghdad',
  AsiaBahrain = 'Asia_Bahrain',
  AsiaBaku = 'Asia_Baku',
  AsiaBangkok = 'Asia_Bangkok',
  AsiaBarnaul = 'Asia_Barnaul',
  AsiaBeirut = 'Asia_Beirut',
  AsiaBishkek = 'Asia_Bishkek',
  AsiaBrunei = 'Asia_Brunei',
  AsiaChita = 'Asia_Chita',
  AsiaChoibalsan = 'Asia_Choibalsan',
  AsiaColombo = 'Asia_Colombo',
  AsiaDamascus = 'Asia_Damascus',
  AsiaDhaka = 'Asia_Dhaka',
  AsiaDili = 'Asia_Dili',
  AsiaDubai = 'Asia_Dubai',
  AsiaDushanbe = 'Asia_Dushanbe',
  AsiaFamagusta = 'Asia_Famagusta',
  AsiaGaza = 'Asia_Gaza',
  AsiaHebron = 'Asia_Hebron',
  AsiaHoChiMinh = 'Asia_Ho_Chi_Minh',
  AsiaHongKong = 'Asia_Hong_Kong',
  AsiaHovd = 'Asia_Hovd',
  AsiaIrkutsk = 'Asia_Irkutsk',
  AsiaJakarta = 'Asia_Jakarta',
  AsiaJayapura = 'Asia_Jayapura',
  AsiaKabul = 'Asia_Kabul',
  AsiaKamchatka = 'Asia_Kamchatka',
  AsiaKarachi = 'Asia_Karachi',
  AsiaKathmandu = 'Asia_Kathmandu',
  AsiaKhandyga = 'Asia_Khandyga',
  AsiaKolkata = 'Asia_Kolkata',
  AsiaKrasnoyarsk = 'Asia_Krasnoyarsk',
  AsiaKualaLumpur = 'Asia_Kuala_Lumpur',
  AsiaKuching = 'Asia_Kuching',
  AsiaKuwait = 'Asia_Kuwait',
  AsiaMacau = 'Asia_Macau',
  AsiaMagadan = 'Asia_Magadan',
  AsiaMakassar = 'Asia_Makassar',
  AsiaManila = 'Asia_Manila',
  AsiaMuscat = 'Asia_Muscat',
  AsiaNicosia = 'Asia_Nicosia',
  AsiaNovokuznetsk = 'Asia_Novokuznetsk',
  AsiaNovosibirsk = 'Asia_Novosibirsk',
  AsiaOmsk = 'Asia_Omsk',
  AsiaOral = 'Asia_Oral',
  AsiaPhnomPenh = 'Asia_Phnom_Penh',
  AsiaPontianak = 'Asia_Pontianak',
  AsiaPyongyang = 'Asia_Pyongyang',
  AsiaQatar = 'Asia_Qatar',
  AsiaQostanay = 'Asia_Qostanay',
  AsiaQyzylorda = 'Asia_Qyzylorda',
  AsiaRiyadh = 'Asia_Riyadh',
  AsiaSakhalin = 'Asia_Sakhalin',
  AsiaSamarkand = 'Asia_Samarkand',
  AsiaSeoul = 'Asia_Seoul',
  AsiaShanghai = 'Asia_Shanghai',
  AsiaSingapore = 'Asia_Singapore',
  AsiaSrednekolymsk = 'Asia_Srednekolymsk',
  AsiaTaipei = 'Asia_Taipei',
  AsiaTashkent = 'Asia_Tashkent',
  AsiaTbilisi = 'Asia_Tbilisi',
  AsiaTehran = 'Asia_Tehran',
  AsiaThimphu = 'Asia_Thimphu',
  AsiaTokyo = 'Asia_Tokyo',
  AsiaTomsk = 'Asia_Tomsk',
  AsiaUlaanbaatar = 'Asia_Ulaanbaatar',
  AsiaUrumqi = 'Asia_Urumqi',
  AsiaUstNera = 'Asia_Ust_Nera',
  AsiaVientiane = 'Asia_Vientiane',
  AsiaVladivostok = 'Asia_Vladivostok',
  AsiaYakutsk = 'Asia_Yakutsk',
  AsiaYangon = 'Asia_Yangon',
  AsiaYekaterinburg = 'Asia_Yekaterinburg',
  AsiaYerevan = 'Asia_Yerevan',
  AtlanticAzores = 'Atlantic_Azores',
  AtlanticBermuda = 'Atlantic_Bermuda',
  AtlanticCanary = 'Atlantic_Canary',
  AtlanticCapeVerde = 'Atlantic_Cape_Verde',
  AtlanticFaroe = 'Atlantic_Faroe',
  AtlanticMadeira = 'Atlantic_Madeira',
  AtlanticReykjavik = 'Atlantic_Reykjavik',
  AtlanticSouthGeorgia = 'Atlantic_South_Georgia',
  AtlanticStHelena = 'Atlantic_St_Helena',
  AtlanticStanley = 'Atlantic_Stanley',
  AustraliaAdelaide = 'Australia_Adelaide',
  AustraliaBrisbane = 'Australia_Brisbane',
  AustraliaBrokenHill = 'Australia_Broken_Hill',
  AustraliaDarwin = 'Australia_Darwin',
  AustraliaEucla = 'Australia_Eucla',
  AustraliaHobart = 'Australia_Hobart',
  AustraliaLindeman = 'Australia_Lindeman',
  AustraliaLordHowe = 'Australia_Lord_Howe',
  AustraliaMelbourne = 'Australia_Melbourne',
  AustraliaPerth = 'Australia_Perth',
  AustraliaSydney = 'Australia_Sydney',
  EtcGmt_1 = 'Etc_GMT_1',
  EtcGmt_2 = 'Etc_GMT_2',
  EtcGmt_3 = 'Etc_GMT_3',
  EtcGmt_4 = 'Etc_GMT_4',
  EtcGmt_5 = 'Etc_GMT_5',
  EtcGmt_6 = 'Etc_GMT_6',
  EtcGmt_7 = 'Etc_GMT_7',
  EtcGmt_8 = 'Etc_GMT_8',
  EtcGmt_9 = 'Etc_GMT_9',
  EtcGmt_10 = 'Etc_GMT_10',
  EtcGmt_11 = 'Etc_GMT_11',
  EtcGmt_12 = 'Etc_GMT_12',
  EtcGmt_13 = 'Etc_GMT_13',
  EtcGmt_14 = 'Etc_GMT_14',
  EtcGmtPlus_1 = 'Etc_GMT_plus_1',
  EtcGmtPlus_2 = 'Etc_GMT_plus_2',
  EtcGmtPlus_3 = 'Etc_GMT_plus_3',
  EtcGmtPlus_4 = 'Etc_GMT_plus_4',
  EtcGmtPlus_5 = 'Etc_GMT_plus_5',
  EtcGmtPlus_6 = 'Etc_GMT_plus_6',
  EtcGmtPlus_7 = 'Etc_GMT_plus_7',
  EtcGmtPlus_8 = 'Etc_GMT_plus_8',
  EtcGmtPlus_9 = 'Etc_GMT_plus_9',
  EtcGmtPlus_10 = 'Etc_GMT_plus_10',
  EtcGmtPlus_11 = 'Etc_GMT_plus_11',
  EtcGmtPlus_12 = 'Etc_GMT_plus_12',
  EuropeAmsterdam = 'Europe_Amsterdam',
  EuropeAndorra = 'Europe_Andorra',
  EuropeAstrakhan = 'Europe_Astrakhan',
  EuropeAthens = 'Europe_Athens',
  EuropeBelgrade = 'Europe_Belgrade',
  EuropeBerlin = 'Europe_Berlin',
  EuropeBratislava = 'Europe_Bratislava',
  EuropeBrussels = 'Europe_Brussels',
  EuropeBucharest = 'Europe_Bucharest',
  EuropeBudapest = 'Europe_Budapest',
  EuropeBusingen = 'Europe_Busingen',
  EuropeChisinau = 'Europe_Chisinau',
  EuropeCopenhagen = 'Europe_Copenhagen',
  EuropeDublin = 'Europe_Dublin',
  EuropeGibraltar = 'Europe_Gibraltar',
  EuropeGuernsey = 'Europe_Guernsey',
  EuropeHelsinki = 'Europe_Helsinki',
  EuropeIsleOfMan = 'Europe_Isle_of_Man',
  EuropeIstanbul = 'Europe_Istanbul',
  EuropeJersey = 'Europe_Jersey',
  EuropeKaliningrad = 'Europe_Kaliningrad',
  EuropeKirov = 'Europe_Kirov',
  EuropeKyiv = 'Europe_Kyiv',
  EuropeLisbon = 'Europe_Lisbon',
  EuropeLjubljana = 'Europe_Ljubljana',
  EuropeLondon = 'Europe_London',
  EuropeLuxembourg = 'Europe_Luxembourg',
  EuropeMadrid = 'Europe_Madrid',
  EuropeMalta = 'Europe_Malta',
  EuropeMariehamn = 'Europe_Mariehamn',
  EuropeMinsk = 'Europe_Minsk',
  EuropeMonaco = 'Europe_Monaco',
  EuropeMoscow = 'Europe_Moscow',
  EuropeOslo = 'Europe_Oslo',
  EuropeParis = 'Europe_Paris',
  EuropePodgorica = 'Europe_Podgorica',
  EuropePrague = 'Europe_Prague',
  EuropeRiga = 'Europe_Riga',
  EuropeRome = 'Europe_Rome',
  EuropeSamara = 'Europe_Samara',
  EuropeSanMarino = 'Europe_San_Marino',
  EuropeSarajevo = 'Europe_Sarajevo',
  EuropeSaratov = 'Europe_Saratov',
  EuropeSimferopol = 'Europe_Simferopol',
  EuropeSkopje = 'Europe_Skopje',
  EuropeSofia = 'Europe_Sofia',
  EuropeStockholm = 'Europe_Stockholm',
  EuropeTallinn = 'Europe_Tallinn',
  EuropeTirane = 'Europe_Tirane',
  EuropeUlyanovsk = 'Europe_Ulyanovsk',
  EuropeVaduz = 'Europe_Vaduz',
  EuropeVatican = 'Europe_Vatican',
  EuropeVienna = 'Europe_Vienna',
  EuropeVilnius = 'Europe_Vilnius',
  EuropeVolgograd = 'Europe_Volgograd',
  EuropeWarsaw = 'Europe_Warsaw',
  EuropeZagreb = 'Europe_Zagreb',
  EuropeZurich = 'Europe_Zurich',
  IndianAntananarivo = 'Indian_Antananarivo',
  IndianChagos = 'Indian_Chagos',
  IndianChristmas = 'Indian_Christmas',
  IndianCocos = 'Indian_Cocos',
  IndianComoro = 'Indian_Comoro',
  IndianKerguelen = 'Indian_Kerguelen',
  IndianMahe = 'Indian_Mahe',
  IndianMaldives = 'Indian_Maldives',
  IndianMauritius = 'Indian_Mauritius',
  IndianMayotte = 'Indian_Mayotte',
  IndianReunion = 'Indian_Reunion',
  PacificApia = 'Pacific_Apia',
  PacificAuckland = 'Pacific_Auckland',
  PacificBougainville = 'Pacific_Bougainville',
  PacificChatham = 'Pacific_Chatham',
  PacificChuuk = 'Pacific_Chuuk',
  PacificEaster = 'Pacific_Easter',
  PacificEfate = 'Pacific_Efate',
  PacificFakaofo = 'Pacific_Fakaofo',
  PacificFiji = 'Pacific_Fiji',
  PacificFunafuti = 'Pacific_Funafuti',
  PacificGalapagos = 'Pacific_Galapagos',
  PacificGambier = 'Pacific_Gambier',
  PacificGuadalcanal = 'Pacific_Guadalcanal',
  PacificGuam = 'Pacific_Guam',
  PacificHonolulu = 'Pacific_Honolulu',
  PacificKanton = 'Pacific_Kanton',
  PacificKiritimati = 'Pacific_Kiritimati',
  PacificKosrae = 'Pacific_Kosrae',
  PacificKwajalein = 'Pacific_Kwajalein',
  PacificMajuro = 'Pacific_Majuro',
  PacificMarquesas = 'Pacific_Marquesas',
  PacificMidway = 'Pacific_Midway',
  PacificNauru = 'Pacific_Nauru',
  PacificNiue = 'Pacific_Niue',
  PacificNorfolk = 'Pacific_Norfolk',
  PacificNoumea = 'Pacific_Noumea',
  PacificPagoPago = 'Pacific_Pago_Pago',
  PacificPalau = 'Pacific_Palau',
  PacificPitcairn = 'Pacific_Pitcairn',
  PacificPohnpei = 'Pacific_Pohnpei',
  PacificPortMoresby = 'Pacific_Port_Moresby',
  PacificRarotonga = 'Pacific_Rarotonga',
  PacificSaipan = 'Pacific_Saipan',
  PacificTahiti = 'Pacific_Tahiti',
  PacificTarawa = 'Pacific_Tarawa',
  PacificTongatapu = 'Pacific_Tongatapu',
  PacificWake = 'Pacific_Wake',
  PacificWallis = 'Pacific_Wallis',
  Utc = 'UTC'
}

export enum IdentifierKind {
  Email = 'EMAIL',
  EmailOrHandle = 'EMAIL_OR_HANDLE',
  Handle = 'HANDLE'
}

export type ImpersonationStatus = {
  __typename?: 'ImpersonationStatus';
  actorUser: Maybe<User>;
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  reason: Maybe<Scalars['String']['output']>;
  startedAt: Maybe<Scalars['DateTime']['output']>;
  targetUser: Maybe<User>;
};

export type InvoicePaymentSubmission = {
  __typename?: 'InvoicePaymentSubmission';
  fileId: Maybe<Scalars['String']['output']>;
  filePath: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  invoiceId: Maybe<Scalars['String']['output']>;
  mimeType: Maybe<Scalars['String']['output']>;
  rejectionReason: Maybe<Scalars['String']['output']>;
  reviewedAt: Maybe<Scalars['String']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  status: Maybe<InvoicePaymentSubmissionStatus>;
  submittedAt: Maybe<Scalars['String']['output']>;
  submittedByUserId: Maybe<Scalars['String']['output']>;
};

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

export type LearningResourceRow = {
  __typename?: 'LearningResourceRow';
  contentType: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  filePath: Maybe<Scalars['String']['output']>;
  fileSize: Maybe<Scalars['Float']['output']>;
  id: Maybe<Scalars['String']['output']>;
  uploadedByUserId: Maybe<Scalars['String']['output']>;
  uploadedByUserName: Maybe<Scalars['String']['output']>;
};

export type LeaveProcessResult = {
  __typename?: 'LeaveProcessResult';
  completedInstance: Maybe<ClassInstanceDetail>;
  completedInstanceId: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  rescheduledInstance: Maybe<ClassInstanceDetail>;
  rescheduledInstanceId: Maybe<Scalars['String']['output']>;
};

export enum LeaveRequestStatus {
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Pending = 'PENDING',
  Rescheduled = 'RESCHEDULED'
}

/** A teacher-submitted lesson report for a completed class instance, with review workflow */
export type LessonReport = {
  __typename?: 'LessonReport';
  attendanceEvaluation: Maybe<AttendanceEvaluation>;
  classAvatarUrl: Maybe<Scalars['String']['output']>;
  classInstanceId: Maybe<Scalars['String']['output']>;
  completionPercentage: Maybe<Scalars['Int']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  idempotencyKey: Maybe<Scalars['String']['output']>;
  lessonDate: Maybe<Scalars['DateTime']['output']>;
  rejectionReason: Maybe<Scalars['String']['output']>;
  reviewedAt: Maybe<Scalars['DateTime']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  status: Maybe<LessonReportStatus>;
  studentAvatarUrl: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  studentNotes: Maybe<Scalars['String']['output']>;
  studentUserId: Maybe<Scalars['String']['output']>;
  subjectName: Maybe<Scalars['String']['output']>;
  submittedAt: Maybe<Scalars['DateTime']['output']>;
  submittedByUserId: Maybe<Scalars['String']['output']>;
  teacherAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  teacherNotes: Maybe<Scalars['String']['output']>;
  teacherUserId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export enum LessonReportStatus {
  Approved = 'APPROVED',
  Draft = 'DRAFT',
  PendingReview = 'PENDING_REVIEW',
  Rejected = 'REJECTED'
}

/** Input for submitting a lesson report for a completed class instance */
export type LessonReportSubmitInput = {
  attendanceEvaluation: AttendanceEvaluation;
  classInstanceId: Scalars['ID']['input'];
  completionPercentage: Scalars['Int']['input'];
  durationMinutes: Scalars['Int']['input'];
  teacherNotes: InputMaybe<Scalars['String']['input']>;
};

/** Input for reviewing (approving/rejecting) a lesson report */
export type LessonReviewInput = {
  rejectionReason: InputMaybe<Scalars['String']['input']>;
  reportId: Scalars['ID']['input'];
};

export type LogSupportRequestInput = {
  reason: Scalars['String']['input'];
};

export type LoginInput = {
  email: Scalars['Email']['input'];
  password: Scalars['String']['input'];
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  token: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
};

export enum ManagerAccountType {
  Manager = 'manager',
  Supervisor = 'supervisor'
}

export type ManagerDirectoryMetrics = {
  __typename?: 'ManagerDirectoryMetrics';
  activeNow: Maybe<Scalars['Int']['output']>;
  alerts: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  systemStaff: Maybe<Scalars['Int']['output']>;
  totalAdmin: Maybe<Scalars['Int']['output']>;
};

export type ManagerDirectoryResult = {
  __typename?: 'ManagerDirectoryResult';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<ManagerDirectoryMetrics>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<ManagerDirectoryRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ManagerDirectoryRow = {
  __typename?: 'ManagerDirectoryRow';
  avatarUrl: Maybe<Scalars['String']['output']>;
  displayAmount: Maybe<DisplayAmount>;
  email: Maybe<Scalars['String']['output']>;
  hourlyRate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<CurrencyCode>;
  roleName: Maybe<Scalars['String']['output']>;
  roleSlug: Maybe<Scalars['String']['output']>;
  staffProfileId: Maybe<Scalars['String']['output']>;
  status: Maybe<AccountStatus>;
  userId: Maybe<Scalars['String']['output']>;
};

/** Manager/Staff account details */
export type ManagerOnboarding = {
  __typename?: 'ManagerOnboarding';
  assignedGroupSlug: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  staffProfileId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

/** Input for creating a new manager/staff account with RBAC assignment */
export type ManagerOnboardingInput = {
  accountType: ManagerAccountType;
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  displayCurrency: InputMaybe<CurrencyCode>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<IanaTimezone>;
};

/** Result of manager onboarding operation */
export type ManagerOnboardingResult = {
  __typename?: 'ManagerOnboardingResult';
  assignedGroupSlug: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  staffProfileId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ManualInvoiceResult = {
  __typename?: 'ManualInvoiceResult';
  amount: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  dueDate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<InvoiceType>;
  issueDate: Maybe<Scalars['String']['output']>;
  paidDate: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  status: Maybe<InvoiceStatus>;
  studentId: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type MarkInvoicePaidResult = {
  __typename?: 'MarkInvoicePaidResult';
  id: Maybe<Scalars['String']['output']>;
  notificationSummaryUpdated: Maybe<Scalars['Boolean']['output']>;
  paidDate: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  status: Maybe<InvoiceStatus>;
  version: Maybe<Scalars['Int']['output']>;
};

/** Input for marking a suggestion as a duplicate of another suggestion. */
export type MarkSuggestionDuplicateInput = {
  duplicateOfId: Scalars['String']['input'];
  suggestionId: Scalars['String']['input'];
};

export type MeetingConfigDetails = {
  __typename?: 'MeetingConfigDetails';
  meetingUrl: Maybe<Scalars['String']['output']>;
  tenantId: Maybe<Scalars['String']['output']>;
  username: Maybe<Scalars['String']['output']>;
};

export type MeetingConfigDetailsInput = {
  meetingUrl: InputMaybe<Scalars['String']['input']>;
  tenantId: InputMaybe<Scalars['String']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
};

export enum MeetingConnectionTestMode {
  GenerateAndDelete = 'GENERATE_AND_DELETE',
  ValidateConfig = 'VALIDATE_CONFIG'
}

export type MeetingIntegrationConnectedAccount = {
  __typename?: 'MeetingIntegrationConnectedAccount';
  connectedAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  lastRefreshedAt: Maybe<Scalars['DateTime']['output']>;
  name: Maybe<Scalars['String']['output']>;
  scopes: Maybe<Array<Scalars['String']['output']>>;
  status: Maybe<MeetingIntegrationConnectedAccountStatus>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum MeetingIntegrationConnectedAccountStatus {
  Connected = 'CONNECTED',
  ExpiringSoon = 'EXPIRING_SOON',
  ReauthNeeded = 'REAUTH_NEEDED',
  Revoked = 'REVOKED'
}

export type MeetingIntegrationProvider = {
  __typename?: 'MeetingIntegrationProvider';
  connectedTeacherCount: Maybe<Scalars['Int']['output']>;
  credentialsHealthy: Maybe<Scalars['Boolean']['output']>;
  endpoints: Maybe<Array<Scalars['String']['output']>>;
  id: Maybe<Scalars['String']['output']>;
  kind: Maybe<Scalars['String']['output']>;
  lastTestedAt: Maybe<Scalars['DateTime']['output']>;
  reauthNeededCount: Maybe<Scalars['Int']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};

export enum MeetingIntegrationProviderSlug {
  GoogleMeet = 'GOOGLE_MEET',
  MicrosoftTeams = 'MICROSOFT_TEAMS',
  Zoom = 'ZOOM'
}

export type MeetingProvider = {
  __typename?: 'MeetingProvider';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['LocalizedString']['output']>;
  fieldSchema: Maybe<MeetingProviderFieldSchema>;
  id: Maybe<Scalars['String']['output']>;
  instructions: Maybe<Scalars['LocalizedString']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  logoUrl: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['LocalizedString']['output']>;
  providerKind: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  urlAllowlist: Maybe<Array<Scalars['String']['output']>>;
  urlExample: Maybe<Scalars['String']['output']>;
};

export type MeetingProviderCreateInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  fieldSchema: MeetingProviderFieldSchemaInput;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['LocalizedString']['input'];
  providerKind: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  urlAllowlist: Array<Scalars['String']['input']>;
  urlExample: InputMaybe<Scalars['String']['input']>;
};

export type MeetingProviderFieldSchema = {
  __typename?: 'MeetingProviderFieldSchema';
  requiresMeetingUrl: Maybe<Scalars['Boolean']['output']>;
  supportsAutoGeneration: Maybe<Scalars['Boolean']['output']>;
  supportsPassword: Maybe<Scalars['Boolean']['output']>;
  supportsTenantId: Maybe<Scalars['Boolean']['output']>;
  supportsUsername: Maybe<Scalars['Boolean']['output']>;
};

export type MeetingProviderFieldSchemaInput = {
  requiresMeetingUrl: Scalars['Boolean']['input'];
  supportsAutoGeneration: InputMaybe<Scalars['Boolean']['input']>;
  supportsPassword: InputMaybe<Scalars['Boolean']['input']>;
  supportsTenantId: InputMaybe<Scalars['Boolean']['input']>;
  supportsUsername: InputMaybe<Scalars['Boolean']['input']>;
};

export type MeetingProviderUpdateInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  fieldSchema: InputMaybe<MeetingProviderFieldSchemaInput>;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['LocalizedString']['input']>;
  providerKind: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  urlAllowlist: InputMaybe<Array<Scalars['String']['input']>>;
  urlExample: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  activateClass: Maybe<ClassInstanceDetail>;
  activateOverrideClass: Maybe<ClassInstanceDetail>;
  activateSupportedCurrency: Maybe<SupportedCurrency>;
  adminResetPassword: Maybe<AdminResetPasswordResult>;
  adminRevokeMeetingProviderToken: Maybe<AdminRevokeTokenResult>;
  /** Approve a pending lesson report (supervisor/manager action) */
  approveLessonReport: Maybe<LessonReport>;
  approvePaymentProof: Maybe<MarkInvoicePaidResult>;
  assignPermissionGroupToUser: Maybe<Scalars['Boolean']['output']>;
  attachSubjectResource: Maybe<SubjectResource>;
  bulkAssignUsersToGroup: Maybe<Scalars['Boolean']['output']>;
  bulkRevokeUsersFromGroup: Maybe<Scalars['Boolean']['output']>;
  changeParentLifecycleStatus: Maybe<ChangeParentLifecycleResult>;
  changePassword: Maybe<Scalars['Boolean']['output']>;
  changeStudentStatus: Maybe<ChangeStudentStatusResult>;
  cleanupTestEntities: Maybe<Scalars['Boolean']['output']>;
  cleanupTestGroupClass: Maybe<Scalars['Boolean']['output']>;
  cleanupTestManager: Maybe<Scalars['Boolean']['output']>;
  cleanupTestSuperAdmin: Maybe<Scalars['Boolean']['output']>;
  clearWeeklySchedule: Maybe<Scalars['Boolean']['output']>;
  connectMeetingProviderOAuth: Maybe<ConnectMeetingProviderOAuthResult>;
  copyStorageItems: Maybe<BulkOperationResult>;
  createClassCategory: Maybe<ClassCategory>;
  createClassMeetingConfig: Maybe<ClassMeetingConfig>;
  createClassSubject: Maybe<ClassSubject>;
  createCurrencyHedge: Maybe<CurrencyHedge>;
  createFolder: Maybe<FileOperationResult>;
  /** Create a new user with a non-specialized permission group */
  createGeneralUser: Maybe<GeneralUserCreateResult>;
  /** Create a new manager/staff account (System Admin only) */
  createManager: Maybe<ManagerOnboardingResult>;
  createManualInvoice: Maybe<ManualInvoiceResult>;
  createMeetingProvider: Maybe<MeetingProvider>;
  /** Create a new parent account with billing configuration */
  createParent: Maybe<ParentOnboardingResult>;
  createPermissionGroup: Maybe<PermissionGroup>;
  /** Create a new quota allocation for a student */
  createQuota: Maybe<Quota>;
  createRecurringClass: Maybe<CreateRecurringClassResult>;
  /** Create a new student profile under an existing parent */
  createStudent: Maybe<StudentOnboardingResult>;
  /** Create a new supervisor account with SUPERVISOR_DEFAULT permission group (System Admin only) */
  createSupervisor: Maybe<ManagerOnboardingResult>;
  createSupportedMobileWallet: Maybe<SupportedMobileWallet>;
  createSupportedOnlineAccount: Maybe<SupportedOnlineAccount>;
  createSupportedPaymentLink: Maybe<SupportedPaymentLink>;
  /** Create a new teacher account with comprehensive profile */
  createTeacher: Maybe<TeacherOnboarding>;
  createTeacherImportantNote: Maybe<TeacherImportantNote>;
  createTeacherManualClassEntry: Maybe<ClassInstanceDetail>;
  createTeacherPayment: Maybe<TeacherPayment>;
  createTestEntities: Maybe<TestEntities>;
  createTestGroupClass: Maybe<TestGroupClass>;
  createTestSuperAdmin: Maybe<TestSuperAdmin>;
  createUserMeetingConfig: Maybe<UserMeetingConfig>;
  createUserPaymentMethod: Maybe<UserPaymentMethod>;
  /** Create a new WhatsApp business account record. */
  createWhatsappAccount: Maybe<WhatsappAccount>;
  /** Retry a failed cron run. */
  cronRunRetry: Maybe<CronRun>;
  /** Manually trigger a cron schedule to run immediately. */
  cronRunTrigger: Maybe<CronRun>;
  /** Create a new cron schedule. */
  cronScheduleCreate: Maybe<CronSchedule>;
  /** Delete a cron schedule (soft by default, hard if specified). */
  cronScheduleDelete: Maybe<Scalars['Boolean']['output']>;
  /** Pause a cron schedule. */
  cronSchedulePause: Maybe<CronSchedule>;
  /** Resume a paused cron schedule. */
  cronScheduleResume: Maybe<CronSchedule>;
  /** Update an existing cron schedule. */
  cronScheduleUpdate: Maybe<CronSchedule>;
  deactivateParent: Maybe<DeactivateParentResult>;
  deactivateSupportedCurrency: Maybe<Scalars['Boolean']['output']>;
  deactivateSupportedMobileWallet: Maybe<SupportedMobileWallet>;
  deactivateSupportedOnlineAccount: Maybe<SupportedOnlineAccount>;
  deactivateSupportedPaymentLink: Maybe<SupportedPaymentLink>;
  /** Soft-deletes a book by marking it as deleted. */
  deleteBook: Maybe<Scalars['Boolean']['output']>;
  deleteClassCategory: Maybe<Scalars['Boolean']['output']>;
  deleteClassInstance: Maybe<Scalars['Boolean']['output']>;
  deleteClassMeetingConfig: Maybe<Scalars['Boolean']['output']>;
  deleteClassSubject: Maybe<Scalars['Boolean']['output']>;
  /** Soft-deletes a complaint (admin only). Returns true on success. */
  deleteComplaint: Maybe<Scalars['Boolean']['output']>;
  deleteCurrencyHedge: Maybe<Scalars['Boolean']['output']>;
  deleteEnvConfigEntry: Maybe<EnvConfigDeleteResult>;
  deleteFile: Maybe<FileOperationResult>;
  deleteInvoice: Maybe<DeleteInvoiceResult>;
  /** Permanently deletes a learning resource from physical storage and the database. */
  deleteLearningResource: Maybe<Scalars['Boolean']['output']>;
  deleteMeetingProvider: Maybe<Scalars['Boolean']['output']>;
  deletePermissionGroup: Maybe<Scalars['Boolean']['output']>;
  /** Soft delete a student quota allocation */
  deleteQuota: Maybe<Quota>;
  deleteRecurringClass: Maybe<Scalars['Boolean']['output']>;
  /** Deletes a per-role session configuration. */
  deleteSessionConfig: Maybe<Scalars['Boolean']['output']>;
  /** Permanently deletes a site content entry. */
  deleteSiteContent: Maybe<Scalars['Boolean']['output']>;
  deleteStorageItems: Maybe<BulkOperationResult>;
  deleteStudent: Maybe<Student>;
  /** Soft-deletes a suggestion (super admin only). Returns true on success. */
  deleteSuggestion: Maybe<Scalars['Boolean']['output']>;
  deleteSystemSetting: Maybe<Scalars['Boolean']['output']>;
  deleteTeacherImportantNote: Maybe<Scalars['Boolean']['output']>;
  deleteUserMeetingConfig: Maybe<Scalars['Boolean']['output']>;
  deleteUserPaymentMethod: Maybe<Scalars['Boolean']['output']>;
  /** Deactivate a WhatsApp account. Calls resetWhatsappChannel() on success (S4). */
  deleteWhatsappAccount: Maybe<WhatsappAccount>;
  /** Special GraphQL endpoint for demo fast login. It bypasses password checks and logs in a user using the provided permission group slug. Intended strictly for demonstration purposes and secured by environment variables. */
  demoLogin: Maybe<LoginResponse>;
  detachSubjectResource: Maybe<Scalars['Boolean']['output']>;
  disconnectMeetingProviderOAuth: Maybe<DisconnectMeetingProviderOAuthResult>;
  endImpersonation: Maybe<EndImpersonationResponse>;
  endPermissionGroupSimulation: Maybe<EndPermissionGroupSimulationResponse>;
  ensureDemoUsers: Maybe<Scalars['Boolean']['output']>;
  executeDstBulkUpdate: Maybe<DstMigrationReport>;
  generateMeetingUrl: Maybe<GenerateMeetingUrlResult>;
  linkDocumentToParent: Maybe<ParentDocument>;
  logTeacherSupportRequest: Maybe<SupportRequestResult>;
  login: Maybe<LoginResponse>;
  logout: Maybe<Scalars['Boolean']['output']>;
  markInvoicePaid: Maybe<MarkInvoicePaidResult>;
  markNotificationRead: Maybe<Scalars['Boolean']['output']>;
  markNotificationsRead: Maybe<Scalars['Int']['output']>;
  /** Marks a suggestion as a duplicate of another suggestion (admin only). */
  markSuggestionDuplicate: Maybe<Suggestion>;
  /** Marks a suggestion as reviewed (admin only). */
  markSuggestionReviewed: Maybe<Suggestion>;
  /** Mark pending teacher dues as paid (batch operation) */
  markTeacherDuesPaid: Maybe<Array<TeacherDue>>;
  moveStorageItems: Maybe<BulkOperationResult>;
  overrideClassInstanceRate: Maybe<ClassInstanceDetail>;
  partiallyUpdateStudent: Maybe<Student>;
  prepareUpload: Maybe<UploadPreparation>;
  reactivateParent: Maybe<ReactivateParentResult>;
  reassignStudentTeacher: Maybe<ReassignStudentTeacherResult>;
  /** Record a credit purchase for a student (adds classes to their balance) */
  recordCreditPurchase: Maybe<CreditPurchaseResult>;
  recordPayment: Maybe<Payment>;
  recordStudentProfileEdit: Maybe<StudentProfile>;
  refreshExchangeRates: Maybe<RefreshExchangeRatesResult>;
  refreshToken: Maybe<RefreshTokenResponse>;
  /** Reject a pending lesson report with a rejection reason (supervisor/manager action) */
  rejectLessonReport: Maybe<LessonReport>;
  rejectPaymentProof: Maybe<MarkInvoicePaidResult>;
  renameFile: Maybe<FileOperationResult>;
  rescheduleClass: Maybe<ClassInstanceDetail>;
  resendClassNotifications: Maybe<SupportRequestResult>;
  resetClass: Maybe<Scalars['Boolean']['output']>;
  /** Creates a response to an existing complaint (admin only). */
  respondToComplaint: Maybe<ComplaintResponse>;
  /** Responds to a suggestion with an admin text response (admin only). */
  respondToSuggestion: Maybe<Suggestion>;
  revokePermissionGroupFromUser: Maybe<Scalars['Boolean']['output']>;
  sendPaymentReminder: Maybe<SendPaymentReminderResult>;
  setDefaultClassMeetingConfig: Maybe<ClassMeetingConfig>;
  setDefaultMeetingConfig: Maybe<UserMeetingConfig>;
  setDefaultUserPaymentMethod: Maybe<UserPaymentMethod>;
  setStorageItemProtection: Maybe<FileOperationResult>;
  /** Enable or disable WhatsApp notification opt-in for a user (REQ-10/BL1). */
  setUserWhatsappOptIn: Maybe<WhatsappAccount>;
  /** Set the access token for a WhatsApp account. Calls resetWhatsappChannel() on success (S4). */
  setWhatsappAccessToken: Maybe<WhatsappAccount>;
  /** Set the two-step verification PIN for a WhatsApp account. Calls resetWhatsappChannel() on success (S4). */
  setWhatsappTwoStepPin: Maybe<WhatsappAccount>;
  startImpersonation: Maybe<StartImpersonationResponse>;
  startPermissionGroupSimulation: Maybe<StartPermissionGroupSimulationResponse>;
  stopClass: Maybe<ClassInstanceDetail>;
  /** Submits a new complaint from the authenticated parent. */
  submitComplaint: Maybe<Complaint>;
  /** Submit a lesson report for a completed class instance (teacher action) */
  submitLessonReport: Maybe<LessonReport>;
  submitPaymentProof: Maybe<MarkInvoicePaidResult>;
  /** Student adds their reflection/notes to an existing lesson report */
  submitStudentLessonReportReflection: Maybe<LessonReport>;
  /** Submits a new suggestion from the authenticated parent. */
  submitSuggestion: Maybe<Suggestion>;
  /** Sync WhatsApp phone numbers and message templates from Meta Graph API (BL3: includes template snapshot). */
  syncWhatsappAccountsFromMeta: Maybe<WhatsappSyncFromMetaResult>;
  testMeetingProviderConnection: Maybe<TestMeetingConnectionResult>;
  updateClassAdminNote: Maybe<GroupClassAudit>;
  updateClassCategory: Maybe<ClassCategory>;
  updateClassMeetingConfig: Maybe<ClassMeetingConfig>;
  updateClassSubject: Maybe<ClassSubject>;
  updateCurrencyHedge: Maybe<CurrencyHedge>;
  updateDirectoryPermissions: Maybe<FileOperationResult>;
  updateFxProvider: Maybe<FxProviderConfig>;
  /** Updates a manager's profile fields. */
  updateManagerProfile: Maybe<ManagerDirectoryRow>;
  updateMeetingProvider: Maybe<MeetingProvider>;
  updateNotificationPreferences: Maybe<Array<NotificationPreference>>;
  updateOwnProfile: Maybe<UnifiedProfile>;
  updatePermissionGroup: Maybe<PermissionGroup>;
  /** Update an existing student quota allocation */
  updateQuota: Maybe<Quota>;
  updateRecurringClassRate: Maybe<RecurringScheduleDetail>;
  updateSessionStatusAbsent: Maybe<ClassInstanceDetail>;
  updateSessionStatusLeave: Maybe<LeaveProcessResult>;
  updateSessionStatusStart: Maybe<ClassInstanceDetail>;
  /** Updates the published state of a site content entry. */
  updateSiteContentPublishState: Maybe<SiteContentEntry>;
  updateStudentQuota: Maybe<EditQuotaResult>;
  updateSupportedMobileWallet: Maybe<SupportedMobileWallet>;
  updateSupportedOnlineAccount: Maybe<SupportedOnlineAccount>;
  updateSupportedPaymentLink: Maybe<SupportedPaymentLink>;
  updateTeacherImportantNote: Maybe<TeacherImportantNote>;
  updateTeacherProfile: Maybe<TeacherProfileResult>;
  updateUserMeetingConfig: Maybe<UserMeetingConfig>;
  updateUserOverrides: Maybe<Scalars['Boolean']['output']>;
  updateUserPaymentMethod: Maybe<UserPaymentMethod>;
  updateUserProfile: Maybe<UnifiedProfile>;
  /** Update an existing WhatsApp account. Calls resetWhatsappChannel() on success (S4). */
  updateWhatsappAccount: Maybe<WhatsappAccount>;
  /** Uploads a new learning resource to the academy library. */
  uploadLearningResource: Maybe<LearningResourceRow>;
  upsertEnvConfigEntry: Maybe<EnvConfigUpsertResult>;
  upsertManualExchangeRate: Maybe<UpsertManualExchangeRateResult>;
  /** Creates or updates a per-role session configuration. */
  upsertSessionConfig: Maybe<SessionConfig>;
  /** Creates or updates a site content entry by slug. */
  upsertSiteContent: Maybe<SiteContentEntry>;
  upsertSystemSetting: Maybe<SystemSetting>;
  verifyBankTransferPaymentMethod: Maybe<UserPaymentMethod>;
};


export type MutationActivateClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationActivateOverrideClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationActivateSupportedCurrencyArgs = {
  input: SupportedCurrencyUpsertInput;
};


export type MutationAdminResetPasswordArgs = {
  input: AdminResetPasswordInput;
};


export type MutationAdminRevokeMeetingProviderTokenArgs = {
  input: AdminRevokeTokenInput;
};


export type MutationApproveLessonReportArgs = {
  reportId: Scalars['ID']['input'];
};


export type MutationApprovePaymentProofArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  invoiceId: Scalars['String']['input'];
};


export type MutationAssignPermissionGroupToUserArgs = {
  input: AssignPermissionGroupToUserInput;
};


export type MutationAttachSubjectResourceArgs = {
  input: AttachSubjectResourceInput;
};


export type MutationBulkAssignUsersToGroupArgs = {
  groupId: Scalars['String']['input'];
  userIds: Array<Scalars['String']['input']>;
};


export type MutationBulkRevokeUsersFromGroupArgs = {
  groupId: Scalars['String']['input'];
  userIds: Array<Scalars['String']['input']>;
};


export type MutationChangeParentLifecycleStatusArgs = {
  newStatus: ParentStatus;
  parentId: Scalars['String']['input'];
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationChangeStudentStatusArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  newStatus: StudentStatus;
  studentId: Scalars['String']['input'];
};


export type MutationCleanupTestEntitiesArgs = {
  parentId: Scalars['String']['input'];
  parentUserId: Scalars['String']['input'];
  studentId: Scalars['String']['input'];
  studentUserId: Scalars['String']['input'];
  teacherId: Scalars['String']['input'];
  teacherUserId: Scalars['String']['input'];
};


export type MutationCleanupTestGroupClassArgs = {
  groupClassId: Scalars['String']['input'];
};


export type MutationCleanupTestManagerArgs = {
  userId: Scalars['String']['input'];
};


export type MutationCleanupTestSuperAdminArgs = {
  userId: Scalars['String']['input'];
};


export type MutationClearWeeklyScheduleArgs = {
  teacherId: Scalars['ID']['input'];
};


export type MutationConnectMeetingProviderOAuthArgs = {
  input: ConnectMeetingProviderOAuthInput;
};


export type MutationCopyStorageItemsArgs = {
  input: StorageItemsCopyInput;
};


export type MutationCreateClassCategoryArgs = {
  input: ClassCategoryCreateInput;
};


export type MutationCreateClassMeetingConfigArgs = {
  input: ClassMeetingConfigCreateInput;
};


export type MutationCreateClassSubjectArgs = {
  input: ClassSubjectCreateInput;
};


export type MutationCreateCurrencyHedgeArgs = {
  amount: Scalars['String']['input'];
  currency: CurrencyCode;
  hedgeType: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateFolderArgs = {
  input: FolderCreateInput;
};


export type MutationCreateGeneralUserArgs = {
  input: GeneralUserCreateInput;
};


export type MutationCreateManagerArgs = {
  input: ManagerOnboardingInput;
};


export type MutationCreateManualInvoiceArgs = {
  amount: Scalars['String']['input'];
  billingMonths: InputMaybe<Array<BillingMonthInput>>;
  currency: CurrencyCode;
  dueDate: Scalars['String']['input'];
  exchangeRateSnapshot: InputMaybe<Scalars['String']['input']>;
  exchangeRateSource: InputMaybe<Scalars['String']['input']>;
  invoiceType: InvoiceType;
  issueDate: Scalars['String']['input'];
  parentId: Scalars['String']['input'];
  sendEmail: InputMaybe<Scalars['Boolean']['input']>;
  studentId: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateMeetingProviderArgs = {
  input: MeetingProviderCreateInput;
};


export type MutationCreateParentArgs = {
  input: ParentOnboardingInput;
};


export type MutationCreatePermissionGroupArgs = {
  input: CreatePermissionGroupInput;
};


export type MutationCreateQuotaArgs = {
  input: QuotaSubmitInput;
};


export type MutationCreateRecurringClassArgs = {
  input: CreateRecurringClassInput;
};


export type MutationCreateStudentArgs = {
  input: StudentOnboardingInput;
};


export type MutationCreateSupervisorArgs = {
  input: ManagerOnboardingInput;
};


export type MutationCreateSupportedMobileWalletArgs = {
  input: SupportedMobileWalletCreateInput;
};


export type MutationCreateSupportedOnlineAccountArgs = {
  input: SupportedOnlineAccountCreateInput;
};


export type MutationCreateSupportedPaymentLinkArgs = {
  input: SupportedPaymentLinkCreateInput;
};


export type MutationCreateTeacherArgs = {
  input: TeacherOnboardingInput;
};


export type MutationCreateTeacherImportantNoteArgs = {
  input: CreateTeacherNoteInput;
};


export type MutationCreateTeacherManualClassEntryArgs = {
  input: CreateManualClassEntryInput;
};


export type MutationCreateTeacherPaymentArgs = {
  amount: Scalars['String']['input'];
  currency: CurrencyCode;
  isTestPayment: InputMaybe<Scalars['Boolean']['input']>;
  paymentDate: InputMaybe<Scalars['String']['input']>;
  teacherId: Scalars['ID']['input'];
  userPaymentMethodId: Scalars['ID']['input'];
};


export type MutationCreateTestEntitiesArgs = {
  classesRemaining: InputMaybe<Scalars['Int']['input']>;
  prefix: Scalars['String']['input'];
};


export type MutationCreateTestGroupClassArgs = {
  classInstanceId: Scalars['String']['input'];
  teacherName: Scalars['String']['input'];
};


export type MutationCreateTestSuperAdminArgs = {
  prefix: Scalars['String']['input'];
};


export type MutationCreateUserMeetingConfigArgs = {
  input: UserMeetingConfigCreateInput;
};


export type MutationCreateUserPaymentMethodArgs = {
  input: UserPaymentMethodCreateInput;
};


export type MutationCreateWhatsappAccountArgs = {
  input: WhatsappAccountCreateInput;
};


export type MutationCronRunRetryArgs = {
  input: CronRunRetryInput;
};


export type MutationCronRunTriggerArgs = {
  input: CronRunTriggerInput;
};


export type MutationCronScheduleCreateArgs = {
  input: CronScheduleSubmitInput;
};


export type MutationCronScheduleDeleteArgs = {
  input: CronScheduleDeleteInput;
};


export type MutationCronSchedulePauseArgs = {
  id: Scalars['String']['input'];
};


export type MutationCronScheduleResumeArgs = {
  id: Scalars['String']['input'];
};


export type MutationCronScheduleUpdateArgs = {
  id: Scalars['String']['input'];
  input: CronScheduleUpdateInput;
};


export type MutationDeactivateParentArgs = {
  parentId: Scalars['String']['input'];
};


export type MutationDeactivateSupportedCurrencyArgs = {
  code: CurrencyCode;
};


export type MutationDeactivateSupportedMobileWalletArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeactivateSupportedOnlineAccountArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeactivateSupportedPaymentLinkArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteBookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteClassCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteClassInstanceArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationDeleteClassMeetingConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteClassSubjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteComplaintArgs = {
  complaintId: Scalars['String']['input'];
};


export type MutationDeleteCurrencyHedgeArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteEnvConfigEntryArgs = {
  key: Scalars['String']['input'];
};


export type MutationDeleteFileArgs = {
  path: Scalars['String']['input'];
};


export type MutationDeleteInvoiceArgs = {
  invoiceId: Scalars['String']['input'];
};


export type MutationDeleteLearningResourceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMeetingProviderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePermissionGroupArgs = {
  groupId: Scalars['String']['input'];
};


export type MutationDeleteQuotaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRecurringClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationDeleteSessionConfigArgs = {
  roleName: Scalars['String']['input'];
};


export type MutationDeleteSiteContentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteStorageItemsArgs = {
  input: StorageItemsDeleteInput;
};


export type MutationDeleteStudentArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteSuggestionArgs = {
  suggestionId: Scalars['String']['input'];
};


export type MutationDeleteSystemSettingArgs = {
  key: Scalars['String']['input'];
};


export type MutationDeleteTeacherImportantNoteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserMeetingConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserPaymentMethodArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWhatsappAccountArgs = {
  id: Scalars['String']['input'];
};


export type MutationDemoLoginArgs = {
  input: DemoLoginInput;
};


export type MutationDetachSubjectResourceArgs = {
  learningResourceId: Scalars['ID']['input'];
  subjectId: Scalars['ID']['input'];
};


export type MutationDisconnectMeetingProviderOAuthArgs = {
  input: DisconnectMeetingProviderOAuthInput;
};


export type MutationExecuteDstBulkUpdateArgs = {
  description: Scalars['String']['input'];
  offsetMinutes: Scalars['Int']['input'];
};


export type MutationGenerateMeetingUrlArgs = {
  input: GenerateMeetingUrlInput;
};


export type MutationLinkDocumentToParentArgs = {
  fileId: Scalars['String']['input'];
  parentId: Scalars['String']['input'];
  usageType: Scalars['String']['input'];
};


export type MutationLogTeacherSupportRequestArgs = {
  input: LogSupportRequestInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationMarkInvoicePaidArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  invoiceId: Scalars['String']['input'];
  proofFileId: Scalars['ID']['input'];
};


export type MutationMarkNotificationReadArgs = {
  deliveryId: Scalars['ID']['input'];
};


export type MutationMarkSuggestionDuplicateArgs = {
  input: MarkSuggestionDuplicateInput;
};


export type MutationMarkSuggestionReviewedArgs = {
  suggestionId: Scalars['String']['input'];
};


export type MutationMarkTeacherDuesPaidArgs = {
  dueIds: Array<Scalars['ID']['input']>;
  teacherPaymentId: Scalars['ID']['input'];
};


export type MutationMoveStorageItemsArgs = {
  input: StorageItemsMoveInput;
};


export type MutationOverrideClassInstanceRateArgs = {
  classInstanceId: Scalars['ID']['input'];
  rateAmount: InputMaybe<Scalars['String']['input']>;
  rateCurrency: InputMaybe<CurrencyCode>;
};


export type MutationPartiallyUpdateStudentArgs = {
  input: PartialStudentUpdateInput;
};


export type MutationPrepareUploadArgs = {
  input: UploadPreparationInput;
};


export type MutationReactivateParentArgs = {
  parentId: Scalars['String']['input'];
};


export type MutationReassignStudentTeacherArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  newTeacherId: Scalars['String']['input'];
  studentId: Scalars['String']['input'];
};


export type MutationRecordCreditPurchaseArgs = {
  hours: Scalars['Int']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  studentId: Scalars['ID']['input'];
};


export type MutationRecordPaymentArgs = {
  amount: Scalars['String']['input'];
  currency: CurrencyCode;
  invoiceId: Scalars['ID']['input'];
  transactionId: InputMaybe<Scalars['String']['input']>;
  userPaymentMethodId: Scalars['ID']['input'];
};


export type MutationRecordStudentProfileEditArgs = {
  input: StudentProfileEditInput;
};


export type MutationRefreshExchangeRatesArgs = {
  force?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationRejectLessonReportArgs = {
  rejectionReason: Scalars['String']['input'];
  reportId: Scalars['ID']['input'];
};


export type MutationRejectPaymentProofArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  invoiceId: Scalars['String']['input'];
  rejectionReason: InputMaybe<Scalars['String']['input']>;
};


export type MutationRenameFileArgs = {
  input: FileRenameInput;
};


export type MutationRescheduleClassArgs = {
  classInstanceId: Scalars['ID']['input'];
  input: RescheduleClassInput;
};


export type MutationResendClassNotificationsArgs = {
  classInstanceId: Scalars['String']['input'];
};


export type MutationResetClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationRespondToComplaintArgs = {
  input: RespondToComplaintInput;
};


export type MutationRespondToSuggestionArgs = {
  input: RespondToSuggestionInput;
};


export type MutationRevokePermissionGroupFromUserArgs = {
  input: RevokePermissionGroupFromUserInput;
};


export type MutationSendPaymentReminderArgs = {
  studentId: Scalars['String']['input'];
};


export type MutationSetDefaultClassMeetingConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSetDefaultMeetingConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSetDefaultUserPaymentMethodArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSetStorageItemProtectionArgs = {
  input: StorageItemProtectionUpdateInput;
};


export type MutationSetUserWhatsappOptInArgs = {
  enabled: Scalars['Boolean']['input'];
  source: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};


export type MutationSetWhatsappAccessTokenArgs = {
  accessToken: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


export type MutationSetWhatsappTwoStepPinArgs = {
  id: Scalars['String']['input'];
  twoStepPin: Scalars['String']['input'];
};


export type MutationStartImpersonationArgs = {
  reason: InputMaybe<Scalars['String']['input']>;
  targetUserId: Scalars['String']['input'];
};


export type MutationStartPermissionGroupSimulationArgs = {
  groupSlug: Scalars['String']['input'];
};


export type MutationStopClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationSubmitComplaintArgs = {
  input: ComplaintSubmitInput;
};


export type MutationSubmitLessonReportArgs = {
  classInstanceId: Scalars['ID']['input'];
  input: LessonReportSubmitInput;
};


export type MutationSubmitPaymentProofArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  invoiceId: Scalars['String']['input'];
  proofFileId: Scalars['ID']['input'];
};


export type MutationSubmitStudentLessonReportReflectionArgs = {
  classInstanceId: Scalars['ID']['input'];
  studentNotes: Scalars['String']['input'];
};


export type MutationSubmitSuggestionArgs = {
  input: SubmitSuggestionInput;
};


export type MutationTestMeetingProviderConnectionArgs = {
  input: TestMeetingConnectionInput;
};


export type MutationUpdateClassAdminNoteArgs = {
  classInstanceId: Scalars['String']['input'];
  content: Scalars['String']['input'];
};


export type MutationUpdateClassCategoryArgs = {
  id: Scalars['ID']['input'];
  input: ClassCategoryUpdateInput;
};


export type MutationUpdateClassMeetingConfigArgs = {
  id: Scalars['ID']['input'];
  input: ClassMeetingConfigUpdateInput;
};


export type MutationUpdateClassSubjectArgs = {
  id: Scalars['ID']['input'];
  input: ClassSubjectUpdateInput;
};


export type MutationUpdateCurrencyHedgeArgs = {
  amount: InputMaybe<Scalars['String']['input']>;
  currency: InputMaybe<CurrencyCode>;
  hedgeType: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateDirectoryPermissionsArgs = {
  input: DirectoryPermissionsUpdateInput;
};


export type MutationUpdateFxProviderArgs = {
  provider: FxProvider;
};


export type MutationUpdateManagerProfileArgs = {
  input: UpdateManagerProfileInput;
  staffProfileId: Scalars['ID']['input'];
};


export type MutationUpdateMeetingProviderArgs = {
  id: Scalars['ID']['input'];
  input: MeetingProviderUpdateInput;
};


export type MutationUpdateNotificationPreferencesArgs = {
  input: Array<NotificationPreferenceInput>;
};


export type MutationUpdateOwnProfileArgs = {
  input: UpdateOwnProfileInput;
};


export type MutationUpdatePermissionGroupArgs = {
  input: UpdatePermissionGroupInput;
};


export type MutationUpdateQuotaArgs = {
  id: Scalars['ID']['input'];
  input: QuotaUpdateInput;
};


export type MutationUpdateRecurringClassRateArgs = {
  input: UpdateRecurringClassRateInput;
};


export type MutationUpdateSessionStatusAbsentArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationUpdateSessionStatusLeaveArgs = {
  classInstanceId: Scalars['ID']['input'];
  leaveReason: Scalars['String']['input'];
};


export type MutationUpdateSessionStatusStartArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationUpdateSiteContentPublishStateArgs = {
  id: Scalars['ID']['input'];
  isPublished: Scalars['Boolean']['input'];
};


export type MutationUpdateStudentQuotaArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  newClassesRemaining: Scalars['Int']['input'];
  studentId: Scalars['String']['input'];
};


export type MutationUpdateSupportedMobileWalletArgs = {
  id: Scalars['ID']['input'];
  input: SupportedMobileWalletUpdateInput;
};


export type MutationUpdateSupportedOnlineAccountArgs = {
  id: Scalars['ID']['input'];
  input: SupportedOnlineAccountUpdateInput;
};


export type MutationUpdateSupportedPaymentLinkArgs = {
  id: Scalars['ID']['input'];
  input: SupportedPaymentLinkUpdateInput;
};


export type MutationUpdateTeacherImportantNoteArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTeacherNoteInput;
};


export type MutationUpdateTeacherProfileArgs = {
  input: TeacherProfileUpdateInput;
  teacherId: Scalars['ID']['input'];
};


export type MutationUpdateUserMeetingConfigArgs = {
  id: Scalars['ID']['input'];
  input: UserMeetingConfigUpdateInput;
};


export type MutationUpdateUserOverridesArgs = {
  overrides: Array<UserOverrideInput>;
  userId: Scalars['String']['input'];
};


export type MutationUpdateUserPaymentMethodArgs = {
  id: Scalars['ID']['input'];
  input: UserPaymentMethodUpdateInput;
};


export type MutationUpdateUserProfileArgs = {
  input: UpdateUserProfileInput;
  userId: Scalars['String']['input'];
};


export type MutationUpdateWhatsappAccountArgs = {
  id: Scalars['String']['input'];
  input: WhatsappAccountUpdateInput;
};


export type MutationUploadLearningResourceArgs = {
  input: ResourceUploadInput;
};


export type MutationUpsertEnvConfigEntryArgs = {
  input: EnvConfigUpsertInput;
};


export type MutationUpsertManualExchangeRateArgs = {
  effectiveDate: InputMaybe<Scalars['DateTime']['input']>;
  fromCurrency: CurrencyCode;
  rate: Scalars['String']['input'];
  toCurrency: CurrencyCode;
};


export type MutationUpsertSessionConfigArgs = {
  input: SessionConfigUpsertInput;
};


export type MutationUpsertSiteContentArgs = {
  input: SiteContentUpsertInput;
};


export type MutationUpsertSystemSettingArgs = {
  input: SystemSettingUpsertInput;
};


export type MutationVerifyBankTransferPaymentMethodArgs = {
  id: Scalars['ID']['input'];
};

export type MyConnectedMeetingProvider = {
  __typename?: 'MyConnectedMeetingProvider';
  connectedAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  providerSlug: Maybe<Scalars['String']['output']>;
};

export type NextUnpaidInvoiceSummary = {
  __typename?: 'NextUnpaidInvoiceSummary';
  amount: Maybe<Scalars['String']['output']>;
  currency: Maybe<CurrencyCode>;
  dueDate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type NotificationAlertsResult = {
  __typename?: 'NotificationAlertsResult';
  alerts: Maybe<Array<SystemAlert>>;
  id: Maybe<Scalars['String']['output']>;
  totalCount: Maybe<Scalars['Int']['output']>;
  unreadCount: Maybe<Scalars['Int']['output']>;
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

export type NotificationPreference = {
  __typename?: 'NotificationPreference';
  channel: Maybe<NotificationChannel>;
  enabled: Maybe<Scalars['Boolean']['output']>;
  eventType: Maybe<NotificationEventType>;
  id: Maybe<Scalars['String']['output']>;
};

export type NotificationPreferenceInput = {
  channel: NotificationChannel;
  enabled: Scalars['Boolean']['input'];
  eventType: NotificationEventType;
};

export enum OnDemandNoCreditsOutcome {
  AutoAbsentNoCredits = 'AUTO_ABSENT_NO_CREDITS',
  AutoCancel = 'AUTO_CANCEL',
  RemindOnly = 'REMIND_ONLY'
}

export enum OnDemandStatus {
  Available = 'AVAILABLE',
  Cancelled = 'CANCELLED',
  Converted = 'CONVERTED',
  NoCreditsAbsent = 'NO_CREDITS_ABSENT',
  NoCreditsCancelled = 'NO_CREDITS_CANCELLED',
  PendingCredit = 'PENDING_CREDIT'
}

/** Summary metrics for the staff onboarding process */
export type OnboardingMetrics = {
  __typename?: 'OnboardingMetrics';
  activeStaff: Maybe<Scalars['Int']['output']>;
  avgOnboardingDays: Maybe<Scalars['Float']['output']>;
  id: Maybe<Scalars['String']['output']>;
  pendingApproval: Maybe<Scalars['Int']['output']>;
};

export type OnlineMeetingInfo = {
  __typename?: 'OnlineMeetingInfo';
  joinUrl: Maybe<Scalars['String']['output']>;
  logoUrl: Maybe<Scalars['String']['output']>;
  meetingId: Maybe<Scalars['String']['output']>;
  platform: Maybe<Scalars['String']['output']>;
  providerName: Maybe<Scalars['LocalizedString']['output']>;
  source: Maybe<Scalars['String']['output']>;
};

export enum OrderSortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export enum OverrideState {
  Denied = 'DENIED',
  Granted = 'GRANTED'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  count: Scalars['Int']['output'];
  currentPage: Scalars['Int']['output'];
  endCursor: Maybe<Scalars['String']['output']>;
  firstItem: Maybe<Scalars['Int']['output']>;
  hasMorePages: Scalars['Boolean']['output'];
  lastItem: Maybe<Scalars['Int']['output']>;
  lastPage: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  startCursor: Maybe<Scalars['String']['output']>;
  total: Scalars['Int']['output'];
};

export type PaginationArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  maxCount: InputMaybe<Scalars['Int']['input']>;
  page: InputMaybe<Scalars['Int']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
};

export type ParentAdminProfileUpdateInput = {
  address: InputMaybe<Scalars['String']['input']>;
  currency: InputMaybe<CurrencyCode>;
  facebook: InputMaybe<Scalars['String']['input']>;
  feeAmount: InputMaybe<Scalars['String']['input']>;
  invoiceType: InputMaybe<Scalars['String']['input']>;
  nationality: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<IanaTimezone>;
  twitter: InputMaybe<Scalars['String']['input']>;
  whatsapp: InputMaybe<Scalars['String']['input']>;
};

export type ParentAssignedStudent = {
  __typename?: 'ParentAssignedStudent';
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  hoursPerWeek: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  studentAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  teacherUserId: Maybe<Scalars['String']['output']>;
};

export type ParentAssignedStudentsResult = {
  __typename?: 'ParentAssignedStudentsResult';
  id: Maybe<Scalars['String']['output']>;
  rows: Maybe<Array<ParentAssignedStudent>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ParentBillingSummary = {
  __typename?: 'ParentBillingSummary';
  activeStudents: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  nextDueDate: Maybe<Scalars['String']['output']>;
  nextUnpaidInvoice: Maybe<NextUnpaidInvoiceSummary>;
  outstandingBalance: Maybe<Scalars['String']['output']>;
  outstandingByCurrency: Maybe<Array<BillingCurrencyTotal>>;
  paidThisTerm: Maybe<Scalars['String']['output']>;
  paidThisTermByCurrency: Maybe<Array<BillingCurrencyTotal>>;
  pendingPaymentCount: Maybe<Scalars['Int']['output']>;
};

/** Paginated parent complaints with page info. */
export type ParentComplaintsResult = {
  __typename?: 'ParentComplaintsResult';
  complaints: Maybe<Array<Complaint>>;
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ParentDashboardMetrics = {
  __typename?: 'ParentDashboardMetrics';
  id: Maybe<Scalars['String']['output']>;
  pendingInvoicesAmount: Maybe<Scalars['String']['output']>;
  pendingInvoicesCount: Maybe<Scalars['Int']['output']>;
  pendingMessages: Maybe<Scalars['Int']['output']>;
  performanceAvg: Maybe<Scalars['Int']['output']>;
  performanceAvgMobile: Maybe<Scalars['Int']['output']>;
  todaysClasses: Maybe<Scalars['Int']['output']>;
  totalStudents: Maybe<Scalars['Int']['output']>;
};

export type ParentDashboardMetricsResult = {
  __typename?: 'ParentDashboardMetricsResult';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<ParentDashboardMetrics>;
  studentProgress: Maybe<Array<StudentProgress>>;
  workshopPromo: Maybe<WorkshopPromo>;
};

export type ParentDashboardScheduleResult = {
  __typename?: 'ParentDashboardScheduleResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<ParentDashboardScheduleRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ParentDashboardScheduleRow = {
  __typename?: 'ParentDashboardScheduleRow';
  bookingStatus: Maybe<BookingStatus>;
  classTimeFormatted: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<ClassExecutionState>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated Use effectiveMeeting.joinUrl */
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  studentAvatarUrl: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentInitials: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  teacherAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
};

export type ParentDirectory = {
  __typename?: 'ParentDirectory';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<ParentDirectoryMetrics>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<ParentDirectoryRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ParentDirectoryAutocompleteRow = {
  __typename?: 'ParentDirectoryAutocompleteRow';
  avatarUrl: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type ParentDirectoryMetrics = {
  __typename?: 'ParentDirectoryMetrics';
  id: Maybe<Scalars['String']['output']>;
  onLeave: Maybe<Scalars['Int']['output']>;
  onTrial: Maybe<Scalars['Int']['output']>;
  regular: Maybe<Scalars['Int']['output']>;
  suspended: Maybe<Scalars['Int']['output']>;
};

export type ParentDirectoryRow = {
  __typename?: 'ParentDirectoryRow';
  accountStatus: Maybe<AccountStatus>;
  avatarUrl: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  guardianOf: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  index: Maybe<Scalars['Int']['output']>;
  lifecycleStatus: Maybe<ParentStatus>;
  name: Maybe<Scalars['String']['output']>;
  time: Maybe<Scalars['String']['output']>;
  unpaidInvoices: Maybe<Scalars['Int']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ParentDocument = {
  __typename?: 'ParentDocument';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  fileId: Maybe<Scalars['String']['output']>;
  filePath: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isProtected: Maybe<Scalars['Boolean']['output']>;
  usageType: Maybe<Scalars['String']['output']>;
};

export type ParentHandbookUrl = {
  __typename?: 'ParentHandbookUrl';
  id: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type ParentInvoiceHistoryResult = {
  __typename?: 'ParentInvoiceHistoryResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<ParentInvoiceRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ParentInvoiceRow = {
  __typename?: 'ParentInvoiceRow';
  amount: Maybe<Scalars['String']['output']>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  dueDate: Maybe<Scalars['String']['output']>;
  hasPaymentProof: Maybe<Scalars['Boolean']['output']>;
  hasRejectedSubmission: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<InvoiceType>;
  issueDate: Maybe<Scalars['String']['output']>;
  paidDate: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  parentUserId: Maybe<Scalars['String']['output']>;
  status: Maybe<InvoiceStatus>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

/** Input for creating a new parent account with billing configuration */
export type ParentOnboardingInput = {
  address: InputMaybe<Scalars['String']['input']>;
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  currency: InputMaybe<CurrencyCode>;
  displayCurrency: InputMaybe<CurrencyCode>;
  email: Scalars['Email']['input'];
  facebook: InputMaybe<Scalars['String']['input']>;
  feeAmount: InputMaybe<Scalars['String']['input']>;
  initialPayinMethod: InputMaybe<UserPaymentMethodInitialInput>;
  invoiceType: InputMaybe<InvoiceType>;
  name: Scalars['String']['input'];
  nationality: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  timezone: IanaTimezone;
  twitter: InputMaybe<Scalars['String']['input']>;
  whatsapp: InputMaybe<Scalars['String']['input']>;
};

/** Result of parent onboarding operation */
export type ParentOnboardingResult = {
  __typename?: 'ParentOnboardingResult';
  currency: Maybe<CurrencyCode>;
  email: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ParentOwnProfile = {
  __typename?: 'ParentOwnProfile';
  address: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  facebook: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nationality: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  twitter: Maybe<Scalars['String']['output']>;
  whatsapp: Maybe<Scalars['String']['output']>;
};

export type ParentOwnProfileUpdateInput = {
  address: InputMaybe<Scalars['String']['input']>;
  facebook: InputMaybe<Scalars['String']['input']>;
  nationality: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<IanaTimezone>;
  twitter: InputMaybe<Scalars['String']['input']>;
  whatsapp: InputMaybe<Scalars['String']['input']>;
};

export type ParentProfile = {
  __typename?: 'ParentProfile';
  accountStatus: Maybe<AccountStatus>;
  address: Maybe<Scalars['String']['output']>;
  avatarUrl: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  email: Maybe<Scalars['String']['output']>;
  facebook: Maybe<Scalars['String']['output']>;
  feeAmount: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<Scalars['String']['output']>;
  lifecycleStatus: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nationality: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  timezone: Maybe<IanaTimezone>;
  twitter: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  whatsapp: Maybe<Scalars['String']['output']>;
};

export enum ParentStatus {
  OnLeave = 'ON_LEAVE',
  OnTrial = 'ON_TRIAL',
  Regular = 'REGULAR',
  Suspended = 'SUSPENDED'
}

/** Pagination options for the parent suggestions history query. */
export type ParentSuggestionOptions = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
};

export type PartialStudentUpdateInput = {
  classesRemaining: InputMaybe<Scalars['Int']['input']>;
  classesTotal: InputMaybe<Scalars['Int']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  gender: InputMaybe<Gender>;
  id: Scalars['String']['input'];
  language: InputMaybe<AppLanguage>;
  name: InputMaybe<Scalars['String']['input']>;
  parentId: InputMaybe<Scalars['String']['input']>;
  primaryTeacherId: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<StudentStatus>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type Payment = {
  __typename?: 'Payment';
  amount: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  id: Maybe<Scalars['String']['output']>;
  invoiceId: Maybe<Scalars['String']['output']>;
  paymentDate: Maybe<Scalars['DateTime']['output']>;
  paymentMethodSnapshot: Maybe<PaymentMethodTransactionSnapshot>;
  paymentMethodType: Maybe<PaymentMethodType>;
  transactionId: Maybe<Scalars['String']['output']>;
  userPaymentMethodId: Maybe<Scalars['String']['output']>;
};

export enum PaymentDirection {
  Both = 'BOTH',
  Payin = 'PAYIN',
  Payout = 'PAYOUT'
}

export type PaymentMethodCatalogSnapshot = {
  __typename?: 'PaymentMethodCatalogSnapshot';
  catalogId: Maybe<Scalars['String']['output']>;
  catalogName: Maybe<Scalars['LocalizedString']['output']>;
  catalogSlug: Maybe<Scalars['String']['output']>;
};

export type PaymentMethodDefaults = {
  __typename?: 'PaymentMethodDefaults';
  payinDefault: Maybe<UserPaymentMethod>;
  payoutDefault: Maybe<UserPaymentMethod>;
};

export type PaymentMethodDetails = {
  __typename?: 'PaymentMethodDetails';
  accountNumber: Maybe<Scalars['String']['output']>;
  bankName: Maybe<Scalars['String']['output']>;
  beneficiaryName: Maybe<Scalars['String']['output']>;
  iban: Maybe<Scalars['String']['output']>;
  identifier: Maybe<Scalars['String']['output']>;
  note: Maybe<Scalars['String']['output']>;
  onlineAccountId: Maybe<Scalars['String']['output']>;
  paymentLinkId: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  routingNumber: Maybe<Scalars['String']['output']>;
  swiftBic: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  walletId: Maybe<Scalars['String']['output']>;
};

export type PaymentMethodDetailsInput = {
  accountNumber: InputMaybe<Scalars['String']['input']>;
  bankName: InputMaybe<Scalars['String']['input']>;
  beneficiaryName: InputMaybe<Scalars['String']['input']>;
  iban: InputMaybe<Scalars['String']['input']>;
  identifier: InputMaybe<Scalars['String']['input']>;
  note: InputMaybe<Scalars['String']['input']>;
  onlineAccountId: InputMaybe<Scalars['String']['input']>;
  paymentLinkId: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  routingNumber: InputMaybe<Scalars['String']['input']>;
  swiftBic: InputMaybe<Scalars['String']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  walletId: InputMaybe<Scalars['String']['input']>;
};

export type PaymentMethodTransactionSnapshot = {
  __typename?: 'PaymentMethodTransactionSnapshot';
  catalog: Maybe<PaymentMethodCatalogSnapshot>;
  details: Maybe<PaymentMethodDetails>;
  direction: Maybe<PaymentDirection>;
  label: Maybe<Scalars['String']['output']>;
  snapshottedAt: Maybe<Scalars['String']['output']>;
  type: Maybe<PaymentMethodType>;
  userPaymentMethodId: Maybe<Scalars['String']['output']>;
};

export enum PaymentMethodType {
  BankTransfer = 'BANK_TRANSFER',
  Cash = 'CASH',
  MobileWallet = 'MOBILE_WALLET',
  OnlineAccount = 'ONLINE_ACCOUNT',
  PaymentLink = 'PAYMENT_LINK',
  ProofUpload = 'PROOF_UPLOAD'
}

/** Paginated pending lesson reports awaiting review, with total count */
export type PendingLessonReportsPayload = {
  __typename?: 'PendingLessonReportsPayload';
  rows: Maybe<Array<LessonReport>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

/** Count of pending lesson reports awaiting review */
export type PendingReviewCount = {
  __typename?: 'PendingReviewCount';
  pendingCount: Maybe<Scalars['Int']['output']>;
};

export type Permission = {
  __typename?: 'Permission';
  action: Maybe<Scalars['String']['output']>;
  category: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isSystem: Maybe<Scalars['Boolean']['output']>;
  key: Maybe<Scalars['String']['output']>;
  resource: Maybe<Scalars['String']['output']>;
};

export type PermissionGroup = {
  __typename?: 'PermissionGroup';
  assignedUsers: Maybe<Array<GroupUser>>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['LocalizedString']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isSystem: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['LocalizedString']['output']>;
  permissionIds: Maybe<Array<Scalars['String']['output']>>;
  slug: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type PermissionGroupSimulationStatus = {
  __typename?: 'PermissionGroupSimulationStatus';
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  groupName: Maybe<Scalars['String']['output']>;
  groupSlug: Maybe<Scalars['String']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  startedAt: Maybe<Scalars['DateTime']['output']>;
};

export enum ProfileAudience {
  Parent = 'PARENT',
  Staff = 'STAFF',
  Student = 'STUDENT',
  Teacher = 'TEACHER'
}

export enum ProfileMode {
  Edit = 'EDIT',
  View = 'VIEW'
}

export enum ProfileScope {
  Other = 'OTHER',
  Own = 'OWN'
}

export type Query = {
  __typename?: 'Query';
  adminBillingSummary: Maybe<AdminBillingSummary>;
  /** Returns the paginated admin complaint queue with metrics. */
  adminComplaintQueue: Maybe<ComplaintQueueResult>;
  adminDashboardSchedule: Maybe<AdminDashboardScheduleResult>;
  adminInvoices: Maybe<AdminInvoiceHistoryResult>;
  /** Returns the paginated admin suggestion list with metrics. */
  adminSuggestions: Maybe<AdminSuggestionResult>;
  /** Find available class slots for a student on a given date */
  availableClassSlots: Maybe<Array<AvailableClassSlot>>;
  /** Lists all books and bags available to the academy. */
  booksAndBags: Maybe<Array<Book>>;
  classCategories: Maybe<Array<ClassCategory>>;
  classInstance: Maybe<ClassInstanceDetail>;
  classMeetingConfigs: Maybe<Array<ClassMeetingConfig>>;
  classStatusEvents: Maybe<Array<ClassStatusEvent>>;
  classSubject: Maybe<ClassSubject>;
  classSubjects: Maybe<Array<ClassSubject>>;
  /** Returns file attachments for a specific complaint. Accessible by the owning parent or admins. */
  complaintFiles: Maybe<Array<ComplaintFile>>;
  /** Get queue statistics for the active queue backend. */
  cronQueueStats: Maybe<CronQueueStats>;
  /** Fetch a single cron run by ID. */
  cronRun: Maybe<CronRun>;
  /** List cron runs with optional filters. */
  cronRuns: Maybe<CronPaginatedRuns>;
  /** Fetch a single cron schedule by ID. */
  cronSchedule: Maybe<CronSchedule>;
  /** List cron schedules with optional filters. */
  cronSchedules: Maybe<CronPaginatedSchedules>;
  currencyHedges: Maybe<Array<CurrencyHedge>>;
  dailyScheduleList: Maybe<Array<DailyScheduleList>>;
  dailyScheduleMetrics: Maybe<DailyScheduleMetrics>;
  directoryChildren: Maybe<Array<DirectoryInfo>>;
  /** Return effective permissions for a user, combining groups and overrides. */
  effectiveUserPermissions: Maybe<Array<Scalars['String']['output']>>;
  envConfigEntries: Maybe<Array<EnvConfigEntry>>;
  exchangeRateHistory: Maybe<ExchangeRateHistoryResult>;
  fileInfo: Maybe<FileInfo>;
  fileUsage: Maybe<FileUsageResult>;
  folderInfo: Maybe<DirectoryInfo>;
  fxProviderConfig: Maybe<FxProviderConfig>;
  fxSyncHealth: Maybe<FxSyncHealth>;
  /** Generates dynamic attendance and financial reports. */
  generateAttendanceReport: Maybe<AttendanceReportPayload>;
  groupClassAudit: Maybe<GroupClassAudit>;
  impersonationStatus: Maybe<ImpersonationStatus>;
  invoicePaymentSubmission: Maybe<InvoicePaymentSubmission>;
  invoicePayments: Maybe<Array<Payment>>;
  /** Check if a user has opted in to WhatsApp notifications (REQ-10/BL1). */
  isUserWhatsappOptIn: Scalars['Boolean']['output'];
  /** Check if WhatsApp Cloud API is configured and credentials are valid. */
  isWhatsappConfigured: Scalars['Boolean']['output'];
  latestExchangeRates: Maybe<Array<ExchangeRate>>;
  latestFxSyncRun: Maybe<FxSyncRun>;
  /** Lists all learning resources available to the academy. */
  learningResources: Maybe<Array<LearningResourceRow>>;
  /** Get the lesson report for a specific class instance (if one has been submitted) */
  lessonReport: Maybe<LessonReport>;
  /** Get a lesson report by its ID */
  lessonReportById: Maybe<LessonReport>;
  /** Get the count of pending lesson reports awaiting review with optional filters */
  lessonReportCount: Maybe<PendingReviewCount>;
  listFiles: Maybe<StorageObjectList>;
  /** Lists all staff members with administrative access. */
  managerDirectory: Maybe<ManagerDirectoryResult>;
  me: Maybe<User>;
  meetingIntegrationConnectedAccounts: Maybe<Array<MeetingIntegrationConnectedAccount>>;
  meetingIntegrationProviders: Maybe<Array<MeetingIntegrationProvider>>;
  meetingProvider: Maybe<MeetingProvider>;
  meetingProviders: Maybe<Array<MeetingProvider>>;
  myConnectedMeetingProviders: Maybe<Array<MyConnectedMeetingProvider>>;
  notificationAlerts: Maybe<NotificationAlertsResult>;
  notificationPreferences: Maybe<Array<NotificationPreference>>;
  /** Returns onboarding metrics for staff accounts. */
  onboardingMetrics: Maybe<OnboardingMetrics>;
  parentAssignedStudents: Maybe<ParentAssignedStudentsResult>;
  parentAssociatedStudents: Maybe<Array<AssociatedStudent>>;
  parentBillingSummary: Maybe<ParentBillingSummary>;
  /** Returns the authenticated parent's complaint history with pagination. */
  parentComplaints: Maybe<ParentComplaintsResult>;
  parentDashboardMetrics: Maybe<ParentDashboardMetricsResult>;
  parentDashboardSchedule: Maybe<ParentDashboardScheduleResult>;
  parentDirectory: Maybe<ParentDirectory>;
  parentDocuments: Maybe<Array<ParentDocument>>;
  parentHandbookUrl: Maybe<ParentHandbookUrl>;
  parentInvoiceHistory: Maybe<ParentInvoiceHistoryResult>;
  parentOwnProfile: Maybe<ParentOwnProfile>;
  parentProfile: Maybe<ParentProfile>;
  /** Returns the authenticated parent's suggestion history with review status. */
  parentSuggestions: Maybe<Array<Suggestion>>;
  /** Lightweight parent list for autocomplete (id, name, avatarUrl). */
  parentsDirectory: Array<ParentDirectoryAutocompleteRow>;
  /** Get pending lesson reports awaiting review with optional teacher/student filters and pagination */
  pendingLessonReports: Maybe<PendingLessonReportsPayload>;
  /** Fetch a single permission group by ID. */
  permissionGroup: Maybe<PermissionGroup>;
  permissionGroupSimulationStatus: Maybe<PermissionGroupSimulationStatus>;
  /** List all permission groups with their permission IDs. */
  permissionGroups: Maybe<Array<PermissionGroup>>;
  /** List all permission catalog entries. */
  permissions: Maybe<Array<Permission>>;
  profileByUserId: Maybe<UnifiedProfile>;
  /** Get a specific quota by ID */
  quota: Maybe<Quota>;
  /** Get aggregated quota balance summary for a student */
  quotaBalance: Maybe<QuotaBalance>;
  /** Get paginated audit ledger history for a quota */
  quotaLedger: Maybe<QuotaLedgerPaginatedResult>;
  /** List quotas with optional filters and pagination */
  quotas: Maybe<QuotaPaginatedResult>;
  /** Get paginated recently approved lesson reports for the supervisor dashboard */
  recentApprovedLessonReports: Maybe<PendingLessonReportsPayload>;
  recurringMeetingConfigs: Maybe<Array<ClassMeetingConfig>>;
  recurringSchedule: Maybe<RecurringScheduleDetail>;
  recurringSchedules: Maybe<RecurringSchedulesPaginatedResult>;
  rescheduleTrackingMetrics: Maybe<RescheduleTrackingMetrics>;
  rescheduleTrackingRows: Maybe<RescheduleTrackingResult>;
  searchFiles: Maybe<StorageObjectList>;
  /** Search suggestions for duplicate marking autocomplete. Requires suggestions.review permission. */
  searchSuggestions: Maybe<Array<SuggestionSearchResult>>;
  searchTeacherAvailability: Maybe<AvailabilitySearchResult>;
  /** Fetches the session configuration for a single role. */
  sessionConfig: Maybe<SessionConfig>;
  /** Lists all per-role session configurations. */
  sessionConfigs: Maybe<Array<SessionConfig>>;
  /** Returns paginated audit logs for the settings audit tab. */
  settingsAuditLogs: Maybe<SettingsAuditLogsResult>;
  settingsTimezones: Maybe<SettingsTimezonesResult>;
  simulatablePermissionGroups: Maybe<Array<SimulatablePermissionGroup>>;
  /** Lists all site content entries for the Settings CMS tab. */
  siteContentEntries: Maybe<Array<SiteContentEntry>>;
  /** Fetches a single site content entry by ID. */
  siteContentEntry: Maybe<SiteContentEntry>;
  /** Lightweight staff list for autocomplete (id, name, avatarUrl, email). */
  staffDirectory: Array<StaffDirectoryAutocompleteRow>;
  statusTrackingSchedule: Maybe<Array<StatusTrackingScheduleRow>>;
  storageStats: Maybe<StorageStats>;
  student: Maybe<Student>;
  studentById: Maybe<AssociatedStudent>;
  studentClassHistory: Maybe<StudentClassHistory>;
  studentClassSessionDetail: Maybe<StudentSessionDetail>;
  /** Get the credit balance (classes total and remaining) for a student */
  studentCreditBalance: Maybe<CreditBalance>;
  studentCreditStatus: Maybe<Array<StudentCreditRow>>;
  /** Get the credit transaction history for a student with optional pagination */
  studentCreditTransactions: Maybe<Array<CreditTransaction>>;
  /** Fetches the global student directory with cross-relational data. */
  studentDirectory: Maybe<StudentDirectoryPayload>;
  /** Aggregated monthly report for a single student: attendance, lessons, and credit ledger activity. */
  studentMonthlyReport: StudentMonthlyReport;
  /** List only active/open quotas (status ACTIVE, remaining > 0) for a student */
  studentOpenQuotas: Maybe<Array<Quota>>;
  studentProfile: Maybe<StudentProfile>;
  /** List all quotas for a student */
  studentQuotas: Maybe<Array<Quota>>;
  /** Paginated lesson reports for the logged-in student (student portal dashboard) */
  studentRecentLessonReports: Maybe<PendingLessonReportsPayload>;
  studentUpcomingClasses: Maybe<StudentUpcomingClassesResult>;
  students: StudentsWithFiltersResponse;
  /** Lightweight student list for autocomplete (id, name, avatarUrl). */
  studentsDirectory: Array<StudentDirectoryRow>;
  /** Returns contributor statistics for the suggestion social proof display. */
  suggestionContributorStats: Maybe<SuggestionContributorStats>;
  supervisorDashboard: Maybe<SupervisorDashboard>;
  supportedCurrencies: Maybe<Array<SupportedCurrency>>;
  supportedMobileWallets: Maybe<Array<SupportedMobileWallet>>;
  supportedOnlineAccounts: Maybe<Array<SupportedOnlineAccount>>;
  supportedPaymentLinks: Maybe<Array<SupportedPaymentLink>>;
  systemSetting: Maybe<SystemSetting>;
  systemSettings: Maybe<Array<SystemSetting>>;
  teacherAssignedClasses: Maybe<TeacherAssignedClassesResult>;
  teacherAssignedStudents: Maybe<TeacherAssignedStudentsResult>;
  teacherDashboard: Maybe<TeacherDashboard>;
  teacherDirectory: Maybe<TeacherDirectory>;
  teacherFutureSchedule: Maybe<TeacherFutureSchedule>;
  teacherHandbookUrl: Maybe<TeacherHandbookUrl>;
  /** Aggregated monthly report for a single teacher: lessons taught, dues, and cancellation count. */
  teacherMonthlyReport: TeacherMonthlyReport;
  teacherOwnProfile: Maybe<TeacherOwnProfile>;
  /** Get pending (unpaid) teacher due entries, optionally filtered by teacher */
  teacherPendingDues: Maybe<Array<TeacherDue>>;
  /** Get summary of pending teacher dues (count + total amount) */
  teacherPendingDuesSummary: Maybe<TeacherPendingDuesSummary>;
  teacherProfileForEdit: Maybe<TeacherProfileResult>;
  teacherWeeklyScheduleGrid: Maybe<WeeklyScheduleGrid>;
  teacherWorkloadMetrics: Maybe<WeeklyWorkloadMetrics>;
  teachers: Maybe<Array<TeacherSimple>>;
  translatedMessage: Maybe<Scalars['String']['output']>;
  unpaidInvoicesAlert: Maybe<UnpaidInvoicesSummary>;
  user: Maybe<User>;
  userMeetingConfig: Maybe<UserMeetingConfig>;
  userMeetingConfigs: Maybe<Array<UserMeetingConfig>>;
  /** List overrides for a user. */
  userOverrides: Maybe<Array<UserOverride>>;
  userPaymentMethod: Maybe<UserPaymentMethod>;
  userPaymentMethods: Maybe<Array<UserPaymentMethod>>;
  /** Return group IDs assigned to a user. */
  userPermissionGroups: Maybe<Array<Scalars['String']['output']>>;
  users: Maybe<Array<User>>;
  welcomeMessage: Maybe<Scalars['String']['output']>;
  /** List all active WhatsApp business accounts. */
  whatsappAccounts: Maybe<Array<WhatsappAccount>>;
};


export type QueryAdminComplaintQueueArgs = {
  filter: ComplaintQueueFilter;
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryAdminDashboardScheduleArgs = {
  input: AdminDashboardScheduleInput;
};


export type QueryAdminInvoicesArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminSuggestionsArgs = {
  filter: SuggestionFilter;
};


export type QueryAvailableClassSlotsArgs = {
  date: Scalars['DateTime']['input'];
  durationMinutes: InputMaybe<Scalars['Int']['input']>;
  studentId: Scalars['ID']['input'];
  teacherId: InputMaybe<Scalars['ID']['input']>;
};


export type QueryClassInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryClassMeetingConfigsArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type QueryClassStatusEventsArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type QueryClassSubjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryClassSubjectsArgs = {
  categoryId: InputMaybe<Scalars['String']['input']>;
};


export type QueryComplaintFilesArgs = {
  complaintId: Scalars['String']['input'];
};


export type QueryCronRunArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCronRunsArgs = {
  input: InputMaybe<CronRunListInput>;
};


export type QueryCronScheduleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCronSchedulesArgs = {
  input: InputMaybe<CronScheduleListInput>;
};


export type QueryDailyScheduleListArgs = {
  date: Scalars['String']['input'];
  metricFilter: InputMaybe<Scalars['String']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
  teacherId: InputMaybe<Scalars['String']['input']>;
};


export type QueryDailyScheduleMetricsArgs = {
  date: Scalars['String']['input'];
  teacherId: InputMaybe<Scalars['String']['input']>;
};


export type QueryDirectoryChildrenArgs = {
  path: InputMaybe<Scalars['String']['input']>;
};


export type QueryEffectiveUserPermissionsArgs = {
  userId: Scalars['String']['input'];
};


export type QueryExchangeRateHistoryArgs = {
  from: CurrencyCode;
  maxDays?: InputMaybe<Scalars['Int']['input']>;
  paginationArgs: InputMaybe<PaginationArgs>;
  to: CurrencyCode;
};


export type QueryFileInfoArgs = {
  path: Scalars['String']['input'];
};


export type QueryFileUsageArgs = {
  input: FileUsageCheckInput;
};


export type QueryFolderInfoArgs = {
  path: Scalars['String']['input'];
};


export type QueryGenerateAttendanceReportArgs = {
  filters: AttendanceReportFiltersInput;
};


export type QueryGroupClassAuditArgs = {
  classInstanceId: Scalars['String']['input'];
};


export type QueryInvoicePaymentSubmissionArgs = {
  invoiceId: Scalars['String']['input'];
};


export type QueryInvoicePaymentsArgs = {
  invoiceId: Scalars['ID']['input'];
};


export type QueryIsUserWhatsappOptInArgs = {
  userId: Scalars['String']['input'];
};


export type QueryLatestExchangeRatesArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryLearningResourcesArgs = {
  searchQuery: InputMaybe<Scalars['String']['input']>;
};


export type QueryLessonReportArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type QueryLessonReportByIdArgs = {
  reportId: Scalars['ID']['input'];
};


export type QueryLessonReportCountArgs = {
  studentId: InputMaybe<Scalars['ID']['input']>;
  teacherId: InputMaybe<Scalars['ID']['input']>;
};


export type QueryListFilesArgs = {
  input: FilesListInput;
};


export type QueryManagerDirectoryArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
  roleFilter: InputMaybe<Scalars['String']['input']>;
  statusFilter: InputMaybe<Scalars['String']['input']>;
};


export type QueryMeetingIntegrationConnectedAccountsArgs = {
  providerSlug: Scalars['String']['input'];
};


export type QueryMeetingProviderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMeetingProvidersArgs = {
  activeOnly?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryParentAssociatedStudentsArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryParentBillingSummaryArgs = {
  parentId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type QueryParentComplaintsArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryParentDashboardScheduleArgs = {
  date: InputMaybe<Scalars['String']['input']>;
  paginationArgs: InputMaybe<PaginationArgs>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryParentDirectoryArgs = {
  lifecycleStatusFilter: InputMaybe<ParentStatus>;
  paginationArgs: InputMaybe<PaginationArgs>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryParentDocumentsArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryParentInvoiceHistoryArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
  parentId: InputMaybe<Scalars['String']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type QueryParentProfileArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryParentSuggestionsArgs = {
  options: ParentSuggestionOptions;
};


export type QueryParentsDirectoryArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryPendingLessonReportsArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
  studentId: InputMaybe<Scalars['ID']['input']>;
  teacherId: InputMaybe<Scalars['ID']['input']>;
};


export type QueryPermissionGroupArgs = {
  id: Scalars['String']['input'];
};


export type QueryProfileByUserIdArgs = {
  userId: Scalars['String']['input'];
};


export type QueryQuotaArgs = {
  id: Scalars['ID']['input'];
};


export type QueryQuotaBalanceArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryQuotaLedgerArgs = {
  pagination: InputMaybe<PaginationArgs>;
  quotaId: Scalars['ID']['input'];
};


export type QueryQuotasArgs = {
  filter: InputMaybe<QuotaPaginatedFilterInput>;
  pagination: InputMaybe<PaginationArgs>;
};


export type QueryRecentApprovedLessonReportsArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryRecurringMeetingConfigsArgs = {
  recurringScheduleId: Scalars['ID']['input'];
};


export type QueryRecurringScheduleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRecurringSchedulesArgs = {
  pagination: InputMaybe<PaginationArgs>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryRescheduleTrackingRowsArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<LeaveRequestStatus>;
};


export type QuerySearchFilesArgs = {
  fileType: InputMaybe<Scalars['String']['input']>;
  folder: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  searchTerm: Scalars['String']['input'];
};


export type QuerySearchSuggestionsArgs = {
  excludeId: Scalars['String']['input'];
  query: Scalars['String']['input'];
};


export type QuerySearchTeacherAvailabilityArgs = {
  input: AvailabilitySearchInput;
};


export type QuerySessionConfigArgs = {
  roleName: Scalars['String']['input'];
};


export type QuerySettingsAuditLogsArgs = {
  filter: InputMaybe<SettingsAuditLogFilter>;
};


export type QuerySettingsTimezonesArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QuerySiteContentEntryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStaffDirectoryArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  permissionGroupFilter: InputMaybe<Scalars['String']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryStatusTrackingScheduleArgs = {
  date: Scalars['String']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  viewerTimezone: InputMaybe<IanaTimezone>;
};


export type QueryStorageStatsArgs = {
  path: InputMaybe<Scalars['String']['input']>;
};


export type QueryStudentArgs = {
  id: Scalars['String']['input'];
};


export type QueryStudentByIdArgs = {
  studentId: Scalars['String']['input'];
};


export type QueryStudentClassHistoryArgs = {
  month: Scalars['Int']['input'];
  studentId: InputMaybe<Scalars['ID']['input']>;
  year: Scalars['Int']['input'];
};


export type QueryStudentClassSessionDetailArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type QueryStudentCreditBalanceArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryStudentCreditTransactionsArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
  studentId: Scalars['ID']['input'];
};


export type QueryStudentDirectoryArgs = {
  filterArgs: InputMaybe<StudentFilterArgs>;
  orderBy: InputMaybe<Array<StudentsOrderByClause>>;
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryStudentMonthlyReportArgs = {
  month: Scalars['Int']['input'];
  studentId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
};


export type QueryStudentOpenQuotasArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryStudentProfileArgs = {
  includeUpcomingClasses: InputMaybe<Scalars['Boolean']['input']>;
  month: InputMaybe<Scalars['Int']['input']>;
  studentId: InputMaybe<Scalars['String']['input']>;
  year: InputMaybe<Scalars['Int']['input']>;
};


export type QueryStudentQuotasArgs = {
  studentId: Scalars['ID']['input'];
};


export type QueryStudentRecentLessonReportsArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryStudentUpcomingClassesArgs = {
  studentId: Scalars['String']['input'];
};


export type QueryStudentsArgs = {
  filterArgs: InputMaybe<StudentFilterArgs>;
  orderBy: InputMaybe<Array<StudentsOrderByClause>>;
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryStudentsDirectoryArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QuerySuggestionContributorStatsArgs = {
  days: Scalars['Int']['input'];
};


export type QuerySupportedCurrenciesArgs = {
  activeOnly: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySupportedMobileWalletsArgs = {
  activeOnly?: InputMaybe<Scalars['Boolean']['input']>;
  countryCode: InputMaybe<CountryCode>;
  direction: InputMaybe<PaymentDirection>;
};


export type QuerySupportedOnlineAccountsArgs = {
  activeOnly?: InputMaybe<Scalars['Boolean']['input']>;
  direction: InputMaybe<PaymentDirection>;
};


export type QuerySupportedPaymentLinksArgs = {
  activeOnly?: InputMaybe<Scalars['Boolean']['input']>;
  direction: InputMaybe<PaymentDirection>;
};


export type QuerySystemSettingArgs = {
  key: Scalars['String']['input'];
};


export type QueryTeacherDashboardArgs = {
  date: Scalars['String']['input'];
  pagination: InputMaybe<PaginationArgs>;
};


export type QueryTeacherDirectoryArgs = {
  paginationArgs: InputMaybe<PaginationArgs>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryTeacherFutureScheduleArgs = {
  teacherId: InputMaybe<Scalars['String']['input']>;
};


export type QueryTeacherMonthlyReportArgs = {
  month: Scalars['Int']['input'];
  teacherId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
};


export type QueryTeacherPendingDuesArgs = {
  teacherId: InputMaybe<Scalars['ID']['input']>;
};


export type QueryTeacherProfileForEditArgs = {
  teacherId: Scalars['ID']['input'];
};


export type QueryTeacherWeeklyScheduleGridArgs = {
  teacherId: InputMaybe<Scalars['String']['input']>;
  weekDate: Scalars['String']['input'];
};


export type QueryTeacherWorkloadMetricsArgs = {
  teacherId: InputMaybe<Scalars['String']['input']>;
  weekDate: Scalars['String']['input'];
};


export type QueryTeachersArgs = {
  limit: Scalars['Int']['input'];
  search: Scalars['String']['input'];
};


export type QueryTranslatedMessageArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserMeetingConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserMeetingConfigsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryUserOverridesArgs = {
  userId: Scalars['String']['input'];
};


export type QueryUserPaymentMethodArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserPaymentMethodsArgs = {
  direction: InputMaybe<PaymentDirection>;
  userId: Scalars['ID']['input'];
};


export type QueryUserPermissionGroupsArgs = {
  userId: Scalars['String']['input'];
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};

/** A class quota allocation for a student */
export type Quota = {
  __typename?: 'Quota';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  kind: Maybe<QuotaKind>;
  name: Maybe<Scalars['String']['output']>;
  periodDays: Maybe<Scalars['Int']['output']>;
  periodType: Maybe<QuotaPeriodType>;
  priority: Maybe<Scalars['Int']['output']>;
  remaining: Maybe<Scalars['Int']['output']>;
  reservedClasses: Maybe<Scalars['Int']['output']>;
  status: Maybe<QuotaStatus>;
  studentId: Maybe<Scalars['String']['output']>;
  totalClasses: Maybe<Scalars['Int']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  validFrom: Maybe<Scalars['DateTime']['output']>;
  validUntil: Maybe<Scalars['DateTime']['output']>;
};

/** Aggregated quota balance summary for a student */
export type QuotaBalance = {
  __typename?: 'QuotaBalance';
  breakdownByExpiration: Maybe<Array<QuotaExpirationBreakdown>>;
  id: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  totalActiveClasses: Maybe<Scalars['Int']['output']>;
  totalRemaining: Maybe<Scalars['Int']['output']>;
  totalReserved: Maybe<Scalars['Int']['output']>;
};

/** Per-quota breakdown of remaining classes by expiration date */
export type QuotaExpirationBreakdown = {
  __typename?: 'QuotaExpirationBreakdown';
  id: Maybe<Scalars['String']['output']>;
  quotaId: Maybe<Scalars['String']['output']>;
  quotaName: Maybe<Scalars['String']['output']>;
  remaining: Maybe<Scalars['Int']['output']>;
  validUntil: Maybe<Scalars['DateTime']['output']>;
};

export enum QuotaKind {
  Package = 'PACKAGE',
  Periodic = 'PERIODIC'
}

/** An append-only transaction ledger row for a quota */
export type QuotaLedger = {
  __typename?: 'QuotaLedger';
  actorUserId: Maybe<Scalars['String']['output']>;
  classInstanceId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  delta: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  quotaId: Maybe<Scalars['String']['output']>;
  reason: Maybe<QuotaLedgerReason>;
  reasonNote: Maybe<Scalars['String']['output']>;
  recurringScheduleId: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
};

/** Paginated result set of quota ledger entries */
export type QuotaLedgerPaginatedResult = {
  __typename?: 'QuotaLedgerPaginatedResult';
  rows: Maybe<Array<QuotaLedger>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

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
  kind: InputMaybe<QuotaKind>;
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<QuotaStatus>;
  studentId: InputMaybe<Scalars['String']['input']>;
};

/** Paginated result set of quotas */
export type QuotaPaginatedResult = {
  __typename?: 'QuotaPaginatedResult';
  rows: Maybe<Array<Quota>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export enum QuotaPeriodType {
  Custom = 'CUSTOM',
  Monthly = 'MONTHLY',
  Weekly = 'WEEKLY'
}

/** Rollover policy configuration for periodic quotas */
export type QuotaRolloverPolicyInput = {
  accumulationCap: InputMaybe<Scalars['Int']['input']>;
  maxRolloverPercent: InputMaybe<Scalars['Float']['input']>;
};

export enum QuotaStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Expired = 'EXPIRED'
}

/** Input for creating a new student quota */
export type QuotaSubmitInput = {
  idempotencyKey: InputMaybe<Scalars['String']['input']>;
  kind: QuotaKind;
  name: Scalars['String']['input'];
  periodDays: InputMaybe<Scalars['Int']['input']>;
  periodType: InputMaybe<QuotaPeriodType>;
  priority: InputMaybe<Scalars['Int']['input']>;
  rolloverPolicy: InputMaybe<QuotaRolloverPolicyInput>;
  studentId: Scalars['String']['input'];
  totalClasses: Scalars['Int']['input'];
  validFrom: InputMaybe<Scalars['DateTime']['input']>;
  validUntil: InputMaybe<Scalars['DateTime']['input']>;
};

/** Input for updating an existing quota */
export type QuotaUpdateInput = {
  name: InputMaybe<Scalars['String']['input']>;
  priority: InputMaybe<Scalars['Int']['input']>;
  status: InputMaybe<QuotaStatus>;
  validUntil: InputMaybe<Scalars['DateTime']['input']>;
};

export enum RateSource {
  Override = 'OVERRIDE',
  Recurring = 'RECURRING',
  Subject = 'SUBJECT',
  Teacher = 'TEACHER'
}

export type ReactivateParentResult = {
  __typename?: 'ReactivateParentResult';
  accountStatus: Maybe<AccountStatus>;
  id: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ReassignStudentTeacherResult = {
  __typename?: 'ReassignStudentTeacherResult';
  id: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

/** Input for recording a credit purchase for a student */
export type RecordPurchaseInput = {
  hours: Scalars['Int']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  sourcePaymentId: InputMaybe<Scalars['ID']['input']>;
  studentId: Scalars['String']['input'];
};

export type RecurringClassDayInput = {
  dayOfWeek: DayOfWeek;
  isActive: Scalars['Boolean']['input'];
  startTime: Scalars['String']['input'];
};

export type RecurringScheduleDayDetail = {
  __typename?: 'RecurringScheduleDayDetail';
  dayOfWeek: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  startTime: Maybe<Scalars['String']['output']>;
};

export type RecurringScheduleDetail = {
  __typename?: 'RecurringScheduleDetail';
  days: Maybe<Array<RecurringScheduleDayDetail>>;
  defaultStartTime: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  hourlyRate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<CurrencyCode>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  timezone: Maybe<IanaTimezone>;
};

export type RecurringScheduleListItem = {
  __typename?: 'RecurringScheduleListItem';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  defaultStartTime: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  hourlyRate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<CurrencyCode>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  timezone: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type RecurringSchedulesPaginatedResult = {
  __typename?: 'RecurringSchedulesPaginatedResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<RecurringScheduleListItem>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type RefreshExchangeRatesResult = {
  __typename?: 'RefreshExchangeRatesResult';
  errorMessage: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  pairsFailed: Maybe<Scalars['Int']['output']>;
  pairsWritten: Maybe<Scalars['Int']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
  syncRunId: Maybe<Scalars['String']['output']>;
};

export type RefreshTokenResponse = {
  __typename?: 'RefreshTokenResponse';
  token: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
};

/** Determines how the attendance data is aggregated. */
export enum ReportGroupingMode {
  Date = 'DATE',
  Student = 'STUDENT',
  Teacher = 'TEACHER'
}

export type RescheduleClassInput = {
  durationMinutes: Scalars['Int']['input'];
  scheduledEndAt: Scalars['String']['input'];
  scheduledStartAt: Scalars['String']['input'];
};

export enum RescheduleDateLabel {
  LeaveRequest = 'LEAVE_REQUEST',
  NewDate = 'NEW_DATE'
}

export type RescheduleTrackingInput = {
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<LeaveRequestStatus>;
};

export type RescheduleTrackingMetrics = {
  __typename?: 'RescheduleTrackingMetrics';
  approved: Maybe<Scalars['Int']['output']>;
  cancelled: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  leave: Maybe<Scalars['Int']['output']>;
  pending: Maybe<Scalars['Int']['output']>;
  rescheduled: Maybe<Scalars['Int']['output']>;
};

export type RescheduleTrackingResult = {
  __typename?: 'RescheduleTrackingResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<RescheduleTrackingRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type RescheduleTrackingRow = {
  __typename?: 'RescheduleTrackingRow';
  dateLabel: Maybe<RescheduleDateLabel>;
  id: Maybe<Scalars['String']['output']>;
  originalClassId: Maybe<Scalars['String']['output']>;
  remarks: Maybe<Scalars['String']['output']>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  status: Maybe<LeaveRequestStatus>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  teacherAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
};

export type ResourceUploadInput = {
  displayName: Scalars['String']['input'];
  fileId: Scalars['ID']['input'];
  filePath: Scalars['String']['input'];
};

/** Input for responding to a complaint. */
export type RespondToComplaintInput = {
  body: Scalars['String']['input'];
  complaintId: Scalars['String']['input'];
};

/** Input for responding to a suggestion with an admin response. */
export type RespondToSuggestionInput = {
  adminResponse: Scalars['String']['input'];
  suggestionId: Scalars['String']['input'];
};

export type RevokePermissionGroupFromUserInput = {
  groupId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export enum SchedulingMode {
  NumberOfClasses = 'NUMBER_OF_CLASSES',
  OnDemand = 'ON_DEMAND',
  Quota = 'QUOTA'
}

export type SendPaymentReminderResult = {
  __typename?: 'SendPaymentReminderResult';
  id: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
};

/** Per-role session TTL and concurrent-session limits for the Settings Session & Security tab. */
export type SessionConfig = {
  __typename?: 'SessionConfig';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  maxConcurrentSessions: Maybe<Scalars['Int']['output']>;
  roleName: Maybe<Scalars['String']['output']>;
  ttlSeconds: Maybe<Scalars['Int']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

/** Input for creating or updating a per-role session configuration. */
export type SessionConfigUpsertInput = {
  maxConcurrentSessions: Scalars['Int']['input'];
  roleName: Scalars['String']['input'];
  ttlSeconds: Scalars['Int']['input'];
};

/** Filter and pagination options for the settings audit log query. */
export type SettingsAuditLogFilter = {
  action: InputMaybe<Scalars['String']['input']>;
  actorUserId: InputMaybe<Scalars['String']['input']>;
  endDate: InputMaybe<Scalars['DateTime']['input']>;
  entityType: InputMaybe<Scalars['String']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  startDate: InputMaybe<Scalars['DateTime']['input']>;
};

/** Paginated audit log entries for the settings audit tab. */
export type SettingsAuditLogsResult = {
  __typename?: 'SettingsAuditLogsResult';
  hasMore: Maybe<Scalars['Boolean']['output']>;
  /** Synthetic identifier for Apollo cache normalization. */
  id: Maybe<Scalars['String']['output']>;
  logs: Maybe<Array<AuditLog>>;
  total: Maybe<Scalars['Int']['output']>;
};

export type SettingsTimezone = {
  __typename?: 'SettingsTimezone';
  baseOffsetMinutes: Maybe<Scalars['Int']['output']>;
  ianaId: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isDstSupported: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  offsetMinutes: Maybe<Scalars['Int']['output']>;
};

export type SettingsTimezonesResult = {
  __typename?: 'SettingsTimezonesResult';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<SettingsTimezone>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SimulatablePermissionGroup = {
  __typename?: 'SimulatablePermissionGroup';
  description: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};

export type SiteContentEntry = {
  __typename?: 'SiteContentEntry';
  body: Maybe<Scalars['String']['output']>;
  contentType: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isPublished: Maybe<Scalars['Boolean']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  updatedByUserId: Maybe<Scalars['String']['output']>;
};

export type SiteContentUpsertInput = {
  body: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  isPublished: Scalars['Boolean']['input'];
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type StaffAdminProfileUpdateInput = {
  phone: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};

export type StaffDirectoryAutocompleteRow = {
  __typename?: 'StaffDirectoryAutocompleteRow';
  avatarUrl: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type StaffOwnProfileUpdateInput = {
  phone: InputMaybe<Scalars['String']['input']>;
};

export type StaffPermissionGroup = {
  __typename?: 'StaffPermissionGroup';
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};

export type StaffPermissionOverride = {
  __typename?: 'StaffPermissionOverride';
  action: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  permissionId: Maybe<Scalars['String']['output']>;
  permissionKey: Maybe<Scalars['String']['output']>;
  resource: Maybe<Scalars['String']['output']>;
  state: Maybe<OverrideState>;
};

export type StartImpersonationResponse = {
  __typename?: 'StartImpersonationResponse';
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  impersonationSessionId: Maybe<Scalars['String']['output']>;
  targetUser: Maybe<User>;
  token: Maybe<Scalars['String']['output']>;
};

export type StartPermissionGroupSimulationResponse = {
  __typename?: 'StartPermissionGroupSimulationResponse';
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  groupSlug: Maybe<Scalars['String']['output']>;
  token: Maybe<Scalars['String']['output']>;
};

export type StatusTrackingScheduleRow = {
  __typename?: 'StatusTrackingScheduleRow';
  avatarUrl: Maybe<Scalars['String']['output']>;
  courseName: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<ClassExecutionState>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  studentAvatarUrl: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentInitials: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  studentStatus: Maybe<StudentStatus>;
  teacherAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
};

export type StorageItemProtectionUpdateInput = {
  isProtected: Scalars['Boolean']['input'];
  path: Scalars['String']['input'];
  protectChildren: InputMaybe<Scalars['Boolean']['input']>;
};

export type StorageItemsCopyInput = {
  destinationPath: Scalars['String']['input'];
  sourcePaths: Array<Scalars['String']['input']>;
};

export type StorageItemsDeleteInput = {
  force: InputMaybe<Scalars['Boolean']['input']>;
  paths: Array<Scalars['String']['input']>;
};

export type StorageItemsMoveInput = {
  destinationPath: Scalars['String']['input'];
  sourcePaths: Array<Scalars['String']['input']>;
};

export type StorageObject = {
  isProtected: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
};

export type StorageObjectList = {
  __typename?: 'StorageObjectList';
  hasMore: Scalars['Boolean']['output'];
  items: Maybe<Array<StorageObject>>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type StorageStats = {
  __typename?: 'StorageStats';
  directoryCount: Maybe<Scalars['Int']['output']>;
  fileTypeBreakdown: Maybe<Array<FileTypeBreakdown>>;
  totalFiles: Maybe<Scalars['Int']['output']>;
  totalSize: Maybe<Scalars['String']['output']>;
};

export type Student = {
  __typename?: 'Student';
  avatarUrl: Maybe<Scalars['String']['output']>;
  classesRemaining: Scalars['Int']['output'];
  classesTotal: Scalars['Int']['output'];
  createdAt: Maybe<Scalars['DateTime']['output']>;
  dateOfBirth: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  gender: Maybe<Gender>;
  hoursPerWeek: Maybe<Scalars['Float']['output']>;
  id: Scalars['String']['output'];
  language: Maybe<AppLanguage>;
  name: Scalars['String']['output'];
  parentId: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  status: StudentStatus;
  teacherName: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type StudentClassHistory = {
  __typename?: 'StudentClassHistory';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<StudentHistoryMetrics>;
  sessions: Maybe<Array<StudentHistorySession>>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type StudentCreateInput = {
  classesRemaining: InputMaybe<Scalars['Int']['input']>;
  classesTotal: InputMaybe<Scalars['Int']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  gender: InputMaybe<Gender>;
  idempotencyKey: Scalars['String']['input'];
  language: InputMaybe<AppLanguage>;
  name: Scalars['String']['input'];
  parentId: Scalars['String']['input'];
  primaryTeacherId: InputMaybe<Scalars['String']['input']>;
  status: StudentStatus;
  userId: Scalars['String']['input'];
};

export type StudentCreditRow = {
  __typename?: 'StudentCreditRow';
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  parentEmail: Maybe<Scalars['String']['output']>;
  planType: Maybe<InvoiceType>;
  status: Maybe<StudentStatus>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type StudentDirectoryPayload = {
  __typename?: 'StudentDirectoryPayload';
  id: Maybe<Scalars['String']['output']>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<StudentDirectoryRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type StudentDirectoryRow = {
  __typename?: 'StudentDirectoryRow';
  avatarUrl: Maybe<Scalars['String']['output']>;
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  hoursPerWeek: Maybe<Scalars['Float']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type StudentFilterArgs = {
  birthDate: InputMaybe<Scalars['DateTime']['input']>;
  birthDateAfter: InputMaybe<Scalars['DateTime']['input']>;
  birthDateBefore: InputMaybe<Scalars['DateTime']['input']>;
  birthDateFrom: InputMaybe<Scalars['DateTime']['input']>;
  birthDateIsEmpty: InputMaybe<Scalars['Boolean']['input']>;
  birthDateIsNotEmpty: InputMaybe<Scalars['Boolean']['input']>;
  birthDateNot: InputMaybe<Scalars['DateTime']['input']>;
  birthDateOnOrAfter: InputMaybe<Scalars['DateTime']['input']>;
  birthDateOnOrBefore: InputMaybe<Scalars['DateTime']['input']>;
  birthDateTo: InputMaybe<Scalars['DateTime']['input']>;
  createdAt: InputMaybe<Scalars['DateTime']['input']>;
  createdAtAfter: InputMaybe<Scalars['DateTime']['input']>;
  createdAtBefore: InputMaybe<Scalars['DateTime']['input']>;
  createdAtFrom: InputMaybe<Scalars['DateTime']['input']>;
  createdAtIsEmpty: InputMaybe<Scalars['Boolean']['input']>;
  createdAtIsNotEmpty: InputMaybe<Scalars['Boolean']['input']>;
  createdAtNot: InputMaybe<Scalars['DateTime']['input']>;
  createdAtOnOrAfter: InputMaybe<Scalars['DateTime']['input']>;
  createdAtOnOrBefore: InputMaybe<Scalars['DateTime']['input']>;
  createdAtTo: InputMaybe<Scalars['DateTime']['input']>;
  gender: InputMaybe<Gender>;
  language: InputMaybe<AppLanguage>;
  name: InputMaybe<Scalars['String']['input']>;
  nameEndsWith: InputMaybe<Scalars['String']['input']>;
  nameEquals: InputMaybe<Scalars['String']['input']>;
  nameIsEmpty: InputMaybe<Scalars['Boolean']['input']>;
  nameIsNotEmpty: InputMaybe<Scalars['Boolean']['input']>;
  nameNotContains: InputMaybe<Scalars['String']['input']>;
  nameNotEquals: InputMaybe<Scalars['String']['input']>;
  nameStartsWith: InputMaybe<Scalars['String']['input']>;
  parentId: InputMaybe<Scalars['String']['input']>;
  primaryTeacherId: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<StudentStatus>;
};

export type StudentHistoryMetrics = {
  __typename?: 'StudentHistoryMetrics';
  attendanceRate: Maybe<Scalars['Int']['output']>;
  hoursStudied: Maybe<Scalars['Float']['output']>;
  performance: Maybe<Scalars['Int']['output']>;
  totalClasses: Maybe<Scalars['Int']['output']>;
};

export type StudentHistorySession = {
  __typename?: 'StudentHistorySession';
  dayOfMonth: Maybe<Scalars['Int']['output']>;
  duration: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  id: Maybe<Scalars['String']['output']>;
  instructor: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  room: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  time: Maybe<Scalars['String']['output']>;
  timeSlot: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

/** Monthly report aggregating student attendance, lessons, and credit ledger activity. */
export type StudentMonthlyReport = {
  __typename?: 'StudentMonthlyReport';
  absentCount: Maybe<Scalars['Int']['output']>;
  cancelledLessons: Maybe<Scalars['Int']['output']>;
  completedLessons: Maybe<Scalars['Int']['output']>;
  creditsBalance: Maybe<Scalars['Int']['output']>;
  creditsDeducted: Maybe<Scalars['Int']['output']>;
  creditsPurchased: Maybe<Scalars['Int']['output']>;
  creditsRefunded: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  lateCount: Maybe<Scalars['Int']['output']>;
  month: Maybe<Scalars['Int']['output']>;
  presentCount: Maybe<Scalars['Int']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  totalHours: Maybe<Scalars['Float']['output']>;
  totalLessons: Maybe<Scalars['Int']['output']>;
  year: Maybe<Scalars['Int']['output']>;
};

/** Input for creating a new student profile under a parent */
export type StudentOnboardingInput = {
  /** Student avatar URL */
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  classesRemaining: InputMaybe<Scalars['Int']['input']>;
  classesTotal: InputMaybe<Scalars['Int']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  /** User display currency */
  displayCurrency: InputMaybe<CurrencyCode>;
  /** Student login email (creates a users row when provided) */
  email: InputMaybe<Scalars['String']['input']>;
  gender: InputMaybe<Gender>;
  language: InputMaybe<AppLanguage>;
  name: Scalars['String']['input'];
  parentId: InputMaybe<Scalars['String']['input']>;
  /** Student login password (required when email is provided) */
  password: InputMaybe<Scalars['String']['input']>;
  /** Student phone (stored on users row) */
  phone: InputMaybe<Scalars['String']['input']>;
  primaryTeacherId: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<StudentStatus>;
  /** Student timezone (applied to the created user record) */
  timezone: InputMaybe<IanaTimezone>;
};

/** Result of student onboarding operation */
export type StudentOnboardingResult = {
  __typename?: 'StudentOnboardingResult';
  name: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  status: Maybe<StudentStatus>;
  studentId: Maybe<Scalars['String']['output']>;
};

export type StudentProfile = {
  __typename?: 'StudentProfile';
  avatarUrl: Maybe<Scalars['String']['output']>;
  classHistory: Maybe<StudentClassHistory>;
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  dateOfBirth: Maybe<Scalars['DateTime']['output']>;
  displayCurrency: Maybe<CurrencyCode>;
  email: Maybe<Scalars['String']['output']>;
  gender: Maybe<Gender>;
  hoursPerWeek: Maybe<Scalars['Float']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isAssociatedViewer: Maybe<Scalars['Boolean']['output']>;
  isOwnStudentProfile: Maybe<Scalars['Boolean']['output']>;
  language: Maybe<AppLanguage>;
  name: Maybe<Scalars['String']['output']>;
  parentEmail: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  parentPhone: Maybe<Scalars['String']['output']>;
  parentUserId: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  status: Maybe<StudentStatus>;
  teacherName: Maybe<Scalars['String']['output']>;
  teacherUserId: Maybe<Scalars['String']['output']>;
  timezone: Maybe<IanaTimezone>;
  timezoneOverride: Maybe<Scalars['String']['output']>;
  upcomingClasses: Maybe<StudentUpcomingClassesResult>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type StudentProfileEditInput = {
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  displayCurrency: InputMaybe<CurrencyCode>;
  gender: InputMaybe<Gender>;
  language: InputMaybe<AppLanguage>;
  parentPhone: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  studentId: InputMaybe<Scalars['ID']['input']>;
  timezone: InputMaybe<Scalars['String']['input']>;
  timezoneOverride: InputMaybe<Scalars['String']['input']>;
};

export type StudentProgress = {
  __typename?: 'StudentProgress';
  completionPercent: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type StudentSessionDetail = {
  __typename?: 'StudentSessionDetail';
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  remarks: Maybe<Scalars['String']['output']>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
};

export enum StudentStatus {
  Deactivated = 'DEACTIVATED',
  OnLeave = 'ON_LEAVE',
  OnTrial = 'ON_TRIAL',
  Regular = 'REGULAR',
  Suspended = 'SUSPENDED'
}

export type StudentUpcomingClass = {
  __typename?: 'StudentUpcomingClass';
  avatarUrl: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<ClassExecutionState>;
  id: Maybe<Scalars['String']['output']>;
  instructor: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  subjectId: Maybe<Scalars['String']['output']>;
  subjectName: Maybe<Scalars['String']['output']>;
  teacherAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
};

export type StudentUpcomingClassesResult = {
  __typename?: 'StudentUpcomingClassesResult';
  classes: Maybe<Array<StudentUpcomingClass>>;
  id: Maybe<Scalars['String']['output']>;
  status: Maybe<StudentStatus>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type StudentsOrderByClause = {
  column: StudentsOrderByColumn;
  order: InputMaybe<OrderSortDirection>;
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

export type StudentsWithFiltersResponse = {
  __typename?: 'StudentsWithFiltersResponse';
  data: Array<Student>;
  pageInfo: PageInfo;
};

export type SubjectResource = {
  __typename?: 'SubjectResource';
  displayName: Maybe<Scalars['String']['output']>;
  filePath: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  learningResourceId: Maybe<Scalars['String']['output']>;
  resourceType: Maybe<Scalars['String']['output']>;
  sortOrder: Maybe<Scalars['Int']['output']>;
  subjectId: Maybe<Scalars['String']['output']>;
};

/** Input for submitting a new suggestion. */
export type SubmitSuggestionInput = {
  body: Scalars['String']['input'];
  submitterName: Scalars['String']['input'];
};

/** A parent suggestion with full details including review and duplicate status. */
export type Suggestion = {
  __typename?: 'Suggestion';
  adminResponse: Maybe<Scalars['String']['output']>;
  body: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  duplicateOfBody: Maybe<Scalars['String']['output']>;
  duplicateOfId: Maybe<Scalars['String']['output']>;
  duplicateOfSubmitterName: Maybe<Scalars['String']['output']>;
  emailSentAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  parentUserId: Maybe<Scalars['String']['output']>;
  responseCount: Maybe<Scalars['Int']['output']>;
  reviewedAt: Maybe<Scalars['DateTime']['output']>;
  reviewedByName: Maybe<Scalars['String']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  status: Maybe<SuggestionStatus>;
  submitterName: Maybe<Scalars['String']['output']>;
};

/** A parent who recently submitted suggestions. */
export type SuggestionContributor = {
  __typename?: 'SuggestionContributor';
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  suggestionCount: Maybe<Scalars['Int']['output']>;
};

/** Statistics about recent suggestion contributors. */
export type SuggestionContributorStats = {
  __typename?: 'SuggestionContributorStats';
  contributors: Maybe<Array<SuggestionContributor>>;
  id: Maybe<Scalars['String']['output']>;
  uniqueContributorCount: Maybe<Scalars['Int']['output']>;
};

/** Filter and pagination options for the admin suggestion list. */
export type SuggestionFilter = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<SuggestionStatus>;
};

/** Aggregate metrics for the suggestion queue. */
export type SuggestionMetrics = {
  __typename?: 'SuggestionMetrics';
  avgResponseTime: Maybe<Scalars['String']['output']>;
  duplicate: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  pending: Maybe<Scalars['Int']['output']>;
  reviewed: Maybe<Scalars['Int']['output']>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

/** A lightweight suggestion result for duplicate search autocomplete. */
export type SuggestionSearchResult = {
  __typename?: 'SuggestionSearchResult';
  body: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  status: Maybe<SuggestionStatus>;
  submitterName: Maybe<Scalars['String']['output']>;
};

/** Status of a suggestion in the review pipeline. */
export enum SuggestionStatus {
  Duplicate = 'DUPLICATE',
  Pending = 'PENDING',
  Reviewed = 'REVIEWED'
}

/** Aggregated supervisor portal dashboard data */
export type SupervisorDashboard = {
  __typename?: 'SupervisorDashboard';
  monthlySnapshot: Maybe<SupervisorMonthlySnapshot>;
  pendingDuesSummary: Maybe<TeacherPendingDuesSummary>;
  pendingReviewCount: Maybe<Scalars['Int']['output']>;
  supervisorName: Maybe<Scalars['String']['output']>;
};

/** Current calendar month snapshot for the supervisor dashboard */
export type SupervisorMonthlySnapshot = {
  __typename?: 'SupervisorMonthlySnapshot';
  label: Maybe<Scalars['String']['output']>;
  month: Maybe<Scalars['Int']['output']>;
  year: Maybe<Scalars['Int']['output']>;
};

export type SupportContact = {
  __typename?: 'SupportContact';
  avatarUrl: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  role: Maybe<Scalars['String']['output']>;
};

export type SupportRequestResult = {
  __typename?: 'SupportRequestResult';
  id: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
};

export type SupportedCurrency = {
  __typename?: 'SupportedCurrency';
  code: Maybe<CurrencyCode>;
  countryCode: Maybe<CountryCode>;
  decimals: Maybe<Scalars['Int']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  sortOrder: Maybe<Scalars['Int']['output']>;
  symbol: Maybe<Scalars['String']['output']>;
};

export type SupportedCurrencyUpsertInput = {
  code: CurrencyCode;
  countryCode: InputMaybe<CountryCode>;
  decimals: InputMaybe<Scalars['Int']['input']>;
  sortOrder: InputMaybe<Scalars['Int']['input']>;
  symbol: Scalars['String']['input'];
};

export type SupportedMobileWallet = {
  __typename?: 'SupportedMobileWallet';
  countryCode: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currencyCode: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['LocalizedString']['output']>;
  id: Maybe<Scalars['String']['output']>;
  instructions: Maybe<Scalars['LocalizedString']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  logoUrl: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['LocalizedString']['output']>;
  phoneRegion: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  supportedDirections: Maybe<PaymentDirection>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type SupportedMobileWalletCreateInput = {
  countryCode: InputMaybe<CountryCode>;
  currencyCode: InputMaybe<CurrencyCode>;
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['LocalizedString']['input'];
  phoneRegion: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  supportedDirections: InputMaybe<PaymentDirection>;
};

export type SupportedMobileWalletUpdateInput = {
  countryCode: InputMaybe<CountryCode>;
  currencyCode: InputMaybe<CurrencyCode>;
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['LocalizedString']['input']>;
  phoneRegion: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  supportedDirections: InputMaybe<PaymentDirection>;
};

export type SupportedOnlineAccount = {
  __typename?: 'SupportedOnlineAccount';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['LocalizedString']['output']>;
  id: Maybe<Scalars['String']['output']>;
  identifierKind: Maybe<IdentifierKind>;
  identifierLabel: Maybe<Scalars['LocalizedString']['output']>;
  instructions: Maybe<Scalars['LocalizedString']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  logoUrl: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['LocalizedString']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  supportedDirections: Maybe<PaymentDirection>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type SupportedOnlineAccountCreateInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  identifierKind: IdentifierKind;
  identifierLabel: InputMaybe<Scalars['LocalizedString']['input']>;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['LocalizedString']['input'];
  slug: Scalars['String']['input'];
  supportedDirections: InputMaybe<PaymentDirection>;
};

export type SupportedOnlineAccountUpdateInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  identifierKind: InputMaybe<IdentifierKind>;
  identifierLabel: InputMaybe<Scalars['LocalizedString']['input']>;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['LocalizedString']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  supportedDirections: InputMaybe<PaymentDirection>;
};

export type SupportedPaymentLink = {
  __typename?: 'SupportedPaymentLink';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['LocalizedString']['output']>;
  id: Maybe<Scalars['String']['output']>;
  instructions: Maybe<Scalars['LocalizedString']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  logoUrl: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['LocalizedString']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  supportedDirections: Maybe<PaymentDirection>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  urlAllowlist: Maybe<Array<Scalars['String']['output']>>;
  urlExample: Maybe<Scalars['String']['output']>;
};

export type SupportedPaymentLinkCreateInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: Scalars['LocalizedString']['input'];
  slug: Scalars['String']['input'];
  supportedDirections: InputMaybe<PaymentDirection>;
  urlAllowlist: Array<Scalars['String']['input']>;
  urlExample: InputMaybe<Scalars['String']['input']>;
};

export type SupportedPaymentLinkUpdateInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  instructions: InputMaybe<Scalars['LocalizedString']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['LocalizedString']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  supportedDirections: InputMaybe<PaymentDirection>;
  urlAllowlist: InputMaybe<Array<Scalars['String']['input']>>;
  urlExample: InputMaybe<Scalars['String']['input']>;
};

export type SystemAlert = {
  __typename?: 'SystemAlert';
  body: Maybe<Scalars['String']['output']>;
  channel: Maybe<NotificationChannel>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  deliveryId: Maybe<Scalars['String']['output']>;
  eventType: Maybe<NotificationEventType>;
  id: Maybe<Scalars['String']['output']>;
  metadata: Maybe<Scalars['JSON']['output']>;
  readAt: Maybe<Scalars['DateTime']['output']>;
  severity: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export type SystemSetting = {
  __typename?: 'SystemSetting';
  category: Maybe<SystemSettingCategory>;
  dataType: Maybe<SystemSettingDataType>;
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  key: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  updatedByUserId: Maybe<Scalars['String']['output']>;
  value: Maybe<Scalars['String']['output']>;
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
  category: InputMaybe<SystemSettingCategory>;
  dataType: InputMaybe<SystemSettingDataType>;
  description: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type TeacherAssignedClass = {
  __typename?: 'TeacherAssignedClass';
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<ClassExecutionState>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  scheduledEndAt: Maybe<Scalars['String']['output']>;
  scheduledStartAt: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type TeacherAssignedClassesResult = {
  __typename?: 'TeacherAssignedClassesResult';
  id: Maybe<Scalars['String']['output']>;
  rows: Maybe<Array<TeacherAssignedClass>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TeacherAssignedStudent = {
  __typename?: 'TeacherAssignedStudent';
  className: Maybe<Scalars['String']['output']>;
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  hoursPerWeek: Maybe<Scalars['Float']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  parentAvatarUrl: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  parentUserId: Maybe<Scalars['String']['output']>;
  status: Maybe<StudentStatus>;
  studentAvatarUrl: Maybe<Scalars['String']['output']>;
};

export type TeacherAssignedStudentsResult = {
  __typename?: 'TeacherAssignedStudentsResult';
  id: Maybe<Scalars['String']['output']>;
  rows: Maybe<Array<TeacherAssignedStudent>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TeacherAvailabilityGap = {
  __typename?: 'TeacherAvailabilityGap';
  calendarDate: Maybe<Scalars['String']['output']>;
  dayOfWeek: Maybe<DayOfWeek>;
  gapEndTime: Maybe<Scalars['String']['output']>;
  gapStartTime: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  teacherGender: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  timezone: Maybe<IanaTimezone>;
};

export type TeacherDashboard = {
  __typename?: 'TeacherDashboard';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<TeacherDashboardMetrics>;
  pageInfo: Maybe<PageInfo>;
  progressFeed: Maybe<Array<TeacherProgressFeedItem>>;
  scheduleRows: Maybe<Array<TeacherDashboardScheduleRow>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TeacherDashboardMetrics = {
  __typename?: 'TeacherDashboardMetrics';
  absent: Maybe<Scalars['Int']['output']>;
  activated: Maybe<Scalars['Int']['output']>;
  advance: Maybe<Scalars['Int']['output']>;
  leave: Maybe<Scalars['Int']['output']>;
  pending: Maybe<Scalars['Int']['output']>;
  regular: Maybe<Scalars['Int']['output']>;
  rescheduled: Maybe<Scalars['Int']['output']>;
  running: Maybe<Scalars['Int']['output']>;
  suspended: Maybe<Scalars['Int']['output']>;
  taken: Maybe<Scalars['Int']['output']>;
  total: Maybe<Scalars['Int']['output']>;
  trial: Maybe<Scalars['Int']['output']>;
};

export type TeacherDashboardScheduleRow = {
  __typename?: 'TeacherDashboardScheduleRow';
  durationMinutes: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<ClassExecutionState>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated Use effectiveMeeting.joinUrl */
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  yourTimeFormatted: Maybe<Scalars['String']['output']>;
};

export type TeacherDirectory = {
  __typename?: 'TeacherDirectory';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<TeacherDirectoryMetrics>;
  pageInfo: Maybe<PageInfo>;
  rows: Maybe<Array<TeacherDirectoryRow>>;
  totalTeachers: Maybe<Scalars['Int']['output']>;
};

export type TeacherDirectoryMetrics = {
  __typename?: 'TeacherDirectoryMetrics';
  activated: Maybe<Scalars['Int']['output']>;
  deactivated: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
};

export type TeacherDirectoryRow = {
  __typename?: 'TeacherDirectoryRow';
  avatarUrl: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  index: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  status: Maybe<AccountStatus>;
  userId: Maybe<Scalars['String']['output']>;
};

/** A per-lesson earning accrued to a teacher when a lesson report is approved */
export type TeacherDue = {
  __typename?: 'TeacherDue';
  amount: Maybe<Scalars['String']['output']>;
  approvedAt: Maybe<Scalars['DateTime']['output']>;
  approvedByUserId: Maybe<Scalars['String']['output']>;
  classDate: Maybe<Scalars['DateTime']['output']>;
  classInstanceId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<CurrencyCode>;
  hours: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  rateSource: Maybe<RateSource>;
  status: Maybe<TeacherDueStatus>;
  studentAvatarUrl: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  teacherAvatarUrl: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  teacherPaymentId: Maybe<Scalars['String']['output']>;
  teacherUserId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export enum TeacherDueStatus {
  Paid = 'PAID',
  Pending = 'PENDING'
}

export type TeacherFutureSchedule = {
  __typename?: 'TeacherFutureSchedule';
  classes: Maybe<Array<FutureClass>>;
  id: Maybe<Scalars['String']['output']>;
  importantNotes: Maybe<Array<TeacherImportantNote>>;
  leaveQuotaTotal: Maybe<Scalars['Int']['output']>;
  leaveQuotaUsed: Maybe<Scalars['Int']['output']>;
  supportContact: Maybe<SupportContact>;
  totalClasses: Maybe<Scalars['Int']['output']>;
};

export type TeacherHandbookUrl = {
  __typename?: 'TeacherHandbookUrl';
  id: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type TeacherImportantNote = {
  __typename?: 'TeacherImportantNote';
  body: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isPublished: Maybe<Scalars['Boolean']['output']>;
  priority: Maybe<Scalars['Int']['output']>;
  startsAt: Maybe<Scalars['DateTime']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

/** Monthly earnings summary for a teacher (lessons, counts, totals) */
export type TeacherMonthlyReport = {
  __typename?: 'TeacherMonthlyReport';
  approvedCount: Maybe<Scalars['Int']['output']>;
  cancelledCount: Maybe<Scalars['Int']['output']>;
  currency: Maybe<CurrencyCode>;
  lessonsTaught: Maybe<Scalars['Int']['output']>;
  month: Maybe<Scalars['Int']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  totalAccruedHours: Maybe<Scalars['Float']['output']>;
  totalDueAmount: Maybe<Scalars['Float']['output']>;
  totalPaidAmount: Maybe<Scalars['Float']['output']>;
  year: Maybe<Scalars['Int']['output']>;
};

/** Teacher onboarding profile with resolved metadata */
export type TeacherOnboarding = {
  __typename?: 'TeacherOnboarding';
  /** Teacher email address */
  email: Maybe<Scalars['String']['output']>;
  /** Teacher gender */
  gender: Maybe<Gender>;
  /** Unique identifier for the teacher profile */
  id: Maybe<Scalars['String']['output']>;
  /** Resolved teacher display name */
  name: Maybe<Scalars['String']['output']>;
  /** Teacher phone number */
  phone: Maybe<Scalars['String']['output']>;
  /** Current teacher account status */
  status: Maybe<Scalars['String']['output']>;
  /** Formatted timezone display string */
  timezoneDisplay: Maybe<Scalars['String']['output']>;
  /** Created user ID for the onboarded teacher */
  userId: Maybe<Scalars['String']['output']>;
};

/** Input for creating a new teacher account with comprehensive profile */
export type TeacherOnboardingInput = {
  /** Teacher address */
  address: InputMaybe<Scalars['String']['input']>;
  /** Teacher avatar URL */
  avatarUrl: InputMaybe<Scalars['String']['input']>;
  /** Teacher country code */
  countryCode: InputMaybe<CountryCode>;
  /** Teacher date of birth (ISO date string) */
  dateOfBirth: InputMaybe<Scalars['String']['input']>;
  displayCurrency: InputMaybe<CurrencyCode>;
  /** Teacher email address */
  email: Scalars['Email']['input'];
  /** Teacher gender */
  gender: InputMaybe<Gender>;
  /** Teacher hourly rate */
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  /** Optional initial payout payment method for the teacher */
  initialPayoutMethod: InputMaybe<UserPaymentMethodInitialInput>;
  /** Teacher full name */
  name: Scalars['String']['input'];
  /** Teacher national ID (encrypted) */
  nationalId: InputMaybe<Scalars['String']['input']>;
  /** Teacher nationality (country code) */
  nationality: InputMaybe<Scalars['String']['input']>;
  /** Teacher password */
  password: Scalars['String']['input'];
  /** Teacher phone number */
  phone: InputMaybe<Scalars['String']['input']>;
  /** Teacher qualifications */
  qualifications: InputMaybe<Scalars['String']['input']>;
  /** Currency for hourly rate */
  rateCurrency: InputMaybe<CurrencyCode>;
  timezone: IanaTimezone;
};

export type TeacherOwnProfile = {
  __typename?: 'TeacherOwnProfile';
  address: Maybe<Scalars['String']['output']>;
  countryCode: Maybe<Scalars['String']['output']>;
  dateOfBirth: Maybe<Scalars['String']['output']>;
  displayAmount: Maybe<DisplayAmount>;
  email: Maybe<Scalars['String']['output']>;
  gender: Maybe<Gender>;
  hourlyRate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nationalId: Maybe<Scalars['String']['output']>;
  nationality: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  qualifications: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<CurrencyCode>;
  timezone: Maybe<IanaTimezone>;
  totalClasses: Maybe<Scalars['Int']['output']>;
};

export type TeacherOwnProfileUpdateInput = {
  address: InputMaybe<Scalars['String']['input']>;
  countryCode: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: InputMaybe<Scalars['String']['input']>;
  gender: InputMaybe<Gender>;
  nationalId: InputMaybe<Scalars['String']['input']>;
  nationality: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  qualifications: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<IanaTimezone>;
};

export type TeacherPayment = {
  __typename?: 'TeacherPayment';
  amount: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  id: Maybe<Scalars['String']['output']>;
  isTestPayment: Maybe<Scalars['Boolean']['output']>;
  paymentDate: Maybe<Scalars['DateTime']['output']>;
  paymentMethodSnapshot: Maybe<PaymentMethodTransactionSnapshot>;
  paymentMethodType: Maybe<PaymentMethodType>;
  teacherId: Maybe<Scalars['String']['output']>;
  userPaymentMethodId: Maybe<Scalars['String']['output']>;
};

/** Summary of pending teacher dues (total count and amount) */
export type TeacherPendingDuesSummary = {
  __typename?: 'TeacherPendingDuesSummary';
  currency: Maybe<CurrencyCode>;
  totalAmount: Maybe<Scalars['Float']['output']>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TeacherProfileResult = {
  __typename?: 'TeacherProfileResult';
  address: Maybe<Scalars['String']['output']>;
  avgEngagementScore: Maybe<Scalars['Float']['output']>;
  countryCode: Maybe<Scalars['String']['output']>;
  dateOfBirth: Maybe<Scalars['String']['output']>;
  displayAmount: Maybe<DisplayAmount>;
  email: Maybe<Scalars['String']['output']>;
  gender: Maybe<Gender>;
  hourlyRate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nationalId: Maybe<Scalars['String']['output']>;
  nationality: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  qualifications: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<CurrencyCode>;
  status: Maybe<AccountStatus>;
  timezone: Maybe<IanaTimezone>;
  totalClasses: Maybe<Scalars['Int']['output']>;
  updatedAt: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type TeacherProfileUpdateInput = {
  address: InputMaybe<Scalars['String']['input']>;
  countryCode: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: InputMaybe<Scalars['String']['input']>;
  gender: InputMaybe<Gender>;
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  nationalId: InputMaybe<Scalars['String']['input']>;
  nationality: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  qualifications: InputMaybe<Scalars['String']['input']>;
  rateCurrency: InputMaybe<CurrencyCode>;
  status: InputMaybe<AccountStatus>;
  timezone: InputMaybe<IanaTimezone>;
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

export type TeacherProgressFeedItem = {
  __typename?: 'TeacherProgressFeedItem';
  durationMinutes: Maybe<Scalars['Int']['output']>;
  eventKind: Maybe<TeacherProgressFeedEventKind>;
  id: Maybe<Scalars['String']['output']>;
  occurredAt: Maybe<Scalars['DateTime']['output']>;
  scheduledTimeFormatted: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type TeacherSimple = {
  __typename?: 'TeacherSimple';
  avatarUrl: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type TestEntities = {
  __typename?: 'TestEntities';
  parentId: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  parentUserEmail: Maybe<Scalars['String']['output']>;
  parentUserId: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  studentUserEmail: Maybe<Scalars['String']['output']>;
  studentUserId: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  teacherUserEmail: Maybe<Scalars['String']['output']>;
  teacherUserId: Maybe<Scalars['String']['output']>;
};

export type TestGroupClass = {
  __typename?: 'TestGroupClass';
  groupClassId: Maybe<Scalars['String']['output']>;
};

export type TestMeetingConnectionInput = {
  mode: MeetingConnectionTestMode;
  providerSlug: MeetingIntegrationProviderSlug;
};

export type TestMeetingConnectionResult = {
  __typename?: 'TestMeetingConnectionResult';
  deleted: Maybe<Scalars['Boolean']['output']>;
  errorCode: Maybe<Scalars['String']['output']>;
  errorMessage: Maybe<Scalars['String']['output']>;
  grantedScopes: Maybe<Array<Scalars['String']['output']>>;
  id: Maybe<Scalars['String']['output']>;
  latencyMs: Maybe<Scalars['Int']['output']>;
  mode: Maybe<MeetingConnectionTestMode>;
  ok: Maybe<Scalars['Boolean']['output']>;
  rawUpstreamPayload: Maybe<Scalars['JSON']['output']>;
  requiredScopes: Maybe<Array<Scalars['String']['output']>>;
  testJoinUrl: Maybe<Scalars['String']['output']>;
  upstreamResponseSummary: Maybe<Scalars['String']['output']>;
};

export type TestSuperAdmin = {
  __typename?: 'TestSuperAdmin';
  email: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type UnifiedProfile = {
  __typename?: 'UnifiedProfile';
  assignedStudents: Maybe<TeacherAssignedStudentsResult>;
  associatedStudents: Maybe<ParentAssignedStudentsResult>;
  audience: Maybe<ProfileAudience>;
  avatarUrl: Maybe<Scalars['String']['output']>;
  displayCurrency: Maybe<CurrencyCode>;
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  meetingConfigs: Maybe<Array<UserMeetingConfig>>;
  name: Maybe<Scalars['String']['output']>;
  parentAdminProfile: Maybe<ParentProfile>;
  parentId: Maybe<Scalars['String']['output']>;
  parentOwnProfile: Maybe<ParentOwnProfile>;
  paymentMethodDefaults: Maybe<PaymentMethodDefaults>;
  paymentMethods: Maybe<Array<UserPaymentMethod>>;
  phone: Maybe<Scalars['String']['output']>;
  scope: Maybe<ProfileScope>;
  staffPermissionGroups: Maybe<Array<StaffPermissionGroup>>;
  staffPermissionOverrides: Maybe<Array<StaffPermissionOverride>>;
  staffProfile: Maybe<ManagerDirectoryRow>;
  staffProfileId: Maybe<Scalars['String']['output']>;
  teacherAdminProfile: Maybe<TeacherProfileResult>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherOwnProfile: Maybe<TeacherOwnProfile>;
  timezone: Maybe<IanaTimezone>;
  userId: Maybe<Scalars['String']['output']>;
};

export type UnpaidInvoiceItem = {
  __typename?: 'UnpaidInvoiceItem';
  amountsByCurrency: Maybe<Array<BillingCurrencyTotal>>;
  currency: Maybe<CurrencyCode>;
  displayAmount: Maybe<DisplayAmount>;
  id: Maybe<Scalars['String']['output']>;
  oldestDueDate: Maybe<Scalars['String']['output']>;
  overdueCount: Maybe<Scalars['Int']['output']>;
  totalUnpaidAmount: Maybe<Scalars['String']['output']>;
  userEmail: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  userName: Maybe<Scalars['String']['output']>;
};

export type UnpaidInvoicesSummary = {
  __typename?: 'UnpaidInvoicesSummary';
  id: Maybe<Scalars['String']['output']>;
  items: Maybe<Array<UnpaidInvoiceItem>>;
  overdueAmountsByCurrency: Maybe<Array<BillingCurrencyTotal>>;
  totalOverdueAmount: Maybe<Scalars['String']['output']>;
  totalOverdueInvoices: Maybe<Scalars['Int']['output']>;
};

export type UpdateManagerProfileInput = {
  email: InputMaybe<Scalars['String']['input']>;
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  rateCurrency: InputMaybe<CurrencyCode>;
  status: InputMaybe<AccountStatus>;
};

export type UpdateOwnProfileInput = {
  core: InputMaybe<CoreUserProfileFieldsInput>;
  parent: InputMaybe<ParentOwnProfileUpdateInput>;
  staff: InputMaybe<StaffOwnProfileUpdateInput>;
  teacher: InputMaybe<TeacherOwnProfileUpdateInput>;
};

export type UpdatePermissionGroupInput = {
  description: InputMaybe<Scalars['LocalizedString']['input']>;
  groupId: Scalars['String']['input'];
  name: InputMaybe<Scalars['LocalizedString']['input']>;
  permissionIds: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateRecurringClassRateInput = {
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  rateCurrency: InputMaybe<CurrencyCode>;
  recurringScheduleId: Scalars['String']['input'];
};

export type UpdateTeacherNoteInput = {
  body: InputMaybe<Scalars['String']['input']>;
  expiresAt: InputMaybe<Scalars['DateTime']['input']>;
  isPublished: InputMaybe<Scalars['Boolean']['input']>;
  priority: InputMaybe<Scalars['Int']['input']>;
  startsAt: InputMaybe<Scalars['DateTime']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserProfileInput = {
  core: InputMaybe<CoreUserProfileFieldsInput>;
  parent: InputMaybe<ParentAdminProfileUpdateInput>;
  staff: InputMaybe<StaffAdminProfileUpdateInput>;
  teacher: InputMaybe<TeacherProfileUpdateInput>;
};

export type UploadPreparation = {
  __typename?: 'UploadPreparation';
  access: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  uploadType: UploadType;
  url: Scalars['String']['output'];
};

export type UploadPreparationInput = {
  contentHash: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  fileSize: Scalars['Int']['input'];
  path: Scalars['String']['input'];
};

export enum UploadType {
  SignedUrl = 'SIGNED_URL',
  VercelBlobClient = 'VERCEL_BLOB_CLIENT'
}

export type UpsertManualExchangeRateResult = {
  __typename?: 'UpsertManualExchangeRateResult';
  id: Maybe<Scalars['String']['output']>;
  rate: Maybe<ExchangeRate>;
};

export type User = {
  __typename?: 'User';
  avatarUrl: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  displayCurrency: Maybe<CurrencyCode>;
  email: Maybe<Scalars['String']['output']>;
  emailVerifiedAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  notificationCount: Maybe<Scalars['Int']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  permissions: Maybe<Array<AppPermission>>;
  phone: Maybe<Scalars['String']['output']>;
  role: Maybe<Scalars['String']['output']>;
  status: Maybe<AccountStatus>;
  teacherId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type UserMeetingConfig = {
  __typename?: 'UserMeetingConfig';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  details: Maybe<MeetingConfigDetails>;
  hasSecret: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isDefault: Maybe<Scalars['Boolean']['output']>;
  label: Maybe<Scalars['String']['output']>;
  meetingUrlError: Maybe<Scalars['String']['output']>;
  meetingUrlExpiresAt: Maybe<Scalars['DateTime']['output']>;
  meetingUrlStatus: Maybe<Scalars['String']['output']>;
  oauthTokenExpiresAt: Maybe<Scalars['DateTime']['output']>;
  provider: Maybe<MeetingProvider>;
  providerId: Maybe<Scalars['String']['output']>;
  providerMetadata: Maybe<Scalars['JSON']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type UserMeetingConfigCreateInput = {
  details: MeetingConfigDetailsInput;
  isDefault: Scalars['Boolean']['input'];
  label: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  providerId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type UserMeetingConfigUpdateInput = {
  details: InputMaybe<MeetingConfigDetailsInput>;
  forceRegenerate: InputMaybe<Scalars['Boolean']['input']>;
  isDefault: InputMaybe<Scalars['Boolean']['input']>;
  label: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  providerId: InputMaybe<Scalars['String']['input']>;
};

export type UserOverride = {
  __typename?: 'UserOverride';
  assignedBy: Maybe<Scalars['String']['output']>;
  permissionId: Maybe<Scalars['String']['output']>;
  state: Maybe<OverrideState>;
};

export type UserOverrideInput = {
  permissionId: Scalars['String']['input'];
  state: OverrideState;
};

export type UserPaymentMethod = {
  __typename?: 'UserPaymentMethod';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  details: Maybe<PaymentMethodDetails>;
  direction: Maybe<PaymentDirection>;
  id: Maybe<Scalars['String']['output']>;
  isDefault: Maybe<Scalars['Boolean']['output']>;
  label: Maybe<Scalars['String']['output']>;
  type: Maybe<PaymentMethodType>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  verifiedAt: Maybe<Scalars['DateTime']['output']>;
  verifiedByUserId: Maybe<Scalars['String']['output']>;
};

export type UserPaymentMethodCreateInput = {
  details: PaymentMethodDetailsInput;
  direction: PaymentDirection;
  isDefault: InputMaybe<Scalars['Boolean']['input']>;
  label: InputMaybe<Scalars['String']['input']>;
  type: PaymentMethodType;
  userId: Scalars['String']['input'];
};

export type UserPaymentMethodInitialInput = {
  details: PaymentMethodDetailsInput;
  direction: PaymentDirection;
  isDefault: InputMaybe<Scalars['Boolean']['input']>;
  label: InputMaybe<Scalars['String']['input']>;
  type: PaymentMethodType;
};

export type UserPaymentMethodUpdateInput = {
  details: InputMaybe<PaymentMethodDetailsInput>;
  direction: InputMaybe<PaymentDirection>;
  isDefault: InputMaybe<Scalars['Boolean']['input']>;
  label: InputMaybe<Scalars['String']['input']>;
};

export enum UserRole {
  AcademyAdmin = 'ACADEMY_ADMIN',
  Guest = 'GUEST',
  Parent = 'PARENT',
  Staff = 'STAFF',
  Student = 'STUDENT',
  Supervisor = 'SUPERVISOR',
  SuperAdmin = 'SUPER_ADMIN',
  Teacher = 'TEACHER',
  User = 'USER'
}

export type WeeklyScheduleClass = {
  __typename?: 'WeeklyScheduleClass';
  classType: Maybe<ClassType>;
  day: Maybe<Scalars['String']['output']>;
  duration: Maybe<Scalars['Int']['output']>;
  effectiveMeeting: Maybe<EffectiveMeeting>;
  executionState: Maybe<ClassExecutionState>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  meetingJoinUrl: Maybe<Scalars['String']['output']>;
  outcome: Maybe<ClassOutcome>;
  startTime: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  subjectId: Maybe<Scalars['String']['output']>;
  subjectName: Maybe<Scalars['String']['output']>;
};

export type WeeklyScheduleGrid = {
  __typename?: 'WeeklyScheduleGrid';
  classes: Maybe<Array<WeeklyScheduleClass>>;
  id: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  weekEnd: Maybe<Scalars['String']['output']>;
  weekStart: Maybe<Scalars['String']['output']>;
};

export type WeeklyWorkloadMetrics = {
  __typename?: 'WeeklyWorkloadMetrics';
  classCount: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  totalMinutes: Maybe<Scalars['Int']['output']>;
  weeklyHoursWorked: Maybe<Scalars['String']['output']>;
};

export type WhatsappAccount = {
  __typename?: 'WhatsappAccount';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  displayName: Maybe<Scalars['LocalizedString']['output']>;
  displayPhoneNumber: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  lastWebhookAt: Maybe<Scalars['DateTime']['output']>;
  maxPhoneNumbersPerBusiness: Maybe<Scalars['String']['output']>;
  phoneNumberId: Maybe<Scalars['String']['output']>;
  portfolioMessagingLimitTier: Maybe<WhatsappLimitTier>;
  qualityRating: Maybe<WhatsappQualityRating>;
  throughputLevel: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  wabaId: Maybe<Scalars['String']['output']>;
};

export type WhatsappAccountCreateInput = {
  displayName: InputMaybe<Scalars['LocalizedString']['input']>;
  /** Display phone number (max 32 chars) */
  displayPhoneNumber: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  /** Phone number ID (max 64 chars) */
  phoneNumberId: Scalars['String']['input'];
  portfolioMessagingLimitTier: InputMaybe<WhatsappLimitTier>;
  qualityRating: InputMaybe<WhatsappQualityRating>;
  throughputLevel: InputMaybe<Scalars['String']['input']>;
  /** WhatsApp Business Account ID (max 64 chars) */
  wabaId: Scalars['String']['input'];
};

export type WhatsappAccountUpdateInput = {
  displayName: InputMaybe<Scalars['LocalizedString']['input']>;
  /** Display phone number (max 32 chars) */
  displayPhoneNumber: InputMaybe<Scalars['String']['input']>;
  isActive: InputMaybe<Scalars['Boolean']['input']>;
  portfolioMessagingLimitTier: InputMaybe<WhatsappLimitTier>;
  qualityRating: InputMaybe<WhatsappQualityRating>;
  throughputLevel: InputMaybe<Scalars['String']['input']>;
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

export type WhatsappSyncFromMetaResult = {
  __typename?: 'WhatsappSyncFromMetaResult';
  accounts: Maybe<Array<WhatsappAccount>>;
  id: Maybe<Scalars['String']['output']>;
  templates: Maybe<Array<WhatsappTemplateSnapshot>>;
};

export enum WhatsappTemplateCategory {
  Authentication = 'AUTHENTICATION',
  Marketing = 'MARKETING',
  Utility = 'UTILITY'
}

export type WhatsappTemplateSnapshot = {
  __typename?: 'WhatsappTemplateSnapshot';
  category: Maybe<WhatsappTemplateCategory>;
  id: Maybe<Scalars['String']['output']>;
  language: Maybe<Scalars['String']['output']>;
  lastSyncedAt: Maybe<Scalars['DateTime']['output']>;
  name: Maybe<Scalars['String']['output']>;
  status: Maybe<WhatsappTemplateStatus>;
};

export enum WhatsappTemplateStatus {
  Approved = 'APPROVED',
  Disabled = 'DISABLED',
  Paused = 'PAUSED',
  Pending = 'PENDING',
  PendingDeletion = 'PENDING_DELETION',
  Rejected = 'REJECTED'
}

export type WorkshopPromo = {
  __typename?: 'WorkshopPromo';
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  imageUrl: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};
