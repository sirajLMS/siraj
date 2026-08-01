/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './graphql-types.ts';

export type AccountStatus =
  | 'ACTIVATED'
  | 'DEACTIVATED';

export type AdminDashboardScheduleInput = {
  date: string;
  metricFilter: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
  teacherId: string | null | undefined;
};

export type AppLanguage =
  | 'ar'
  | 'en';

export type AppPermission =
  | 'AUTH_LOGIN'
  | 'BILLING_CREATE_INVOICE'
  | 'BILLING_DELETE_INVOICE'
  | 'BILLING_MANAGE_CURRENCIES'
  | 'BILLING_MANAGE_CURRENCY_HEDGES'
  | 'BILLING_MANAGE_FX_PROVIDER'
  | 'BILLING_OVERRIDE_EXCHANGE_RATES'
  | 'BILLING_REFRESH_EXCHANGE_RATES'
  | 'BILLING_SUBMIT_PAYMENT_PROOF'
  | 'BILLING_UPDATE_STATUS_PAID'
  | 'BILLING_VIEW_EXCHANGE_RATES'
  | 'BILLING_VIEW_HISTORY'
  | 'BILLING_VIEW_UNPAID_INVOICES'
  | 'CATEGORIES_CREATE'
  | 'CATEGORIES_DELETE'
  | 'CATEGORIES_LIST'
  | 'CATEGORIES_UPDATE'
  | 'COMMUNICATION_SUBMIT_SUGGESTION'
  | 'COMPLAINTS_DELETE'
  | 'COMPLAINTS_LIST'
  | 'COMPLAINTS_RESPOND'
  | 'CREDITS_MANAGE'
  | 'DASHBOARD_FILTER_METRICS'
  | 'DASHBOARD_METRICS_VIEW_ALL'
  | 'DASHBOARD_SEARCH'
  | 'DASHBOARD_VIEW'
  | 'DASHBOARD_VIEW_METRICS'
  | 'DOCUMENT_MANAGE_PARENT_DOCS'
  | 'HISTORY_VIEW_CALENDAR'
  | 'HISTORY_VIEW_DETAILS'
  | 'INVOICES_CREATE'
  | 'INVOICES_DELETE'
  | 'INVOICES_EDIT'
  | 'INVOICES_LIST'
  | 'INVOICES_MARK_PAID'
  | 'LESSON_REPORTS_APPROVE'
  | 'LESSON_REPORTS_REJECT'
  | 'LESSON_REPORTS_REVIEW'
  | 'LESSON_REPORTS_SUBMIT'
  | 'MEETING_CONFIGS_MANAGE_CLASS'
  | 'MEETING_CONFIGS_MANAGE_OTHER'
  | 'MEETING_CONFIGS_MANAGE_OWN'
  | 'MEETING_PROVIDERS_MANAGE_CATALOG'
  | 'MONTHLY_REPORTS_VIEW'
  | 'NOTES_CREATE'
  | 'NOTES_DELETE'
  | 'NOTES_LIST'
  | 'NOTES_UPDATE'
  | 'NOTIFICATION_VIEW_ALERTS'
  | 'PARENTS_CREATE'
  | 'PARENTS_EDIT'
  | 'PARENTS_LIST'
  | 'PARENT_MANAGE_STATUS'
  | 'PARENT_VIEW_DIRECTORY'
  | 'PARENT_VIEW_STUDENTS'
  | 'PAYMENT_METHODS_MANAGE_CATALOGS'
  | 'PAYMENT_METHODS_VERIFY_BANK_TRANSFER'
  | 'PERMISSION_GROUPS_ASSIGN'
  | 'PERMISSION_GROUPS_MANAGE'
  | 'PROFILE_CORE_CONTACT_EDIT_OTHER'
  | 'PROFILE_CORE_CONTACT_EDIT_OWN'
  | 'PROFILE_CORE_CONTACT_VIEW_OTHER'
  | 'PROFILE_CORE_CONTACT_VIEW_OWN'
  | 'PROFILE_CORE_IDENTITY_EDIT_OTHER'
  | 'PROFILE_CORE_IDENTITY_EDIT_OWN'
  | 'PROFILE_CORE_IDENTITY_VIEW_OTHER'
  | 'PROFILE_CORE_IDENTITY_VIEW_OWN'
  | 'PROFILE_MEETING_CONFIGS_EDIT_OTHER'
  | 'PROFILE_MEETING_CONFIGS_EDIT_OWN'
  | 'PROFILE_MEETING_CONFIGS_VIEW_OTHER'
  | 'PROFILE_MEETING_CONFIGS_VIEW_OWN'
  | 'PROFILE_PARENT_ACCOUNT_EDIT_OTHER'
  | 'PROFILE_PARENT_ACCOUNT_EDIT_OWN'
  | 'PROFILE_PARENT_ACCOUNT_VIEW_OTHER'
  | 'PROFILE_PARENT_ACCOUNT_VIEW_OWN'
  | 'PROFILE_PARENT_BILLING_EDIT_OTHER'
  | 'PROFILE_PARENT_BILLING_EDIT_OWN'
  | 'PROFILE_PARENT_BILLING_VIEW_OTHER'
  | 'PROFILE_PARENT_BILLING_VIEW_OWN'
  | 'PROFILE_PARENT_IDENTITY_EDIT_OTHER'
  | 'PROFILE_PARENT_IDENTITY_EDIT_OWN'
  | 'PROFILE_PARENT_IDENTITY_VIEW_OTHER'
  | 'PROFILE_PARENT_IDENTITY_VIEW_OWN'
  | 'PROFILE_PARENT_SOCIAL_EDIT_OTHER'
  | 'PROFILE_PARENT_SOCIAL_EDIT_OWN'
  | 'PROFILE_PARENT_SOCIAL_VIEW_OTHER'
  | 'PROFILE_PARENT_SOCIAL_VIEW_OWN'
  | 'PROFILE_PARENT_STUDENTS_EDIT_OTHER'
  | 'PROFILE_PARENT_STUDENTS_EDIT_OWN'
  | 'PROFILE_PARENT_STUDENTS_VIEW_OTHER'
  | 'PROFILE_PARENT_STUDENTS_VIEW_OWN'
  | 'PROFILE_PAYMENT_METHODS_EDIT_OTHER'
  | 'PROFILE_PAYMENT_METHODS_EDIT_OWN'
  | 'PROFILE_PAYMENT_METHODS_VIEW_OTHER'
  | 'PROFILE_PAYMENT_METHODS_VIEW_OWN'
  | 'PROFILE_STAFF_PERMISSIONS_EDIT_OTHER'
  | 'PROFILE_STAFF_PERMISSIONS_EDIT_OWN'
  | 'PROFILE_STAFF_PERMISSIONS_VIEW_OTHER'
  | 'PROFILE_STAFF_PERMISSIONS_VIEW_OWN'
  | 'PROFILE_STAFF_ROLE_EDIT_OTHER'
  | 'PROFILE_STAFF_ROLE_EDIT_OWN'
  | 'PROFILE_STAFF_ROLE_VIEW_OTHER'
  | 'PROFILE_STAFF_ROLE_VIEW_OWN'
  | 'PROFILE_TEACHER_IDENTITY_EDIT_OTHER'
  | 'PROFILE_TEACHER_IDENTITY_EDIT_OWN'
  | 'PROFILE_TEACHER_IDENTITY_VIEW_OTHER'
  | 'PROFILE_TEACHER_IDENTITY_VIEW_OWN'
  | 'PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER'
  | 'PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN'
  | 'PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER'
  | 'PROFILE_TEACHER_PROFESSIONAL_VIEW_OWN'
  | 'PROFILE_TEACHER_STUDENTS_EDIT_OTHER'
  | 'PROFILE_TEACHER_STUDENTS_EDIT_OWN'
  | 'PROFILE_TEACHER_STUDENTS_VIEW_OTHER'
  | 'PROFILE_TEACHER_STUDENTS_VIEW_OWN'
  | 'QUOTAS_MANAGE'
  | 'QUOTAS_VIEW'
  | 'REPORTS_GENERATE'
  | 'REPORT_GENERATE_CUSTOM'
  | 'REPORT_VIEW_FINANCIALS'
  | 'RESOURCES_DELETE'
  | 'RESOURCES_LIST'
  | 'RESOURCES_UPLOAD'
  | 'SCHEDULE_CLEAR_WEEKLY'
  | 'SCHEDULE_CREATE_CLASS'
  | 'SCHEDULE_DELETE_CLASS'
  | 'SCHEDULE_DST_MIGRATE'
  | 'SCHEDULE_FILTER_ADVANCED'
  | 'SCHEDULE_MANAGE_RECURRING'
  | 'SCHEDULE_SEARCH_AVAILABILITY'
  | 'SCHEDULE_VIEW_ALL'
  | 'SCHEDULE_VIEW_ASSIGNED'
  | 'SCHEDULE_VIEW_FAMILY'
  | 'SCHEDULE_VIEW_LIST'
  | 'SCHEDULE_VIEW_TIMEZONES'
  | 'SCHEDULE_VIEW_WEEKLY'
  | 'SCHEDULE_VIEW_WORKLOAD'
  | 'SESSION_ACTIVATE_CLASS'
  | 'SESSION_ACTIVATE_OVERRIDE'
  | 'SESSION_OVERRIDE_ACTIONS'
  | 'SESSION_RESCHEDULE'
  | 'SESSION_RESET'
  | 'SESSION_UPDATE_STATUS_ABSENT'
  | 'SESSION_UPDATE_STATUS_LEAVE'
  | 'SESSION_UPDATE_STATUS_START'
  | 'SESSION_VIEW_DETAILS'
  | 'SETTINGS_AUDIT_VIEW'
  | 'SETTINGS_EDIT_ENV'
  | 'SETTINGS_EDIT_GENERAL'
  | 'SETTINGS_EDIT_SESSION'
  | 'SETTINGS_SITE_CONTENT_MANAGE'
  | 'SETTINGS_TIMEZONES_VIEW'
  | 'SETTINGS_VIEW'
  | 'STAFF_CREATE'
  | 'STAFF_EDIT'
  | 'STAFF_LIST'
  | 'STAFF_VIEW_DIRECTORY'
  | 'STORAGE_MANAGE'
  | 'STUDENTS_CHANGE_STATUS'
  | 'STUDENTS_CHANGE_TEACHER'
  | 'STUDENTS_CREATE'
  | 'STUDENTS_EDIT'
  | 'STUDENTS_LIST'
  | 'STUDENTS_OVERRIDE_QUOTA'
  | 'STUDENT_ACADEMIC_EDIT_OTHER'
  | 'STUDENT_ACADEMIC_EDIT_OWN'
  | 'STUDENT_ACADEMIC_VIEW_OTHER'
  | 'STUDENT_ACADEMIC_VIEW_OWN'
  | 'STUDENT_EDIT_QUOTA'
  | 'STUDENT_HISTORY_EDIT_OTHER'
  | 'STUDENT_HISTORY_EDIT_OWN'
  | 'STUDENT_HISTORY_VIEW_OTHER'
  | 'STUDENT_HISTORY_VIEW_OWN'
  | 'STUDENT_IDENTITY_EDIT_OTHER'
  | 'STUDENT_IDENTITY_EDIT_OWN'
  | 'STUDENT_IDENTITY_VIEW_OTHER'
  | 'STUDENT_IDENTITY_VIEW_OWN'
  | 'STUDENT_MANAGE_STATUS'
  | 'STUDENT_PARENT_EDIT_OTHER'
  | 'STUDENT_PARENT_EDIT_OWN'
  | 'STUDENT_PARENT_VIEW_OTHER'
  | 'STUDENT_PARENT_VIEW_OWN'
  | 'STUDENT_QUOTA_EDIT_EDIT_OTHER'
  | 'STUDENT_QUOTA_EDIT_EDIT_OWN'
  | 'STUDENT_QUOTA_EDIT_VIEW_OTHER'
  | 'STUDENT_QUOTA_EDIT_VIEW_OWN'
  | 'STUDENT_REASSIGN_TEACHER'
  | 'STUDENT_SCHEDULE_EDIT_OTHER'
  | 'STUDENT_SCHEDULE_EDIT_OWN'
  | 'STUDENT_SCHEDULE_VIEW_OTHER'
  | 'STUDENT_SCHEDULE_VIEW_OWN'
  | 'STUDENT_TEACHER_EDIT_OTHER'
  | 'STUDENT_TEACHER_EDIT_OWN'
  | 'STUDENT_TEACHER_VIEW_OTHER'
  | 'STUDENT_TEACHER_VIEW_OWN'
  | 'STUDENT_VIEW_ASSOCIATED'
  | 'STUDENT_VIEW_OWN_DASHBOARD'
  | 'SUBJECTS_CREATE'
  | 'SUBJECTS_DELETE'
  | 'SUBJECTS_LIST'
  | 'SUBJECTS_MANAGE_RESOURCES'
  | 'SUBJECTS_UPDATE'
  | 'SUBJECTS_VIEW_RESOURCES'
  | 'SUGGESTIONS_DELETE'
  | 'SUGGESTIONS_LIST'
  | 'SUGGESTIONS_REVIEW'
  | 'SUPERVISOR_VIEW_DASHBOARD'
  | 'SUPPORT_SUBMIT_COMPLAINT'
  | 'SUPPORT_VIEW_HISTORY'
  | 'SYSTEM_BULK_UPDATE_DST'
  | 'SYSTEM_DISPATCH_EMAIL'
  | 'SYSTEM_ENFORCE_LEAVE_LIMIT'
  | 'SYSTEM_ENFORCE_SUSPENDED_LOCK'
  | 'SYSTEM_ENFORCE_TIME_WINDOW'
  | 'SYSTEM_PROCESS_STUDENT_LEAVE'
  | 'SYSTEM_RESTRICT_RESOURCE_ACCESS'
  | 'SYSTEM_SYNC_NOTIFICATIONS'
  | 'TEACHERS_CREATE'
  | 'TEACHERS_EDIT'
  | 'TEACHERS_LIST'
  | 'TEACHERS_MANAGE_SCHEDULE'
  | 'TEACHER_DUES_MARK_PAID'
  | 'TEACHER_DUES_VIEW'
  | 'TEACHER_VIEW_DASHBOARD'
  | 'TEACHER_VIEW_STUDENTS'
  | 'TEST_CUSTOM_ALT'
  | 'TEST_CUSTOM_ONLY'
  | 'TEST_SYSTEM_ONLY';

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

export type AttendanceEvaluation =
  | 'ABSENT'
  | 'LATE'
  | 'PRESENT';

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

export type AvailabilitySearchSortBy =
  | 'MOST_AVAILABLE_DAYS'
  | 'MOST_GAPS'
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'TIMEZONE_ASC';

export type BillingMonthInput = {
  month: number;
  year: number;
};

export type BookingStatus =
  | 'CONFIRMED'
  | 'RESCHEDULED';

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

export type ClassExecutionState =
  | 'ACTIVATED'
  | 'COMPLETED'
  | 'NOT_ACTIVATED'
  | 'ON_DEMAND_CONFLICT_HELD'
  | 'ON_DEMAND_NO_CREDITS_ABSENT'
  | 'ON_DEMAND_NO_CREDITS_CANCELLED'
  | 'ON_DEMAND_PENDING_CREDITS'
  | 'RUNNING';

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

export type ClassOutcome =
  | 'ABSENT'
  | 'LEAVE'
  | 'PENDING'
  | 'TAKEN';

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

export type ClassType =
  | 'ADVANCE'
  | 'REGULAR'
  | 'TRIAL';

/** Categories for parent complaints. */
export type ComplaintCategory =
  | 'OTHER'
  | 'REGARDING_SYSTEM'
  | 'REGARDING_TEACHER';

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
export type ComplaintStatus =
  | 'ANSWERED'
  | 'UNANSWERED';

/** Input for submitting a new complaint. */
export type ComplaintSubmitInput = {
  body: string;
  category: ComplaintCategory;
  files: Array<ComplaintFileMetadataInput> | null | undefined;
  studentId: string | null | undefined;
  submitterEmail: string;
};

export type CoreUserProfileFieldsInput = {
  avatarUrl: string | null | undefined;
  displayCurrency: CurrencyCode | null | undefined;
  email: string | null | undefined;
  name: string | null | undefined;
  timezone: IanaTimezone | null | undefined;
};

export type CountryCode =
  | 'AD'
  | 'AE'
  | 'AF'
  | 'AG'
  | 'AI'
  | 'AL'
  | 'AM'
  | 'AO'
  | 'AQ'
  | 'AR'
  | 'AS'
  | 'AT'
  | 'AU'
  | 'AW'
  | 'AX'
  | 'AZ'
  | 'BA'
  | 'BB'
  | 'BD'
  | 'BE'
  | 'BF'
  | 'BG'
  | 'BH'
  | 'BI'
  | 'BJ'
  | 'BL'
  | 'BM'
  | 'BN'
  | 'BO'
  | 'BR'
  | 'BS'
  | 'BT'
  | 'BV'
  | 'BW'
  | 'BY'
  | 'BZ'
  | 'CA'
  | 'CC'
  | 'CD'
  | 'CF'
  | 'CG'
  | 'CH'
  | 'CI'
  | 'CK'
  | 'CL'
  | 'CM'
  | 'CN'
  | 'CO'
  | 'CR'
  | 'CU'
  | 'CV'
  | 'CW'
  | 'CX'
  | 'CY'
  | 'CZ'
  | 'DE'
  | 'DJ'
  | 'DK'
  | 'DM'
  | 'DO'
  | 'DZ'
  | 'EC'
  | 'EE'
  | 'EG'
  | 'EH'
  | 'ER'
  | 'ES'
  | 'ET'
  | 'FI'
  | 'FJ'
  | 'FK'
  | 'FM'
  | 'FO'
  | 'FR'
  | 'GA'
  | 'GB'
  | 'GD'
  | 'GE'
  | 'GF'
  | 'GG'
  | 'GH'
  | 'GI'
  | 'GL'
  | 'GM'
  | 'GN'
  | 'GP'
  | 'GQ'
  | 'GR'
  | 'GS'
  | 'GT'
  | 'GU'
  | 'GW'
  | 'GY'
  | 'HK'
  | 'HM'
  | 'HN'
  | 'HR'
  | 'HT'
  | 'HU'
  | 'ID'
  | 'IE'
  | 'IM'
  | 'IN'
  | 'IO'
  | 'IQ'
  | 'IR'
  | 'IS'
  | 'IT'
  | 'JE'
  | 'JM'
  | 'JO'
  | 'JP'
  | 'KE'
  | 'KG'
  | 'KH'
  | 'KI'
  | 'KM'
  | 'KN'
  | 'KP'
  | 'KR'
  | 'KW'
  | 'KY'
  | 'KZ'
  | 'LA'
  | 'LB'
  | 'LC'
  | 'LI'
  | 'LK'
  | 'LR'
  | 'LS'
  | 'LT'
  | 'LU'
  | 'LV'
  | 'LY'
  | 'MA'
  | 'MC'
  | 'MD'
  | 'ME'
  | 'MF'
  | 'MG'
  | 'MH'
  | 'MK'
  | 'ML'
  | 'MM'
  | 'MN'
  | 'MO'
  | 'MP'
  | 'MQ'
  | 'MR'
  | 'MS'
  | 'MT'
  | 'MU'
  | 'MV'
  | 'MW'
  | 'MX'
  | 'MY'
  | 'MZ'
  | 'NA'
  | 'NC'
  | 'NE'
  | 'NF'
  | 'NG'
  | 'NI'
  | 'NL'
  | 'NO'
  | 'NP'
  | 'NR'
  | 'NU'
  | 'NZ'
  | 'OM'
  | 'PA'
  | 'PE'
  | 'PF'
  | 'PG'
  | 'PH'
  | 'PK'
  | 'PL'
  | 'PM'
  | 'PN'
  | 'PR'
  | 'PS'
  | 'PT'
  | 'PW'
  | 'PY'
  | 'QA'
  | 'RE'
  | 'RO'
  | 'RS'
  | 'RU'
  | 'RW'
  | 'SA'
  | 'SB'
  | 'SC'
  | 'SD'
  | 'SE'
  | 'SG'
  | 'SH'
  | 'SI'
  | 'SJ'
  | 'SK'
  | 'SL'
  | 'SM'
  | 'SN'
  | 'SO'
  | 'SR'
  | 'SS'
  | 'ST'
  | 'SV'
  | 'SX'
  | 'SY'
  | 'SZ'
  | 'TC'
  | 'TD'
  | 'TF'
  | 'TG'
  | 'TH'
  | 'TJ'
  | 'TK'
  | 'TL'
  | 'TM'
  | 'TN'
  | 'TO'
  | 'TR'
  | 'TV'
  | 'TW'
  | 'TZ'
  | 'UA'
  | 'UG'
  | 'US'
  | 'UY'
  | 'UZ'
  | 'VA'
  | 'VC'
  | 'VE'
  | 'VG'
  | 'VI'
  | 'VN'
  | 'VU'
  | 'WF'
  | 'WS'
  | 'XK'
  | 'YE'
  | 'YT'
  | 'ZA'
  | 'ZM'
  | 'ZW';

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
  classType: string | null | undefined;
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

export type CreditReason =
  | 'ADJUSTMENT'
  | 'DEDUCTION'
  | 'PURCHASE'
  | 'REFUND';

export type CurrencyCode =
  | 'AED'
  | 'AUD'
  | 'BHD'
  | 'CAD'
  | 'CHF'
  | 'CNY'
  | 'DJF'
  | 'DZD'
  | 'EGP'
  | 'EUR'
  | 'GBP'
  | 'ILS'
  | 'INR'
  | 'IQD'
  | 'JOD'
  | 'JPY'
  | 'KMF'
  | 'KWD'
  | 'LBP'
  | 'LYD'
  | 'MAD'
  | 'MRU'
  | 'OMR'
  | 'QAR'
  | 'SAR'
  | 'SDG'
  | 'SOS'
  | 'SYP'
  | 'TND'
  | 'TRY'
  | 'USD'
  | 'YER';

export type DayOfWeek =
  | 'FRIDAY'
  | 'MONDAY'
  | 'SATURDAY'
  | 'SUNDAY'
  | 'THURSDAY'
  | 'TUESDAY'
  | 'WEDNESDAY';

/** Input for the demo fast login mutation. */
export type DemoLoginInput = {
  /** The unique slug of the permission group to authenticate as. */
  groupSlug: string;
};

export type EffectiveMeetingSource =
  | 'class'
  | 'none'
  | 'recurring'
  | 'teacher';

export type EnvConfigUpsertInput = {
  key: string;
  value: string;
};

export type FxProvider =
  | 'Fixer'
  | 'OpenExchangeRates';

export type FxProviderConfigSource =
  | 'DATABASE'
  | 'ENV';

export type FxSyncStatus =
  | 'Failed'
  | 'Partial'
  | 'Running'
  | 'Success';

export type Gender =
  | 'FEMALE'
  | 'MALE';

export type GroupClassAttendanceStatus =
  | 'ABSENT'
  | 'LATE'
  | 'PENDING'
  | 'PRESENT';

export type IanaTimezone =
  | 'Africa_Abidjan'
  | 'Africa_Accra'
  | 'Africa_Addis_Ababa'
  | 'Africa_Algiers'
  | 'Africa_Asmara'
  | 'Africa_Bamako'
  | 'Africa_Bangui'
  | 'Africa_Banjul'
  | 'Africa_Bissau'
  | 'Africa_Blantyre'
  | 'Africa_Brazzaville'
  | 'Africa_Bujumbura'
  | 'Africa_Cairo'
  | 'Africa_Casablanca'
  | 'Africa_Ceuta'
  | 'Africa_Conakry'
  | 'Africa_Dakar'
  | 'Africa_Dar_es_Salaam'
  | 'Africa_Djibouti'
  | 'Africa_Douala'
  | 'Africa_El_Aaiun'
  | 'Africa_Freetown'
  | 'Africa_Gaborone'
  | 'Africa_Harare'
  | 'Africa_Johannesburg'
  | 'Africa_Juba'
  | 'Africa_Kampala'
  | 'Africa_Khartoum'
  | 'Africa_Kigali'
  | 'Africa_Kinshasa'
  | 'Africa_Lagos'
  | 'Africa_Libreville'
  | 'Africa_Lome'
  | 'Africa_Luanda'
  | 'Africa_Lubumbashi'
  | 'Africa_Lusaka'
  | 'Africa_Malabo'
  | 'Africa_Maputo'
  | 'Africa_Maseru'
  | 'Africa_Mbabane'
  | 'Africa_Mogadishu'
  | 'Africa_Monrovia'
  | 'Africa_Nairobi'
  | 'Africa_Ndjamena'
  | 'Africa_Niamey'
  | 'Africa_Nouakchott'
  | 'Africa_Ouagadougou'
  | 'Africa_Porto_Novo'
  | 'Africa_Sao_Tome'
  | 'Africa_Tripoli'
  | 'Africa_Tunis'
  | 'Africa_Windhoek'
  | 'America_Adak'
  | 'America_Anchorage'
  | 'America_Anguilla'
  | 'America_Antigua'
  | 'America_Araguaina'
  | 'America_Argentina_Buenos_Aires'
  | 'America_Argentina_Catamarca'
  | 'America_Argentina_Cordoba'
  | 'America_Argentina_Jujuy'
  | 'America_Argentina_La_Rioja'
  | 'America_Argentina_Mendoza'
  | 'America_Argentina_Rio_Gallegos'
  | 'America_Argentina_Salta'
  | 'America_Argentina_San_Juan'
  | 'America_Argentina_San_Luis'
  | 'America_Argentina_Tucuman'
  | 'America_Argentina_Ushuaia'
  | 'America_Aruba'
  | 'America_Asuncion'
  | 'America_Atikokan'
  | 'America_Bahia'
  | 'America_Bahia_Banderas'
  | 'America_Barbados'
  | 'America_Belem'
  | 'America_Belize'
  | 'America_Blanc_Sablon'
  | 'America_Boa_Vista'
  | 'America_Bogota'
  | 'America_Boise'
  | 'America_Cambridge_Bay'
  | 'America_Campo_Grande'
  | 'America_Cancun'
  | 'America_Caracas'
  | 'America_Cayenne'
  | 'America_Cayman'
  | 'America_Chicago'
  | 'America_Chihuahua'
  | 'America_Ciudad_Juarez'
  | 'America_Costa_Rica'
  | 'America_Creston'
  | 'America_Cuiaba'
  | 'America_Curacao'
  | 'America_Danmarkshavn'
  | 'America_Dawson'
  | 'America_Dawson_Creek'
  | 'America_Denver'
  | 'America_Detroit'
  | 'America_Dominica'
  | 'America_Edmonton'
  | 'America_Eirunepe'
  | 'America_El_Salvador'
  | 'America_Fort_Nelson'
  | 'America_Fortaleza'
  | 'America_Glace_Bay'
  | 'America_Goose_Bay'
  | 'America_Grand_Turk'
  | 'America_Grenada'
  | 'America_Guadeloupe'
  | 'America_Guatemala'
  | 'America_Guayaquil'
  | 'America_Guyana'
  | 'America_Halifax'
  | 'America_Havana'
  | 'America_Hermosillo'
  | 'America_Indiana_Indianapolis'
  | 'America_Indiana_Knox'
  | 'America_Indiana_Marengo'
  | 'America_Indiana_Petersburg'
  | 'America_Indiana_Tell_City'
  | 'America_Indiana_Vevay'
  | 'America_Indiana_Vincennes'
  | 'America_Indiana_Winamac'
  | 'America_Inuvik'
  | 'America_Iqaluit'
  | 'America_Jamaica'
  | 'America_Juneau'
  | 'America_Kentucky_Louisville'
  | 'America_Kentucky_Monticello'
  | 'America_Kralendijk'
  | 'America_La_Paz'
  | 'America_Lima'
  | 'America_Los_Angeles'
  | 'America_Lower_Princes'
  | 'America_Maceio'
  | 'America_Managua'
  | 'America_Manaus'
  | 'America_Marigot'
  | 'America_Martinique'
  | 'America_Matamoros'
  | 'America_Mazatlan'
  | 'America_Menominee'
  | 'America_Merida'
  | 'America_Metlakatla'
  | 'America_Mexico_City'
  | 'America_Miquelon'
  | 'America_Moncton'
  | 'America_Monterrey'
  | 'America_Montevideo'
  | 'America_Montserrat'
  | 'America_Nassau'
  | 'America_New_York'
  | 'America_Nome'
  | 'America_Noronha'
  | 'America_North_Dakota_Beulah'
  | 'America_North_Dakota_Center'
  | 'America_North_Dakota_New_Salem'
  | 'America_Nuuk'
  | 'America_Ojinaga'
  | 'America_Panama'
  | 'America_Paramaribo'
  | 'America_Phoenix'
  | 'America_Port_au_Prince'
  | 'America_Port_of_Spain'
  | 'America_Porto_Velho'
  | 'America_Puerto_Rico'
  | 'America_Punta_Arenas'
  | 'America_Rankin_Inlet'
  | 'America_Recife'
  | 'America_Regina'
  | 'America_Resolute'
  | 'America_Rio_Branco'
  | 'America_Santarem'
  | 'America_Santiago'
  | 'America_Santo_Domingo'
  | 'America_Sao_Paulo'
  | 'America_Scoresbysund'
  | 'America_Sitka'
  | 'America_St_Barthelemy'
  | 'America_St_Johns'
  | 'America_St_Kitts'
  | 'America_St_Lucia'
  | 'America_St_Thomas'
  | 'America_St_Vincent'
  | 'America_Swift_Current'
  | 'America_Tegucigalpa'
  | 'America_Thule'
  | 'America_Tijuana'
  | 'America_Toronto'
  | 'America_Tortola'
  | 'America_Vancouver'
  | 'America_Whitehorse'
  | 'America_Winnipeg'
  | 'America_Yakutat'
  | 'Antarctica_Casey'
  | 'Antarctica_Davis'
  | 'Antarctica_DumontDUrville'
  | 'Antarctica_Macquarie'
  | 'Antarctica_Mawson'
  | 'Antarctica_McMurdo'
  | 'Antarctica_Palmer'
  | 'Antarctica_Rothera'
  | 'Antarctica_Syowa'
  | 'Antarctica_Troll'
  | 'Antarctica_Vostok'
  | 'Arctic_Longyearbyen'
  | 'Asia_Aden'
  | 'Asia_Almaty'
  | 'Asia_Amman'
  | 'Asia_Anadyr'
  | 'Asia_Aqtau'
  | 'Asia_Aqtobe'
  | 'Asia_Ashgabat'
  | 'Asia_Atyrau'
  | 'Asia_Baghdad'
  | 'Asia_Bahrain'
  | 'Asia_Baku'
  | 'Asia_Bangkok'
  | 'Asia_Barnaul'
  | 'Asia_Beirut'
  | 'Asia_Bishkek'
  | 'Asia_Brunei'
  | 'Asia_Chita'
  | 'Asia_Choibalsan'
  | 'Asia_Colombo'
  | 'Asia_Damascus'
  | 'Asia_Dhaka'
  | 'Asia_Dili'
  | 'Asia_Dubai'
  | 'Asia_Dushanbe'
  | 'Asia_Famagusta'
  | 'Asia_Gaza'
  | 'Asia_Hebron'
  | 'Asia_Ho_Chi_Minh'
  | 'Asia_Hong_Kong'
  | 'Asia_Hovd'
  | 'Asia_Irkutsk'
  | 'Asia_Jakarta'
  | 'Asia_Jayapura'
  | 'Asia_Kabul'
  | 'Asia_Kamchatka'
  | 'Asia_Karachi'
  | 'Asia_Kathmandu'
  | 'Asia_Khandyga'
  | 'Asia_Kolkata'
  | 'Asia_Krasnoyarsk'
  | 'Asia_Kuala_Lumpur'
  | 'Asia_Kuching'
  | 'Asia_Kuwait'
  | 'Asia_Macau'
  | 'Asia_Magadan'
  | 'Asia_Makassar'
  | 'Asia_Manila'
  | 'Asia_Muscat'
  | 'Asia_Nicosia'
  | 'Asia_Novokuznetsk'
  | 'Asia_Novosibirsk'
  | 'Asia_Omsk'
  | 'Asia_Oral'
  | 'Asia_Phnom_Penh'
  | 'Asia_Pontianak'
  | 'Asia_Pyongyang'
  | 'Asia_Qatar'
  | 'Asia_Qostanay'
  | 'Asia_Qyzylorda'
  | 'Asia_Riyadh'
  | 'Asia_Sakhalin'
  | 'Asia_Samarkand'
  | 'Asia_Seoul'
  | 'Asia_Shanghai'
  | 'Asia_Singapore'
  | 'Asia_Srednekolymsk'
  | 'Asia_Taipei'
  | 'Asia_Tashkent'
  | 'Asia_Tbilisi'
  | 'Asia_Tehran'
  | 'Asia_Thimphu'
  | 'Asia_Tokyo'
  | 'Asia_Tomsk'
  | 'Asia_Ulaanbaatar'
  | 'Asia_Urumqi'
  | 'Asia_Ust_Nera'
  | 'Asia_Vientiane'
  | 'Asia_Vladivostok'
  | 'Asia_Yakutsk'
  | 'Asia_Yangon'
  | 'Asia_Yekaterinburg'
  | 'Asia_Yerevan'
  | 'Atlantic_Azores'
  | 'Atlantic_Bermuda'
  | 'Atlantic_Canary'
  | 'Atlantic_Cape_Verde'
  | 'Atlantic_Faroe'
  | 'Atlantic_Madeira'
  | 'Atlantic_Reykjavik'
  | 'Atlantic_South_Georgia'
  | 'Atlantic_St_Helena'
  | 'Atlantic_Stanley'
  | 'Australia_Adelaide'
  | 'Australia_Brisbane'
  | 'Australia_Broken_Hill'
  | 'Australia_Darwin'
  | 'Australia_Eucla'
  | 'Australia_Hobart'
  | 'Australia_Lindeman'
  | 'Australia_Lord_Howe'
  | 'Australia_Melbourne'
  | 'Australia_Perth'
  | 'Australia_Sydney'
  | 'Etc_GMT_1'
  | 'Etc_GMT_2'
  | 'Etc_GMT_3'
  | 'Etc_GMT_4'
  | 'Etc_GMT_5'
  | 'Etc_GMT_6'
  | 'Etc_GMT_7'
  | 'Etc_GMT_8'
  | 'Etc_GMT_9'
  | 'Etc_GMT_10'
  | 'Etc_GMT_11'
  | 'Etc_GMT_12'
  | 'Etc_GMT_13'
  | 'Etc_GMT_14'
  | 'Etc_GMT_plus_1'
  | 'Etc_GMT_plus_2'
  | 'Etc_GMT_plus_3'
  | 'Etc_GMT_plus_4'
  | 'Etc_GMT_plus_5'
  | 'Etc_GMT_plus_6'
  | 'Etc_GMT_plus_7'
  | 'Etc_GMT_plus_8'
  | 'Etc_GMT_plus_9'
  | 'Etc_GMT_plus_10'
  | 'Etc_GMT_plus_11'
  | 'Etc_GMT_plus_12'
  | 'Europe_Amsterdam'
  | 'Europe_Andorra'
  | 'Europe_Astrakhan'
  | 'Europe_Athens'
  | 'Europe_Belgrade'
  | 'Europe_Berlin'
  | 'Europe_Bratislava'
  | 'Europe_Brussels'
  | 'Europe_Bucharest'
  | 'Europe_Budapest'
  | 'Europe_Busingen'
  | 'Europe_Chisinau'
  | 'Europe_Copenhagen'
  | 'Europe_Dublin'
  | 'Europe_Gibraltar'
  | 'Europe_Guernsey'
  | 'Europe_Helsinki'
  | 'Europe_Isle_of_Man'
  | 'Europe_Istanbul'
  | 'Europe_Jersey'
  | 'Europe_Kaliningrad'
  | 'Europe_Kirov'
  | 'Europe_Kyiv'
  | 'Europe_Lisbon'
  | 'Europe_Ljubljana'
  | 'Europe_London'
  | 'Europe_Luxembourg'
  | 'Europe_Madrid'
  | 'Europe_Malta'
  | 'Europe_Mariehamn'
  | 'Europe_Minsk'
  | 'Europe_Monaco'
  | 'Europe_Moscow'
  | 'Europe_Oslo'
  | 'Europe_Paris'
  | 'Europe_Podgorica'
  | 'Europe_Prague'
  | 'Europe_Riga'
  | 'Europe_Rome'
  | 'Europe_Samara'
  | 'Europe_San_Marino'
  | 'Europe_Sarajevo'
  | 'Europe_Saratov'
  | 'Europe_Simferopol'
  | 'Europe_Skopje'
  | 'Europe_Sofia'
  | 'Europe_Stockholm'
  | 'Europe_Tallinn'
  | 'Europe_Tirane'
  | 'Europe_Ulyanovsk'
  | 'Europe_Vaduz'
  | 'Europe_Vatican'
  | 'Europe_Vienna'
  | 'Europe_Vilnius'
  | 'Europe_Volgograd'
  | 'Europe_Warsaw'
  | 'Europe_Zagreb'
  | 'Europe_Zurich'
  | 'Indian_Antananarivo'
  | 'Indian_Chagos'
  | 'Indian_Christmas'
  | 'Indian_Cocos'
  | 'Indian_Comoro'
  | 'Indian_Kerguelen'
  | 'Indian_Mahe'
  | 'Indian_Maldives'
  | 'Indian_Mauritius'
  | 'Indian_Mayotte'
  | 'Indian_Reunion'
  | 'Pacific_Apia'
  | 'Pacific_Auckland'
  | 'Pacific_Bougainville'
  | 'Pacific_Chatham'
  | 'Pacific_Chuuk'
  | 'Pacific_Easter'
  | 'Pacific_Efate'
  | 'Pacific_Fakaofo'
  | 'Pacific_Fiji'
  | 'Pacific_Funafuti'
  | 'Pacific_Galapagos'
  | 'Pacific_Gambier'
  | 'Pacific_Guadalcanal'
  | 'Pacific_Guam'
  | 'Pacific_Honolulu'
  | 'Pacific_Kanton'
  | 'Pacific_Kiritimati'
  | 'Pacific_Kosrae'
  | 'Pacific_Kwajalein'
  | 'Pacific_Majuro'
  | 'Pacific_Marquesas'
  | 'Pacific_Midway'
  | 'Pacific_Nauru'
  | 'Pacific_Niue'
  | 'Pacific_Norfolk'
  | 'Pacific_Noumea'
  | 'Pacific_Pago_Pago'
  | 'Pacific_Palau'
  | 'Pacific_Pitcairn'
  | 'Pacific_Pohnpei'
  | 'Pacific_Port_Moresby'
  | 'Pacific_Rarotonga'
  | 'Pacific_Saipan'
  | 'Pacific_Tahiti'
  | 'Pacific_Tarawa'
  | 'Pacific_Tongatapu'
  | 'Pacific_Wake'
  | 'Pacific_Wallis'
  | 'UTC';

export type IdentifierKind =
  | 'EMAIL'
  | 'EMAIL_OR_HANDLE'
  | 'HANDLE';

export type InvoicePaymentSubmissionStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type InvoiceStatus =
  | 'CANCELLED'
  | 'PAID'
  | 'PAYMENT_PENDING'
  | 'UNPAID';

export type InvoiceType =
  | 'MANUAL'
  | 'MONTHLY'
  | 'PER_CLASSES';

export type LeaveRequestStatus =
  | 'APPROVED'
  | 'CANCELLED'
  | 'PENDING'
  | 'RESCHEDULED';

export type LessonReportStatus =
  | 'APPROVED'
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REJECTED';

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

export type ManagerAccountType =
  | 'admin'
  | 'manager'
  | 'supervisor';

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
  meetingUrl: string;
  tenantId: string | null | undefined;
  username: string | null | undefined;
};

export type MeetingProviderCreateInput = {
  description: Partial<Record<'ar' | 'en', string>> | null | undefined;
  fieldSchema: MeetingProviderFieldSchemaInput;
  instructions: Partial<Record<'ar' | 'en', string>> | null | undefined;
  isActive: boolean | null | undefined;
  logoUrl: string | null | undefined;
  name: Partial<Record<'ar' | 'en', string>>;
  slug: string;
  urlAllowlist: Array<string>;
  urlExample: string | null | undefined;
};

export type MeetingProviderFieldSchemaInput = {
  requiresMeetingUrl: boolean;
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
  slug: string | null | undefined;
  urlAllowlist: Array<string> | null | undefined;
  urlExample: string | null | undefined;
};

export type NotificationChannel =
  | 'EMAIL'
  | 'ON_APP'
  | 'PUSH'
  | 'SMS';

export type NotificationEventType =
  | 'CLASS_ACTIVATED'
  | 'CLASS_CANCELLED'
  | 'CLASS_COMPLETED'
  | 'CLASS_LEAVE_REQUESTED'
  | 'CLASS_MARKED_ABSENT'
  | 'CLASS_MARKED_MISSED'
  | 'CLASS_REMINDER'
  | 'CLASS_RESCHEDULED'
  | 'CLASS_RESET'
  | 'CLASS_SCHEDULED'
  | 'CLASS_STARTED'
  | 'COMPLAINT_RESPONSE'
  | 'INVOICE_GENERATED'
  | 'INVOICE_STATUS_CHANGED'
  | 'LESSON_REPORT_REVIEWED'
  | 'LESSON_REPORT_SUBMITTED'
  | 'NEW_COMPLAINT'
  | 'NEW_SUGGESTION'
  | 'ON_DEMAND_INSTANCE_PENDING_CREDIT'
  | 'ON_DEMAND_INSTANCE_REMINDER_T1'
  | 'ON_DEMAND_INSTANCE_REMINDER_T3'
  | 'ON_DEMAND_TEACHER_DAILY_DIGEST'
  | 'PAYMENT_METHOD_CHANGED'
  | 'QUOTA_EXPIRED'
  | 'QUOTA_EXPIRING_SOON'
  | 'QUOTA_LOW_BALANCE'
  | 'STUDENT_QUOTA_OVERRIDDEN'
  | 'STUDENT_STATUS_CHANGED'
  | 'STUDENT_TEACHER_REASSIGNED'
  | 'SUGGESTION_ACKNOWLEDGED'
  | 'SUGGESTION_DUPLICATE_MARKED';

export type NotificationPreferenceInput = {
  channel: NotificationChannel;
  enabled: boolean;
  eventType: NotificationEventType;
};

export type OnDemandNoCreditsOutcome =
  | 'AUTO_ABSENT_NO_CREDITS'
  | 'AUTO_CANCEL'
  | 'REMIND_ONLY';

export type OrderSortDirection =
  | 'ASC'
  | 'DESC';

export type OverrideState =
  | 'DENIED'
  | 'GRANTED';

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

export type ParentStatus =
  | 'ON_LEAVE'
  | 'ON_TRIAL'
  | 'REGULAR'
  | 'SUSPENDED';

export type PaymentDirection =
  | 'BOTH'
  | 'PAYIN'
  | 'PAYOUT';

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

export type PaymentMethodType =
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'MOBILE_WALLET'
  | 'ONLINE_ACCOUNT'
  | 'PAYMENT_LINK'
  | 'PROOF_UPLOAD';

export type ProfileAudience =
  | 'PARENT'
  | 'STAFF'
  | 'STUDENT'
  | 'TEACHER';

export type ProfileScope =
  | 'OTHER'
  | 'OWN';

export type QuotaKind =
  | 'PACKAGE'
  | 'PERIODIC';

export type QuotaLedgerReason =
  | 'ADJUST'
  | 'EXPIRE'
  | 'GRANT'
  | 'REDEEM'
  | 'RELEASE'
  | 'RESERVE';

/** Filter options for querying quotas */
export type QuotaPaginatedFilterInput = {
  kind: QuotaKind | null | undefined;
  search: string | null | undefined;
  status: QuotaStatus | null | undefined;
  studentId: string | null | undefined;
};

export type QuotaPeriodType =
  | 'CUSTOM'
  | 'MONTHLY'
  | 'WEEKLY';

/** Rollover policy configuration for periodic quotas */
export type QuotaRolloverPolicyInput = {
  accumulationCap: number | null | undefined;
  maxRolloverPercent: number | null | undefined;
};

export type QuotaStatus =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'EXPIRED';

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
  version: number;
};

export type RateSource =
  | 'OVERRIDE'
  | 'RECURRING'
  | 'SUBJECT'
  | 'TEACHER';

export type RecurringClassDayInput = {
  dayOfWeek: string;
  isActive: boolean;
  startTime: string;
};

/** Determines how the attendance data is aggregated. */
export type ReportGroupingMode =
  | 'DATE'
  | 'STUDENT'
  | 'TEACHER';

export type RescheduleClassInput = {
  durationMinutes: number;
  scheduledEndAt: string;
  scheduledStartAt: string;
};

export type RescheduleDateLabel =
  | 'LEAVE_REQUEST'
  | 'NEW_DATE';

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

export type SchedulingMode =
  | 'NUMBER_OF_CLASSES'
  | 'ON_DEMAND'
  | 'QUOTA';

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

export type StudentStatus =
  | 'DEACTIVATED'
  | 'ON_LEAVE'
  | 'ON_TRIAL'
  | 'REGULAR'
  | 'SUSPENDED';

export type StudentsOrderByClause = {
  column: StudentsOrderByColumn;
  order: OrderSortDirection | null | undefined;
};

export type StudentsOrderByColumn =
  | 'CLASSES_REMAINING'
  | 'CLASSES_TOTAL'
  | 'CREATED_AT'
  | 'DATE_OF_BIRTH'
  | 'GENDER'
  | 'ID'
  | 'NAME'
  | 'PARENT_ID'
  | 'STATUS'
  | 'UPDATED_AT';

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
export type SuggestionStatus =
  | 'DUPLICATE'
  | 'PENDING'
  | 'REVIEWED';

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

export type SystemSettingCategory =
  | 'app'
  | 'auth'
  | 'billing'
  | 'cache'
  | 'communication'
  | 'email'
  | 'fx'
  | 'general'
  | 'meeting'
  | 'push'
  | 'redis'
  | 'scheduling'
  | 'security'
  | 'sms'
  | 'storage'
  | 'system';

export type SystemSettingDataType =
  | 'boolean'
  | 'integer'
  | 'json'
  | 'string';

export type SystemSettingUpsertInput = {
  category: SystemSettingCategory | null | undefined;
  dataType: SystemSettingDataType | null | undefined;
  description: string | null | undefined;
  key: string;
  value: string;
};

export type TeacherDueStatus =
  | 'PAID'
  | 'PENDING';

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

export type TeacherProgressFeedEventKind =
  | 'ACTIVATED'
  | 'AUTO_MISSED'
  | 'COMPLETED'
  | 'LEAVE'
  | 'MARKED_ABSENT'
  | 'OTHER'
  | 'STARTED';

export type UpdateManagerProfileInput = {
  hourlyRate: string | null | undefined;
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

export type UploadType =
  | 'SIGNED_URL'
  | 'VERCEL_BLOB_CLIENT';

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

export type MeQuery_me_User = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, permissions: Array<Types.AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: Types.CurrencyCode | null };

export type MeQuery_Query = { me: MeQuery_me_User | null };


export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = MeQuery_Query;

export type UserQuery_user_User = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, permissions: Array<Types.AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: Types.CurrencyCode | null };

export type UserQuery_Query = { user: UserQuery_user_User | null };


export type UserQueryVariables = Exact<{
  id: string;
}>;


export type UserQuery = UserQuery_Query;

export type UsersQuery_users_User = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, permissions: Array<Types.AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: Types.CurrencyCode | null };

export type UsersQuery_Query = { users: Array<UsersQuery_users_User> | null };


export type UsersQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
  offset: number | null | undefined;
}>;


export type UsersQuery = UsersQuery_Query;

export type LoginMutation_login_LoginResponse_user_User = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, permissions: Array<Types.AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: Types.CurrencyCode | null };

export type LoginMutation_login_LoginResponse = { token: string | null, user: LoginMutation_login_LoginResponse_user_User | null };

export type LoginMutation_Mutation = { login: LoginMutation_login_LoginResponse | null };


export type LoginMutationVariables = Exact<{
  input: Types.LoginInput;
}>;


export type LoginMutation = LoginMutation_Mutation;

export type DemoLoginMutation_demoLogin_LoginResponse_user_User = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, permissions: Array<Types.AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: Types.CurrencyCode | null };

export type DemoLoginMutation_demoLogin_LoginResponse = { token: string | null, user: DemoLoginMutation_demoLogin_LoginResponse_user_User | null };

export type DemoLoginMutation_Mutation = { demoLogin: DemoLoginMutation_demoLogin_LoginResponse | null };


export type DemoLoginMutationVariables = Exact<{
  input: Types.DemoLoginInput;
}>;


export type DemoLoginMutation = DemoLoginMutation_Mutation;

export type LogoutMutation_Mutation = { logout: boolean | null };


export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = LogoutMutation_Mutation;

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, permissions: Array<Types.AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: Types.CurrencyCode | null };

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse = { token: string | null, user: RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User | null };

export type RefreshTokenMutation_Mutation = { refreshToken: RefreshTokenMutation_refreshToken_RefreshTokenResponse | null };


export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = RefreshTokenMutation_Mutation;

export type ImpersonationStatusQuery_impersonationStatus_ImpersonationStatus_targetUser_User = { id: string | null, name: string | null, email: string | null };

export type ImpersonationStatusQuery_impersonationStatus_ImpersonationStatus_actorUser_User = { id: string | null, name: string | null, email: string | null };

export type ImpersonationStatusQuery_impersonationStatus_ImpersonationStatus = { isActive: boolean | null, startedAt: string | null, expiresAt: string | null, reason: string | null, targetUser: ImpersonationStatusQuery_impersonationStatus_ImpersonationStatus_targetUser_User | null, actorUser: ImpersonationStatusQuery_impersonationStatus_ImpersonationStatus_actorUser_User | null };

export type ImpersonationStatusQuery_Query = { impersonationStatus: ImpersonationStatusQuery_impersonationStatus_ImpersonationStatus | null };


export type ImpersonationStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type ImpersonationStatusQuery = ImpersonationStatusQuery_Query;

export type StartImpersonationMutation_startImpersonation_StartImpersonationResponse_targetUser_User = { id: string | null, name: string | null, email: string | null, permissions: Array<Types.AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, phone: string | null, status: Types.AccountStatus | null, displayCurrency: Types.CurrencyCode | null };

export type StartImpersonationMutation_startImpersonation_StartImpersonationResponse = { token: string | null, expiresAt: string | null, impersonationSessionId: string | null, targetUser: StartImpersonationMutation_startImpersonation_StartImpersonationResponse_targetUser_User | null };

export type StartImpersonationMutation_Mutation = { startImpersonation: StartImpersonationMutation_startImpersonation_StartImpersonationResponse | null };


export type StartImpersonationMutationVariables = Exact<{
  targetUserId: string;
  reason: string | null | undefined;
}>;


export type StartImpersonationMutation = StartImpersonationMutation_Mutation;

export type EndImpersonationMutation_endImpersonation_EndImpersonationResponse = { token: string | null };

export type EndImpersonationMutation_Mutation = { endImpersonation: EndImpersonationMutation_endImpersonation_EndImpersonationResponse | null };


export type EndImpersonationMutationVariables = Exact<{ [key: string]: never; }>;


export type EndImpersonationMutation = EndImpersonationMutation_Mutation;

export type PermissionGroupSimulationStatusQuery_permissionGroupSimulationStatus_PermissionGroupSimulationStatus = { isActive: boolean | null, groupSlug: string | null, groupName: string | null, startedAt: string | null, expiresAt: string | null };

export type PermissionGroupSimulationStatusQuery_Query = { permissionGroupSimulationStatus: PermissionGroupSimulationStatusQuery_permissionGroupSimulationStatus_PermissionGroupSimulationStatus | null };


export type PermissionGroupSimulationStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionGroupSimulationStatusQuery = PermissionGroupSimulationStatusQuery_Query;

export type SimulatablePermissionGroupsQuery_simulatablePermissionGroups_SimulatablePermissionGroup = { slug: string | null, name: string | null, description: string | null };

export type SimulatablePermissionGroupsQuery_Query = { simulatablePermissionGroups: Array<SimulatablePermissionGroupsQuery_simulatablePermissionGroups_SimulatablePermissionGroup> | null };


export type SimulatablePermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type SimulatablePermissionGroupsQuery = SimulatablePermissionGroupsQuery_Query;

export type StartPermissionGroupSimulationMutation_startPermissionGroupSimulation_StartPermissionGroupSimulationResponse = { token: string | null, expiresAt: string | null, groupSlug: string | null };

export type StartPermissionGroupSimulationMutation_Mutation = { startPermissionGroupSimulation: StartPermissionGroupSimulationMutation_startPermissionGroupSimulation_StartPermissionGroupSimulationResponse | null };


export type StartPermissionGroupSimulationMutationVariables = Exact<{
  groupSlug: string;
}>;


export type StartPermissionGroupSimulationMutation = StartPermissionGroupSimulationMutation_Mutation;

export type EndPermissionGroupSimulationMutation_endPermissionGroupSimulation_EndPermissionGroupSimulationResponse = { token: string | null };

export type EndPermissionGroupSimulationMutation_Mutation = { endPermissionGroupSimulation: EndPermissionGroupSimulationMutation_endPermissionGroupSimulation_EndPermissionGroupSimulationResponse | null };


export type EndPermissionGroupSimulationMutationVariables = Exact<{ [key: string]: never; }>;


export type EndPermissionGroupSimulationMutation = EndPermissionGroupSimulationMutation_Mutation;

export type ChangePasswordMutation_Mutation = { changePassword: boolean | null };


export type ChangePasswordMutationVariables = Exact<{
  input: Types.ChangePasswordInput;
}>;


export type ChangePasswordMutation = ChangePasswordMutation_Mutation;

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_overdueAmountsByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_overdueAmountsByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_overdueAmountsByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem_amountsByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem_amountsByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem_amountsByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem = { id: string | null, userId: string | null, userName: string | null, userEmail: string | null, totalUnpaidAmount: string | null, currency: Types.CurrencyCode | null, overdueCount: number | null, oldestDueDate: string | null, amountsByCurrency: Array<UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem_amountsByCurrency_BillingCurrencyTotal> | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary = { id: string | null, totalOverdueInvoices: number | null, totalOverdueAmount: string | null, overdueAmountsByCurrency: Array<UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_overdueAmountsByCurrency_BillingCurrencyTotal> | null, items: Array<UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem> | null };

export type UnpaidInvoicesAlertQuery_Query = { unpaidInvoicesAlert: UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary | null };


export type UnpaidInvoicesAlertQueryVariables = Exact<{ [key: string]: never; }>;


export type UnpaidInvoicesAlertQuery = UnpaidInvoicesAlertQuery_Query;

export type CreateManualInvoiceMutation_createManualInvoice_ManualInvoiceResult_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type CreateManualInvoiceMutation_createManualInvoice_ManualInvoiceResult = { id: string | null, parentId: string | null, studentId: string | null, amount: string | null, currency: Types.CurrencyCode | null, status: Types.InvoiceStatus | null, invoiceType: Types.InvoiceType | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, version: number | null, createdAt: string | null, displayAmount: CreateManualInvoiceMutation_createManualInvoice_ManualInvoiceResult_displayAmount_DisplayAmount | null };

export type CreateManualInvoiceMutation_Mutation = { createManualInvoice: CreateManualInvoiceMutation_createManualInvoice_ManualInvoiceResult | null };


export type CreateManualInvoiceMutationVariables = Exact<{
  parentId: string;
  studentId: string | null | undefined;
  amount: string;
  currency: Types.CurrencyCode;
  invoiceType: Types.InvoiceType;
  issueDate: string;
  dueDate: string;
  exchangeRateSnapshot: string | null | undefined;
  exchangeRateSource: string | null | undefined;
  billingMonths: Array<Types.BillingMonthInput> | Types.BillingMonthInput | null | undefined;
  sendEmail: boolean | null | undefined;
}>;


export type CreateManualInvoiceMutation = CreateManualInvoiceMutation_Mutation;

export type MarkInvoicePaidMutation_markInvoicePaid_MarkInvoicePaidResult = { id: string | null, parentId: string | null, status: Types.InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type MarkInvoicePaidMutation_Mutation = { markInvoicePaid: MarkInvoicePaidMutation_markInvoicePaid_MarkInvoicePaidResult | null };


export type MarkInvoicePaidMutationVariables = Exact<{
  invoiceId: string;
  proofFileId: string | number;
  expectedVersion: number | null | undefined;
}>;


export type MarkInvoicePaidMutation = MarkInvoicePaidMutation_Mutation;

export type SubmitPaymentProofMutation_submitPaymentProof_MarkInvoicePaidResult = { id: string | null, parentId: string | null, status: Types.InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type SubmitPaymentProofMutation_Mutation = { submitPaymentProof: SubmitPaymentProofMutation_submitPaymentProof_MarkInvoicePaidResult | null };


export type SubmitPaymentProofMutationVariables = Exact<{
  invoiceId: string;
  proofFileId: string | number;
  expectedVersion: number | null | undefined;
}>;


export type SubmitPaymentProofMutation = SubmitPaymentProofMutation_Mutation;

export type ApprovePaymentProofMutation_approvePaymentProof_MarkInvoicePaidResult = { id: string | null, parentId: string | null, status: Types.InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type ApprovePaymentProofMutation_Mutation = { approvePaymentProof: ApprovePaymentProofMutation_approvePaymentProof_MarkInvoicePaidResult | null };


export type ApprovePaymentProofMutationVariables = Exact<{
  invoiceId: string;
  expectedVersion: number | null | undefined;
}>;


export type ApprovePaymentProofMutation = ApprovePaymentProofMutation_Mutation;

export type RejectPaymentProofMutation_rejectPaymentProof_MarkInvoicePaidResult = { id: string | null, parentId: string | null, status: Types.InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type RejectPaymentProofMutation_Mutation = { rejectPaymentProof: RejectPaymentProofMutation_rejectPaymentProof_MarkInvoicePaidResult | null };


export type RejectPaymentProofMutationVariables = Exact<{
  invoiceId: string;
  rejectionReason: string | null | undefined;
  expectedVersion: number | null | undefined;
}>;


export type RejectPaymentProofMutation = RejectPaymentProofMutation_Mutation;

export type InvoicePaymentSubmissionQuery_invoicePaymentSubmission_InvoicePaymentSubmission = { id: string | null, invoiceId: string | null, fileId: string | null, filePath: string | null, mimeType: string | null, status: Types.InvoicePaymentSubmissionStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null };

export type InvoicePaymentSubmissionQuery_Query = { invoicePaymentSubmission: InvoicePaymentSubmissionQuery_invoicePaymentSubmission_InvoicePaymentSubmission | null };


export type InvoicePaymentSubmissionQueryVariables = Exact<{
  invoiceId: string;
}>;


export type InvoicePaymentSubmissionQuery = InvoicePaymentSubmissionQuery_Query;

export type DeleteInvoiceMutation_deleteInvoice_DeleteInvoiceResult = { id: string | null, parentId: string | null, version: number | null, notificationSummaryUpdated: boolean | null };

export type DeleteInvoiceMutation_Mutation = { deleteInvoice: DeleteInvoiceMutation_deleteInvoice_DeleteInvoiceResult | null };


export type DeleteInvoiceMutationVariables = Exact<{
  invoiceId: string;
}>;


export type DeleteInvoiceMutation = DeleteInvoiceMutation_Mutation;

export type SendPaymentReminderMutation_sendPaymentReminder_SendPaymentReminderResult = { id: string | null, success: boolean | null };

export type SendPaymentReminderMutation_Mutation = { sendPaymentReminder: SendPaymentReminderMutation_sendPaymentReminder_SendPaymentReminderResult | null };


export type SendPaymentReminderMutationVariables = Exact<{
  studentId: string;
}>;


export type SendPaymentReminderMutation = SendPaymentReminderMutation_Mutation;

export type InvoicePaymentsQuery_invoicePayments_Payment_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_details_PaymentMethodDetails = { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null };

export type InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_catalog_PaymentMethodCatalogSnapshot = { catalogId: string | null, catalogSlug: string | null, catalogName: Partial<Record<'ar' | 'en', string>> | null };

export type InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot = { userPaymentMethodId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_details_PaymentMethodDetails | null, catalog: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_catalog_PaymentMethodCatalogSnapshot | null };

export type InvoicePaymentsQuery_invoicePayments_Payment = { id: string | null, invoiceId: string | null, amount: string | null, currency: Types.CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: Types.PaymentMethodType | null, transactionId: string | null, createdAt: string | null, displayAmount: InvoicePaymentsQuery_invoicePayments_Payment_displayAmount_DisplayAmount | null, paymentMethodSnapshot: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot | null };

export type InvoicePaymentsQuery_Query = { invoicePayments: Array<InvoicePaymentsQuery_invoicePayments_Payment> | null };


export type InvoicePaymentsQueryVariables = Exact<{
  invoiceId: string | number;
}>;


export type InvoicePaymentsQuery = InvoicePaymentsQuery_Query;

export type RecordPaymentMutation_recordPayment_Payment_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type RecordPaymentMutation_recordPayment_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot = { userPaymentMethodId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_details_PaymentMethodDetails | null, catalog: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_catalog_PaymentMethodCatalogSnapshot | null };

export type RecordPaymentMutation_recordPayment_Payment = { id: string | null, invoiceId: string | null, amount: string | null, currency: Types.CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: Types.PaymentMethodType | null, displayAmount: RecordPaymentMutation_recordPayment_Payment_displayAmount_DisplayAmount | null, paymentMethodSnapshot: RecordPaymentMutation_recordPayment_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot | null };

export type RecordPaymentMutation_Mutation = { recordPayment: RecordPaymentMutation_recordPayment_Payment | null };


export type RecordPaymentMutationVariables = Exact<{
  invoiceId: string | number;
  amount: string;
  currency: Types.CurrencyCode;
  userPaymentMethodId: string | number;
  transactionId: string | null | undefined;
}>;


export type RecordPaymentMutation = RecordPaymentMutation_Mutation;

export type CreateTeacherPaymentMutation_createTeacherPayment_TeacherPayment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot = { userPaymentMethodId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_details_PaymentMethodDetails | null, catalog: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_catalog_PaymentMethodCatalogSnapshot | null };

export type CreateTeacherPaymentMutation_createTeacherPayment_TeacherPayment = { id: string | null, teacherId: string | null, amount: string | null, currency: Types.CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: Types.PaymentMethodType | null, isTestPayment: boolean | null, paymentMethodSnapshot: CreateTeacherPaymentMutation_createTeacherPayment_TeacherPayment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot | null };

export type CreateTeacherPaymentMutation_Mutation = { createTeacherPayment: CreateTeacherPaymentMutation_createTeacherPayment_TeacherPayment | null };


export type CreateTeacherPaymentMutationVariables = Exact<{
  teacherId: string | number;
  amount: string;
  currency: Types.CurrencyCode;
  userPaymentMethodId: string | number;
  paymentDate: string | null | undefined;
  isTestPayment: boolean | null | undefined;
}>;


export type CreateTeacherPaymentMutation = CreateTeacherPaymentMutation_Mutation;

export type StudentCreditBalanceQuery_studentCreditBalance_CreditBalance = { studentId: string | null, classesRemaining: number | null, classesTotal: number | null };

export type StudentCreditBalanceQuery_Query = { studentCreditBalance: StudentCreditBalanceQuery_studentCreditBalance_CreditBalance | null };


export type StudentCreditBalanceQueryVariables = Exact<{
  studentId: string | number;
}>;


export type StudentCreditBalanceQuery = StudentCreditBalanceQuery_Query;

export type StudentCreditTransactionsQuery_studentCreditTransactions_CreditTransaction = { id: string | null, studentId: string | null, changeAmount: number | null, reason: Types.CreditReason | null, sourcePaymentId: string | null, classInstanceId: string | null, notes: string | null, creditedByUserId: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentCreditTransactionsQuery_Query = { studentCreditTransactions: Array<StudentCreditTransactionsQuery_studentCreditTransactions_CreditTransaction> | null };


export type StudentCreditTransactionsQueryVariables = Exact<{
  studentId: string | number;
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type StudentCreditTransactionsQuery = StudentCreditTransactionsQuery_Query;

export type RecordCreditPurchaseMutation_recordCreditPurchase_CreditPurchaseResult = { id: string | null, studentId: string | null, changeAmount: number | null, reason: Types.CreditReason | null, sourcePaymentId: string | null, classInstanceId: string | null, notes: string | null, creditedByUserId: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type RecordCreditPurchaseMutation_Mutation = { recordCreditPurchase: RecordCreditPurchaseMutation_recordCreditPurchase_CreditPurchaseResult | null };


export type RecordCreditPurchaseMutationVariables = Exact<{
  studentId: string | number;
  hours: number;
  notes: string | null | undefined;
}>;


export type RecordCreditPurchaseMutation = RecordCreditPurchaseMutation_Mutation;

export type SupportedCurrencyFieldsFragment = { code: Types.CurrencyCode | null, symbol: string | null, countryCode: Types.CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null };

export type SupportedCurrenciesQuery_supportedCurrencies_SupportedCurrency = { code: Types.CurrencyCode | null, symbol: string | null, countryCode: Types.CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null };

export type SupportedCurrenciesQuery_Query = { supportedCurrencies: Array<SupportedCurrenciesQuery_supportedCurrencies_SupportedCurrency> | null };


export type SupportedCurrenciesQueryVariables = Exact<{
  activeOnly: boolean | null | undefined;
}>;


export type SupportedCurrenciesQuery = SupportedCurrenciesQuery_Query;

export type ActivateSupportedCurrencyMutation_activateSupportedCurrency_SupportedCurrency = { code: Types.CurrencyCode | null, symbol: string | null, countryCode: Types.CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null };

export type ActivateSupportedCurrencyMutation_Mutation = { activateSupportedCurrency: ActivateSupportedCurrencyMutation_activateSupportedCurrency_SupportedCurrency | null };


export type ActivateSupportedCurrencyMutationVariables = Exact<{
  input: Types.SupportedCurrencyUpsertInput;
}>;


export type ActivateSupportedCurrencyMutation = ActivateSupportedCurrencyMutation_Mutation;

export type DeactivateSupportedCurrencyMutation_Mutation = { deactivateSupportedCurrency: boolean | null };


export type DeactivateSupportedCurrencyMutationVariables = Exact<{
  code: Types.CurrencyCode;
}>;


export type DeactivateSupportedCurrencyMutation = DeactivateSupportedCurrencyMutation_Mutation;

export type LatestExchangeRatesQuery_latestExchangeRates_ExchangeRate = { id: string | null, fromCurrency: string | null, toCurrency: string | null, rate: string | null, source: string | null, effectiveDate: string | null };

export type LatestExchangeRatesQuery_Query = { latestExchangeRates: Array<LatestExchangeRatesQuery_latestExchangeRates_ExchangeRate> | null };


export type LatestExchangeRatesQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type LatestExchangeRatesQuery = LatestExchangeRatesQuery_Query;

export type ExchangeRateHistoryQuery_exchangeRateHistory_ExchangeRateHistoryResult_rows_ExchangeRateHistoryRow = { id: string | null, fromCurrency: Types.CurrencyCode | null, toCurrency: Types.CurrencyCode | null, rate: string | null, source: string | null, effectiveDate: string | null };

export type ExchangeRateHistoryQuery_exchangeRateHistory_ExchangeRateHistoryResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, lastItem: number | null, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type ExchangeRateHistoryQuery_exchangeRateHistory_ExchangeRateHistoryResult = { id: string | null, totalCount: number | null, rows: Array<ExchangeRateHistoryQuery_exchangeRateHistory_ExchangeRateHistoryResult_rows_ExchangeRateHistoryRow> | null, pageInfo: ExchangeRateHistoryQuery_exchangeRateHistory_ExchangeRateHistoryResult_pageInfo_PageInfo | null };

export type ExchangeRateHistoryQuery_Query = { exchangeRateHistory: ExchangeRateHistoryQuery_exchangeRateHistory_ExchangeRateHistoryResult | null };


export type ExchangeRateHistoryQueryVariables = Exact<{
  from: Types.CurrencyCode;
  to: Types.CurrencyCode;
  paginationArgs: Types.PaginationArgs | null | undefined;
  maxDays: number | null | undefined;
}>;


export type ExchangeRateHistoryQuery = ExchangeRateHistoryQuery_Query;

export type LatestFxSyncRunQuery_latestFxSyncRun_FxSyncRun = { id: string | null, provider: Types.FxProvider | null, status: Types.FxSyncStatus | null, pairsWritten: string | null, pairsFailed: string | null, errorMessage: string | null, triggerType: string | null, triggeredByUserId: string | null, startedAt: string | null, finishedAt: string | null };

export type LatestFxSyncRunQuery_Query = { latestFxSyncRun: LatestFxSyncRunQuery_latestFxSyncRun_FxSyncRun | null };


export type LatestFxSyncRunQueryVariables = Exact<{ [key: string]: never; }>;


export type LatestFxSyncRunQuery = LatestFxSyncRunQuery_Query;

export type RefreshExchangeRatesMutation_refreshExchangeRates_RefreshExchangeRatesResult = { id: string | null, success: boolean | null, pairsWritten: number | null, pairsFailed: number | null, syncRunId: string | null, errorMessage: string | null };

export type RefreshExchangeRatesMutation_Mutation = { refreshExchangeRates: RefreshExchangeRatesMutation_refreshExchangeRates_RefreshExchangeRatesResult | null };


export type RefreshExchangeRatesMutationVariables = Exact<{
  force: boolean | null | undefined;
}>;


export type RefreshExchangeRatesMutation = RefreshExchangeRatesMutation_Mutation;

export type FxSyncHealthQuery_fxSyncHealth_FxSyncHealth = { id: string | null, isStale: boolean | null, status: Types.FxSyncStatus | null, finishedAt: string | null };

export type FxSyncHealthQuery_Query = { fxSyncHealth: FxSyncHealthQuery_fxSyncHealth_FxSyncHealth | null };


export type FxSyncHealthQueryVariables = Exact<{ [key: string]: never; }>;


export type FxSyncHealthQuery = FxSyncHealthQuery_Query;

export type FxProviderConfigQuery_fxProviderConfig_FxProviderConfig = { id: string | null, activeProvider: Types.FxProvider | null, source: Types.FxProviderConfigSource | null, updatedAt: string | null, updatedByUserId: string | null, updatedByName: string | null };

export type FxProviderConfigQuery_Query = { fxProviderConfig: FxProviderConfigQuery_fxProviderConfig_FxProviderConfig | null };


export type FxProviderConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type FxProviderConfigQuery = FxProviderConfigQuery_Query;

export type UpdateFxProviderMutation_updateFxProvider_FxProviderConfig = { id: string | null, activeProvider: Types.FxProvider | null, source: Types.FxProviderConfigSource | null, updatedAt: string | null, updatedByUserId: string | null, updatedByName: string | null };

export type UpdateFxProviderMutation_Mutation = { updateFxProvider: UpdateFxProviderMutation_updateFxProvider_FxProviderConfig | null };


export type UpdateFxProviderMutationVariables = Exact<{
  provider: Types.FxProvider;
}>;


export type UpdateFxProviderMutation = UpdateFxProviderMutation_Mutation;

export type UpsertManualExchangeRateMutation_upsertManualExchangeRate_UpsertManualExchangeRateResult_rate_ExchangeRate = { id: string | null, fromCurrency: string | null, toCurrency: string | null, rate: string | null, source: string | null, effectiveDate: string | null };

export type UpsertManualExchangeRateMutation_upsertManualExchangeRate_UpsertManualExchangeRateResult = { id: string | null, rate: UpsertManualExchangeRateMutation_upsertManualExchangeRate_UpsertManualExchangeRateResult_rate_ExchangeRate | null };

export type UpsertManualExchangeRateMutation_Mutation = { upsertManualExchangeRate: UpsertManualExchangeRateMutation_upsertManualExchangeRate_UpsertManualExchangeRateResult | null };


export type UpsertManualExchangeRateMutationVariables = Exact<{
  fromCurrency: Types.CurrencyCode;
  toCurrency: Types.CurrencyCode;
  rate: string;
  effectiveDate: string | null | undefined;
}>;


export type UpsertManualExchangeRateMutation = UpsertManualExchangeRateMutation_Mutation;

export type CurrencyHedgesQuery_currencyHedges_CurrencyHedge = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null };

export type CurrencyHedgesQuery_Query = { currencyHedges: Array<CurrencyHedgesQuery_currencyHedges_CurrencyHedge> | null };


export type CurrencyHedgesQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrencyHedgesQuery = CurrencyHedgesQuery_Query;

export type CreateCurrencyHedgeMutation_createCurrencyHedge_CurrencyHedge = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null };

export type CreateCurrencyHedgeMutation_Mutation = { createCurrencyHedge: CreateCurrencyHedgeMutation_createCurrencyHedge_CurrencyHedge | null };


export type CreateCurrencyHedgeMutationVariables = Exact<{
  currency: Types.CurrencyCode;
  amount: string;
  hedgeType: string;
  notes: string | null | undefined;
}>;


export type CreateCurrencyHedgeMutation = CreateCurrencyHedgeMutation_Mutation;

export type UpdateCurrencyHedgeMutation_updateCurrencyHedge_CurrencyHedge = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null };

export type UpdateCurrencyHedgeMutation_Mutation = { updateCurrencyHedge: UpdateCurrencyHedgeMutation_updateCurrencyHedge_CurrencyHedge | null };


export type UpdateCurrencyHedgeMutationVariables = Exact<{
  id: string;
  currency: Types.CurrencyCode | null | undefined;
  amount: string | null | undefined;
  hedgeType: string | null | undefined;
  notes: string | null | undefined;
}>;


export type UpdateCurrencyHedgeMutation = UpdateCurrencyHedgeMutation_Mutation;

export type DeleteCurrencyHedgeMutation_Mutation = { deleteCurrencyHedge: boolean | null };


export type DeleteCurrencyHedgeMutationVariables = Exact<{
  id: string;
}>;


export type DeleteCurrencyHedgeMutation = DeleteCurrencyHedgeMutation_Mutation;

export type PaymentMethodDetailsFieldsFragment = { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null };

export type PaymentMethodTransactionSnapshotFieldsFragment = { userPaymentMethodId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_details_PaymentMethodDetails | null, catalog: InvoicePaymentsQuery_invoicePayments_Payment_paymentMethodSnapshot_PaymentMethodTransactionSnapshot_catalog_PaymentMethodCatalogSnapshot | null };

export type UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails = { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null };

export type UserPaymentMethodFieldsFragment = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payinDefault_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payoutDefault_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type PaymentMethodDefaultsFieldsFragment = { payinDefault: PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payinDefault_UserPaymentMethod | null, payoutDefault: PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payoutDefault_UserPaymentMethod | null };

export type SupportedMobileWalletFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedPaymentLinkFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedOnlineAccountFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: Types.IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UserPaymentMethodsQuery_userPaymentMethods_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type UserPaymentMethodsQuery_Query = { userPaymentMethods: Array<UserPaymentMethodsQuery_userPaymentMethods_UserPaymentMethod> | null };


export type UserPaymentMethodsQueryVariables = Exact<{
  userId: string | number;
  direction: Types.PaymentDirection | null | undefined;
}>;


export type UserPaymentMethodsQuery = UserPaymentMethodsQuery_Query;

export type UserPaymentMethodQuery_userPaymentMethod_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type UserPaymentMethodQuery_Query = { userPaymentMethod: UserPaymentMethodQuery_userPaymentMethod_UserPaymentMethod | null };


export type UserPaymentMethodQueryVariables = Exact<{
  id: string | number;
}>;


export type UserPaymentMethodQuery = UserPaymentMethodQuery_Query;

export type SupportedMobileWalletsQuery_supportedMobileWallets_SupportedMobileWallet = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedMobileWalletsQuery_Query = { supportedMobileWallets: Array<SupportedMobileWalletsQuery_supportedMobileWallets_SupportedMobileWallet> | null };


export type SupportedMobileWalletsQueryVariables = Exact<{
  countryCode: Types.CountryCode | null | undefined;
  direction: Types.PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;


export type SupportedMobileWalletsQuery = SupportedMobileWalletsQuery_Query;

export type SupportedPaymentLinksQuery_supportedPaymentLinks_SupportedPaymentLink = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedPaymentLinksQuery_Query = { supportedPaymentLinks: Array<SupportedPaymentLinksQuery_supportedPaymentLinks_SupportedPaymentLink> | null };


export type SupportedPaymentLinksQueryVariables = Exact<{
  direction: Types.PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;


export type SupportedPaymentLinksQuery = SupportedPaymentLinksQuery_Query;

export type SupportedOnlineAccountsQuery_supportedOnlineAccounts_SupportedOnlineAccount = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: Types.IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedOnlineAccountsQuery_Query = { supportedOnlineAccounts: Array<SupportedOnlineAccountsQuery_supportedOnlineAccounts_SupportedOnlineAccount> | null };


export type SupportedOnlineAccountsQueryVariables = Exact<{
  direction: Types.PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;


export type SupportedOnlineAccountsQuery = SupportedOnlineAccountsQuery_Query;

export type CreateUserPaymentMethodMutation_createUserPaymentMethod_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type CreateUserPaymentMethodMutation_Mutation = { createUserPaymentMethod: CreateUserPaymentMethodMutation_createUserPaymentMethod_UserPaymentMethod | null };


export type CreateUserPaymentMethodMutationVariables = Exact<{
  input: Types.UserPaymentMethodCreateInput;
}>;


export type CreateUserPaymentMethodMutation = CreateUserPaymentMethodMutation_Mutation;

export type UpdateUserPaymentMethodMutation_updateUserPaymentMethod_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type UpdateUserPaymentMethodMutation_Mutation = { updateUserPaymentMethod: UpdateUserPaymentMethodMutation_updateUserPaymentMethod_UserPaymentMethod | null };


export type UpdateUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
  input: Types.UserPaymentMethodUpdateInput;
}>;


export type UpdateUserPaymentMethodMutation = UpdateUserPaymentMethodMutation_Mutation;

export type DeleteUserPaymentMethodMutation_Mutation = { deleteUserPaymentMethod: boolean | null };


export type DeleteUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteUserPaymentMethodMutation = DeleteUserPaymentMethodMutation_Mutation;

export type SetDefaultUserPaymentMethodMutation_setDefaultUserPaymentMethod_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type SetDefaultUserPaymentMethodMutation_Mutation = { setDefaultUserPaymentMethod: SetDefaultUserPaymentMethodMutation_setDefaultUserPaymentMethod_UserPaymentMethod | null };


export type SetDefaultUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;


export type SetDefaultUserPaymentMethodMutation = SetDefaultUserPaymentMethodMutation_Mutation;

export type VerifyBankTransferPaymentMethodMutation_verifyBankTransferPaymentMethod_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type VerifyBankTransferPaymentMethodMutation_Mutation = { verifyBankTransferPaymentMethod: VerifyBankTransferPaymentMethodMutation_verifyBankTransferPaymentMethod_UserPaymentMethod | null };


export type VerifyBankTransferPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;


export type VerifyBankTransferPaymentMethodMutation = VerifyBankTransferPaymentMethodMutation_Mutation;

export type CreateSupportedMobileWalletMutation_createSupportedMobileWallet_SupportedMobileWallet = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type CreateSupportedMobileWalletMutation_Mutation = { createSupportedMobileWallet: CreateSupportedMobileWalletMutation_createSupportedMobileWallet_SupportedMobileWallet | null };


export type CreateSupportedMobileWalletMutationVariables = Exact<{
  input: Types.SupportedMobileWalletCreateInput;
}>;


export type CreateSupportedMobileWalletMutation = CreateSupportedMobileWalletMutation_Mutation;

export type UpdateSupportedMobileWalletMutation_updateSupportedMobileWallet_SupportedMobileWallet = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSupportedMobileWalletMutation_Mutation = { updateSupportedMobileWallet: UpdateSupportedMobileWalletMutation_updateSupportedMobileWallet_SupportedMobileWallet | null };


export type UpdateSupportedMobileWalletMutationVariables = Exact<{
  id: string | number;
  input: Types.SupportedMobileWalletUpdateInput;
}>;


export type UpdateSupportedMobileWalletMutation = UpdateSupportedMobileWalletMutation_Mutation;

export type DeactivateSupportedMobileWalletMutation_deactivateSupportedMobileWallet_SupportedMobileWallet = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type DeactivateSupportedMobileWalletMutation_Mutation = { deactivateSupportedMobileWallet: DeactivateSupportedMobileWalletMutation_deactivateSupportedMobileWallet_SupportedMobileWallet | null };


export type DeactivateSupportedMobileWalletMutationVariables = Exact<{
  id: string | number;
}>;


export type DeactivateSupportedMobileWalletMutation = DeactivateSupportedMobileWalletMutation_Mutation;

export type CreateSupportedPaymentLinkMutation_createSupportedPaymentLink_SupportedPaymentLink = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type CreateSupportedPaymentLinkMutation_Mutation = { createSupportedPaymentLink: CreateSupportedPaymentLinkMutation_createSupportedPaymentLink_SupportedPaymentLink | null };


export type CreateSupportedPaymentLinkMutationVariables = Exact<{
  input: Types.SupportedPaymentLinkCreateInput;
}>;


export type CreateSupportedPaymentLinkMutation = CreateSupportedPaymentLinkMutation_Mutation;

export type UpdateSupportedPaymentLinkMutation_updateSupportedPaymentLink_SupportedPaymentLink = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSupportedPaymentLinkMutation_Mutation = { updateSupportedPaymentLink: UpdateSupportedPaymentLinkMutation_updateSupportedPaymentLink_SupportedPaymentLink | null };


export type UpdateSupportedPaymentLinkMutationVariables = Exact<{
  id: string | number;
  input: Types.SupportedPaymentLinkUpdateInput;
}>;


export type UpdateSupportedPaymentLinkMutation = UpdateSupportedPaymentLinkMutation_Mutation;

export type DeactivateSupportedPaymentLinkMutation_deactivateSupportedPaymentLink_SupportedPaymentLink = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type DeactivateSupportedPaymentLinkMutation_Mutation = { deactivateSupportedPaymentLink: DeactivateSupportedPaymentLinkMutation_deactivateSupportedPaymentLink_SupportedPaymentLink | null };


export type DeactivateSupportedPaymentLinkMutationVariables = Exact<{
  id: string | number;
}>;


export type DeactivateSupportedPaymentLinkMutation = DeactivateSupportedPaymentLinkMutation_Mutation;

export type CreateSupportedOnlineAccountMutation_createSupportedOnlineAccount_SupportedOnlineAccount = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: Types.IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type CreateSupportedOnlineAccountMutation_Mutation = { createSupportedOnlineAccount: CreateSupportedOnlineAccountMutation_createSupportedOnlineAccount_SupportedOnlineAccount | null };


export type CreateSupportedOnlineAccountMutationVariables = Exact<{
  input: Types.SupportedOnlineAccountCreateInput;
}>;


export type CreateSupportedOnlineAccountMutation = CreateSupportedOnlineAccountMutation_Mutation;

export type UpdateSupportedOnlineAccountMutation_updateSupportedOnlineAccount_SupportedOnlineAccount = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: Types.IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSupportedOnlineAccountMutation_Mutation = { updateSupportedOnlineAccount: UpdateSupportedOnlineAccountMutation_updateSupportedOnlineAccount_SupportedOnlineAccount | null };


export type UpdateSupportedOnlineAccountMutationVariables = Exact<{
  id: string | number;
  input: Types.SupportedOnlineAccountUpdateInput;
}>;


export type UpdateSupportedOnlineAccountMutation = UpdateSupportedOnlineAccountMutation_Mutation;

export type DeactivateSupportedOnlineAccountMutation_deactivateSupportedOnlineAccount_SupportedOnlineAccount = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: Types.IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: Types.PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type DeactivateSupportedOnlineAccountMutation_Mutation = { deactivateSupportedOnlineAccount: DeactivateSupportedOnlineAccountMutation_deactivateSupportedOnlineAccount_SupportedOnlineAccount | null };


export type DeactivateSupportedOnlineAccountMutationVariables = Exact<{
  id: string | number;
}>;


export type DeactivateSupportedOnlineAccountMutation = DeactivateSupportedOnlineAccountMutation_Mutation;

export type QuotaFieldsFragment = { id: string | null, studentId: string | null, name: string | null, kind: Types.QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: Types.QuotaStatus | null, periodType: Types.QuotaPeriodType | null, periodDays: number | null, priority: number | null, version: number | null, createdAt: string | null, updatedAt: string | null };

export type QuotaQuery_quota_Quota = { id: string | null, studentId: string | null, name: string | null, kind: Types.QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: Types.QuotaStatus | null, periodType: Types.QuotaPeriodType | null, periodDays: number | null, priority: number | null, version: number | null, createdAt: string | null, updatedAt: string | null };

export type QuotaQuery_Query = { quota: QuotaQuery_quota_Quota | null };


export type QuotaQueryVariables = Exact<{
  id: string | number;
}>;


export type QuotaQuery = QuotaQuery_Query;

export type QuotasQuery_quotas_QuotaPaginatedResult_rows_Quota = { id: string | null, studentId: string | null, name: string | null, kind: Types.QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: Types.QuotaStatus | null, periodType: Types.QuotaPeriodType | null, periodDays: number | null, priority: number | null, version: number | null, createdAt: string | null, updatedAt: string | null };

export type QuotasQuery_quotas_QuotaPaginatedResult = { totalCount: number | null, rows: Array<QuotasQuery_quotas_QuotaPaginatedResult_rows_Quota> | null };

export type QuotasQuery_Query = { quotas: QuotasQuery_quotas_QuotaPaginatedResult | null };


export type QuotasQueryVariables = Exact<{
  filter: Types.QuotaPaginatedFilterInput | null | undefined;
  pagination: Types.PaginationArgs | null | undefined;
}>;


export type QuotasQuery = QuotasQuery_Query;

export type QuotaLedgerQuery_quotaLedger_QuotaLedgerPaginatedResult_rows_QuotaLedger = { id: string | null, quotaId: string | null, studentId: string | null, recurringScheduleId: string | null, classInstanceId: string | null, delta: number | null, reason: Types.QuotaLedgerReason | null, reasonNote: string | null, actorUserId: string | null, createdAt: string | null };

export type QuotaLedgerQuery_quotaLedger_QuotaLedgerPaginatedResult = { totalCount: number | null, rows: Array<QuotaLedgerQuery_quotaLedger_QuotaLedgerPaginatedResult_rows_QuotaLedger> | null };

export type QuotaLedgerQuery_Query = { quotaLedger: QuotaLedgerQuery_quotaLedger_QuotaLedgerPaginatedResult | null };


export type QuotaLedgerQueryVariables = Exact<{
  quotaId: string | number;
  pagination: Types.PaginationArgs | null | undefined;
}>;


export type QuotaLedgerQuery = QuotaLedgerQuery_Query;

export type CreateQuotaMutation_createQuota_Quota = { id: string | null, studentId: string | null, name: string | null, kind: Types.QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: Types.QuotaStatus | null, periodType: Types.QuotaPeriodType | null, periodDays: number | null, priority: number | null, version: number | null, createdAt: string | null, updatedAt: string | null };

export type CreateQuotaMutation_Mutation = { createQuota: CreateQuotaMutation_createQuota_Quota | null };


export type CreateQuotaMutationVariables = Exact<{
  input: Types.QuotaSubmitInput;
}>;


export type CreateQuotaMutation = CreateQuotaMutation_Mutation;

export type UpdateQuotaMutation_updateQuota_Quota = { id: string | null, studentId: string | null, name: string | null, kind: Types.QuotaKind | null, totalClasses: number | null, remaining: number | null, reservedClasses: number | null, validFrom: string | null, validUntil: string | null, status: Types.QuotaStatus | null, periodType: Types.QuotaPeriodType | null, periodDays: number | null, priority: number | null, version: number | null, createdAt: string | null, updatedAt: string | null };

export type UpdateQuotaMutation_Mutation = { updateQuota: UpdateQuotaMutation_updateQuota_Quota | null };


export type UpdateQuotaMutationVariables = Exact<{
  id: string | number;
  input: Types.QuotaUpdateInput;
}>;


export type UpdateQuotaMutation = UpdateQuotaMutation_Mutation;

export type DeleteQuotaMutation_deleteQuota_Quota = { id: string | null, studentId: string | null, name: string | null, kind: Types.QuotaKind | null, status: Types.QuotaStatus | null };

export type DeleteQuotaMutation_Mutation = { deleteQuota: DeleteQuotaMutation_deleteQuota_Quota | null };


export type DeleteQuotaMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteQuotaMutation = DeleteQuotaMutation_Mutation;

export type UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_nextUnpaidInvoice_NextUnpaidInvoiceSummary = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, dueDate: string | null, studentName: string | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary = { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null, pendingPaymentCount: number | null, nextUnpaidInvoice: UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_nextUnpaidInvoice_NextUnpaidInvoiceSummary | null, outstandingByCurrency: Array<UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal> | null, paidThisTermByCurrency: Array<UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal> | null };

export type UserBillingProfileSummaryQuery_Query = { parentBillingSummary: UserBillingProfileSummaryQuery_parentBillingSummary_ParentBillingSummary | null };


export type UserBillingProfileSummaryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
}>;


export type UserBillingProfileSummaryQuery = UserBillingProfileSummaryQuery_Query;

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow = { id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: Types.CurrencyCode | null, status: Types.InvoiceStatus | null, invoiceType: Types.InvoiceType | null, studentId: string | null, studentName: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow_displayAmount_DisplayAmount | null };

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult = { id: string | null, totalCount: number | null, rows: Array<UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow> | null, pageInfo: UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_pageInfo_PageInfo | null };

export type UserBillingProfileInvoiceHistoryQuery_Query = { parentInvoiceHistory: UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult | null };


export type UserBillingProfileInvoiceHistoryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
  paginationArgs: Types.PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;


export type UserBillingProfileInvoiceHistoryQuery = UserBillingProfileInvoiceHistoryQuery_Query;

export type ClassCategoryFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type ClassCategoriesQuery_classCategories_ClassCategory = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type ClassCategoriesQuery_Query = { classCategories: Array<ClassCategoriesQuery_classCategories_ClassCategory> | null };


export type ClassCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type ClassCategoriesQuery = ClassCategoriesQuery_Query;

export type CreateClassCategoryMutation_createClassCategory_ClassCategory = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type CreateClassCategoryMutation_Mutation = { createClassCategory: CreateClassCategoryMutation_createClassCategory_ClassCategory | null };


export type CreateClassCategoryMutationVariables = Exact<{
  input: Types.ClassCategoryCreateInput;
}>;


export type CreateClassCategoryMutation = CreateClassCategoryMutation_Mutation;

export type UpdateClassCategoryMutation_updateClassCategory_ClassCategory = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type UpdateClassCategoryMutation_Mutation = { updateClassCategory: UpdateClassCategoryMutation_updateClassCategory_ClassCategory | null };


export type UpdateClassCategoryMutationVariables = Exact<{
  id: string | number;
  input: Types.ClassCategoryUpdateInput;
}>;


export type UpdateClassCategoryMutation = UpdateClassCategoryMutation_Mutation;

export type DeleteClassCategoryMutation_Mutation = { deleteClassCategory: boolean | null };


export type DeleteClassCategoryMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteClassCategoryMutation = DeleteClassCategoryMutation_Mutation;

export type ClassSubjectFieldsFragment_ClassSubject_category_ClassCategory = { id: string | null, name: string | null, slug: string | null };

export type ClassSubjectFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, category: ClassSubjectFieldsFragment_ClassSubject_category_ClassCategory | null };

export type SubjectResourceFieldsFragment = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectsQuery_classSubjects_ClassSubject_resources_SubjectResource = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectsQuery_classSubjects_ClassSubject = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, resources: Array<ClassSubjectsQuery_classSubjects_ClassSubject_resources_SubjectResource> | null, category: ClassSubjectFieldsFragment_ClassSubject_category_ClassCategory | null };

export type ClassSubjectsQuery_Query = { classSubjects: Array<ClassSubjectsQuery_classSubjects_ClassSubject> | null };


export type ClassSubjectsQueryVariables = Exact<{
  categoryId: string | null | undefined;
}>;


export type ClassSubjectsQuery = ClassSubjectsQuery_Query;

export type ClassSubjectByIdQuery_classSubject_ClassSubject_resources_SubjectResource = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectByIdQuery_classSubject_ClassSubject = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, resources: Array<ClassSubjectByIdQuery_classSubject_ClassSubject_resources_SubjectResource> | null, category: ClassSubjectFieldsFragment_ClassSubject_category_ClassCategory | null };

export type ClassSubjectByIdQuery_Query = { classSubject: ClassSubjectByIdQuery_classSubject_ClassSubject | null };


export type ClassSubjectByIdQueryVariables = Exact<{
  id: string | number;
}>;


export type ClassSubjectByIdQuery = ClassSubjectByIdQuery_Query;

export type CreateClassSubjectMutation_createClassSubject_ClassSubject = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, category: ClassSubjectFieldsFragment_ClassSubject_category_ClassCategory | null };

export type CreateClassSubjectMutation_Mutation = { createClassSubject: CreateClassSubjectMutation_createClassSubject_ClassSubject | null };


export type CreateClassSubjectMutationVariables = Exact<{
  input: Types.ClassSubjectCreateInput;
}>;


export type CreateClassSubjectMutation = CreateClassSubjectMutation_Mutation;

export type UpdateClassSubjectMutation_updateClassSubject_ClassSubject = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, category: ClassSubjectFieldsFragment_ClassSubject_category_ClassCategory | null };

export type UpdateClassSubjectMutation_Mutation = { updateClassSubject: UpdateClassSubjectMutation_updateClassSubject_ClassSubject | null };


export type UpdateClassSubjectMutationVariables = Exact<{
  id: string | number;
  input: Types.ClassSubjectUpdateInput;
}>;


export type UpdateClassSubjectMutation = UpdateClassSubjectMutation_Mutation;

export type DeleteClassSubjectMutation_Mutation = { deleteClassSubject: boolean | null };


export type DeleteClassSubjectMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteClassSubjectMutation = DeleteClassSubjectMutation_Mutation;

export type AttachSubjectResourceMutation_attachSubjectResource_SubjectResource = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type AttachSubjectResourceMutation_Mutation = { attachSubjectResource: AttachSubjectResourceMutation_attachSubjectResource_SubjectResource | null };


export type AttachSubjectResourceMutationVariables = Exact<{
  input: Types.AttachSubjectResourceInput;
}>;


export type AttachSubjectResourceMutation = AttachSubjectResourceMutation_Mutation;

export type DetachSubjectResourceMutation_Mutation = { detachSubjectResource: boolean | null };


export type DetachSubjectResourceMutationVariables = Exact<{
  subjectId: string | number;
  learningResourceId: string | number;
}>;


export type DetachSubjectResourceMutation = DetachSubjectResourceMutation_Mutation;

export type GroupClassAuditQuery_groupClassAudit_GroupClassAudit_students_GroupClassStudent = { id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: Types.GroupClassAttendanceStatus | null, avatarUrl: string | null };

export type GroupClassAuditQuery_groupClassAudit_GroupClassAudit_meetingInfo_OnlineMeetingInfo = { platform: string | null, meetingId: string | null, joinUrl: string | null, logoUrl: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, source: string | null };

export type GroupClassAuditQuery_groupClassAudit_GroupClassAudit_communications_CommunicationLogEntry = { id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null };

export type GroupClassAuditQuery_groupClassAudit_GroupClassAudit_adminNote_AdminNoteInfo = { content: string | null, lastUpdated: string | null };

export type GroupClassAuditQuery_groupClassAudit_GroupClassAudit = { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<GroupClassAuditQuery_groupClassAudit_GroupClassAudit_students_GroupClassStudent> | null, meetingInfo: GroupClassAuditQuery_groupClassAudit_GroupClassAudit_meetingInfo_OnlineMeetingInfo | null, communications: Array<GroupClassAuditQuery_groupClassAudit_GroupClassAudit_communications_CommunicationLogEntry> | null, adminNote: GroupClassAuditQuery_groupClassAudit_GroupClassAudit_adminNote_AdminNoteInfo | null };

export type GroupClassAuditQuery_Query = { groupClassAudit: GroupClassAuditQuery_groupClassAudit_GroupClassAudit | null };


export type GroupClassAuditQueryVariables = Exact<{
  classInstanceId: string;
}>;


export type GroupClassAuditQuery = GroupClassAuditQuery_Query;

export type UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_students_GroupClassStudent = { id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: Types.GroupClassAttendanceStatus | null, avatarUrl: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_meetingInfo_OnlineMeetingInfo = { platform: string | null, meetingId: string | null, joinUrl: string | null, logoUrl: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, source: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_communications_CommunicationLogEntry = { id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_adminNote_AdminNoteInfo = { content: string | null, lastUpdated: string | null };

export type UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit = { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_students_GroupClassStudent> | null, meetingInfo: UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_meetingInfo_OnlineMeetingInfo | null, communications: Array<UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_communications_CommunicationLogEntry> | null, adminNote: UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit_adminNote_AdminNoteInfo | null };

export type UpdateClassAdminNoteMutation_Mutation = { updateClassAdminNote: UpdateClassAdminNoteMutation_updateClassAdminNote_GroupClassAudit | null };


export type UpdateClassAdminNoteMutationVariables = Exact<{
  classInstanceId: string;
  content: string;
}>;


export type UpdateClassAdminNoteMutation = UpdateClassAdminNoteMutation_Mutation;

export type ResendClassNotificationsMutation_resendClassNotifications_SupportRequestResult = { id: string | null, success: boolean | null };

export type ResendClassNotificationsMutation_Mutation = { resendClassNotifications: ResendClassNotificationsMutation_resendClassNotifications_SupportRequestResult | null };


export type ResendClassNotificationsMutationVariables = Exact<{
  classInstanceId: string;
}>;


export type ResendClassNotificationsMutation = ResendClassNotificationsMutation_Mutation;

export type LessonReportQuery_lessonReport_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type LessonReportQuery_Query = { lessonReport: LessonReportQuery_lessonReport_LessonReport | null };


export type LessonReportQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type LessonReportQuery = LessonReportQuery_Query;

export type LessonReportByIdQuery_lessonReportById_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type LessonReportByIdQuery_Query = { lessonReportById: LessonReportByIdQuery_lessonReportById_LessonReport | null };


export type LessonReportByIdQueryVariables = Exact<{
  reportId: string | number;
}>;


export type LessonReportByIdQuery = LessonReportByIdQuery_Query;

export type PendingLessonReportsQuery_pendingLessonReports_PendingLessonReportsPayload_rows_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type PendingLessonReportsQuery_pendingLessonReports_PendingLessonReportsPayload = { totalCount: number | null, rows: Array<PendingLessonReportsQuery_pendingLessonReports_PendingLessonReportsPayload_rows_LessonReport> | null };

export type PendingLessonReportsQuery_Query = { pendingLessonReports: PendingLessonReportsQuery_pendingLessonReports_PendingLessonReportsPayload | null };


export type PendingLessonReportsQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
  studentId: string | number | null | undefined;
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type PendingLessonReportsQuery = PendingLessonReportsQuery_Query;

export type RecentApprovedLessonReportsQuery_recentApprovedLessonReports_PendingLessonReportsPayload_rows_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type RecentApprovedLessonReportsQuery_recentApprovedLessonReports_PendingLessonReportsPayload = { totalCount: number | null, rows: Array<RecentApprovedLessonReportsQuery_recentApprovedLessonReports_PendingLessonReportsPayload_rows_LessonReport> | null };

export type RecentApprovedLessonReportsQuery_Query = { recentApprovedLessonReports: RecentApprovedLessonReportsQuery_recentApprovedLessonReports_PendingLessonReportsPayload | null };


export type RecentApprovedLessonReportsQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type RecentApprovedLessonReportsQuery = RecentApprovedLessonReportsQuery_Query;

export type StudentRecentLessonReportsQuery_studentRecentLessonReports_PendingLessonReportsPayload_rows_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentRecentLessonReportsQuery_studentRecentLessonReports_PendingLessonReportsPayload = { totalCount: number | null, rows: Array<StudentRecentLessonReportsQuery_studentRecentLessonReports_PendingLessonReportsPayload_rows_LessonReport> | null };

export type StudentRecentLessonReportsQuery_Query = { studentRecentLessonReports: StudentRecentLessonReportsQuery_studentRecentLessonReports_PendingLessonReportsPayload | null };


export type StudentRecentLessonReportsQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type StudentRecentLessonReportsQuery = StudentRecentLessonReportsQuery_Query;

export type LessonReportCountQuery_lessonReportCount_PendingReviewCount = { pendingCount: number | null };

export type LessonReportCountQuery_Query = { lessonReportCount: LessonReportCountQuery_lessonReportCount_PendingReviewCount | null };


export type LessonReportCountQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
  studentId: string | number | null | undefined;
}>;


export type LessonReportCountQuery = LessonReportCountQuery_Query;

export type SubmitLessonReportMutation_submitLessonReport_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type SubmitLessonReportMutation_Mutation = { submitLessonReport: SubmitLessonReportMutation_submitLessonReport_LessonReport | null };


export type SubmitLessonReportMutationVariables = Exact<{
  classInstanceId: string | number;
  input: Types.LessonReportSubmitInput;
}>;


export type SubmitLessonReportMutation = SubmitLessonReportMutation_Mutation;

export type ApproveLessonReportMutation_approveLessonReport_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type ApproveLessonReportMutation_Mutation = { approveLessonReport: ApproveLessonReportMutation_approveLessonReport_LessonReport | null };


export type ApproveLessonReportMutationVariables = Exact<{
  reportId: string | number;
}>;


export type ApproveLessonReportMutation = ApproveLessonReportMutation_Mutation;

export type RejectLessonReportMutation_rejectLessonReport_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type RejectLessonReportMutation_Mutation = { rejectLessonReport: RejectLessonReportMutation_rejectLessonReport_LessonReport | null };


export type RejectLessonReportMutationVariables = Exact<{
  reportId: string | number;
  rejectionReason: string;
}>;


export type RejectLessonReportMutation = RejectLessonReportMutation_Mutation;

export type SubmitStudentLessonReportReflectionMutation_submitStudentLessonReportReflection_LessonReport = { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: Types.AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: Types.LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null };

export type SubmitStudentLessonReportReflectionMutation_Mutation = { submitStudentLessonReportReflection: SubmitStudentLessonReportReflectionMutation_submitStudentLessonReportReflection_LessonReport | null };


export type SubmitStudentLessonReportReflectionMutationVariables = Exact<{
  classInstanceId: string | number;
  studentNotes: string;
}>;


export type SubmitStudentLessonReportReflectionMutation = SubmitStudentLessonReportReflectionMutation_Mutation;

export type ParentComplaintsQuery_parentComplaints_ParentComplaintsResult_complaints_Complaint_responses_ComplaintResponse = { id: string | null, body: string | null, emailSent: boolean | null, createdAt: string | null, responderName: string | null };

export type ParentComplaintsQuery_parentComplaints_ParentComplaintsResult_complaints_Complaint = { id: string | null, category: Types.ComplaintCategory | null, body: string | null, status: Types.ComplaintStatus | null, createdAt: string | null, studentName: string | null, responses: Array<ParentComplaintsQuery_parentComplaints_ParentComplaintsResult_complaints_Complaint_responses_ComplaintResponse> | null };

export type ParentComplaintsQuery_parentComplaints_ParentComplaintsResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentComplaintsQuery_parentComplaints_ParentComplaintsResult = { id: string | null, totalCount: number | null, complaints: Array<ParentComplaintsQuery_parentComplaints_ParentComplaintsResult_complaints_Complaint> | null, pageInfo: ParentComplaintsQuery_parentComplaints_ParentComplaintsResult_pageInfo_PageInfo | null };

export type ParentComplaintsQuery_Query = { parentComplaints: ParentComplaintsQuery_parentComplaints_ParentComplaintsResult | null };


export type ParentComplaintsQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type ParentComplaintsQuery = ParentComplaintsQuery_Query;

export type AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint_responses_ComplaintResponse = { id: string | null, body: string | null, createdAt: string | null, responderName: string | null, emailSent: boolean | null };

export type AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint = { id: string | null, category: Types.ComplaintCategory | null, body: string | null, status: Types.ComplaintStatus | null, createdAt: string | null, parentName: string | null, parentAvatarUrl: string | null, studentName: string | null, responses: Array<AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint_responses_ComplaintResponse> | null };

export type AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_metrics_ComplaintMetrics = { id: string | null, unanswered: number | null, answered: number | null, avgResolutionTime: string | null };

export type AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult = { id: string | null, totalCount: number | null, rows: Array<AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint> | null, metrics: AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_metrics_ComplaintMetrics | null, pageInfo: AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_pageInfo_PageInfo | null };

export type AdminComplaintQueueQuery_Query = { adminComplaintQueue: AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult | null };


export type AdminComplaintQueueQueryVariables = Exact<{
  filter: Types.ComplaintQueueFilter;
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type AdminComplaintQueueQuery = AdminComplaintQueueQuery_Query;

export type SubmitComplaintMutation_submitComplaint_Complaint = { id: string | null, category: Types.ComplaintCategory | null, body: string | null, status: Types.ComplaintStatus | null, createdAt: string | null };

export type SubmitComplaintMutation_Mutation = { submitComplaint: SubmitComplaintMutation_submitComplaint_Complaint | null };


export type SubmitComplaintMutationVariables = Exact<{
  input: Types.ComplaintSubmitInput;
}>;


export type SubmitComplaintMutation = SubmitComplaintMutation_Mutation;

export type RespondToComplaintMutation_respondToComplaint_ComplaintResponse = { id: string | null, body: string | null, emailSent: boolean | null, createdAt: string | null, responderName: string | null };

export type RespondToComplaintMutation_Mutation = { respondToComplaint: RespondToComplaintMutation_respondToComplaint_ComplaintResponse | null };


export type RespondToComplaintMutationVariables = Exact<{
  input: Types.RespondToComplaintInput;
}>;


export type RespondToComplaintMutation = RespondToComplaintMutation_Mutation;

export type DeleteComplaintMutation_Mutation = { deleteComplaint: boolean | null };


export type DeleteComplaintMutationVariables = Exact<{
  complaintId: string;
}>;


export type DeleteComplaintMutation = DeleteComplaintMutation_Mutation;

export type MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema = { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null };

export type MeetingProviderFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema | null };

export type UserMeetingConfigFieldsFragment_UserMeetingConfig_details_MeetingConfigDetails = { meetingUrl: string | null, username: string | null, tenantId: string | null };

export type UserMeetingConfigFieldsFragment_UserMeetingConfig_provider_MeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema | null };

export type UserMeetingConfigFieldsFragment = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_UserMeetingConfig_details_MeetingConfigDetails | null, provider: UserMeetingConfigFieldsFragment_UserMeetingConfig_provider_MeetingProvider | null };

export type MeetingProvidersQuery_meetingProviders_MeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema | null };

export type MeetingProvidersQuery_Query = { meetingProviders: Array<MeetingProvidersQuery_meetingProviders_MeetingProvider> | null };


export type MeetingProvidersQueryVariables = Exact<{
  activeOnly: boolean | null | undefined;
}>;


export type MeetingProvidersQuery = MeetingProvidersQuery_Query;

export type MeetingProviderQuery_meetingProvider_MeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema | null };

export type MeetingProviderQuery_Query = { meetingProvider: MeetingProviderQuery_meetingProvider_MeetingProvider | null };


export type MeetingProviderQueryVariables = Exact<{
  id: string | number;
}>;


export type MeetingProviderQuery = MeetingProviderQuery_Query;

export type UserMeetingConfigsQuery_userMeetingConfigs_UserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_UserMeetingConfig_details_MeetingConfigDetails | null, provider: UserMeetingConfigFieldsFragment_UserMeetingConfig_provider_MeetingProvider | null };

export type UserMeetingConfigsQuery_Query = { userMeetingConfigs: Array<UserMeetingConfigsQuery_userMeetingConfigs_UserMeetingConfig> | null };


export type UserMeetingConfigsQueryVariables = Exact<{
  userId: string | number;
}>;


export type UserMeetingConfigsQuery = UserMeetingConfigsQuery_Query;

export type UserMeetingConfigQuery_userMeetingConfig_UserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_UserMeetingConfig_details_MeetingConfigDetails | null, provider: UserMeetingConfigFieldsFragment_UserMeetingConfig_provider_MeetingProvider | null };

export type UserMeetingConfigQuery_Query = { userMeetingConfig: UserMeetingConfigQuery_userMeetingConfig_UserMeetingConfig | null };


export type UserMeetingConfigQueryVariables = Exact<{
  id: string | number;
}>;


export type UserMeetingConfigQuery = UserMeetingConfigQuery_Query;

export type CreateMeetingProviderMutation_createMeetingProvider_MeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema | null };

export type CreateMeetingProviderMutation_Mutation = { createMeetingProvider: CreateMeetingProviderMutation_createMeetingProvider_MeetingProvider | null };


export type CreateMeetingProviderMutationVariables = Exact<{
  input: Types.MeetingProviderCreateInput;
}>;


export type CreateMeetingProviderMutation = CreateMeetingProviderMutation_Mutation;

export type UpdateMeetingProviderMutation_updateMeetingProvider_MeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema | null };

export type UpdateMeetingProviderMutation_Mutation = { updateMeetingProvider: UpdateMeetingProviderMutation_updateMeetingProvider_MeetingProvider | null };


export type UpdateMeetingProviderMutationVariables = Exact<{
  id: string | number;
  input: Types.MeetingProviderUpdateInput;
}>;


export type UpdateMeetingProviderMutation = UpdateMeetingProviderMutation_Mutation;

export type DeleteMeetingProviderMutation_Mutation = { deleteMeetingProvider: boolean | null };


export type DeleteMeetingProviderMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteMeetingProviderMutation = DeleteMeetingProviderMutation_Mutation;

export type CreateUserMeetingConfigMutation_createUserMeetingConfig_UserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_UserMeetingConfig_details_MeetingConfigDetails | null, provider: UserMeetingConfigFieldsFragment_UserMeetingConfig_provider_MeetingProvider | null };

export type CreateUserMeetingConfigMutation_Mutation = { createUserMeetingConfig: CreateUserMeetingConfigMutation_createUserMeetingConfig_UserMeetingConfig | null };


export type CreateUserMeetingConfigMutationVariables = Exact<{
  input: Types.UserMeetingConfigCreateInput;
}>;


export type CreateUserMeetingConfigMutation = CreateUserMeetingConfigMutation_Mutation;

export type UpdateUserMeetingConfigMutation_updateUserMeetingConfig_UserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_UserMeetingConfig_details_MeetingConfigDetails | null, provider: UserMeetingConfigFieldsFragment_UserMeetingConfig_provider_MeetingProvider | null };

export type UpdateUserMeetingConfigMutation_Mutation = { updateUserMeetingConfig: UpdateUserMeetingConfigMutation_updateUserMeetingConfig_UserMeetingConfig | null };


export type UpdateUserMeetingConfigMutationVariables = Exact<{
  id: string | number;
  input: Types.UserMeetingConfigUpdateInput;
}>;


export type UpdateUserMeetingConfigMutation = UpdateUserMeetingConfigMutation_Mutation;

export type DeleteUserMeetingConfigMutation_Mutation = { deleteUserMeetingConfig: boolean | null };


export type DeleteUserMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteUserMeetingConfigMutation = DeleteUserMeetingConfigMutation_Mutation;

export type SetDefaultMeetingConfigMutation_setDefaultMeetingConfig_UserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: UserMeetingConfigFieldsFragment_UserMeetingConfig_details_MeetingConfigDetails | null, provider: UserMeetingConfigFieldsFragment_UserMeetingConfig_provider_MeetingProvider | null };

export type SetDefaultMeetingConfigMutation_Mutation = { setDefaultMeetingConfig: SetDefaultMeetingConfigMutation_setDefaultMeetingConfig_UserMeetingConfig | null };


export type SetDefaultMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type SetDefaultMeetingConfigMutation = SetDefaultMeetingConfigMutation_Mutation;

export type ClassMeetingConfigFieldsFragment_ClassMeetingConfig_details_MeetingConfigDetails = { meetingUrl: string | null, username: string | null, tenantId: string | null };

export type ClassMeetingConfigFieldsFragment_ClassMeetingConfig_provider_MeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: MeetingProviderFieldsFragment_MeetingProvider_fieldSchema_MeetingProviderFieldSchema | null };

export type ClassMeetingConfigFieldsFragment = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_details_MeetingConfigDetails | null, provider: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_provider_MeetingProvider | null };

export type EffectiveMeetingFieldsFragment = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type ClassMeetingConfigsQuery_classMeetingConfigs_ClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_details_MeetingConfigDetails | null, provider: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_provider_MeetingProvider | null };

export type ClassMeetingConfigsQuery_Query = { classMeetingConfigs: Array<ClassMeetingConfigsQuery_classMeetingConfigs_ClassMeetingConfig> | null };


export type ClassMeetingConfigsQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ClassMeetingConfigsQuery = ClassMeetingConfigsQuery_Query;

export type RecurringMeetingConfigsQuery_recurringMeetingConfigs_ClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_details_MeetingConfigDetails | null, provider: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_provider_MeetingProvider | null };

export type RecurringMeetingConfigsQuery_Query = { recurringMeetingConfigs: Array<RecurringMeetingConfigsQuery_recurringMeetingConfigs_ClassMeetingConfig> | null };


export type RecurringMeetingConfigsQueryVariables = Exact<{
  recurringScheduleId: string | number;
}>;


export type RecurringMeetingConfigsQuery = RecurringMeetingConfigsQuery_Query;

export type CreateClassMeetingConfigMutation_createClassMeetingConfig_ClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_details_MeetingConfigDetails | null, provider: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_provider_MeetingProvider | null };

export type CreateClassMeetingConfigMutation_Mutation = { createClassMeetingConfig: CreateClassMeetingConfigMutation_createClassMeetingConfig_ClassMeetingConfig | null };


export type CreateClassMeetingConfigMutationVariables = Exact<{
  input: Types.ClassMeetingConfigCreateInput;
}>;


export type CreateClassMeetingConfigMutation = CreateClassMeetingConfigMutation_Mutation;

export type UpdateClassMeetingConfigMutation_updateClassMeetingConfig_ClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_details_MeetingConfigDetails | null, provider: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_provider_MeetingProvider | null };

export type UpdateClassMeetingConfigMutation_Mutation = { updateClassMeetingConfig: UpdateClassMeetingConfigMutation_updateClassMeetingConfig_ClassMeetingConfig | null };


export type UpdateClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
  input: Types.ClassMeetingConfigUpdateInput;
}>;


export type UpdateClassMeetingConfigMutation = UpdateClassMeetingConfigMutation_Mutation;

export type DeleteClassMeetingConfigMutation_Mutation = { deleteClassMeetingConfig: boolean | null };


export type DeleteClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteClassMeetingConfigMutation = DeleteClassMeetingConfigMutation_Mutation;

export type SetDefaultClassMeetingConfigMutation_setDefaultClassMeetingConfig_ClassMeetingConfig = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_details_MeetingConfigDetails | null, provider: ClassMeetingConfigFieldsFragment_ClassMeetingConfig_provider_MeetingProvider | null };

export type SetDefaultClassMeetingConfigMutation_Mutation = { setDefaultClassMeetingConfig: SetDefaultClassMeetingConfigMutation_setDefaultClassMeetingConfig_ClassMeetingConfig | null };


export type SetDefaultClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type SetDefaultClassMeetingConfigMutation = SetDefaultClassMeetingConfigMutation_Mutation;

export type NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult_alerts_SystemAlert = { id: string | null, deliveryId: string | null, type: string | null, eventType: Types.NotificationEventType | null, channel: Types.NotificationChannel | null, metadata: unknown, title: string | null, body: string | null, createdAt: string | null, severity: string | null, readAt: string | null };

export type NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult = { id: string | null, totalCount: number | null, unreadCount: number | null, alerts: Array<NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult_alerts_SystemAlert> | null };

export type NotificationAlertsQuery_Query = { notificationAlerts: NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult | null };


export type NotificationAlertsQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationAlertsQuery = NotificationAlertsQuery_Query;

export type MarkNotificationsReadMutation_Mutation = { markNotificationsRead: number | null };


export type MarkNotificationsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkNotificationsReadMutation = MarkNotificationsReadMutation_Mutation;

export type MarkNotificationReadMutation_Mutation = { markNotificationRead: boolean | null };


export type MarkNotificationReadMutationVariables = Exact<{
  deliveryId: string | number;
}>;


export type MarkNotificationReadMutation = MarkNotificationReadMutation_Mutation;

export type NotificationPreferencesQuery_notificationPreferences_NotificationPreference = { id: string | null, channel: Types.NotificationChannel | null, eventType: Types.NotificationEventType | null, enabled: boolean | null };

export type NotificationPreferencesQuery_Query = { notificationPreferences: Array<NotificationPreferencesQuery_notificationPreferences_NotificationPreference> | null };


export type NotificationPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationPreferencesQuery = NotificationPreferencesQuery_Query;

export type UpdateNotificationPreferencesMutation_updateNotificationPreferences_NotificationPreference = { id: string | null, channel: Types.NotificationChannel | null, eventType: Types.NotificationEventType | null, enabled: boolean | null };

export type UpdateNotificationPreferencesMutation_Mutation = { updateNotificationPreferences: Array<UpdateNotificationPreferencesMutation_updateNotificationPreferences_NotificationPreference> | null };


export type UpdateNotificationPreferencesMutationVariables = Exact<{
  input: Array<Types.NotificationPreferenceInput> | Types.NotificationPreferenceInput;
}>;


export type UpdateNotificationPreferencesMutation = UpdateNotificationPreferencesMutation_Mutation;

export type ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow = { id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: Types.CurrencyCode | null, status: Types.InvoiceStatus | null, invoiceType: Types.InvoiceType | null, studentId: string | null, studentName: string | null, parentId: string | null, parentUserId: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow_displayAmount_DisplayAmount | null };

export type ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult = { id: string | null, totalCount: number | null, rows: Array<ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow> | null, pageInfo: ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_pageInfo_PageInfo | null };

export type ParentInvoiceHistoryQuery_Query = { parentInvoiceHistory: ParentInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult | null };


export type ParentInvoiceHistoryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
  paginationArgs: Types.PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;


export type ParentInvoiceHistoryQuery = ParentInvoiceHistoryQuery_Query;

export type AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult_rows_ParentInvoiceRow_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult_rows_ParentInvoiceRow = { id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: Types.CurrencyCode | null, status: Types.InvoiceStatus | null, invoiceType: Types.InvoiceType | null, studentId: string | null, studentName: string | null, parentId: string | null, parentUserId: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult_rows_ParentInvoiceRow_displayAmount_DisplayAmount | null };

export type AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult = { id: string | null, totalCount: number | null, rows: Array<AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult_rows_ParentInvoiceRow> | null, pageInfo: AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult_pageInfo_PageInfo | null };

export type AdminInvoicesQuery_Query = { adminInvoices: AdminInvoicesQuery_adminInvoices_AdminInvoiceHistoryResult | null };


export type AdminInvoicesQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;


export type AdminInvoicesQuery = AdminInvoicesQuery_Query;

export type AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_outstandingByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_outstandingByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_outstandingByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_mtdRevenueByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_mtdRevenueByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_mtdRevenueByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary = { id: string | null, totalOutstanding: string | null, pendingCount: number | null, mtdRevenue: string | null, negativeBalanceCount: number | null, outstandingByCurrency: Array<AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_outstandingByCurrency_BillingCurrencyTotal> | null, mtdRevenueByCurrency: Array<AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary_mtdRevenueByCurrency_BillingCurrencyTotal> | null };

export type AdminBillingSummaryQuery_Query = { adminBillingSummary: AdminBillingSummaryQuery_adminBillingSummary_AdminBillingSummary | null };


export type AdminBillingSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminBillingSummaryQuery = AdminBillingSummaryQuery_Query;

export type StudentCreditStatusQuery_studentCreditStatus_StudentCreditRow = { id: string | null, studentName: string | null, parentEmail: string | null, planType: Types.InvoiceType | null, classesRemaining: number | null, classesTotal: number | null, status: Types.StudentStatus | null };

export type StudentCreditStatusQuery_Query = { studentCreditStatus: Array<StudentCreditStatusQuery_studentCreditStatus_StudentCreditRow> | null };


export type StudentCreditStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type StudentCreditStatusQuery = StudentCreditStatusQuery_Query;

export type ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_nextUnpaidInvoice_NextUnpaidInvoiceSummary = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, dueDate: string | null, studentName: string | null };

export type ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal = { id: string | null, currency: Types.CurrencyCode | null, amount: string | null, displayAmount: ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal_displayAmount_DisplayAmount | null };

export type ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary = { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null, pendingPaymentCount: number | null, nextUnpaidInvoice: ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_nextUnpaidInvoice_NextUnpaidInvoiceSummary | null, outstandingByCurrency: Array<ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_outstandingByCurrency_BillingCurrencyTotal> | null, paidThisTermByCurrency: Array<ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary_paidThisTermByCurrency_BillingCurrencyTotal> | null };

export type ParentBillingSummaryQuery_Query = { parentBillingSummary: ParentBillingSummaryQuery_parentBillingSummary_ParentBillingSummary | null };


export type ParentBillingSummaryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
}>;


export type ParentBillingSummaryQuery = ParentBillingSummaryQuery_Query;

export type ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult_rows_ParentDashboardScheduleRow_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult_rows_ParentDashboardScheduleRow = { id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentAvatarUrl: string | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, bookingStatus: Types.BookingStatus | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, classTimeFormatted: string | null, effectiveMeeting: ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult_rows_ParentDashboardScheduleRow_effectiveMeeting_EffectiveMeeting | null };

export type ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult = { id: string | null, totalCount: number | null, rows: Array<ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult_rows_ParentDashboardScheduleRow> | null, pageInfo: ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult_pageInfo_PageInfo | null };

export type ParentDashboardScheduleQuery_Query = { parentDashboardSchedule: ParentDashboardScheduleQuery_parentDashboardSchedule_ParentDashboardScheduleResult | null };


export type ParentDashboardScheduleQueryVariables = Exact<{
  date: string | null | undefined;
  search: string | null | undefined;
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type ParentDashboardScheduleQuery = ParentDashboardScheduleQuery_Query;

export type ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult_metrics_ParentDashboardMetrics = { id: string | null, totalStudents: number | null, todaysClasses: number | null, pendingInvoicesCount: number | null, pendingInvoicesAmount: string | null, performanceAvg: number | null, performanceAvgMobile: number | null, pendingMessages: number | null };

export type ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult_studentProgress_StudentProgress = { id: string | null, name: string | null, completionPercent: number | null };

export type ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult_workshopPromo_WorkshopPromo = { id: string | null, title: string | null, description: string | null, imageUrl: string | null };

export type ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult = { id: string | null, metrics: ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult_metrics_ParentDashboardMetrics | null, studentProgress: Array<ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult_studentProgress_StudentProgress> | null, workshopPromo: ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult_workshopPromo_WorkshopPromo | null };

export type ParentDashboardMetricsQuery_Query = { parentDashboardMetrics: ParentDashboardMetricsQuery_parentDashboardMetrics_ParentDashboardMetricsResult | null };


export type ParentDashboardMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentDashboardMetricsQuery = ParentDashboardMetricsQuery_Query;

export type ParentDirectoryAutocompleteRowFragmentFragment = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type ParentDirectoryQuery_parentDirectory_ParentDirectory_metrics_ParentDirectoryMetrics = { id: string | null, regular: number | null, onLeave: number | null, onTrial: number | null, suspended: number | null };

export type ParentDirectoryQuery_parentDirectory_ParentDirectory_rows_ParentDirectoryRow = { id: string | null, userId: string | null, index: number | null, name: string | null, email: string | null, avatarUrl: string | null, guardianOf: string | null, time: string | null, lifecycleStatus: Types.ParentStatus | null, accountStatus: Types.AccountStatus | null, unpaidInvoices: number | null };

export type ParentDirectoryQuery_parentDirectory_ParentDirectory_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ParentDirectoryQuery_parentDirectory_ParentDirectory = { id: string | null, totalCount: number | null, metrics: ParentDirectoryQuery_parentDirectory_ParentDirectory_metrics_ParentDirectoryMetrics | null, rows: Array<ParentDirectoryQuery_parentDirectory_ParentDirectory_rows_ParentDirectoryRow> | null, pageInfo: ParentDirectoryQuery_parentDirectory_ParentDirectory_pageInfo_PageInfo | null };

export type ParentDirectoryQuery_Query = { parentDirectory: ParentDirectoryQuery_parentDirectory_ParentDirectory | null };


export type ParentDirectoryQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
  search: string | null | undefined;
  lifecycleStatusFilter: Types.ParentStatus | null | undefined;
}>;


export type ParentDirectoryQuery = ParentDirectoryQuery_Query;

export type ParentsDirectoryQuery_parentsDirectory_ParentDirectoryAutocompleteRow = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type ParentsDirectoryQuery_Query = { parentsDirectory: Array<ParentsDirectoryQuery_parentsDirectory_ParentDirectoryAutocompleteRow> };


export type ParentsDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
}>;


export type ParentsDirectoryQuery = ParentsDirectoryQuery_Query;

export type ParentDocumentsQuery_parentDocuments_ParentDocument = { id: string | null, fileId: string | null, filePath: string | null, isProtected: boolean | null, usageType: string | null, createdAt: string | null };

export type ParentDocumentsQuery_Query = { parentDocuments: Array<ParentDocumentsQuery_parentDocuments_ParentDocument> | null };


export type ParentDocumentsQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentDocumentsQuery = ParentDocumentsQuery_Query;

export type LinkDocumentToParentMutation_linkDocumentToParent_ParentDocument = { id: string | null, fileId: string | null, filePath: string | null, isProtected: boolean | null, usageType: string | null, createdAt: string | null };

export type LinkDocumentToParentMutation_Mutation = { linkDocumentToParent: LinkDocumentToParentMutation_linkDocumentToParent_ParentDocument | null };


export type LinkDocumentToParentMutationVariables = Exact<{
  parentId: string;
  fileId: string;
  usageType: string;
}>;


export type LinkDocumentToParentMutation = LinkDocumentToParentMutation_Mutation;

export type ChangeParentLifecycleStatusMutation_changeParentLifecycleStatus_ChangeParentLifecycleResult = { id: string | null, lifecycleStatus: Types.ParentStatus | null };

export type ChangeParentLifecycleStatusMutation_Mutation = { changeParentLifecycleStatus: ChangeParentLifecycleStatusMutation_changeParentLifecycleStatus_ChangeParentLifecycleResult | null };


export type ChangeParentLifecycleStatusMutationVariables = Exact<{
  parentId: string;
  newStatus: Types.ParentStatus;
}>;


export type ChangeParentLifecycleStatusMutation = ChangeParentLifecycleStatusMutation_Mutation;

export type CreateParentMutation_createParent_ParentOnboardingResult = { userId: string | null, parentId: string | null, name: string | null, email: string | null, status: string | null, invoiceType: string | null, currency: Types.CurrencyCode | null };

export type CreateParentMutation_Mutation = { createParent: CreateParentMutation_createParent_ParentOnboardingResult | null };


export type CreateParentMutationVariables = Exact<{
  input: Types.ParentOnboardingInput;
}>;


export type CreateParentMutation = CreateParentMutation_Mutation;

export type ParentAssignedStudentsQuery_parentAssignedStudents_ParentAssignedStudentsResult_rows_ParentAssignedStudent = { id: string | null, name: string | null, studentAvatarUrl: string | null, status: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null };

export type ParentAssignedStudentsQuery_parentAssignedStudents_ParentAssignedStudentsResult = { id: string | null, totalCount: number | null, rows: Array<ParentAssignedStudentsQuery_parentAssignedStudents_ParentAssignedStudentsResult_rows_ParentAssignedStudent> | null };

export type ParentAssignedStudentsQuery_Query = { parentAssignedStudents: ParentAssignedStudentsQuery_parentAssignedStudents_ParentAssignedStudentsResult | null };


export type ParentAssignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentAssignedStudentsQuery = ParentAssignedStudentsQuery_Query;

export type ParentOwnProfileQuery_parentOwnProfile_ParentOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null };

export type ParentOwnProfileQuery_Query = { parentOwnProfile: ParentOwnProfileQuery_parentOwnProfile_ParentOwnProfile | null };


export type ParentOwnProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentOwnProfileQuery = ParentOwnProfileQuery_Query;

export type ParentHandbookUrlQuery_parentHandbookUrl_ParentHandbookUrl = { id: string | null, url: string | null };

export type ParentHandbookUrlQuery_Query = { parentHandbookUrl: ParentHandbookUrlQuery_parentHandbookUrl_ParentHandbookUrl | null };


export type ParentHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentHandbookUrlQuery = ParentHandbookUrlQuery_Query;

export type ParentProfileQuery_parentProfile_ParentProfile_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ParentProfileQuery_parentProfile_ParentProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: Types.AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: Types.CurrencyCode | null, timezone: Types.IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: ParentProfileQuery_parentProfile_ParentProfile_displayAmount_DisplayAmount | null };

export type ParentProfileQuery_Query = { parentProfile: ParentProfileQuery_parentProfile_ParentProfile | null };


export type ParentProfileQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentProfileQuery = ParentProfileQuery_Query;

export type ParentAssociatedStudentsQuery_parentAssociatedStudents_AssociatedStudent = { id: string | null, name: string | null, avatarUrl: string | null, status: Types.StudentStatus | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, updatedAt: string | null };

export type ParentAssociatedStudentsQuery_Query = { parentAssociatedStudents: Array<ParentAssociatedStudentsQuery_parentAssociatedStudents_AssociatedStudent> | null };


export type ParentAssociatedStudentsQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentAssociatedStudentsQuery = ParentAssociatedStudentsQuery_Query;

export type DeactivateParentMutation_deactivateParent_DeactivateParentResult = { id: string | null, userId: string | null, accountStatus: Types.AccountStatus | null };

export type DeactivateParentMutation_Mutation = { deactivateParent: DeactivateParentMutation_deactivateParent_DeactivateParentResult | null };


export type DeactivateParentMutationVariables = Exact<{
  parentId: string;
}>;


export type DeactivateParentMutation = DeactivateParentMutation_Mutation;

export type ReactivateParentMutation_reactivateParent_ReactivateParentResult = { id: string | null, userId: string | null, accountStatus: Types.AccountStatus | null };

export type ReactivateParentMutation_Mutation = { reactivateParent: ReactivateParentMutation_reactivateParent_ReactivateParentResult | null };


export type ReactivateParentMutationVariables = Exact<{
  parentId: string;
}>;


export type ReactivateParentMutation = ReactivateParentMutation_Mutation;

export type UpdateStudentQuotaMutation_updateStudentQuota_EditQuotaResult = { id: string | null, classesRemaining: number | null, classesTotal: number | null, version: number | null };

export type UpdateStudentQuotaMutation_Mutation = { updateStudentQuota: UpdateStudentQuotaMutation_updateStudentQuota_EditQuotaResult | null };


export type UpdateStudentQuotaMutationVariables = Exact<{
  studentId: string;
  newClassesRemaining: number;
  expectedVersion: number | null | undefined;
}>;


export type UpdateStudentQuotaMutation = UpdateStudentQuotaMutation_Mutation;

export type PermissionFieldsFragment = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionGroupFieldsFragment = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null };

export type PermissionGroupDetailFieldsFragment_PermissionGroup_assignedUsers_GroupUser = { id: string | null, name: string | null, email: string | null };

export type PermissionGroupDetailFieldsFragment = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

export type UserOverrideFieldsFragment = { permissionId: string | null, state: Types.OverrideState | null, assignedBy: string | null };

export type PermissionsQuery_permissions_Permission = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionsQuery_Query = { permissions: Array<PermissionsQuery_permissions_Permission> | null };


export type PermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionsQuery = PermissionsQuery_Query;

export type PermissionGroupsQuery_permissionGroups_PermissionGroup = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null };

export type PermissionGroupsQuery_Query = { permissionGroups: Array<PermissionGroupsQuery_permissionGroups_PermissionGroup> | null };


export type PermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionGroupsQuery = PermissionGroupsQuery_Query;

export type PermissionGroupQuery_permissionGroup_PermissionGroup = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

export type PermissionGroupQuery_Query = { permissionGroup: PermissionGroupQuery_permissionGroup_PermissionGroup | null };


export type PermissionGroupQueryVariables = Exact<{
  id: string;
}>;


export type PermissionGroupQuery = PermissionGroupQuery_Query;

export type UserPermissionGroupsQuery_Query = { userPermissionGroups: Array<string> | null };


export type UserPermissionGroupsQueryVariables = Exact<{
  userId: string;
}>;


export type UserPermissionGroupsQuery = UserPermissionGroupsQuery_Query;

export type UserOverridesQuery_userOverrides_UserOverride = { permissionId: string | null, state: Types.OverrideState | null, assignedBy: string | null };

export type UserOverridesQuery_Query = { userOverrides: Array<UserOverridesQuery_userOverrides_UserOverride> | null };


export type UserOverridesQueryVariables = Exact<{
  userId: string;
}>;


export type UserOverridesQuery = UserOverridesQuery_Query;

export type EffectiveUserPermissionsQuery_Query = { effectiveUserPermissions: Array<string> | null };


export type EffectiveUserPermissionsQueryVariables = Exact<{
  userId: string;
}>;


export type EffectiveUserPermissionsQuery = EffectiveUserPermissionsQuery_Query;

export type CreatePermissionGroupMutation_createPermissionGroup_PermissionGroup = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

export type CreatePermissionGroupMutation_Mutation = { createPermissionGroup: CreatePermissionGroupMutation_createPermissionGroup_PermissionGroup | null };


export type CreatePermissionGroupMutationVariables = Exact<{
  input: Types.CreatePermissionGroupInput;
}>;


export type CreatePermissionGroupMutation = CreatePermissionGroupMutation_Mutation;

export type UpdatePermissionGroupMutation_updatePermissionGroup_PermissionGroup = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupDetailFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

export type UpdatePermissionGroupMutation_Mutation = { updatePermissionGroup: UpdatePermissionGroupMutation_updatePermissionGroup_PermissionGroup | null };


export type UpdatePermissionGroupMutationVariables = Exact<{
  input: Types.UpdatePermissionGroupInput;
}>;


export type UpdatePermissionGroupMutation = UpdatePermissionGroupMutation_Mutation;

export type DeletePermissionGroupMutation_Mutation = { deletePermissionGroup: boolean | null };


export type DeletePermissionGroupMutationVariables = Exact<{
  groupId: string;
}>;


export type DeletePermissionGroupMutation = DeletePermissionGroupMutation_Mutation;

export type AssignPermissionGroupToUserMutation_Mutation = { assignPermissionGroupToUser: boolean | null };


export type AssignPermissionGroupToUserMutationVariables = Exact<{
  input: Types.AssignPermissionGroupToUserInput;
}>;


export type AssignPermissionGroupToUserMutation = AssignPermissionGroupToUserMutation_Mutation;

export type RevokePermissionGroupFromUserMutation_Mutation = { revokePermissionGroupFromUser: boolean | null };


export type RevokePermissionGroupFromUserMutationVariables = Exact<{
  input: Types.RevokePermissionGroupFromUserInput;
}>;


export type RevokePermissionGroupFromUserMutation = RevokePermissionGroupFromUserMutation_Mutation;

export type BulkAssignUsersToGroupMutation_Mutation = { bulkAssignUsersToGroup: boolean | null };


export type BulkAssignUsersToGroupMutationVariables = Exact<{
  groupId: string;
  userIds: Array<string> | string;
}>;


export type BulkAssignUsersToGroupMutation = BulkAssignUsersToGroupMutation_Mutation;

export type BulkRevokeUsersFromGroupMutation_Mutation = { bulkRevokeUsersFromGroup: boolean | null };


export type BulkRevokeUsersFromGroupMutationVariables = Exact<{
  groupId: string;
  userIds: Array<string> | string;
}>;


export type BulkRevokeUsersFromGroupMutation = BulkRevokeUsersFromGroupMutation_Mutation;

export type UpdateUserOverridesMutation_Mutation = { updateUserOverrides: boolean | null };


export type UpdateUserOverridesMutationVariables = Exact<{
  userId: string;
  overrides: Array<Types.UserOverrideInput> | Types.UserOverrideInput;
}>;


export type UpdateUserOverridesMutation = UpdateUserOverridesMutation_Mutation;

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherOwnProfile_TeacherOwnProfile_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherOwnProfile_TeacherOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, countryCode: string | null, nationalId: string | null, dateOfBirth: string | null, gender: Types.Gender | null, address: string | null, qualifications: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, totalClasses: number | null, displayAmount: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherOwnProfile_TeacherOwnProfile_displayAmount_DisplayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherAdminProfile_TeacherProfileResult_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherAdminProfile_TeacherProfileResult = { id: string | null, name: string | null, email: string | null, phone: string | null, nationalId: string | null, nationality: string | null, countryCode: string | null, dateOfBirth: string | null, gender: Types.Gender | null, address: string | null, qualifications: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, status: Types.AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null, displayAmount: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherAdminProfile_TeacherProfileResult_displayAmount_DisplayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_parentOwnProfile_ParentOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_parentAdminProfile_ParentProfile_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_parentAdminProfile_ParentProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: Types.AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: Types.CurrencyCode | null, timezone: Types.IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_parentAdminProfile_ParentProfile_displayAmount_DisplayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_paymentMethods_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_paymentMethodDefaults_PaymentMethodDefaults = { payinDefault: PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payinDefault_UserPaymentMethod | null, payoutDefault: PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payoutDefault_UserPaymentMethod | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_associatedStudents_ParentAssignedStudentsResult_rows_ParentAssignedStudent = { id: string | null, name: string | null, studentAvatarUrl: string | null, status: string | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_associatedStudents_ParentAssignedStudentsResult = { id: string | null, totalCount: number | null, rows: Array<ProfileByUserIdQuery_profileByUserId_UnifiedProfile_associatedStudents_ParentAssignedStudentsResult_rows_ParentAssignedStudent> | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffProfile_ManagerDirectoryRow_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffProfile_ManagerDirectoryRow = { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, roleSlug: string | null, roleName: string | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, displayAmount: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffProfile_ManagerDirectoryRow_displayAmount_DisplayAmount | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffPermissionGroups_StaffPermissionGroup = { id: string | null, name: string | null, slug: string | null, description: string | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffPermissionOverrides_StaffPermissionOverride = { id: string | null, permissionId: string | null, permissionKey: string | null, resource: string | null, action: string | null, state: Types.OverrideState | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_meetingConfigs_UserMeetingConfig_details_MeetingConfigDetails = { meetingUrl: string | null, username: string | null, tenantId: string | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_meetingConfigs_UserMeetingConfig_provider_MeetingProvider = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_meetingConfigs_UserMeetingConfig = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, details: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_meetingConfigs_UserMeetingConfig_details_MeetingConfigDetails | null, provider: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_meetingConfigs_UserMeetingConfig_provider_MeetingProvider | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_assignedStudents_TeacherAssignedStudentsResult_rows_TeacherAssignedStudent = { id: string | null, name: string | null, studentAvatarUrl: string | null, parentId: string | null, parentUserId: string | null, parentName: string | null, parentAvatarUrl: string | null, className: string | null, status: Types.StudentStatus | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile_assignedStudents_TeacherAssignedStudentsResult = { id: string | null, totalCount: number | null, rows: Array<ProfileByUserIdQuery_profileByUserId_UnifiedProfile_assignedStudents_TeacherAssignedStudentsResult_rows_TeacherAssignedStudent> | null };

export type ProfileByUserIdQuery_profileByUserId_UnifiedProfile = { id: string | null, userId: string | null, audience: Types.ProfileAudience | null, scope: Types.ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: Types.CurrencyCode | null, timezone: Types.IanaTimezone | null, phone: string | null, teacherOwnProfile: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherOwnProfile_TeacherOwnProfile | null, teacherAdminProfile: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_teacherAdminProfile_TeacherProfileResult | null, parentOwnProfile: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_parentOwnProfile_ParentOwnProfile | null, parentAdminProfile: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_parentAdminProfile_ParentProfile | null, paymentMethods: Array<ProfileByUserIdQuery_profileByUserId_UnifiedProfile_paymentMethods_UserPaymentMethod> | null, paymentMethodDefaults: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_paymentMethodDefaults_PaymentMethodDefaults | null, associatedStudents: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_associatedStudents_ParentAssignedStudentsResult | null, staffProfile: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffProfile_ManagerDirectoryRow | null, staffPermissionGroups: Array<ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffPermissionGroups_StaffPermissionGroup> | null, staffPermissionOverrides: Array<ProfileByUserIdQuery_profileByUserId_UnifiedProfile_staffPermissionOverrides_StaffPermissionOverride> | null, meetingConfigs: Array<ProfileByUserIdQuery_profileByUserId_UnifiedProfile_meetingConfigs_UserMeetingConfig> | null, assignedStudents: ProfileByUserIdQuery_profileByUserId_UnifiedProfile_assignedStudents_TeacherAssignedStudentsResult | null };

export type ProfileByUserIdQuery_Query = { profileByUserId: ProfileByUserIdQuery_profileByUserId_UnifiedProfile | null };


export type ProfileByUserIdQueryVariables = Exact<{
  userId: string;
}>;


export type ProfileByUserIdQuery = ProfileByUserIdQuery_Query;

export type UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_teacherOwnProfile_TeacherOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, countryCode: string | null, nationalId: string | null, dateOfBirth: string | null, gender: Types.Gender | null, address: string | null, qualifications: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, totalClasses: number | null };

export type UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_parentOwnProfile_ParentOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null };

export type UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow = { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, phone: string | null, status: Types.AccountStatus | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, displayAmount: UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow_displayAmount_DisplayAmount | null };

export type UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile = { id: string | null, userId: string | null, audience: Types.ProfileAudience | null, scope: Types.ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: Types.CurrencyCode | null, timezone: Types.IanaTimezone | null, teacherOwnProfile: UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_teacherOwnProfile_TeacherOwnProfile | null, parentOwnProfile: UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_parentOwnProfile_ParentOwnProfile | null, staffProfile: UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow | null };

export type UpdateOwnProfileMutation_Mutation = { updateOwnProfile: UpdateOwnProfileMutation_updateOwnProfile_UnifiedProfile | null };


export type UpdateOwnProfileMutationVariables = Exact<{
  input: Types.UpdateOwnProfileInput;
}>;


export type UpdateOwnProfileMutation = UpdateOwnProfileMutation_Mutation;

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_teacherAdminProfile_TeacherProfileResult = { id: string | null, name: string | null, email: string | null, phone: string | null, nationalId: string | null, nationality: string | null, countryCode: string | null, dateOfBirth: string | null, gender: Types.Gender | null, address: string | null, qualifications: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, status: Types.AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null };

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_parentAdminProfile_ParentProfile_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_parentAdminProfile_ParentProfile = { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: Types.AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: Types.CurrencyCode | null, timezone: Types.IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_parentAdminProfile_ParentProfile_displayAmount_DisplayAmount | null };

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_paymentMethods_UserPaymentMethod = { id: string | null, userId: string | null, type: Types.PaymentMethodType | null, direction: Types.PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: UserPaymentMethodFieldsFragment_UserPaymentMethod_details_PaymentMethodDetails | null };

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_paymentMethodDefaults_PaymentMethodDefaults = { payinDefault: PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payinDefault_UserPaymentMethod | null, payoutDefault: PaymentMethodDefaultsFieldsFragment_PaymentMethodDefaults_payoutDefault_UserPaymentMethod | null };

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow = { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, phone: string | null, status: Types.AccountStatus | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, displayAmount: UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow_displayAmount_DisplayAmount | null };

export type UpdateUserProfileMutation_updateUserProfile_UnifiedProfile = { id: string | null, userId: string | null, audience: Types.ProfileAudience | null, scope: Types.ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: Types.CurrencyCode | null, teacherAdminProfile: UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_teacherAdminProfile_TeacherProfileResult | null, parentAdminProfile: UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_parentAdminProfile_ParentProfile | null, paymentMethods: Array<UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_paymentMethods_UserPaymentMethod> | null, paymentMethodDefaults: UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_paymentMethodDefaults_PaymentMethodDefaults | null, staffProfile: UpdateUserProfileMutation_updateUserProfile_UnifiedProfile_staffProfile_ManagerDirectoryRow | null };

export type UpdateUserProfileMutation_Mutation = { updateUserProfile: UpdateUserProfileMutation_updateUserProfile_UnifiedProfile | null };


export type UpdateUserProfileMutationVariables = Exact<{
  userId: string;
  input: Types.UpdateUserProfileInput;
}>;


export type UpdateUserProfileMutation = UpdateUserProfileMutation_Mutation;

export type StudentMonthlyReportQuery_studentMonthlyReport_StudentMonthlyReport = { id: string | null, studentId: string | null, studentName: string | null, year: number | null, month: number | null, totalLessons: number | null, completedLessons: number | null, cancelledLessons: number | null, presentCount: number | null, absentCount: number | null, lateCount: number | null, totalHours: number | null, creditsPurchased: number | null, creditsDeducted: number | null, creditsRefunded: number | null, creditsBalance: number | null };

export type StudentMonthlyReportQuery_Query = { studentMonthlyReport: StudentMonthlyReportQuery_studentMonthlyReport_StudentMonthlyReport | null };


export type StudentMonthlyReportQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;


export type StudentMonthlyReportQuery = StudentMonthlyReportQuery_Query;

export type GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload_rows_AttendanceReportRow_paidAmounts_AttendanceReportPaidAmount_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload_rows_AttendanceReportRow_paidAmounts_AttendanceReportPaidAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, displayAmount: GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload_rows_AttendanceReportRow_paidAmounts_AttendanceReportPaidAmount_displayAmount_DisplayAmount | null };

export type GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload_rows_AttendanceReportRow = { id: string | null, groupKey: string | null, groupLabel: string | null, takenClasses: number | null, absentClasses: number | null, leaveClasses: number | null, pendingClasses: number | null, totalHours: number | null, engagementGrowth: number | null, paidAmounts: Array<GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload_rows_AttendanceReportRow_paidAmounts_AttendanceReportPaidAmount> | null };

export type GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload = { engagementGrowth: number | null, rows: Array<GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload_rows_AttendanceReportRow> | null };

export type GenerateAttendanceReportQuery_Query = { generateAttendanceReport: GenerateAttendanceReportQuery_generateAttendanceReport_AttendanceReportPayload | null };


export type GenerateAttendanceReportQueryVariables = Exact<{
  filters: Types.AttendanceReportFiltersInput;
}>;


export type GenerateAttendanceReportQuery = GenerateAttendanceReportQuery_Query;

export type DeleteBookMutationMutation_Mutation = { deleteBook: boolean | null };


export type DeleteBookMutationMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteBookMutationMutation = DeleteBookMutationMutation_Mutation;

export type LearningResourceRowFragmentFragment = { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null };

export type LearningResourcesQuery_learningResources_LearningResourceRow = { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null };

export type LearningResourcesQuery_Query = { learningResources: Array<LearningResourcesQuery_learningResources_LearningResourceRow> | null };


export type LearningResourcesQueryVariables = Exact<{
  searchQuery: string | null | undefined;
}>;


export type LearningResourcesQuery = LearningResourcesQuery_Query;

export type UploadLearningResourceMutation_uploadLearningResource_LearningResourceRow = { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null };

export type UploadLearningResourceMutation_Mutation = { uploadLearningResource: UploadLearningResourceMutation_uploadLearningResource_LearningResourceRow | null };


export type UploadLearningResourceMutationVariables = Exact<{
  input: Types.ResourceUploadInput;
}>;


export type UploadLearningResourceMutation = UploadLearningResourceMutation_Mutation;

export type PrepareUploadMutation_prepareUpload_UploadPreparation = { id: string, url: string, uploadType: Types.UploadType };

export type PrepareUploadMutation_Mutation = { prepareUpload: PrepareUploadMutation_prepareUpload_UploadPreparation | null };


export type PrepareUploadMutationVariables = Exact<{
  input: Types.UploadPreparationInput;
}>;


export type PrepareUploadMutation = PrepareUploadMutation_Mutation;

export type DeleteLearningResourceMutation_Mutation = { deleteLearningResource: boolean | null };


export type DeleteLearningResourceMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteLearningResourceMutation = DeleteLearningResourceMutation_Mutation;

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_pageInfo_PageInfo = { count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher_gaps_TeacherAvailabilityGap = { id: string | null, teacherId: string | null, teacherName: string | null, teacherGender: string | null, dayOfWeek: Types.DayOfWeek | null, calendarDate: string | null, gapStartTime: string | null, gapEndTime: string | null, timezone: Types.IanaTimezone | null };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher = { id: string | null, name: string | null, gender: Types.Gender | null, timezone: Types.IanaTimezone | null, availableDaysCount: number | null, gaps: Array<SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher_gaps_TeacherAvailabilityGap> | null };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult = { id: string | null, totalGaps: number | null, totalCount: number | null, pageInfo: SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_pageInfo_PageInfo | null, teachers: Array<SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher> | null };

export type SearchTeacherAvailabilityQuery_Query = { searchTeacherAvailability: SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult | null };


export type SearchTeacherAvailabilityQueryVariables = Exact<{
  input: Types.AvailabilitySearchInput;
}>;


export type SearchTeacherAvailabilityQuery = SearchTeacherAvailabilityQuery_Query;

export type AvailableClassSlotsQuery_availableClassSlots_AvailableClassSlot = { id: string | null, teacherId: string | null, startAt: string | null, endAt: string | null, available: boolean | null };

export type AvailableClassSlotsQuery_Query = { availableClassSlots: Array<AvailableClassSlotsQuery_availableClassSlots_AvailableClassSlot> | null };


export type AvailableClassSlotsQueryVariables = Exact<{
  studentId: string | number;
  date: string;
  teacherId: string | number | null | undefined;
  durationMinutes: number | null | undefined;
}>;


export type AvailableClassSlotsQuery = AvailableClassSlotsQuery_Query;

export type ClassInstanceQuery_classInstance_ClassInstanceDetail_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type ClassInstanceQuery_classInstance_ClassInstanceDetail_student_ClassInstanceStudentInfo = { id: string | null, name: string | null, grade: string | null, level: string | null, avatarUrl: string | null };

export type ClassInstanceQuery_classInstance_ClassInstanceDetail_teacher_ClassInstanceTeacherInfo = { id: string | null, name: string | null, title: string | null, avatarUrl: string | null };

export type ClassInstanceQuery_classInstance_ClassInstanceDetail_performance_ClassInstancePerformance = { id: string | null, engagementScore: number | null, assessmentProgress: number | null, assessmentTotal: number | null, focusLevel: string | null, sessionHealth: string | null, heatmapData: Array<unknown> | null, latencyMs: number | null, authorizationLabel: string | null, attendanceRate: number | null, avgGrade: string | null, lastClassDaysAgo: number | null };

export type ClassInstanceQuery_classInstance_ClassInstanceDetail = { id: string | null, courseName: string | null, classType: Types.ClassType | null, instanceId: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, status: Types.ClassExecutionState | null, remarks: string | null, hasTimezoneMismatch: boolean | null, studentTimezone: Types.IanaTimezone | null, teacherTimezone: Types.IanaTimezone | null, meetingJoinUrl: string | null, recurringScheduleId: string | null, payrollCredited: boolean | null, isRescheduled: boolean | null, isFrozen: boolean | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, avatarUrl: string | null, subjectId: string | null, subjectName: string | null, subjectAvatarUrl: string | null, rateAmount: string | null, rateCurrency: Types.CurrencyCode | null, isRateOverridden: boolean | null, rateSource: Types.RateSource | null, effectiveMeeting: ClassInstanceQuery_classInstance_ClassInstanceDetail_effectiveMeeting_EffectiveMeeting | null, student: ClassInstanceQuery_classInstance_ClassInstanceDetail_student_ClassInstanceStudentInfo | null, teacher: ClassInstanceQuery_classInstance_ClassInstanceDetail_teacher_ClassInstanceTeacherInfo | null, performance: ClassInstanceQuery_classInstance_ClassInstanceDetail_performance_ClassInstancePerformance | null };

export type ClassInstanceQuery_Query = { classInstance: ClassInstanceQuery_classInstance_ClassInstanceDetail | null };


export type ClassInstanceQueryVariables = Exact<{
  id: string | number;
}>;


export type ClassInstanceQuery = ClassInstanceQuery_Query;

export type ClassStatusEventsQuery_classStatusEvents_ClassStatusEvent = { id: string | null, eventType: string | null, description: string | null, createdAt: string | null };

export type ClassStatusEventsQuery_Query = { classStatusEvents: Array<ClassStatusEventsQuery_classStatusEvents_ClassStatusEvent> | null };


export type ClassStatusEventsQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ClassStatusEventsQuery = ClassStatusEventsQuery_Query;

export type ActivateClassMutation_activateClass_ClassInstanceDetail = { id: string | null, status: Types.ClassExecutionState | null, durationMinutes: number | null, remarks: string | null, meetingJoinUrl: string | null };

export type ActivateClassMutation_Mutation = { activateClass: ActivateClassMutation_activateClass_ClassInstanceDetail | null };


export type ActivateClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ActivateClassMutation = ActivateClassMutation_Mutation;

export type ActivateOverrideClassMutation_activateOverrideClass_ClassInstanceDetail = { id: string | null, executionState: Types.ClassExecutionState | null, status: Types.ClassExecutionState | null, durationMinutes: number | null, remarks: string | null, meetingJoinUrl: string | null };

export type ActivateOverrideClassMutation_Mutation = { activateOverrideClass: ActivateOverrideClassMutation_activateOverrideClass_ClassInstanceDetail | null };


export type ActivateOverrideClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ActivateOverrideClassMutation = ActivateOverrideClassMutation_Mutation;

export type ResetClassMutation_Mutation = { resetClass: boolean | null };


export type ResetClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ResetClassMutation = ResetClassMutation_Mutation;

export type UpdateSessionStatusStartMutation_updateSessionStatusStart_ClassInstanceDetail = { id: string | null, executionState: Types.ClassExecutionState | null, status: Types.ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type UpdateSessionStatusStartMutation_Mutation = { updateSessionStatusStart: UpdateSessionStatusStartMutation_updateSessionStatusStart_ClassInstanceDetail | null };


export type UpdateSessionStatusStartMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type UpdateSessionStatusStartMutation = UpdateSessionStatusStartMutation_Mutation;

export type UpdateSessionStatusAbsentMutation_updateSessionStatusAbsent_ClassInstanceDetail = { id: string | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, payrollCredited: boolean | null, status: Types.ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type UpdateSessionStatusAbsentMutation_Mutation = { updateSessionStatusAbsent: UpdateSessionStatusAbsentMutation_updateSessionStatusAbsent_ClassInstanceDetail | null };


export type UpdateSessionStatusAbsentMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type UpdateSessionStatusAbsentMutation = UpdateSessionStatusAbsentMutation_Mutation;

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_completedInstance_ClassInstanceDetail = { id: string | null, outcome: Types.ClassOutcome | null, isRescheduled: boolean | null };

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_rescheduledInstance_ClassInstanceDetail = { id: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null };

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult = { completedInstanceId: string | null, rescheduledInstanceId: string | null, completedInstance: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_completedInstance_ClassInstanceDetail | null, rescheduledInstance: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_rescheduledInstance_ClassInstanceDetail | null };

export type UpdateSessionStatusLeaveMutation_Mutation = { updateSessionStatusLeave: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult | null };


export type UpdateSessionStatusLeaveMutationVariables = Exact<{
  classInstanceId: string | number;
  leaveReason: string;
}>;


export type UpdateSessionStatusLeaveMutation = UpdateSessionStatusLeaveMutation_Mutation;

export type StopClassMutation_stopClass_ClassInstanceDetail = { id: string | null, status: Types.ClassExecutionState | null, durationMinutes: number | null, remarks: string | null };

export type StopClassMutation_Mutation = { stopClass: StopClassMutation_stopClass_ClassInstanceDetail | null };


export type StopClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type StopClassMutation = StopClassMutation_Mutation;

export type RescheduleClassMutation_rescheduleClass_ClassInstanceDetail = { id: string | null, status: Types.ClassExecutionState | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null };

export type RescheduleClassMutation_Mutation = { rescheduleClass: RescheduleClassMutation_rescheduleClass_ClassInstanceDetail | null };


export type RescheduleClassMutationVariables = Exact<{
  classInstanceId: string | number;
  input: Types.RescheduleClassInput;
}>;


export type RescheduleClassMutation = RescheduleClassMutation_Mutation;

export type DeleteClassInstanceMutation_Mutation = { deleteClassInstance: boolean | null };


export type DeleteClassInstanceMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type DeleteClassInstanceMutation = DeleteClassInstanceMutation_Mutation;

export type OverrideClassInstanceRateMutation_overrideClassInstanceRate_ClassInstanceDetail = { id: string | null, rateAmount: string | null, rateCurrency: Types.CurrencyCode | null, isRateOverridden: boolean | null, rateSource: Types.RateSource | null };

export type OverrideClassInstanceRateMutation_Mutation = { overrideClassInstanceRate: OverrideClassInstanceRateMutation_overrideClassInstanceRate_ClassInstanceDetail | null };


export type OverrideClassInstanceRateMutationVariables = Exact<{
  classInstanceId: string | number;
  rateAmount: string | null | undefined;
  rateCurrency: Types.CurrencyCode | null | undefined;
}>;


export type OverrideClassInstanceRateMutation = OverrideClassInstanceRateMutation_Mutation;

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_updatedSessions_DstUpdatedSession = { id: string | null, studentId: string | null, teacherId: string | null, studentName: string | null, teacherName: string | null, fromTime: string | null, toTime: string | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_conflictGroups_DstConflictGroup_conflicts_DstConflictItem = { id: string | null, studentName: string | null, message: string | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_conflictGroups_DstConflictGroup = { id: string | null, teacherName: string | null, conflicts: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_conflictGroups_DstConflictGroup_conflicts_DstConflictItem> | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_checkedEmptyItems_DstCheckedEmptyItem = { id: string | null, studentName: string | null, reason: string | null };

export type ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport = { id: string | null, runId: string | null, updated: number | null, conflicts: number | null, unchanged: number | null, total: number | null, status: string | null, updatedSessions: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_updatedSessions_DstUpdatedSession> | null, conflictGroups: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_conflictGroups_DstConflictGroup> | null, checkedEmptyItems: Array<ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport_checkedEmptyItems_DstCheckedEmptyItem> | null };

export type ExecuteDstBulkUpdateMutation_Mutation = { executeDstBulkUpdate: ExecuteDstBulkUpdateMutation_executeDstBulkUpdate_DstMigrationReport | null };


export type ExecuteDstBulkUpdateMutationVariables = Exact<{
  offsetMinutes: number;
  description: string;
}>;


export type ExecuteDstBulkUpdateMutation = ExecuteDstBulkUpdateMutation_Mutation;

export type CreateRecurringClassMutation_createRecurringClass_CreateRecurringClassResult = { id: string | null, recurringScheduleId: string | null, classInstanceIds: Array<string> | null, classInstanceCount: number | null };

export type CreateRecurringClassMutation_Mutation = { createRecurringClass: CreateRecurringClassMutation_createRecurringClass_CreateRecurringClassResult | null };


export type CreateRecurringClassMutationVariables = Exact<{
  input: Types.CreateRecurringClassInput;
}>;


export type CreateRecurringClassMutation = CreateRecurringClassMutation_Mutation;

export type RecurringScheduleQuery_recurringSchedule_RecurringScheduleDetail_days_RecurringScheduleDayDetail = { id: string | null, dayOfWeek: string | null, startTime: string | null, isActive: boolean | null };

export type RecurringScheduleQuery_recurringSchedule_RecurringScheduleDetail = { id: string | null, studentId: string | null, studentName: string | null, teacherId: string | null, teacherName: string | null, durationMinutes: number | null, defaultStartTime: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, days: Array<RecurringScheduleQuery_recurringSchedule_RecurringScheduleDetail_days_RecurringScheduleDayDetail> | null };

export type RecurringScheduleQuery_Query = { recurringSchedule: RecurringScheduleQuery_recurringSchedule_RecurringScheduleDetail | null };


export type RecurringScheduleQueryVariables = Exact<{
  id: string | number;
}>;


export type RecurringScheduleQuery = RecurringScheduleQuery_Query;

export type UpdateRecurringClassRateMutation_updateRecurringClassRate_RecurringScheduleDetail = { id: string | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null };

export type UpdateRecurringClassRateMutation_Mutation = { updateRecurringClassRate: UpdateRecurringClassRateMutation_updateRecurringClassRate_RecurringScheduleDetail | null };


export type UpdateRecurringClassRateMutationVariables = Exact<{
  input: Types.UpdateRecurringClassRateInput;
}>;


export type UpdateRecurringClassRateMutation = UpdateRecurringClassRateMutation_Mutation;

export type DeleteRecurringClassMutation_Mutation = { deleteRecurringClass: boolean | null };


export type DeleteRecurringClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type DeleteRecurringClassMutation = DeleteRecurringClassMutation_Mutation;

export type ClearWeeklyScheduleMutation_Mutation = { clearWeeklySchedule: boolean | null };


export type ClearWeeklyScheduleMutationVariables = Exact<{
  teacherId: string | number;
}>;


export type ClearWeeklyScheduleMutation = ClearWeeklyScheduleMutation_Mutation;

export type AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_metrics_DailyScheduleMetrics = { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList_student_DailyScheduleListUserItem = { id: string | null, name: string | null, avatarUrl: string | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList_teacher_DailyScheduleListUserItem = { id: string | null, name: string | null, avatarUrl: string | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList = { id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, teacherTimezone: Types.IanaTimezone | null, studentTimezone: Types.IanaTimezone | null, duration: number | null, scheduledStartAt: string | null, scheduledEndAt: string | null, outcome: Types.ClassOutcome | null, executionState: Types.ClassExecutionState | null, isFrozen: boolean | null, meetingJoinUrl: string | null, courseName: string | null, avatarUrl: string | null, effectiveMeeting: AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList_effectiveMeeting_EffectiveMeeting | null, student: AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList_student_DailyScheduleListUserItem | null, teacher: AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList_teacher_DailyScheduleListUserItem | null };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult = { id: string | null, totalCount: number | null, metrics: AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_metrics_DailyScheduleMetrics | null, rows: Array<AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList> | null, pageInfo: AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_pageInfo_PageInfo | null };

export type AdminDashboardScheduleQuery_Query = { adminDashboardSchedule: AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult | null };


export type AdminDashboardScheduleQueryVariables = Exact<{
  input: Types.AdminDashboardScheduleInput;
}>;


export type AdminDashboardScheduleQuery = AdminDashboardScheduleQuery_Query;

export type DailyScheduleMetricsQuery_dailyScheduleMetrics_DailyScheduleMetrics = { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type DailyScheduleMetricsQuery_Query = { dailyScheduleMetrics: DailyScheduleMetricsQuery_dailyScheduleMetrics_DailyScheduleMetrics | null };


export type DailyScheduleMetricsQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
}>;


export type DailyScheduleMetricsQuery = DailyScheduleMetricsQuery_Query;

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_student_DailyScheduleListUserItem = { id: string | null, name: string | null, avatarUrl: string | null };

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_teacher_DailyScheduleListUserItem = { id: string | null, name: string | null, avatarUrl: string | null };

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList = { id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, teacherTimezone: Types.IanaTimezone | null, studentTimezone: Types.IanaTimezone | null, duration: number | null, outcome: Types.ClassOutcome | null, executionState: Types.ClassExecutionState | null, isFrozen: boolean | null, meetingJoinUrl: string | null, courseName: string | null, avatarUrl: string | null, effectiveMeeting: DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_effectiveMeeting_EffectiveMeeting | null, student: DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_student_DailyScheduleListUserItem | null, teacher: DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_teacher_DailyScheduleListUserItem | null };

export type DailyScheduleListQuery_Query = { dailyScheduleList: Array<DailyScheduleListQuery_dailyScheduleList_DailyScheduleList> | null };


export type DailyScheduleListQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
  search: string | null | undefined;
  metricFilter: string | null | undefined;
}>;


export type DailyScheduleListQuery = DailyScheduleListQuery_Query;

export type RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingResult_rows_RescheduleTrackingRow = { id: string | null, originalClassId: string | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, status: Types.LeaveRequestStatus | null, dateLabel: Types.RescheduleDateLabel | null, remarks: string | null };

export type RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingResult = { id: string | null, totalCount: number | null, rows: Array<RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingResult_rows_RescheduleTrackingRow> | null, pageInfo: RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingResult_pageInfo_PageInfo | null };

export type RescheduleTrackingRowsQuery_Query = { rescheduleTrackingRows: RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingResult | null };


export type RescheduleTrackingRowsQueryVariables = Exact<{
  search: string | null | undefined;
  status: Types.LeaveRequestStatus | null | undefined;
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type RescheduleTrackingRowsQuery = RescheduleTrackingRowsQuery_Query;

export type RescheduleTrackingMetricsQuery_rescheduleTrackingMetrics_RescheduleTrackingMetrics = { id: string | null, pending: number | null, approved: number | null, leave: number | null, rescheduled: number | null, cancelled: number | null };

export type RescheduleTrackingMetricsQuery_Query = { rescheduleTrackingMetrics: RescheduleTrackingMetricsQuery_rescheduleTrackingMetrics_RescheduleTrackingMetrics | null };


export type RescheduleTrackingMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type RescheduleTrackingMetricsQuery = RescheduleTrackingMetricsQuery_Query;

export type StatusTrackingScheduleQuery_statusTrackingSchedule_StatusTrackingScheduleRow_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type StatusTrackingScheduleQuery_statusTrackingSchedule_StatusTrackingScheduleRow = { id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentAvatarUrl: string | null, studentStatus: Types.StudentStatus | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, courseName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StatusTrackingScheduleQuery_statusTrackingSchedule_StatusTrackingScheduleRow_effectiveMeeting_EffectiveMeeting | null };

export type StatusTrackingScheduleQuery_Query = { statusTrackingSchedule: Array<StatusTrackingScheduleQuery_statusTrackingSchedule_StatusTrackingScheduleRow> | null };


export type StatusTrackingScheduleQueryVariables = Exact<{
  date: string;
  search: string | null | undefined;
  viewerTimezone: Types.IanaTimezone | null | undefined;
}>;


export type StatusTrackingScheduleQuery = StatusTrackingScheduleQuery_Query;

export type TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass = { id: string | null, studentName: string | null, studentId: string | null, duration: number | null, startTime: string | null, day: string | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, subjectName: string | null, classType: Types.ClassType | null, meetingJoinUrl: string | null, effectiveMeeting: TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass_effectiveMeeting_EffectiveMeeting | null };

export type TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid = { id: string | null, teacherId: string | null, weekStart: string | null, weekEnd: string | null, classes: Array<TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass> | null };

export type TeacherWeeklyScheduleGridQuery_Query = { teacherWeeklyScheduleGrid: TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid | null };


export type TeacherWeeklyScheduleGridQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;


export type TeacherWeeklyScheduleGridQuery = TeacherWeeklyScheduleGridQuery_Query;

export type TeacherWorkloadMetricsQuery_teacherWorkloadMetrics_WeeklyWorkloadMetrics = { id: string | null, weeklyHoursWorked: string | null, totalMinutes: number | null, classCount: number | null };

export type TeacherWorkloadMetricsQuery_Query = { teacherWorkloadMetrics: TeacherWorkloadMetricsQuery_teacherWorkloadMetrics_WeeklyWorkloadMetrics | null };


export type TeacherWorkloadMetricsQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;


export type TeacherWorkloadMetricsQuery = TeacherWorkloadMetricsQuery_Query;

export type EnvConfigEntryFieldsFragment = { id: string | null, key: string | null, category: string | null, displayStrategy: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSecret: boolean | null, excludeFromDb: boolean | null, value: string | null, source: string | null, hasDbOverride: boolean | null, editable: boolean | null };

export type EnvConfigUpsertResultFieldsFragment = { id: string | null, key: string | null, source: string | null, hasDbOverride: boolean | null, updatedAt: string | null };

export type EnvConfigDeleteResultFieldsFragment = { id: string | null, key: string | null, deleted: boolean | null, source: string | null };

export type EnvConfigEntriesQuery_envConfigEntries_EnvConfigEntry = { id: string | null, key: string | null, category: string | null, displayStrategy: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSecret: boolean | null, excludeFromDb: boolean | null, value: string | null, source: string | null, hasDbOverride: boolean | null, editable: boolean | null };

export type EnvConfigEntriesQuery_Query = { envConfigEntries: Array<EnvConfigEntriesQuery_envConfigEntries_EnvConfigEntry> | null };


export type EnvConfigEntriesQueryVariables = Exact<{ [key: string]: never; }>;


export type EnvConfigEntriesQuery = EnvConfigEntriesQuery_Query;

export type UpsertEnvConfigEntryMutation_upsertEnvConfigEntry_EnvConfigUpsertResult = { id: string | null, key: string | null, source: string | null, hasDbOverride: boolean | null, updatedAt: string | null };

export type UpsertEnvConfigEntryMutation_Mutation = { upsertEnvConfigEntry: UpsertEnvConfigEntryMutation_upsertEnvConfigEntry_EnvConfigUpsertResult | null };


export type UpsertEnvConfigEntryMutationVariables = Exact<{
  input: Types.EnvConfigUpsertInput;
}>;


export type UpsertEnvConfigEntryMutation = UpsertEnvConfigEntryMutation_Mutation;

export type DeleteEnvConfigEntryMutation_deleteEnvConfigEntry_EnvConfigDeleteResult = { id: string | null, key: string | null, deleted: boolean | null, source: string | null };

export type DeleteEnvConfigEntryMutation_Mutation = { deleteEnvConfigEntry: DeleteEnvConfigEntryMutation_deleteEnvConfigEntry_EnvConfigDeleteResult | null };


export type DeleteEnvConfigEntryMutationVariables = Exact<{
  key: string;
}>;


export type DeleteEnvConfigEntryMutation = DeleteEnvConfigEntryMutation_Mutation;

export type SystemSettingFieldsFragment = { id: string | null, key: string | null, value: string | null, dataType: Types.SystemSettingDataType | null, description: string | null, category: Types.SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type SystemSettingsQuery_systemSettings_SystemSetting = { id: string | null, key: string | null, value: string | null, dataType: Types.SystemSettingDataType | null, description: string | null, category: Types.SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type SystemSettingsQuery_Query = { systemSettings: Array<SystemSettingsQuery_systemSettings_SystemSetting> | null };


export type SystemSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SystemSettingsQuery = SystemSettingsQuery_Query;

export type SystemSettingQuery_systemSetting_SystemSetting = { id: string | null, key: string | null, value: string | null, dataType: Types.SystemSettingDataType | null, description: string | null, category: Types.SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type SystemSettingQuery_Query = { systemSetting: SystemSettingQuery_systemSetting_SystemSetting | null };


export type SystemSettingQueryVariables = Exact<{
  key: string;
}>;


export type SystemSettingQuery = SystemSettingQuery_Query;

export type UpsertSystemSettingMutation_upsertSystemSetting_SystemSetting = { id: string | null, key: string | null, value: string | null, dataType: Types.SystemSettingDataType | null, description: string | null, category: Types.SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type UpsertSystemSettingMutation_Mutation = { upsertSystemSetting: UpsertSystemSettingMutation_upsertSystemSetting_SystemSetting | null };


export type UpsertSystemSettingMutationVariables = Exact<{
  input: Types.SystemSettingUpsertInput;
}>;


export type UpsertSystemSettingMutation = UpsertSystemSettingMutation_Mutation;

export type DeleteSystemSettingMutation_Mutation = { deleteSystemSetting: boolean | null };


export type DeleteSystemSettingMutationVariables = Exact<{
  key: string;
}>;


export type DeleteSystemSettingMutation = DeleteSystemSettingMutation_Mutation;

export type SessionConfigFieldsFragment = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type SessionConfigsQuery_sessionConfigs_SessionConfig = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type SessionConfigsQuery_Query = { sessionConfigs: Array<SessionConfigsQuery_sessionConfigs_SessionConfig> | null };


export type SessionConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type SessionConfigsQuery = SessionConfigsQuery_Query;

export type SessionConfigQuery_sessionConfig_SessionConfig = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type SessionConfigQuery_Query = { sessionConfig: SessionConfigQuery_sessionConfig_SessionConfig | null };


export type SessionConfigQueryVariables = Exact<{
  roleName: string;
}>;


export type SessionConfigQuery = SessionConfigQuery_Query;

export type UpsertSessionConfigMutation_upsertSessionConfig_SessionConfig = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type UpsertSessionConfigMutation_Mutation = { upsertSessionConfig: UpsertSessionConfigMutation_upsertSessionConfig_SessionConfig | null };


export type UpsertSessionConfigMutationVariables = Exact<{
  input: Types.SessionConfigUpsertInput;
}>;


export type UpsertSessionConfigMutation = UpsertSessionConfigMutation_Mutation;

export type DeleteSessionConfigMutation_Mutation = { deleteSessionConfig: boolean | null };


export type DeleteSessionConfigMutationVariables = Exact<{
  roleName: string;
}>;


export type DeleteSessionConfigMutation = DeleteSessionConfigMutation_Mutation;

export type AuditLogFieldsFragment = { id: string | null, actorUserId: string | null, actorType: string | null, entityType: string | null, entityId: string | null, action: string | null, description: string | null, previousState: unknown, newState: unknown, changes: unknown, ipAddress: string | null, userAgent: string | null, metadata: unknown, createdAt: string | null };

export type SettingsAuditLogsQuery_settingsAuditLogs_SettingsAuditLogsResult_logs_AuditLog = { id: string | null, actorUserId: string | null, actorType: string | null, entityType: string | null, entityId: string | null, action: string | null, description: string | null, previousState: unknown, newState: unknown, changes: unknown, ipAddress: string | null, userAgent: string | null, metadata: unknown, createdAt: string | null };

export type SettingsAuditLogsQuery_settingsAuditLogs_SettingsAuditLogsResult = { id: string | null, total: number | null, hasMore: boolean | null, logs: Array<SettingsAuditLogsQuery_settingsAuditLogs_SettingsAuditLogsResult_logs_AuditLog> | null };

export type SettingsAuditLogsQuery_Query = { settingsAuditLogs: SettingsAuditLogsQuery_settingsAuditLogs_SettingsAuditLogsResult | null };


export type SettingsAuditLogsQueryVariables = Exact<{
  filter: Types.SettingsAuditLogFilter | null | undefined;
}>;


export type SettingsAuditLogsQuery = SettingsAuditLogsQuery_Query;

export type SiteContentEntryFieldsFragment = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type SiteContentEntriesQuery_siteContentEntries_SiteContentEntry = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type SiteContentEntriesQuery_Query = { siteContentEntries: Array<SiteContentEntriesQuery_siteContentEntries_SiteContentEntry> | null };


export type SiteContentEntriesQueryVariables = Exact<{ [key: string]: never; }>;


export type SiteContentEntriesQuery = SiteContentEntriesQuery_Query;

export type SiteContentEntryQuery_siteContentEntry_SiteContentEntry = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type SiteContentEntryQuery_Query = { siteContentEntry: SiteContentEntryQuery_siteContentEntry_SiteContentEntry | null };


export type SiteContentEntryQueryVariables = Exact<{
  id: string | number;
}>;


export type SiteContentEntryQuery = SiteContentEntryQuery_Query;

export type UpsertSiteContentMutation_upsertSiteContent_SiteContentEntry = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type UpsertSiteContentMutation_Mutation = { upsertSiteContent: UpsertSiteContentMutation_upsertSiteContent_SiteContentEntry | null };


export type UpsertSiteContentMutationVariables = Exact<{
  input: Types.SiteContentUpsertInput;
}>;


export type UpsertSiteContentMutation = UpsertSiteContentMutation_Mutation;

export type UpdateSiteContentPublishStateMutation_updateSiteContentPublishState_SiteContentEntry = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type UpdateSiteContentPublishStateMutation_Mutation = { updateSiteContentPublishState: UpdateSiteContentPublishStateMutation_updateSiteContentPublishState_SiteContentEntry | null };


export type UpdateSiteContentPublishStateMutationVariables = Exact<{
  id: string | number;
  isPublished: boolean;
}>;


export type UpdateSiteContentPublishStateMutation = UpdateSiteContentPublishStateMutation_Mutation;

export type DeleteSiteContentMutation_Mutation = { deleteSiteContent: boolean | null };


export type DeleteSiteContentMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteSiteContentMutation = DeleteSiteContentMutation_Mutation;

export type SettingsTimezoneFieldsFragment = { id: string | null, ianaId: string | null, name: string | null, baseOffsetMinutes: number | null, offsetMinutes: number | null, isDstSupported: boolean | null };

export type SettingsTimezonesQuery_settingsTimezones_SettingsTimezonesResult_rows_SettingsTimezone = { id: string | null, ianaId: string | null, name: string | null, baseOffsetMinutes: number | null, offsetMinutes: number | null, isDstSupported: boolean | null };

export type SettingsTimezonesQuery_settingsTimezones_SettingsTimezonesResult_pageInfo_PageInfo = { count: number, currentPage: number, endCursor: string | null, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, startCursor: string | null, total: number };

export type SettingsTimezonesQuery_settingsTimezones_SettingsTimezonesResult = { id: string | null, totalCount: number | null, rows: Array<SettingsTimezonesQuery_settingsTimezones_SettingsTimezonesResult_rows_SettingsTimezone> | null, pageInfo: SettingsTimezonesQuery_settingsTimezones_SettingsTimezonesResult_pageInfo_PageInfo | null };

export type SettingsTimezonesQuery_Query = { settingsTimezones: SettingsTimezonesQuery_settingsTimezones_SettingsTimezonesResult | null };


export type SettingsTimezonesQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type SettingsTimezonesQuery = SettingsTimezonesQuery_Query;

export type EnsureDemoUsersMutation_Mutation = { ensureDemoUsers: boolean | null };


export type EnsureDemoUsersMutationVariables = Exact<{ [key: string]: never; }>;


export type EnsureDemoUsersMutation = EnsureDemoUsersMutation_Mutation;

export type CreateTestEntitiesMutation_createTestEntities_TestEntities = { studentUserEmail: string | null, studentUserId: string | null, studentId: string | null, studentName: string | null, parentUserEmail: string | null, parentUserId: string | null, parentId: string | null, parentName: string | null, teacherUserEmail: string | null, teacherUserId: string | null, teacherId: string | null, teacherName: string | null };

export type CreateTestEntitiesMutation_Mutation = { createTestEntities: CreateTestEntitiesMutation_createTestEntities_TestEntities | null };


export type CreateTestEntitiesMutationVariables = Exact<{
  prefix: string;
  classesRemaining: number | null | undefined;
}>;


export type CreateTestEntitiesMutation = CreateTestEntitiesMutation_Mutation;

export type CleanupTestEntitiesMutation_Mutation = { cleanupTestEntities: boolean | null };


export type CleanupTestEntitiesMutationVariables = Exact<{
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  studentId: string;
  teacherId: string;
  parentId: string;
}>;


export type CleanupTestEntitiesMutation = CleanupTestEntitiesMutation_Mutation;

export type CreateTestGroupClassMutation_createTestGroupClass_TestGroupClass = { groupClassId: string | null };

export type CreateTestGroupClassMutation_Mutation = { createTestGroupClass: CreateTestGroupClassMutation_createTestGroupClass_TestGroupClass | null };


export type CreateTestGroupClassMutationVariables = Exact<{
  classInstanceId: string;
  teacherName: string;
}>;


export type CreateTestGroupClassMutation = CreateTestGroupClassMutation_Mutation;

export type CleanupTestGroupClassMutation_Mutation = { cleanupTestGroupClass: boolean | null };


export type CleanupTestGroupClassMutationVariables = Exact<{
  groupClassId: string;
}>;


export type CleanupTestGroupClassMutation = CleanupTestGroupClassMutation_Mutation;

export type CleanupTestManagerMutation_Mutation = { cleanupTestManager: boolean | null };


export type CleanupTestManagerMutationVariables = Exact<{
  userId: string;
}>;


export type CleanupTestManagerMutation = CleanupTestManagerMutation_Mutation;

export type CreateTestSuperAdminMutation_createTestSuperAdmin_TestSuperAdmin = { userId: string | null, email: string | null };

export type CreateTestSuperAdminMutation_Mutation = { createTestSuperAdmin: CreateTestSuperAdminMutation_createTestSuperAdmin_TestSuperAdmin | null };


export type CreateTestSuperAdminMutationVariables = Exact<{
  prefix: string;
}>;


export type CreateTestSuperAdminMutation = CreateTestSuperAdminMutation_Mutation;

export type CleanupTestSuperAdminMutation_Mutation = { cleanupTestSuperAdmin: boolean | null };


export type CleanupTestSuperAdminMutationVariables = Exact<{
  userId: string;
}>;


export type CleanupTestSuperAdminMutation = CleanupTestSuperAdminMutation_Mutation;

export type WelcomeMessageQuery_Query = { welcomeMessage: string | null };


export type WelcomeMessageQueryVariables = Exact<{ [key: string]: never; }>;


export type WelcomeMessageQuery = WelcomeMessageQuery_Query;

export type TranslatedMessageQuery_Query = { translatedMessage: string | null };


export type TranslatedMessageQueryVariables = Exact<{
  key: string;
  namespace: string;
}>;


export type TranslatedMessageQuery = TranslatedMessageQuery_Query;

export type StudentDirectoryRowFragmentFragment = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryDetailFragmentFragment = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, parentName: string | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryQuery_studentDirectory_StudentDirectoryPayload_rows_StudentDirectoryRow = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryQuery_studentDirectory_StudentDirectoryPayload_pageInfo_PageInfo = { count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type StudentDirectoryQuery_studentDirectory_StudentDirectoryPayload = { id: string | null, totalCount: number | null, rows: Array<StudentDirectoryQuery_studentDirectory_StudentDirectoryPayload_rows_StudentDirectoryRow> | null, pageInfo: StudentDirectoryQuery_studentDirectory_StudentDirectoryPayload_pageInfo_PageInfo | null };

export type StudentDirectoryQuery_Query = { studentDirectory: StudentDirectoryQuery_studentDirectory_StudentDirectoryPayload | null };


export type StudentDirectoryQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
  orderBy: Array<Types.StudentsOrderByClause> | Types.StudentsOrderByClause | null | undefined;
  filterArgs: Types.StudentFilterArgs | null | undefined;
}>;


export type StudentDirectoryQuery = StudentDirectoryQuery_Query;

export type StudentsDirectoryQuery_studentsDirectory_StudentDirectoryRow = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentsDirectoryQuery_Query = { studentsDirectory: Array<StudentsDirectoryQuery_studentsDirectory_StudentDirectoryRow> };


export type StudentsDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
}>;


export type StudentsDirectoryQuery = StudentsDirectoryQuery_Query;

export type StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, isFrozen: boolean | null, instructor: string | null, teacherId: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession_effectiveMeeting_EffectiveMeeting | null };

export type StudentClassHistoryQuery_studentClassHistory_StudentClassHistory = { id: string | null, studentName: string | null, metrics: StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics | null, sessions: Array<StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession> | null };

export type StudentClassHistoryQuery_Query = { studentClassHistory: StudentClassHistoryQuery_studentClassHistory_StudentClassHistory | null };


export type StudentClassHistoryQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;


export type StudentClassHistoryQuery = StudentClassHistoryQuery_Query;

export type StudentClassSessionDetailQuery_studentClassSessionDetail_StudentSessionDetail_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type StudentClassSessionDetailQuery_studentClassSessionDetail_StudentSessionDetail = { id: string | null, durationMinutes: number | null, executionState: string | null, outcome: string | null, remarks: string | null, meetingJoinUrl: string | null, teacherName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, effectiveMeeting: StudentClassSessionDetailQuery_studentClassSessionDetail_StudentSessionDetail_effectiveMeeting_EffectiveMeeting | null };

export type StudentClassSessionDetailQuery_Query = { studentClassSessionDetail: StudentClassSessionDetailQuery_studentClassSessionDetail_StudentSessionDetail | null };


export type StudentClassSessionDetailQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type StudentClassSessionDetailQuery = StudentClassSessionDetailQuery_Query;

export type ReassignStudentTeacherMutation_reassignStudentTeacher_ReassignStudentTeacherResult = { id: string | null, primaryTeacherId: string | null, version: number | null };

export type ReassignStudentTeacherMutation_Mutation = { reassignStudentTeacher: ReassignStudentTeacherMutation_reassignStudentTeacher_ReassignStudentTeacherResult | null };


export type ReassignStudentTeacherMutationVariables = Exact<{
  studentId: string;
  newTeacherId: string;
  expectedVersion: number | null | undefined;
}>;


export type ReassignStudentTeacherMutation = ReassignStudentTeacherMutation_Mutation;

export type ChangeStudentStatusMutation_changeStudentStatus_ChangeStudentStatusResult = { id: string | null, status: Types.StudentStatus | null, version: number | null };

export type ChangeStudentStatusMutation_Mutation = { changeStudentStatus: ChangeStudentStatusMutation_changeStudentStatus_ChangeStudentStatusResult | null };


export type ChangeStudentStatusMutationVariables = Exact<{
  studentId: string;
  newStatus: Types.StudentStatus;
  expectedVersion: number | null | undefined;
}>;


export type ChangeStudentStatusMutation = ChangeStudentStatusMutation_Mutation;

export type CreateStudentMutation_createStudent_StudentOnboardingResult = { studentId: string | null, parentId: string | null, name: string | null, status: Types.StudentStatus | null, primaryTeacherId: string | null };

export type CreateStudentMutation_Mutation = { createStudent: CreateStudentMutation_createStudent_StudentOnboardingResult | null };


export type CreateStudentMutationVariables = Exact<{
  input: Types.StudentOnboardingInput;
}>;


export type CreateStudentMutation = CreateStudentMutation_Mutation;

export type StudentUpcomingClassFieldsFragment_StudentUpcomingClass_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type StudentUpcomingClassFieldsFragment = { id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StudentUpcomingClassFieldsFragment_StudentUpcomingClass_effectiveMeeting_EffectiveMeeting | null };

export type StudentHistoryMetricsFieldsFragment = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentHistorySessionFieldsFragment_StudentHistorySession_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type StudentHistorySessionFieldsFragment = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, isFrozen: boolean | null, instructor: string | null, teacherId: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: StudentHistorySessionFieldsFragment_StudentHistorySession_effectiveMeeting_EffectiveMeeting | null };

export type StudentProfileQuery_studentProfile_StudentProfile_upcomingClasses_StudentUpcomingClassesResult_classes_StudentUpcomingClass = { id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StudentUpcomingClassFieldsFragment_StudentUpcomingClass_effectiveMeeting_EffectiveMeeting | null };

export type StudentProfileQuery_studentProfile_StudentProfile_upcomingClasses_StudentUpcomingClassesResult = { id: string | null, studentId: string | null, studentName: string | null, status: Types.StudentStatus | null, classes: Array<StudentProfileQuery_studentProfile_StudentProfile_upcomingClasses_StudentUpcomingClassesResult_classes_StudentUpcomingClass> | null };

export type StudentProfileQuery_studentProfile_StudentProfile_classHistory_StudentClassHistory_metrics_StudentHistoryMetrics = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentProfileQuery_studentProfile_StudentProfile_classHistory_StudentClassHistory_sessions_StudentHistorySession = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, isFrozen: boolean | null, instructor: string | null, teacherId: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: StudentHistorySessionFieldsFragment_StudentHistorySession_effectiveMeeting_EffectiveMeeting | null };

export type StudentProfileQuery_studentProfile_StudentProfile_classHistory_StudentClassHistory = { id: string | null, studentName: string | null, metrics: StudentProfileQuery_studentProfile_StudentProfile_classHistory_StudentClassHistory_metrics_StudentHistoryMetrics | null, sessions: Array<StudentProfileQuery_studentProfile_StudentProfile_classHistory_StudentClassHistory_sessions_StudentHistorySession> | null };

export type StudentProfileQuery_studentProfile_StudentProfile = { id: string | null, name: string | null, status: Types.StudentStatus | null, avatarUrl: string | null, dateOfBirth: string | null, gender: Types.Gender | null, language: Types.AppLanguage | null, timezoneOverride: string | null, email: string | null, phone: string | null, timezone: Types.IanaTimezone | null, displayCurrency: Types.CurrencyCode | null, parentId: string | null, parentUserId: string | null, parentName: string | null, parentEmail: string | null, parentPhone: string | null, isAssociatedViewer: boolean | null, isOwnStudentProfile: boolean | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null, version: number | null, createdAt: string | null, updatedAt: string | null, upcomingClasses: StudentProfileQuery_studentProfile_StudentProfile_upcomingClasses_StudentUpcomingClassesResult | null, classHistory: StudentProfileQuery_studentProfile_StudentProfile_classHistory_StudentClassHistory | null };

export type StudentProfileQuery_Query = { studentProfile: StudentProfileQuery_studentProfile_StudentProfile | null };


export type StudentProfileQueryVariables = Exact<{
  studentId: string | null | undefined;
  year: number | null | undefined;
  month: number | null | undefined;
  includeUpcomingClasses: boolean | null | undefined;
}>;


export type StudentProfileQuery = StudentProfileQuery_Query;

export type RecordStudentProfileEditMutation_recordStudentProfileEdit_StudentProfile = { id: string | null, name: string | null, status: Types.StudentStatus | null, avatarUrl: string | null, dateOfBirth: string | null, gender: Types.Gender | null, language: Types.AppLanguage | null, timezoneOverride: string | null, email: string | null, phone: string | null, parentPhone: string | null, version: number | null, updatedAt: string | null };

export type RecordStudentProfileEditMutation_Mutation = { recordStudentProfileEdit: RecordStudentProfileEditMutation_recordStudentProfileEdit_StudentProfile | null };


export type RecordStudentProfileEditMutationVariables = Exact<{
  input: Types.StudentProfileEditInput;
}>;


export type RecordStudentProfileEditMutation = RecordStudentProfileEditMutation_Mutation;

export type StudentUpcomingClassesQuery_studentUpcomingClasses_StudentUpcomingClassesResult_classes_StudentUpcomingClass_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type StudentUpcomingClassesQuery_studentUpcomingClasses_StudentUpcomingClassesResult_classes_StudentUpcomingClass = { id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: StudentUpcomingClassesQuery_studentUpcomingClasses_StudentUpcomingClassesResult_classes_StudentUpcomingClass_effectiveMeeting_EffectiveMeeting | null };

export type StudentUpcomingClassesQuery_studentUpcomingClasses_StudentUpcomingClassesResult = { id: string | null, studentId: string | null, studentName: string | null, status: Types.StudentStatus | null, classes: Array<StudentUpcomingClassesQuery_studentUpcomingClasses_StudentUpcomingClassesResult_classes_StudentUpcomingClass> | null };

export type StudentUpcomingClassesQuery_Query = { studentUpcomingClasses: StudentUpcomingClassesQuery_studentUpcomingClasses_StudentUpcomingClassesResult | null };


export type StudentUpcomingClassesQueryVariables = Exact<{
  studentId: string;
}>;


export type StudentUpcomingClassesQuery = StudentUpcomingClassesQuery_Query;

export type StudentsQuery_students_StudentsWithFiltersResponse_data_Student = { id: string, name: string, avatarUrl: string | null };

export type StudentsQuery_students_StudentsWithFiltersResponse_pageInfo_PageInfo = { total: number };

export type StudentsQuery_students_StudentsWithFiltersResponse = { data: Array<StudentsQuery_students_StudentsWithFiltersResponse_data_Student>, pageInfo: StudentsQuery_students_StudentsWithFiltersResponse_pageInfo_PageInfo };

export type StudentsQuery_Query = { students: StudentsQuery_students_StudentsWithFiltersResponse };


export type StudentsQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
  orderBy: Array<Types.StudentsOrderByClause> | Types.StudentsOrderByClause | null | undefined;
  filterArgs: Types.StudentFilterArgs | null | undefined;
}>;


export type StudentsQuery = StudentsQuery_Query;

export type StudentByIdQuery_studentById_AssociatedStudent = { id: string | null, name: string | null, avatarUrl: string | null, status: Types.StudentStatus | null, primaryTeacherId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, version: number | null, updatedAt: string | null };

export type StudentByIdQuery_Query = { studentById: StudentByIdQuery_studentById_AssociatedStudent | null };


export type StudentByIdQueryVariables = Exact<{
  studentId: string;
}>;


export type StudentByIdQuery = StudentByIdQuery_Query;

export type AdminSuggestionsQuery_adminSuggestions_AdminSuggestionResult_rows_Suggestion = { id: string | null, parentId: string | null, parentUserId: string | null, submitterName: string | null, body: string | null, status: Types.SuggestionStatus | null, adminResponse: string | null, duplicateOfId: string | null, duplicateOfBody: string | null, duplicateOfSubmitterName: string | null, responseCount: number | null, emailSentAt: string | null, createdAt: string | null, parentName: string | null };

export type AdminSuggestionsQuery_adminSuggestions_AdminSuggestionResult_metrics_SuggestionMetrics = { id: string | null, pending: number | null, reviewed: number | null, duplicate: number | null, avgResponseTime: string | null, totalCount: number | null };

export type AdminSuggestionsQuery_adminSuggestions_AdminSuggestionResult = { id: string | null, rows: Array<AdminSuggestionsQuery_adminSuggestions_AdminSuggestionResult_rows_Suggestion> | null, metrics: AdminSuggestionsQuery_adminSuggestions_AdminSuggestionResult_metrics_SuggestionMetrics | null };

export type AdminSuggestionsQuery_Query = { adminSuggestions: AdminSuggestionsQuery_adminSuggestions_AdminSuggestionResult | null };


export type AdminSuggestionsQueryVariables = Exact<{
  filter: Types.SuggestionFilter;
}>;


export type AdminSuggestionsQuery = AdminSuggestionsQuery_Query;

export type SearchSuggestionsQuery_searchSuggestions_SuggestionSearchResult = { id: string | null, submitterName: string | null, body: string | null, status: Types.SuggestionStatus | null, parentName: string | null, createdAt: string | null };

export type SearchSuggestionsQuery_Query = { searchSuggestions: Array<SearchSuggestionsQuery_searchSuggestions_SuggestionSearchResult> | null };


export type SearchSuggestionsQueryVariables = Exact<{
  query: string;
  excludeId: string;
}>;


export type SearchSuggestionsQuery = SearchSuggestionsQuery_Query;

export type SubmitSuggestionMutation_submitSuggestion_Suggestion = { id: string | null, submitterName: string | null, body: string | null, createdAt: string | null };

export type SubmitSuggestionMutation_Mutation = { submitSuggestion: SubmitSuggestionMutation_submitSuggestion_Suggestion | null };


export type SubmitSuggestionMutationVariables = Exact<{
  input: Types.SubmitSuggestionInput;
}>;


export type SubmitSuggestionMutation = SubmitSuggestionMutation_Mutation;

export type MarkSuggestionReviewedMutation_markSuggestionReviewed_Suggestion = { id: string | null, emailSentAt: string | null };

export type MarkSuggestionReviewedMutation_Mutation = { markSuggestionReviewed: MarkSuggestionReviewedMutation_markSuggestionReviewed_Suggestion | null };


export type MarkSuggestionReviewedMutationVariables = Exact<{
  suggestionId: string;
}>;


export type MarkSuggestionReviewedMutation = MarkSuggestionReviewedMutation_Mutation;

export type RespondToSuggestionMutation_respondToSuggestion_Suggestion = { id: string | null, adminResponse: string | null };

export type RespondToSuggestionMutation_Mutation = { respondToSuggestion: RespondToSuggestionMutation_respondToSuggestion_Suggestion | null };


export type RespondToSuggestionMutationVariables = Exact<{
  input: Types.RespondToSuggestionInput;
}>;


export type RespondToSuggestionMutation = RespondToSuggestionMutation_Mutation;

export type MarkSuggestionDuplicateMutation_markSuggestionDuplicate_Suggestion = { id: string | null, duplicateOfId: string | null };

export type MarkSuggestionDuplicateMutation_Mutation = { markSuggestionDuplicate: MarkSuggestionDuplicateMutation_markSuggestionDuplicate_Suggestion | null };


export type MarkSuggestionDuplicateMutationVariables = Exact<{
  input: Types.MarkSuggestionDuplicateInput;
}>;


export type MarkSuggestionDuplicateMutation = MarkSuggestionDuplicateMutation_Mutation;

export type DeleteSuggestionMutation_Mutation = { deleteSuggestion: boolean | null };


export type DeleteSuggestionMutationVariables = Exact<{
  suggestionId: string;
}>;


export type DeleteSuggestionMutation = DeleteSuggestionMutation_Mutation;

export type SuggestionContributorStatsQuery_suggestionContributorStats_SuggestionContributorStats_contributors_SuggestionContributor = { id: string | null, name: string | null, suggestionCount: number | null };

export type SuggestionContributorStatsQuery_suggestionContributorStats_SuggestionContributorStats = { id: string | null, uniqueContributorCount: number | null, contributors: Array<SuggestionContributorStatsQuery_suggestionContributorStats_SuggestionContributorStats_contributors_SuggestionContributor> | null };

export type SuggestionContributorStatsQuery_Query = { suggestionContributorStats: SuggestionContributorStatsQuery_suggestionContributorStats_SuggestionContributorStats | null };


export type SuggestionContributorStatsQueryVariables = Exact<{
  days: number;
}>;


export type SuggestionContributorStatsQuery = SuggestionContributorStatsQuery_Query;

export type SupervisorDashboardQuery_supervisorDashboard_SupervisorDashboard_pendingDuesSummary_TeacherPendingDuesSummary = { totalCount: number | null, totalAmount: number | null, currency: Types.CurrencyCode | null };

export type SupervisorDashboardQuery_supervisorDashboard_SupervisorDashboard_monthlySnapshot_SupervisorMonthlySnapshot = { year: number | null, month: number | null, label: string | null };

export type SupervisorDashboardQuery_supervisorDashboard_SupervisorDashboard = { supervisorName: string | null, pendingReviewCount: number | null, pendingDuesSummary: SupervisorDashboardQuery_supervisorDashboard_SupervisorDashboard_pendingDuesSummary_TeacherPendingDuesSummary | null, monthlySnapshot: SupervisorDashboardQuery_supervisorDashboard_SupervisorDashboard_monthlySnapshot_SupervisorMonthlySnapshot | null };

export type SupervisorDashboardQuery_Query = { supervisorDashboard: SupervisorDashboardQuery_supervisorDashboard_SupervisorDashboard | null };


export type SupervisorDashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type SupervisorDashboardQuery = SupervisorDashboardQuery_Query;

export type TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_metrics_TeacherDirectoryMetrics = { id: string | null, activated: number | null, deactivated: number | null };

export type TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_rows_TeacherDirectoryRow = { id: string | null, userId: string | null, index: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: Types.AccountStatus | null };

export type TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type TeacherDirectoryQuery_teacherDirectory_TeacherDirectory = { id: string | null, totalTeachers: number | null, metrics: TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_metrics_TeacherDirectoryMetrics | null, rows: Array<TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_rows_TeacherDirectoryRow> | null, pageInfo: TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_pageInfo_PageInfo | null };

export type TeacherDirectoryQuery_Query = { teacherDirectory: TeacherDirectoryQuery_teacherDirectory_TeacherDirectory | null };


export type TeacherDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  paginationArgs: Types.PaginationArgs | null | undefined;
}>;


export type TeacherDirectoryQuery = TeacherDirectoryQuery_Query;

export type ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult_metrics_ManagerDirectoryMetrics = { id: string | null, totalAdmin: number | null, systemStaff: number | null, activeNow: number | null, alerts: number | null };

export type ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult_rows_ManagerDirectoryRow = { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, roleSlug: string | null, roleName: string | null };

export type ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number };

export type ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult = { id: string | null, totalCount: number | null, metrics: ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult_metrics_ManagerDirectoryMetrics | null, rows: Array<ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult_rows_ManagerDirectoryRow> | null, pageInfo: ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult_pageInfo_PageInfo | null };

export type ManagerDirectoryQuery_Query = { managerDirectory: ManagerDirectoryQuery_managerDirectory_ManagerDirectoryResult | null };


export type ManagerDirectoryQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
  roleFilter: string | null | undefined;
  statusFilter: string | null | undefined;
}>;


export type ManagerDirectoryQuery = ManagerDirectoryQuery_Query;

export type UpdateManagerProfileMutation_updateManagerProfile_ManagerDirectoryRow = { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, roleSlug: string | null, roleName: string | null };

export type UpdateManagerProfileMutation_Mutation = { updateManagerProfile: UpdateManagerProfileMutation_updateManagerProfile_ManagerDirectoryRow | null };


export type UpdateManagerProfileMutationVariables = Exact<{
  staffProfileId: string | number;
  input: Types.UpdateManagerProfileInput;
}>;


export type UpdateManagerProfileMutation = UpdateManagerProfileMutation_Mutation;

export type OnboardingMetricsQuery_onboardingMetrics_OnboardingMetrics = { id: string | null, activeStaff: number | null, pendingApproval: number | null, avgOnboardingDays: number | null };

export type OnboardingMetricsQuery_Query = { onboardingMetrics: OnboardingMetricsQuery_onboardingMetrics_OnboardingMetrics | null };


export type OnboardingMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingMetricsQuery = OnboardingMetricsQuery_Query;

export type StaffDirectoryAutocompleteRowFragmentFragment = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type StaffDirectoryQuery_staffDirectory_StaffDirectoryAutocompleteRow = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type StaffDirectoryQuery_Query = { staffDirectory: Array<StaffDirectoryQuery_staffDirectory_StaffDirectoryAutocompleteRow> };


export type StaffDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
  permissionGroupFilter: string | null | undefined;
}>;


export type StaffDirectoryQuery = StaffDirectoryQuery_Query;

export type CreateManagerMutation_createManager_ManagerOnboardingResult = { id: string | null, userId: string | null, staffProfileId: string | null, name: string | null, email: string | null, status: string | null, assignedGroupSlug: string | null };

export type CreateManagerMutation_Mutation = { createManager: CreateManagerMutation_createManager_ManagerOnboardingResult | null };


export type CreateManagerMutationVariables = Exact<{
  input: Types.ManagerOnboardingInput;
}>;


export type CreateManagerMutation = CreateManagerMutation_Mutation;

export type TeacherProfileForEditQuery_teacherProfileForEdit_TeacherProfileResult = { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, dateOfBirth: string | null, gender: Types.Gender | null, address: string | null, qualifications: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, status: Types.AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null };

export type TeacherProfileForEditQuery_Query = { teacherProfileForEdit: TeacherProfileForEditQuery_teacherProfileForEdit_TeacherProfileResult | null };


export type TeacherProfileForEditQueryVariables = Exact<{
  teacherId: string | number;
}>;


export type TeacherProfileForEditQuery = TeacherProfileForEditQuery_Query;

export type UpdateTeacherProfileMutation_updateTeacherProfile_TeacherProfileResult = { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, dateOfBirth: string | null, gender: Types.Gender | null, address: string | null, qualifications: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, status: Types.AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null };

export type UpdateTeacherProfileMutation_Mutation = { updateTeacherProfile: UpdateTeacherProfileMutation_updateTeacherProfile_TeacherProfileResult | null };


export type UpdateTeacherProfileMutationVariables = Exact<{
  teacherId: string | number;
  input: Types.TeacherProfileUpdateInput;
}>;


export type UpdateTeacherProfileMutation = UpdateTeacherProfileMutation_Mutation;

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics = { total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow = { id: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, yourTimeFormatted: string | null, effectiveMeeting: TeacherDashboardQuery_teacherDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow_effectiveMeeting_EffectiveMeeting | null };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_progressFeed_TeacherProgressFeedItem = { id: string | null, studentId: string | null, studentName: string | null, scheduledTimeFormatted: string | null, durationMinutes: number | null, eventKind: Types.TeacherProgressFeedEventKind | null, occurredAt: string | null };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_pageInfo_PageInfo = { count: number, currentPage: number, firstItem: number | null, lastItem: number | null, hasMorePages: boolean, lastPage: number, perPage: number, total: number };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard = { id: string | null, totalCount: number | null, metrics: TeacherDashboardQuery_teacherDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics | null, scheduleRows: Array<TeacherDashboardQuery_teacherDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow> | null, progressFeed: Array<TeacherDashboardQuery_teacherDashboard_TeacherDashboard_progressFeed_TeacherProgressFeedItem> | null, pageInfo: TeacherDashboardQuery_teacherDashboard_TeacherDashboard_pageInfo_PageInfo | null };

export type TeacherDashboardQuery_Query = { teacherDashboard: TeacherDashboardQuery_teacherDashboard_TeacherDashboard | null };


export type TeacherDashboardQueryVariables = Exact<{
  date: string;
  pagination: Types.PaginationArgs | null | undefined;
}>;


export type TeacherDashboardQuery = TeacherDashboardQuery_Query;

export type CreateTeacherManualClassEntryMutation_createTeacherManualClassEntry_ClassInstanceDetail = { id: string | null, status: Types.ClassExecutionState | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null };

export type CreateTeacherManualClassEntryMutation_Mutation = { createTeacherManualClassEntry: CreateTeacherManualClassEntryMutation_createTeacherManualClassEntry_ClassInstanceDetail | null };


export type CreateTeacherManualClassEntryMutationVariables = Exact<{
  input: Types.CreateManualClassEntryInput;
}>;


export type CreateTeacherManualClassEntryMutation = CreateTeacherManualClassEntryMutation_Mutation;

export type LogTeacherSupportRequestMutation_logTeacherSupportRequest_SupportRequestResult = { id: string | null, success: boolean | null };

export type LogTeacherSupportRequestMutation_Mutation = { logTeacherSupportRequest: LogTeacherSupportRequestMutation_logTeacherSupportRequest_SupportRequestResult | null };


export type LogTeacherSupportRequestMutationVariables = Exact<{
  input: Types.LogSupportRequestInput;
}>;


export type LogTeacherSupportRequestMutation = LogTeacherSupportRequestMutation_Mutation;

export type TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_classes_FutureClass_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_classes_FutureClass = { id: string | null, courseName: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, isRescheduled: boolean | null, leaveRequestDisabled: boolean | null, leaveRequestDisabledReason: string | null, studentCount: number | null, location: string | null, subjectId: string | null, subjectName: string | null, classType: Types.ClassType | null, executionState: string | null, outcome: string | null, meetingJoinUrl: string | null, avatarUrl: string | null, effectiveMeeting: TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_classes_FutureClass_effectiveMeeting_EffectiveMeeting | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_importantNotes_TeacherImportantNote = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_supportContact_SupportContact = { id: string | null, name: string | null, role: string | null, avatarUrl: string | null, phone: string | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule = { id: string | null, leaveQuotaUsed: number | null, leaveQuotaTotal: number | null, totalClasses: number | null, classes: Array<TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_classes_FutureClass> | null, importantNotes: Array<TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_importantNotes_TeacherImportantNote> | null, supportContact: TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_supportContact_SupportContact | null };

export type TeacherFutureScheduleQuery_Query = { teacherFutureSchedule: TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule | null };


export type TeacherFutureScheduleQueryVariables = Exact<{
  teacherId: string | null | undefined;
}>;


export type TeacherFutureScheduleQuery = TeacherFutureScheduleQuery_Query;

export type TeacherHandbookUrlQuery_teacherHandbookUrl_TeacherHandbookUrl = { id: string | null, url: string | null };

export type TeacherHandbookUrlQuery_Query = { teacherHandbookUrl: TeacherHandbookUrlQuery_teacherHandbookUrl_TeacherHandbookUrl | null };


export type TeacherHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherHandbookUrlQuery = TeacherHandbookUrlQuery_Query;

export type TeacherPendingDuesQuery_teacherPendingDues_TeacherDue = { id: string | null, teacherId: string | null, teacherName: string | null, teacherUserId: string | null, teacherAvatarUrl: string | null, classInstanceId: string | null, studentId: string | null, studentName: string | null, studentAvatarUrl: string | null, classDate: string | null, hours: string | null, amount: string | null, currency: Types.CurrencyCode | null, status: Types.TeacherDueStatus | null, approvedByUserId: string | null, approvedAt: string | null, teacherPaymentId: string | null, createdAt: string | null, updatedAt: string | null, rateSource: Types.RateSource | null };

export type TeacherPendingDuesQuery_Query = { teacherPendingDues: Array<TeacherPendingDuesQuery_teacherPendingDues_TeacherDue> | null };


export type TeacherPendingDuesQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
}>;


export type TeacherPendingDuesQuery = TeacherPendingDuesQuery_Query;

export type TeacherPendingDuesSummaryQuery_teacherPendingDuesSummary_TeacherPendingDuesSummary = { totalCount: number | null, totalAmount: number | null, currency: Types.CurrencyCode | null };

export type TeacherPendingDuesSummaryQuery_Query = { teacherPendingDuesSummary: TeacherPendingDuesSummaryQuery_teacherPendingDuesSummary_TeacherPendingDuesSummary | null };


export type TeacherPendingDuesSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherPendingDuesSummaryQuery = TeacherPendingDuesSummaryQuery_Query;

export type TeacherMonthlyReportQuery_teacherMonthlyReport_TeacherMonthlyReport = { teacherId: string | null, teacherName: string | null, year: number | null, month: number | null, lessonsTaught: number | null, approvedCount: number | null, cancelledCount: number | null, totalAccruedHours: number | null, totalDueAmount: number | null, totalPaidAmount: number | null, currency: Types.CurrencyCode | null };

export type TeacherMonthlyReportQuery_Query = { teacherMonthlyReport: TeacherMonthlyReportQuery_teacherMonthlyReport_TeacherMonthlyReport | null };


export type TeacherMonthlyReportQueryVariables = Exact<{
  teacherId: string | number;
  year: number;
  month: number;
}>;


export type TeacherMonthlyReportQuery = TeacherMonthlyReportQuery_Query;

export type MarkTeacherDuesPaidMutation_markTeacherDuesPaid_TeacherDue = { id: string | null, teacherId: string | null, teacherName: string | null, teacherUserId: string | null, teacherAvatarUrl: string | null, classInstanceId: string | null, studentId: string | null, studentName: string | null, studentAvatarUrl: string | null, classDate: string | null, hours: string | null, amount: string | null, currency: Types.CurrencyCode | null, status: Types.TeacherDueStatus | null, approvedByUserId: string | null, approvedAt: string | null, teacherPaymentId: string | null, createdAt: string | null, updatedAt: string | null };

export type MarkTeacherDuesPaidMutation_Mutation = { markTeacherDuesPaid: Array<MarkTeacherDuesPaidMutation_markTeacherDuesPaid_TeacherDue> | null };


export type MarkTeacherDuesPaidMutationVariables = Exact<{
  dueIds: Array<string | number> | string | number;
  teacherPaymentId: string | number;
}>;


export type MarkTeacherDuesPaidMutation = MarkTeacherDuesPaidMutation_Mutation;

export type TeacherImportantNoteFieldsFragment = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type CreateTeacherImportantNoteMutation_createTeacherImportantNote_TeacherImportantNote = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type CreateTeacherImportantNoteMutation_Mutation = { createTeacherImportantNote: CreateTeacherImportantNoteMutation_createTeacherImportantNote_TeacherImportantNote | null };


export type CreateTeacherImportantNoteMutationVariables = Exact<{
  input: Types.CreateTeacherNoteInput;
}>;


export type CreateTeacherImportantNoteMutation = CreateTeacherImportantNoteMutation_Mutation;

export type UpdateTeacherImportantNoteMutation_updateTeacherImportantNote_TeacherImportantNote = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type UpdateTeacherImportantNoteMutation_Mutation = { updateTeacherImportantNote: UpdateTeacherImportantNoteMutation_updateTeacherImportantNote_TeacherImportantNote | null };


export type UpdateTeacherImportantNoteMutationVariables = Exact<{
  id: string | number;
  input: Types.UpdateTeacherNoteInput;
}>;


export type UpdateTeacherImportantNoteMutation = UpdateTeacherImportantNoteMutation_Mutation;

export type DeleteTeacherImportantNoteMutation_Mutation = { deleteTeacherImportantNote: boolean | null };


export type DeleteTeacherImportantNoteMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTeacherImportantNoteMutation = DeleteTeacherImportantNoteMutation_Mutation;

export type CreateTeacherMutation_createTeacher_TeacherOnboarding = { userId: string | null, id: string | null, name: string | null, email: string | null, status: string | null, gender: Types.Gender | null, timezoneDisplay: string | null };

export type CreateTeacherMutation_Mutation = { createTeacher: CreateTeacherMutation_createTeacher_TeacherOnboarding | null };


export type CreateTeacherMutationVariables = Exact<{
  input: Types.TeacherOnboardingInput;
}>;


export type CreateTeacherMutation = CreateTeacherMutation_Mutation;

export type TeacherAssignedStudentsQuery_teacherAssignedStudents_TeacherAssignedStudentsResult_rows_TeacherAssignedStudent = { id: string | null, name: string | null, status: Types.StudentStatus | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null };

export type TeacherAssignedStudentsQuery_teacherAssignedStudents_TeacherAssignedStudentsResult = { id: string | null, totalCount: number | null, rows: Array<TeacherAssignedStudentsQuery_teacherAssignedStudents_TeacherAssignedStudentsResult_rows_TeacherAssignedStudent> | null };

export type TeacherAssignedStudentsQuery_Query = { teacherAssignedStudents: TeacherAssignedStudentsQuery_teacherAssignedStudents_TeacherAssignedStudentsResult | null };


export type TeacherAssignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherAssignedStudentsQuery = TeacherAssignedStudentsQuery_Query;

export type TeacherOwnProfileQuery_teacherOwnProfile_TeacherOwnProfile_displayAmount_DisplayAmount = { id: string | null, amount: string | null, currency: Types.CurrencyCode | null, stale: boolean | null };

export type TeacherOwnProfileQuery_teacherOwnProfile_TeacherOwnProfile = { id: string | null, name: string | null, email: string | null, phone: string | null, timezone: Types.IanaTimezone | null, hourlyRate: string | null, rateCurrency: Types.CurrencyCode | null, displayAmount: TeacherOwnProfileQuery_teacherOwnProfile_TeacherOwnProfile_displayAmount_DisplayAmount | null };

export type TeacherOwnProfileQuery_Query = { teacherOwnProfile: TeacherOwnProfileQuery_teacherOwnProfile_TeacherOwnProfile | null };


export type TeacherOwnProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherOwnProfileQuery = TeacherOwnProfileQuery_Query;

export type TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult_rows_TeacherAssignedClass_effectiveMeeting_EffectiveMeeting = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: Types.EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult_rows_TeacherAssignedClass = { id: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: Types.ClassExecutionState | null, outcome: Types.ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult_rows_TeacherAssignedClass_effectiveMeeting_EffectiveMeeting | null };

export type TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult = { id: string | null, totalCount: number | null, rows: Array<TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult_rows_TeacherAssignedClass> | null };

export type TeacherAssignedClassesQuery_Query = { teacherAssignedClasses: TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult | null };


export type TeacherAssignedClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherAssignedClassesQuery = TeacherAssignedClassesQuery_Query;

export type TeachersQuery_teachers_TeacherSimple = { id: string | null, name: string | null, avatarUrl: string | null };

export type TeachersQuery_Query = { teachers: Array<TeachersQuery_teachers_TeacherSimple> | null };


export type TeachersQueryVariables = Exact<{
  search: string;
  limit: number;
}>;


export type TeachersQuery = TeachersQuery_Query;

export type UserFieldsFragmentFragment = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: Types.AccountStatus | null, permissions: Array<Types.AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: Types.CurrencyCode | null };
