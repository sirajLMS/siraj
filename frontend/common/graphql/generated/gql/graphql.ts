/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  effectiveFrom: string | null | undefined;
  effectiveUntil: string | null | undefined;
  generateInstancesForWeeks: number | null | undefined;
  hourlyRate: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
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
  | 'database'
  | 'env';

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
  | 'approved'
  | 'pending'
  | 'rejected';

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
  | 'PAYMENT_METHOD_CHANGED'
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
  | 'activated'
  | 'auto_missed'
  | 'completed'
  | 'leave'
  | 'marked_absent'
  | 'other'
  | 'started';

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

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null } | null };

export type UserQueryVariables = Exact<{
  id: string;
}>;


export type UserQuery = { user: { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null } | null };

export type UsersQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
  offset: number | null | undefined;
}>;


export type UsersQuery = { users: Array<{ id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null }> | null };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { token: string | null, user: { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null } | null } | null };

export type DemoLoginMutationVariables = Exact<{
  input: DemoLoginInput;
}>;


export type DemoLoginMutation = { demoLogin: { token: string | null, user: { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null } | null } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean | null };

export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = { refreshToken: { token: string | null, user: { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null } | null } | null };

export type ImpersonationStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type ImpersonationStatusQuery = { impersonationStatus: { isActive: boolean | null, startedAt: string | null, expiresAt: string | null, reason: string | null, targetUser: { id: string | null, name: string | null, email: string | null } | null, actorUser: { id: string | null, name: string | null, email: string | null } | null } | null };

export type StartImpersonationMutationVariables = Exact<{
  targetUserId: string;
  reason: string | null | undefined;
}>;


export type StartImpersonationMutation = { startImpersonation: { token: string | null, expiresAt: string | null, impersonationSessionId: string | null, targetUser: { id: string | null, name: string | null, email: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, phone: string | null, status: AccountStatus | null, displayCurrency: CurrencyCode | null } | null } | null };

export type EndImpersonationMutationVariables = Exact<{ [key: string]: never; }>;


export type EndImpersonationMutation = { endImpersonation: { token: string | null } | null };

export type PermissionGroupSimulationStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionGroupSimulationStatusQuery = { permissionGroupSimulationStatus: { isActive: boolean | null, groupSlug: string | null, groupName: string | null, startedAt: string | null, expiresAt: string | null } | null };

export type SimulatablePermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type SimulatablePermissionGroupsQuery = { simulatablePermissionGroups: Array<{ slug: string | null, name: string | null, description: string | null }> | null };

export type StartPermissionGroupSimulationMutationVariables = Exact<{
  groupSlug: string;
}>;


export type StartPermissionGroupSimulationMutation = { startPermissionGroupSimulation: { token: string | null, expiresAt: string | null, groupSlug: string | null } | null };

export type EndPermissionGroupSimulationMutationVariables = Exact<{ [key: string]: never; }>;


export type EndPermissionGroupSimulationMutation = { endPermissionGroupSimulation: { token: string | null } | null };

export type ChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInput;
}>;


export type ChangePasswordMutation = { changePassword: boolean | null };

export type UnpaidInvoicesAlertQueryVariables = Exact<{ [key: string]: never; }>;


export type UnpaidInvoicesAlertQuery = { unpaidInvoicesAlert: { id: string | null, totalOverdueInvoices: number | null, totalOverdueAmount: string | null, overdueAmountsByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null, items: Array<{ id: string | null, userId: string | null, userName: string | null, userEmail: string | null, totalUnpaidAmount: string | null, currency: CurrencyCode | null, overdueCount: number | null, oldestDueDate: string | null, amountsByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null }> | null } | null };

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


export type CreateManualInvoiceMutation = { createManualInvoice: { id: string | null, parentId: string | null, studentId: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, version: number | null, createdAt: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null };

export type MarkInvoicePaidMutationVariables = Exact<{
  invoiceId: string;
  proofFileId: string | number;
  expectedVersion: number | null | undefined;
}>;


export type MarkInvoicePaidMutation = { markInvoicePaid: { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null } | null };

export type SubmitPaymentProofMutationVariables = Exact<{
  invoiceId: string;
  proofFileId: string | number;
  expectedVersion: number | null | undefined;
}>;


export type SubmitPaymentProofMutation = { submitPaymentProof: { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null } | null };

export type ApprovePaymentProofMutationVariables = Exact<{
  invoiceId: string;
  expectedVersion: number | null | undefined;
}>;


export type ApprovePaymentProofMutation = { approvePaymentProof: { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null } | null };

export type RejectPaymentProofMutationVariables = Exact<{
  invoiceId: string;
  rejectionReason: string | null | undefined;
  expectedVersion: number | null | undefined;
}>;


export type RejectPaymentProofMutation = { rejectPaymentProof: { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null } | null };

export type InvoicePaymentSubmissionQueryVariables = Exact<{
  invoiceId: string;
}>;


export type InvoicePaymentSubmissionQuery = { invoicePaymentSubmission: { id: string | null, invoiceId: string | null, fileId: string | null, filePath: string | null, mimeType: string | null, status: InvoicePaymentSubmissionStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null } | null };

export type DeleteInvoiceMutationVariables = Exact<{
  invoiceId: string;
}>;


export type DeleteInvoiceMutation = { deleteInvoice: { id: string | null, parentId: string | null, version: number | null, notificationSummaryUpdated: boolean | null } | null };

export type SendPaymentReminderMutationVariables = Exact<{
  studentId: string;
}>;


export type SendPaymentReminderMutation = { sendPaymentReminder: { id: string | null, success: boolean | null } | null };

export type InvoicePaymentsQueryVariables = Exact<{
  invoiceId: string | number;
}>;


export type InvoicePaymentsQuery = { invoicePayments: Array<{ id: string | null, invoiceId: string | null, amount: string | null, currency: CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: PaymentMethodType | null, transactionId: string | null, createdAt: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null, paymentMethodSnapshot: { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null, catalog: { catalogId: string | null, catalogSlug: string | null, catalogName: Partial<Record<'ar' | 'en', string>> | null } | null } | null }> | null };

export type RecordPaymentMutationVariables = Exact<{
  invoiceId: string | number;
  amount: string;
  currency: CurrencyCode;
  userPaymentMethodId: string | number;
  transactionId: string | null | undefined;
}>;


export type RecordPaymentMutation = { recordPayment: { id: string | null, invoiceId: string | null, amount: string | null, currency: CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: PaymentMethodType | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null, paymentMethodSnapshot: { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null, catalog: { catalogId: string | null, catalogSlug: string | null, catalogName: Partial<Record<'ar' | 'en', string>> | null } | null } | null } | null };

export type CreateTeacherPaymentMutationVariables = Exact<{
  teacherId: string | number;
  amount: string;
  currency: CurrencyCode;
  userPaymentMethodId: string | number;
  paymentDate: string | null | undefined;
  isTestPayment: boolean | null | undefined;
}>;


export type CreateTeacherPaymentMutation = { createTeacherPayment: { id: string | null, teacherId: string | null, amount: string | null, currency: CurrencyCode | null, paymentDate: string | null, userPaymentMethodId: string | null, paymentMethodType: PaymentMethodType | null, isTestPayment: boolean | null, paymentMethodSnapshot: { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null, catalog: { catalogId: string | null, catalogSlug: string | null, catalogName: Partial<Record<'ar' | 'en', string>> | null } | null } | null } | null };

export type StudentCreditBalanceQueryVariables = Exact<{
  studentId: string | number;
}>;


export type StudentCreditBalanceQuery = { studentCreditBalance: { studentId: string | null, classesRemaining: number | null, classesTotal: number | null } | null };

export type StudentCreditTransactionsQueryVariables = Exact<{
  studentId: string | number;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type StudentCreditTransactionsQuery = { studentCreditTransactions: Array<{ id: string | null, studentId: string | null, changeAmount: number | null, reason: CreditReason | null, sourcePaymentId: string | null, classInstanceId: string | null, notes: string | null, creditedByUserId: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null }> | null };

export type RecordCreditPurchaseMutationVariables = Exact<{
  studentId: string | number;
  hours: number;
  notes: string | null | undefined;
}>;


export type RecordCreditPurchaseMutation = { recordCreditPurchase: { id: string | null, studentId: string | null, changeAmount: number | null, reason: CreditReason | null, sourcePaymentId: string | null, classInstanceId: string | null, notes: string | null, creditedByUserId: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type SupportedCurrencyFieldsFragment = { code: CurrencyCode | null, symbol: string | null, countryCode: CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null };

export type SupportedCurrenciesQueryVariables = Exact<{
  activeOnly: boolean | null | undefined;
}>;


export type SupportedCurrenciesQuery = { supportedCurrencies: Array<{ code: CurrencyCode | null, symbol: string | null, countryCode: CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null }> | null };

export type ActivateSupportedCurrencyMutationVariables = Exact<{
  input: SupportedCurrencyUpsertInput;
}>;


export type ActivateSupportedCurrencyMutation = { activateSupportedCurrency: { code: CurrencyCode | null, symbol: string | null, countryCode: CountryCode | null, decimals: number | null, sortOrder: number | null, isActive: boolean | null } | null };

export type DeactivateSupportedCurrencyMutationVariables = Exact<{
  code: CurrencyCode;
}>;


export type DeactivateSupportedCurrencyMutation = { deactivateSupportedCurrency: boolean | null };

export type LatestExchangeRatesQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type LatestExchangeRatesQuery = { latestExchangeRates: Array<{ id: string | null, fromCurrency: string | null, toCurrency: string | null, rate: string | null, source: string | null, effectiveDate: string | null }> | null };

export type ExchangeRateHistoryQueryVariables = Exact<{
  from: CurrencyCode;
  to: CurrencyCode;
  paginationArgs: PaginationArgs | null | undefined;
  maxDays: number | null | undefined;
}>;


export type ExchangeRateHistoryQuery = { exchangeRateHistory: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, fromCurrency: CurrencyCode | null, toCurrency: CurrencyCode | null, rate: string | null, source: string | null, effectiveDate: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, lastItem: number | null, hasMorePages: boolean, lastPage: number, perPage: number, total: number } | null } | null };

export type LatestFxSyncRunQueryVariables = Exact<{ [key: string]: never; }>;


export type LatestFxSyncRunQuery = { latestFxSyncRun: { id: string | null, provider: FxProvider | null, status: FxSyncStatus | null, pairsWritten: string | null, pairsFailed: string | null, errorMessage: string | null, triggerType: string | null, triggeredByUserId: string | null, startedAt: string | null, finishedAt: string | null } | null };

export type RefreshExchangeRatesMutationVariables = Exact<{
  force: boolean | null | undefined;
}>;


export type RefreshExchangeRatesMutation = { refreshExchangeRates: { id: string | null, success: boolean | null, pairsWritten: number | null, pairsFailed: number | null, syncRunId: string | null, errorMessage: string | null } | null };

export type FxSyncHealthQueryVariables = Exact<{ [key: string]: never; }>;


export type FxSyncHealthQuery = { fxSyncHealth: { id: string | null, isStale: boolean | null, status: FxSyncStatus | null, finishedAt: string | null } | null };

export type FxProviderConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type FxProviderConfigQuery = { fxProviderConfig: { id: string | null, activeProvider: FxProvider | null, source: FxProviderConfigSource | null, updatedAt: string | null, updatedByUserId: string | null, updatedByName: string | null } | null };

export type UpdateFxProviderMutationVariables = Exact<{
  provider: FxProvider;
}>;


export type UpdateFxProviderMutation = { updateFxProvider: { id: string | null, activeProvider: FxProvider | null, source: FxProviderConfigSource | null, updatedAt: string | null, updatedByUserId: string | null, updatedByName: string | null } | null };

export type UpsertManualExchangeRateMutationVariables = Exact<{
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: string;
  effectiveDate: string | null | undefined;
}>;


export type UpsertManualExchangeRateMutation = { upsertManualExchangeRate: { id: string | null, rate: { id: string | null, fromCurrency: string | null, toCurrency: string | null, rate: string | null, source: string | null, effectiveDate: string | null } | null } | null };

export type CurrencyHedgesQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrencyHedgesQuery = { currencyHedges: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null }> | null };

export type CreateCurrencyHedgeMutationVariables = Exact<{
  currency: CurrencyCode;
  amount: string;
  hedgeType: string;
  notes: string | null | undefined;
}>;


export type CreateCurrencyHedgeMutation = { createCurrencyHedge: { id: string | null, currency: CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type UpdateCurrencyHedgeMutationVariables = Exact<{
  id: string;
  currency: CurrencyCode | null | undefined;
  amount: string | null | undefined;
  hedgeType: string | null | undefined;
  notes: string | null | undefined;
}>;


export type UpdateCurrencyHedgeMutation = { updateCurrencyHedge: { id: string | null, currency: CurrencyCode | null, amount: string | null, hedgeType: string | null, notes: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type DeleteCurrencyHedgeMutationVariables = Exact<{
  id: string;
}>;


export type DeleteCurrencyHedgeMutation = { deleteCurrencyHedge: boolean | null };

export type PaymentMethodDetailsFieldsFragment = { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null };

export type PaymentMethodTransactionSnapshotFieldsFragment = { userPaymentMethodId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, label: string | null, snapshottedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null, catalog: { catalogId: string | null, catalogSlug: string | null, catalogName: Partial<Record<'ar' | 'en', string>> | null } | null };

export type UserPaymentMethodFieldsFragment = { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null };

export type PaymentMethodDefaultsFieldsFragment = { payinDefault: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null, payoutDefault: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null };

export type SupportedMobileWalletFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedPaymentLinkFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type SupportedOnlineAccountFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null };

export type UserPaymentMethodsQueryVariables = Exact<{
  userId: string | number;
  direction: PaymentDirection | null | undefined;
}>;


export type UserPaymentMethodsQuery = { userPaymentMethods: Array<{ id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null }> | null };

export type UserPaymentMethodQueryVariables = Exact<{
  id: string | number;
}>;


export type UserPaymentMethodQuery = { userPaymentMethod: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null };

export type SupportedMobileWalletsQueryVariables = Exact<{
  countryCode: CountryCode | null | undefined;
  direction: PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;


export type SupportedMobileWalletsQuery = { supportedMobileWallets: Array<{ id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null }> | null };

export type SupportedPaymentLinksQueryVariables = Exact<{
  direction: PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;


export type SupportedPaymentLinksQuery = { supportedPaymentLinks: Array<{ id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null }> | null };

export type SupportedOnlineAccountsQueryVariables = Exact<{
  direction: PaymentDirection | null | undefined;
  activeOnly: boolean | null | undefined;
}>;


export type SupportedOnlineAccountsQuery = { supportedOnlineAccounts: Array<{ id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null }> | null };

export type CreateUserPaymentMethodMutationVariables = Exact<{
  input: UserPaymentMethodCreateInput;
}>;


export type CreateUserPaymentMethodMutation = { createUserPaymentMethod: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null };

export type UpdateUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
  input: UserPaymentMethodUpdateInput;
}>;


export type UpdateUserPaymentMethodMutation = { updateUserPaymentMethod: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null };

export type DeleteUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteUserPaymentMethodMutation = { deleteUserPaymentMethod: boolean | null };

export type SetDefaultUserPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;


export type SetDefaultUserPaymentMethodMutation = { setDefaultUserPaymentMethod: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null };

export type VerifyBankTransferPaymentMethodMutationVariables = Exact<{
  id: string | number;
}>;


export type VerifyBankTransferPaymentMethodMutation = { verifyBankTransferPaymentMethod: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null };

export type CreateSupportedMobileWalletMutationVariables = Exact<{
  input: SupportedMobileWalletCreateInput;
}>;


export type CreateSupportedMobileWalletMutation = { createSupportedMobileWallet: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type UpdateSupportedMobileWalletMutationVariables = Exact<{
  id: string | number;
  input: SupportedMobileWalletUpdateInput;
}>;


export type UpdateSupportedMobileWalletMutation = { updateSupportedMobileWallet: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type DeactivateSupportedMobileWalletMutationVariables = Exact<{
  id: string | number;
}>;


export type DeactivateSupportedMobileWalletMutation = { deactivateSupportedMobileWallet: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, countryCode: string | null, currencyCode: string | null, phoneRegion: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type CreateSupportedPaymentLinkMutationVariables = Exact<{
  input: SupportedPaymentLinkCreateInput;
}>;


export type CreateSupportedPaymentLinkMutation = { createSupportedPaymentLink: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type UpdateSupportedPaymentLinkMutationVariables = Exact<{
  id: string | number;
  input: SupportedPaymentLinkUpdateInput;
}>;


export type UpdateSupportedPaymentLinkMutation = { updateSupportedPaymentLink: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type DeactivateSupportedPaymentLinkMutationVariables = Exact<{
  id: string | number;
}>;


export type DeactivateSupportedPaymentLinkMutation = { deactivateSupportedPaymentLink: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type CreateSupportedOnlineAccountMutationVariables = Exact<{
  input: SupportedOnlineAccountCreateInput;
}>;


export type CreateSupportedOnlineAccountMutation = { createSupportedOnlineAccount: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type UpdateSupportedOnlineAccountMutationVariables = Exact<{
  id: string | number;
  input: SupportedOnlineAccountUpdateInput;
}>;


export type UpdateSupportedOnlineAccountMutation = { updateSupportedOnlineAccount: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type DeactivateSupportedOnlineAccountMutationVariables = Exact<{
  id: string | number;
}>;


export type DeactivateSupportedOnlineAccountMutation = { deactivateSupportedOnlineAccount: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, identifierKind: IdentifierKind | null, identifierLabel: Partial<Record<'ar' | 'en', string>> | null, supportedDirections: PaymentDirection | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null } | null };

export type UserBillingProfileSummaryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
}>;


export type UserBillingProfileSummaryQuery = { parentBillingSummary: { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null, pendingPaymentCount: number | null, nextUnpaidInvoice: { id: string | null, amount: string | null, currency: CurrencyCode | null, dueDate: string | null, studentName: string | null } | null, outstandingByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null, paidThisTermByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null } | null };

export type UserBillingProfileInvoiceHistoryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;


export type UserBillingProfileInvoiceHistoryQuery = { parentInvoiceHistory: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type ClassCategoryFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null };

export type ClassCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type ClassCategoriesQuery = { classCategories: Array<{ id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null }> | null };

export type CreateClassCategoryMutationVariables = Exact<{
  input: ClassCategoryCreateInput;
}>;


export type CreateClassCategoryMutation = { createClassCategory: { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null } | null };

export type UpdateClassCategoryMutationVariables = Exact<{
  id: string | number;
  input: ClassCategoryUpdateInput;
}>;


export type UpdateClassCategoryMutation = { updateClassCategory: { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null } | null };

export type DeleteClassCategoryMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteClassCategoryMutation = { deleteClassCategory: boolean | null };

export type ClassSubjectFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, category: { id: string | null, name: string | null, slug: string | null } | null };

export type SubjectResourceFieldsFragment = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectsQueryVariables = Exact<{
  categoryId: string | null | undefined;
}>;


export type ClassSubjectsQuery = { classSubjects: Array<{ id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, resources: Array<{ id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null }> | null, category: { id: string | null, name: string | null, slug: string | null } | null }> | null };

export type ClassSubjectByIdQueryVariables = Exact<{
  id: string | number;
}>;


export type ClassSubjectByIdQuery = { classSubject: { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, resources: Array<{ id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null }> | null, category: { id: string | null, name: string | null, slug: string | null } | null } | null };

export type CreateClassSubjectMutationVariables = Exact<{
  input: ClassSubjectCreateInput;
}>;


export type CreateClassSubjectMutation = { createClassSubject: { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, category: { id: string | null, name: string | null, slug: string | null } | null } | null };

export type UpdateClassSubjectMutationVariables = Exact<{
  id: string | number;
  input: ClassSubjectUpdateInput;
}>;


export type UpdateClassSubjectMutation = { updateClassSubject: { id: string | null, name: string | null, slug: string | null, description: string | null, avatarUrl: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, category: { id: string | null, name: string | null, slug: string | null } | null } | null };

export type DeleteClassSubjectMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteClassSubjectMutation = { deleteClassSubject: boolean | null };

export type AttachSubjectResourceMutationVariables = Exact<{
  input: AttachSubjectResourceInput;
}>;


export type AttachSubjectResourceMutation = { attachSubjectResource: { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null } | null };

export type DetachSubjectResourceMutationVariables = Exact<{
  subjectId: string | number;
  learningResourceId: string | number;
}>;


export type DetachSubjectResourceMutation = { detachSubjectResource: boolean | null };

export type GroupClassAuditQueryVariables = Exact<{
  classInstanceId: string;
}>;


export type GroupClassAuditQuery = { groupClassAudit: { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<{ id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: GroupClassAttendanceStatus | null, avatarUrl: string | null }> | null, meetingInfo: { platform: string | null, meetingId: string | null, joinUrl: string | null, logoUrl: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, source: string | null } | null, communications: Array<{ id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null }> | null, adminNote: { content: string | null, lastUpdated: string | null } | null } | null };

export type UpdateClassAdminNoteMutationVariables = Exact<{
  classInstanceId: string;
  content: string;
}>;


export type UpdateClassAdminNoteMutation = { updateClassAdminNote: { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<{ id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: GroupClassAttendanceStatus | null, avatarUrl: string | null }> | null, meetingInfo: { platform: string | null, meetingId: string | null, joinUrl: string | null, logoUrl: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, source: string | null } | null, communications: Array<{ id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null }> | null, adminNote: { content: string | null, lastUpdated: string | null } | null } | null };

export type ResendClassNotificationsMutationVariables = Exact<{
  classInstanceId: string;
}>;


export type ResendClassNotificationsMutation = { resendClassNotifications: { id: string | null, success: boolean | null } | null };

export type LessonReportQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type LessonReportQuery = { lessonReport: { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type LessonReportByIdQueryVariables = Exact<{
  reportId: string | number;
}>;


export type LessonReportByIdQuery = { lessonReportById: { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type PendingLessonReportsQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
  studentId: string | number | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type PendingLessonReportsQuery = { pendingLessonReports: { totalCount: number | null, rows: Array<{ id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null }> | null } | null };

export type RecentApprovedLessonReportsQueryVariables = Exact<{
  limit: number | null | undefined;
}>;


export type RecentApprovedLessonReportsQuery = { recentApprovedLessonReports: Array<{ id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null }> | null };

export type StudentRecentLessonReportsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type StudentRecentLessonReportsQuery = { studentRecentLessonReports: { totalCount: number | null, rows: Array<{ id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null }> | null } | null };

export type LessonReportCountQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
  studentId: string | number | null | undefined;
}>;


export type LessonReportCountQuery = { lessonReportCount: { pendingCount: number | null } | null };

export type SubmitLessonReportMutationVariables = Exact<{
  classInstanceId: string | number;
  input: LessonReportSubmitInput;
}>;


export type SubmitLessonReportMutation = { submitLessonReport: { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type ApproveLessonReportMutationVariables = Exact<{
  reportId: string | number;
}>;


export type ApproveLessonReportMutation = { approveLessonReport: { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type RejectLessonReportMutationVariables = Exact<{
  reportId: string | number;
  rejectionReason: string;
}>;


export type RejectLessonReportMutation = { rejectLessonReport: { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type SubmitStudentLessonReportReflectionMutationVariables = Exact<{
  classInstanceId: string | number;
  studentNotes: string;
}>;


export type SubmitStudentLessonReportReflectionMutation = { submitStudentLessonReportReflection: { id: string | null, classInstanceId: string | null, studentId: string | null, teacherId: string | null, teacherName: string | null, studentName: string | null, subjectName: string | null, classAvatarUrl: string | null, teacherAvatarUrl: string | null, studentAvatarUrl: string | null, teacherUserId: string | null, studentUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedByUserId: string | null, submittedAt: string | null, reviewedByUserId: string | null, reviewedAt: string | null, rejectionReason: string | null, idempotencyKey: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type ParentComplaintsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type ParentComplaintsQuery = { parentComplaints: { id: string | null, totalCount: number | null, complaints: Array<{ id: string | null, category: ComplaintCategory | null, body: string | null, status: ComplaintStatus | null, createdAt: string | null, studentName: string | null, responses: Array<{ id: string | null, body: string | null, emailSent: boolean | null, createdAt: string | null, responderName: string | null }> | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type AdminComplaintQueueQueryVariables = Exact<{
  filter: ComplaintQueueFilter;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type AdminComplaintQueueQuery = { adminComplaintQueue: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, category: ComplaintCategory | null, body: string | null, status: ComplaintStatus | null, createdAt: string | null, parentName: string | null, parentAvatarUrl: string | null, studentName: string | null, responses: Array<{ id: string | null, body: string | null, createdAt: string | null, responderName: string | null, emailSent: boolean | null }> | null }> | null, metrics: { id: string | null, unanswered: number | null, answered: number | null, avgResolutionTime: string | null } | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type SubmitComplaintMutationVariables = Exact<{
  input: ComplaintSubmitInput;
}>;


export type SubmitComplaintMutation = { submitComplaint: { id: string | null, category: ComplaintCategory | null, body: string | null, status: ComplaintStatus | null, createdAt: string | null } | null };

export type RespondToComplaintMutationVariables = Exact<{
  input: RespondToComplaintInput;
}>;


export type RespondToComplaintMutation = { respondToComplaint: { id: string | null, body: string | null, emailSent: boolean | null, createdAt: string | null, responderName: string | null } | null };

export type DeleteComplaintMutationVariables = Exact<{
  complaintId: string;
}>;


export type DeleteComplaintMutation = { deleteComplaint: boolean | null };

export type MeetingProviderFieldsFragment = { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null };

export type UserMeetingConfigFieldsFragment = { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null };

export type MeetingProvidersQueryVariables = Exact<{
  activeOnly: boolean | null | undefined;
}>;


export type MeetingProvidersQuery = { meetingProviders: Array<{ id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null }> | null };

export type MeetingProviderQueryVariables = Exact<{
  id: string | number;
}>;


export type MeetingProviderQuery = { meetingProvider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null };

export type UserMeetingConfigsQueryVariables = Exact<{
  userId: string | number;
}>;


export type UserMeetingConfigsQuery = { userMeetingConfigs: Array<{ id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null }> | null };

export type UserMeetingConfigQueryVariables = Exact<{
  id: string | number;
}>;


export type UserMeetingConfigQuery = { userMeetingConfig: { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null } | null };

export type CreateMeetingProviderMutationVariables = Exact<{
  input: MeetingProviderCreateInput;
}>;


export type CreateMeetingProviderMutation = { createMeetingProvider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null };

export type UpdateMeetingProviderMutationVariables = Exact<{
  id: string | number;
  input: MeetingProviderUpdateInput;
}>;


export type UpdateMeetingProviderMutation = { updateMeetingProvider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null };

export type DeleteMeetingProviderMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteMeetingProviderMutation = { deleteMeetingProvider: boolean | null };

export type CreateUserMeetingConfigMutationVariables = Exact<{
  input: UserMeetingConfigCreateInput;
}>;


export type CreateUserMeetingConfigMutation = { createUserMeetingConfig: { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null } | null };

export type UpdateUserMeetingConfigMutationVariables = Exact<{
  id: string | number;
  input: UserMeetingConfigUpdateInput;
}>;


export type UpdateUserMeetingConfigMutation = { updateUserMeetingConfig: { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null } | null };

export type DeleteUserMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteUserMeetingConfigMutation = { deleteUserMeetingConfig: boolean | null };

export type SetDefaultMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type SetDefaultMeetingConfigMutation = { setDefaultMeetingConfig: { id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null } | null };

export type ClassMeetingConfigFieldsFragment = { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null };

export type EffectiveMeetingFieldsFragment = { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null };

export type ClassMeetingConfigsQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ClassMeetingConfigsQuery = { classMeetingConfigs: Array<{ id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null }> | null };

export type RecurringMeetingConfigsQueryVariables = Exact<{
  recurringScheduleId: string | number;
}>;


export type RecurringMeetingConfigsQuery = { recurringMeetingConfigs: Array<{ id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null }> | null };

export type CreateClassMeetingConfigMutationVariables = Exact<{
  input: ClassMeetingConfigCreateInput;
}>;


export type CreateClassMeetingConfigMutation = { createClassMeetingConfig: { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null } | null };

export type UpdateClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
  input: ClassMeetingConfigUpdateInput;
}>;


export type UpdateClassMeetingConfigMutation = { updateClassMeetingConfig: { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null } | null };

export type DeleteClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteClassMeetingConfigMutation = { deleteClassMeetingConfig: boolean | null };

export type SetDefaultClassMeetingConfigMutationVariables = Exact<{
  id: string | number;
}>;


export type SetDefaultClassMeetingConfigMutation = { setDefaultClassMeetingConfig: { id: string | null, classInstanceId: string | null, recurringScheduleId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, createdAt: string | null, updatedAt: string | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null, description: Partial<Record<'ar' | 'en', string>> | null, instructions: Partial<Record<'ar' | 'en', string>> | null, urlAllowlist: Array<string> | null, urlExample: string | null, logoUrl: string | null, isActive: boolean | null, createdAt: string | null, updatedAt: string | null, fieldSchema: { requiresMeetingUrl: boolean | null, supportsUsername: boolean | null, supportsPassword: boolean | null, supportsTenantId: boolean | null } | null } | null } | null };

export type NotificationAlertsQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationAlertsQuery = { notificationAlerts: { id: string | null, totalCount: number | null, unreadCount: number | null, alerts: Array<{ id: string | null, deliveryId: string | null, type: string | null, eventType: NotificationEventType | null, channel: NotificationChannel | null, metadata: unknown, title: string | null, body: string | null, createdAt: string | null, severity: string | null, readAt: string | null }> | null } | null };

export type MarkNotificationsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkNotificationsReadMutation = { markNotificationsRead: number | null };

export type MarkNotificationReadMutationVariables = Exact<{
  deliveryId: string | number;
}>;


export type MarkNotificationReadMutation = { markNotificationRead: boolean | null };

export type NotificationPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationPreferencesQuery = { notificationPreferences: Array<{ id: string | null, channel: NotificationChannel | null, eventType: NotificationEventType | null, enabled: boolean | null }> | null };

export type UpdateNotificationPreferencesMutationVariables = Exact<{
  input: Array<NotificationPreferenceInput> | NotificationPreferenceInput;
}>;


export type UpdateNotificationPreferencesMutation = { updateNotificationPreferences: Array<{ id: string | null, channel: NotificationChannel | null, eventType: NotificationEventType | null, enabled: boolean | null }> | null };

export type ParentInvoiceHistoryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;


export type ParentInvoiceHistoryQuery = { parentInvoiceHistory: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null, parentId: string | null, parentUserId: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type AdminInvoicesQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
}>;


export type AdminInvoicesQuery = { adminInvoices: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: CurrencyCode | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null, parentId: string | null, parentUserId: string | null, hasPaymentProof: boolean | null, hasRejectedSubmission: boolean | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type AdminBillingSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminBillingSummaryQuery = { adminBillingSummary: { id: string | null, totalOutstanding: string | null, pendingCount: number | null, mtdRevenue: string | null, negativeBalanceCount: number | null, outstandingByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null, mtdRevenueByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null } | null };

export type StudentCreditStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type StudentCreditStatusQuery = { studentCreditStatus: Array<{ id: string | null, studentName: string | null, parentEmail: string | null, planType: InvoiceType | null, classesRemaining: number | null, classesTotal: number | null, status: StudentStatus | null }> | null };

export type ParentBillingSummaryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
}>;


export type ParentBillingSummaryQuery = { parentBillingSummary: { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null, pendingPaymentCount: number | null, nextUnpaidInvoice: { id: string | null, amount: string | null, currency: CurrencyCode | null, dueDate: string | null, studentName: string | null } | null, outstandingByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null, paidThisTermByCurrency: Array<{ id: string | null, currency: CurrencyCode | null, amount: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null } | null };

export type ParentDashboardScheduleQueryVariables = Exact<{
  date: string | null | undefined;
  search: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type ParentDashboardScheduleQuery = { parentDashboardSchedule: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentAvatarUrl: string | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, bookingStatus: BookingStatus | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, classTimeFormatted: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type ParentDashboardMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentDashboardMetricsQuery = { parentDashboardMetrics: { id: string | null, metrics: { id: string | null, totalStudents: number | null, todaysClasses: number | null, pendingInvoicesCount: number | null, pendingInvoicesAmount: string | null, performanceAvg: number | null, performanceAvgMobile: number | null, pendingMessages: number | null } | null, studentProgress: Array<{ id: string | null, name: string | null, completionPercent: number | null }> | null, workshopPromo: { id: string | null, title: string | null, description: string | null, imageUrl: string | null } | null } | null };

export type ParentDirectoryAutocompleteRowFragmentFragment = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type ParentDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
  lifecycleStatusFilter: ParentStatus | null | undefined;
}>;


export type ParentDirectoryQuery = { parentDirectory: { id: string | null, totalCount: number | null, metrics: { id: string | null, regular: number | null, onLeave: number | null, onTrial: number | null, suspended: number | null } | null, rows: Array<{ id: string | null, userId: string | null, index: number | null, name: string | null, email: string | null, avatarUrl: string | null, guardianOf: string | null, time: string | null, lifecycleStatus: ParentStatus | null, accountStatus: AccountStatus | null, unpaidInvoices: number | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type ParentsDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
}>;


export type ParentsDirectoryQuery = { parentsDirectory: Array<{ id: string | null, name: string | null, avatarUrl: string | null, email: string | null }> };

export type ParentDocumentsQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentDocumentsQuery = { parentDocuments: Array<{ id: string | null, fileId: string | null, filePath: string | null, isProtected: boolean | null, usageType: string | null, createdAt: string | null }> | null };

export type LinkDocumentToParentMutationVariables = Exact<{
  parentId: string;
  fileId: string;
  usageType: string;
}>;


export type LinkDocumentToParentMutation = { linkDocumentToParent: { id: string | null, fileId: string | null, filePath: string | null, isProtected: boolean | null, usageType: string | null, createdAt: string | null } | null };

export type ChangeParentLifecycleStatusMutationVariables = Exact<{
  parentId: string;
  newStatus: ParentStatus;
}>;


export type ChangeParentLifecycleStatusMutation = { changeParentLifecycleStatus: { id: string | null, lifecycleStatus: ParentStatus | null } | null };

export type CreateParentMutationVariables = Exact<{
  input: ParentOnboardingInput;
}>;


export type CreateParentMutation = { createParent: { userId: string | null, parentId: string | null, name: string | null, email: string | null, status: string | null, invoiceType: string | null, currency: CurrencyCode | null } | null };

export type ParentAssignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentAssignedStudentsQuery = { parentAssignedStudents: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, name: string | null, studentAvatarUrl: string | null, status: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null }> | null } | null };

export type ParentOwnProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentOwnProfileQuery = { parentOwnProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null } | null };

export type ParentHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentHandbookUrlQuery = { parentHandbookUrl: { id: string | null, url: string | null } | null };

export type ParentProfileQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentProfileQuery = { parentProfile: { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: CurrencyCode | null, timezone: IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null };

export type ParentAssociatedStudentsQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentAssociatedStudentsQuery = { parentAssociatedStudents: Array<{ id: string | null, name: string | null, avatarUrl: string | null, status: StudentStatus | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, updatedAt: string | null }> | null };

export type DeactivateParentMutationVariables = Exact<{
  parentId: string;
}>;


export type DeactivateParentMutation = { deactivateParent: { id: string | null, userId: string | null, accountStatus: AccountStatus | null } | null };

export type ReactivateParentMutationVariables = Exact<{
  parentId: string;
}>;


export type ReactivateParentMutation = { reactivateParent: { id: string | null, userId: string | null, accountStatus: AccountStatus | null } | null };

export type UpdateStudentQuotaMutationVariables = Exact<{
  studentId: string;
  newClassesRemaining: number;
  expectedVersion: number | null | undefined;
}>;


export type UpdateStudentQuotaMutation = { updateStudentQuota: { id: string | null, classesRemaining: number | null, classesTotal: number | null, version: number | null } | null };

export type PermissionFieldsFragment = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionGroupFieldsFragment = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null };

export type PermissionGroupDetailFieldsFragment = { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null };

export type UserOverrideFieldsFragment = { permissionId: string | null, state: OverrideState | null, assignedBy: string | null };

export type PermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionsQuery = { permissions: Array<{ id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null }> | null };

export type PermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionGroupsQuery = { permissionGroups: Array<{ id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null }> | null };

export type PermissionGroupQueryVariables = Exact<{
  id: string;
}>;


export type PermissionGroupQuery = { permissionGroup: { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null } | null };

export type UserPermissionGroupsQueryVariables = Exact<{
  userId: string;
}>;


export type UserPermissionGroupsQuery = { userPermissionGroups: Array<string> | null };

export type UserOverridesQueryVariables = Exact<{
  userId: string;
}>;


export type UserOverridesQuery = { userOverrides: Array<{ permissionId: string | null, state: OverrideState | null, assignedBy: string | null }> | null };

export type EffectiveUserPermissionsQueryVariables = Exact<{
  userId: string;
}>;


export type EffectiveUserPermissionsQuery = { effectiveUserPermissions: Array<string> | null };

export type CreatePermissionGroupMutationVariables = Exact<{
  input: CreatePermissionGroupInput;
}>;


export type CreatePermissionGroupMutation = { createPermissionGroup: { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null } | null };

export type UpdatePermissionGroupMutationVariables = Exact<{
  input: UpdatePermissionGroupInput;
}>;


export type UpdatePermissionGroupMutation = { updatePermissionGroup: { id: string | null, name: Partial<Record<'ar' | 'en', string>> | null, slug: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null } | null };

export type DeletePermissionGroupMutationVariables = Exact<{
  groupId: string;
}>;


export type DeletePermissionGroupMutation = { deletePermissionGroup: boolean | null };

export type AssignPermissionGroupToUserMutationVariables = Exact<{
  input: AssignPermissionGroupToUserInput;
}>;


export type AssignPermissionGroupToUserMutation = { assignPermissionGroupToUser: boolean | null };

export type RevokePermissionGroupFromUserMutationVariables = Exact<{
  input: RevokePermissionGroupFromUserInput;
}>;


export type RevokePermissionGroupFromUserMutation = { revokePermissionGroupFromUser: boolean | null };

export type BulkAssignUsersToGroupMutationVariables = Exact<{
  groupId: string;
  userIds: Array<string> | string;
}>;


export type BulkAssignUsersToGroupMutation = { bulkAssignUsersToGroup: boolean | null };

export type BulkRevokeUsersFromGroupMutationVariables = Exact<{
  groupId: string;
  userIds: Array<string> | string;
}>;


export type BulkRevokeUsersFromGroupMutation = { bulkRevokeUsersFromGroup: boolean | null };

export type UpdateUserOverridesMutationVariables = Exact<{
  userId: string;
  overrides: Array<UserOverrideInput> | UserOverrideInput;
}>;


export type UpdateUserOverridesMutation = { updateUserOverrides: boolean | null };

export type ProfileByUserIdQueryVariables = Exact<{
  userId: string;
}>;


export type ProfileByUserIdQuery = { profileByUserId: { id: string | null, userId: string | null, audience: ProfileAudience | null, scope: ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: CurrencyCode | null, timezone: IanaTimezone | null, phone: string | null, teacherOwnProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, countryCode: string | null, nationalId: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, totalClasses: number | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null, teacherAdminProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, nationalId: string | null, nationality: string | null, countryCode: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null, parentOwnProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null } | null, parentAdminProfile: { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: CurrencyCode | null, timezone: IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null, paymentMethods: Array<{ id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null }> | null, paymentMethodDefaults: { payinDefault: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null, payoutDefault: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null } | null, associatedStudents: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, name: string | null, studentAvatarUrl: string | null, status: string | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null }> | null } | null, staffProfile: { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null, staffPermissionGroups: Array<{ id: string | null, name: string | null, slug: string | null, description: string | null }> | null, staffPermissionOverrides: Array<{ id: string | null, permissionId: string | null, permissionKey: string | null, resource: string | null, action: string | null, state: OverrideState | null }> | null, meetingConfigs: Array<{ id: string | null, userId: string | null, providerId: string | null, label: string | null, isDefault: boolean | null, hasSecret: boolean | null, details: { meetingUrl: string | null, username: string | null, tenantId: string | null } | null, provider: { id: string | null, slug: string | null, name: Partial<Record<'ar' | 'en', string>> | null } | null }> | null, assignedStudents: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, name: string | null, studentAvatarUrl: string | null, parentId: string | null, parentUserId: string | null, parentName: string | null, parentAvatarUrl: string | null, className: string | null, status: StudentStatus | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null }> | null } | null } | null };

export type UpdateOwnProfileMutationVariables = Exact<{
  input: UpdateOwnProfileInput;
}>;


export type UpdateOwnProfileMutation = { updateOwnProfile: { id: string | null, userId: string | null, audience: ProfileAudience | null, scope: ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: CurrencyCode | null, timezone: IanaTimezone | null, teacherOwnProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, countryCode: string | null, nationalId: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, totalClasses: number | null } | null, parentOwnProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null } | null, staffProfile: { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, phone: string | null, status: AccountStatus | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null } | null };

export type UpdateUserProfileMutationVariables = Exact<{
  userId: string;
  input: UpdateUserProfileInput;
}>;


export type UpdateUserProfileMutation = { updateUserProfile: { id: string | null, userId: string | null, audience: ProfileAudience | null, scope: ProfileScope | null, name: string | null, email: string | null, avatarUrl: string | null, teacherId: string | null, parentId: string | null, staffProfileId: string | null, displayCurrency: CurrencyCode | null, teacherAdminProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, nationalId: string | null, nationality: string | null, countryCode: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null } | null, parentAdminProfile: { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, lifecycleStatus: string | null, accountStatus: AccountStatus | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, invoiceType: string | null, feeAmount: string | null, currency: CurrencyCode | null, timezone: IanaTimezone | null, createdAt: string | null, updatedAt: string | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null, paymentMethods: Array<{ id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null }> | null, paymentMethodDefaults: { payinDefault: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null, payoutDefault: { id: string | null, userId: string | null, type: PaymentMethodType | null, direction: PaymentDirection | null, isDefault: boolean | null, label: string | null, verifiedAt: string | null, verifiedByUserId: string | null, createdAt: string | null, updatedAt: string | null, details: { walletId: string | null, phone: string | null, paymentLinkId: string | null, url: string | null, onlineAccountId: string | null, identifier: string | null, iban: string | null, bankName: string | null, beneficiaryName: string | null, swiftBic: string | null, accountNumber: string | null, routingNumber: string | null, note: string | null } | null } | null } | null, staffProfile: { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, phone: string | null, status: AccountStatus | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null } | null };

export type StudentMonthlyReportQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;


export type StudentMonthlyReportQuery = { studentMonthlyReport: { id: string | null, studentId: string | null, studentName: string | null, year: number | null, month: number | null, totalLessons: number | null, completedLessons: number | null, cancelledLessons: number | null, presentCount: number | null, absentCount: number | null, lateCount: number | null, totalHours: number | null, creditsPurchased: number | null, creditsDeducted: number | null, creditsRefunded: number | null, creditsBalance: number | null } | null };

export type GenerateAttendanceReportQueryVariables = Exact<{
  filters: AttendanceReportFiltersInput;
}>;


export type GenerateAttendanceReportQuery = { generateAttendanceReport: { engagementGrowth: number | null, rows: Array<{ id: string | null, groupKey: string | null, groupLabel: string | null, takenClasses: number | null, absentClasses: number | null, leaveClasses: number | null, pendingClasses: number | null, totalHours: number | null, engagementGrowth: number | null, paidAmounts: Array<{ id: string | null, amount: string | null, currency: CurrencyCode | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null }> | null }> | null } | null };

export type DeleteBookMutationMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteBookMutationMutation = { deleteBook: boolean | null };

export type LearningResourceRowFragmentFragment = { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null };

export type LearningResourcesQueryVariables = Exact<{
  searchQuery: string | null | undefined;
}>;


export type LearningResourcesQuery = { learningResources: Array<{ id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null }> | null };

export type UploadLearningResourceMutationVariables = Exact<{
  input: ResourceUploadInput;
}>;


export type UploadLearningResourceMutation = { uploadLearningResource: { id: string | null, displayName: string | null, filePath: string | null, uploadedByUserId: string | null, uploadedByUserName: string | null, fileSize: number | null, contentType: string | null, createdAt: string | null } | null };

export type PrepareUploadMutationVariables = Exact<{
  input: UploadPreparationInput;
}>;


export type PrepareUploadMutation = { prepareUpload: { id: string, url: string, uploadType: UploadType } | null };

export type DeleteLearningResourceMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteLearningResourceMutation = { deleteLearningResource: boolean | null };

export type SearchTeacherAvailabilityQueryVariables = Exact<{
  input: AvailabilitySearchInput;
}>;


export type SearchTeacherAvailabilityQuery = { searchTeacherAvailability: { id: string | null, totalGaps: number | null, totalCount: number | null, pageInfo: { count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } | null, teachers: Array<{ id: string | null, name: string | null, gender: Gender | null, timezone: IanaTimezone | null, availableDaysCount: number | null, gaps: Array<{ id: string | null, teacherId: string | null, teacherName: string | null, teacherGender: string | null, dayOfWeek: DayOfWeek | null, calendarDate: string | null, gapStartTime: string | null, gapEndTime: string | null, timezone: IanaTimezone | null }> | null }> | null } | null };

export type ClassInstanceQueryVariables = Exact<{
  id: string | number;
}>;


export type ClassInstanceQuery = { classInstance: { id: string | null, courseName: string | null, classType: ClassType | null, instanceId: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, status: ClassExecutionState | null, remarks: string | null, hasTimezoneMismatch: boolean | null, studentTimezone: IanaTimezone | null, teacherTimezone: IanaTimezone | null, meetingJoinUrl: string | null, recurringScheduleId: string | null, payrollCredited: boolean | null, isRescheduled: boolean | null, isFrozen: boolean | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, avatarUrl: string | null, subjectId: string | null, subjectName: string | null, subjectAvatarUrl: string | null, rateAmount: string | null, rateCurrency: CurrencyCode | null, isRateOverridden: boolean | null, rateSource: RateSource | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null, student: { id: string | null, name: string | null, grade: string | null, level: string | null, avatarUrl: string | null } | null, teacher: { id: string | null, name: string | null, title: string | null, avatarUrl: string | null } | null, performance: { id: string | null, engagementScore: number | null, assessmentProgress: number | null, assessmentTotal: number | null, focusLevel: string | null, sessionHealth: string | null, heatmapData: Array<unknown> | null, latencyMs: number | null, authorizationLabel: string | null, attendanceRate: number | null, avgGrade: string | null, lastClassDaysAgo: number | null } | null } | null };

export type ClassStatusEventsQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ClassStatusEventsQuery = { classStatusEvents: Array<{ id: string | null, eventType: string | null, description: string | null, createdAt: string | null }> | null };

export type ActivateClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ActivateClassMutation = { activateClass: { id: string | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null, meetingJoinUrl: string | null } | null };

export type ActivateOverrideClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ActivateOverrideClassMutation = { activateOverrideClass: { id: string | null, executionState: ClassExecutionState | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null, meetingJoinUrl: string | null } | null };

export type ResetClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ResetClassMutation = { resetClass: boolean | null };

export type UpdateSessionStatusStartMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type UpdateSessionStatusStartMutation = { updateSessionStatusStart: { id: string | null, executionState: ClassExecutionState | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null } | null };

export type UpdateSessionStatusAbsentMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type UpdateSessionStatusAbsentMutation = { updateSessionStatusAbsent: { id: string | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, payrollCredited: boolean | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null } | null };

export type UpdateSessionStatusLeaveMutationVariables = Exact<{
  classInstanceId: string | number;
  leaveReason: string;
}>;


export type UpdateSessionStatusLeaveMutation = { updateSessionStatusLeave: { completedInstanceId: string | null, rescheduledInstanceId: string | null, completedInstance: { id: string | null, outcome: ClassOutcome | null, isRescheduled: boolean | null } | null, rescheduledInstance: { id: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null } | null } | null };

export type StopClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type StopClassMutation = { stopClass: { id: string | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null } | null };

export type RescheduleClassMutationVariables = Exact<{
  classInstanceId: string | number;
  input: RescheduleClassInput;
}>;


export type RescheduleClassMutation = { rescheduleClass: { id: string | null, status: ClassExecutionState | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null } | null };

export type DeleteClassInstanceMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type DeleteClassInstanceMutation = { deleteClassInstance: boolean | null };

export type OverrideClassInstanceRateMutationVariables = Exact<{
  classInstanceId: string | number;
  rateAmount: string | null | undefined;
  rateCurrency: CurrencyCode | null | undefined;
}>;


export type OverrideClassInstanceRateMutation = { overrideClassInstanceRate: { id: string | null, rateAmount: string | null, rateCurrency: CurrencyCode | null, isRateOverridden: boolean | null, rateSource: RateSource | null } | null };

export type ExecuteDstBulkUpdateMutationVariables = Exact<{
  offsetMinutes: number;
  description: string;
}>;


export type ExecuteDstBulkUpdateMutation = { executeDstBulkUpdate: { id: string | null, runId: string | null, updated: number | null, conflicts: number | null, unchanged: number | null, total: number | null, status: string | null, updatedSessions: Array<{ id: string | null, studentId: string | null, teacherId: string | null, studentName: string | null, teacherName: string | null, fromTime: string | null, toTime: string | null }> | null, conflictGroups: Array<{ id: string | null, teacherName: string | null, conflicts: Array<{ id: string | null, studentName: string | null, message: string | null }> | null }> | null, checkedEmptyItems: Array<{ id: string | null, studentName: string | null, reason: string | null }> | null } | null };

export type CreateRecurringClassMutationVariables = Exact<{
  input: CreateRecurringClassInput;
}>;


export type CreateRecurringClassMutation = { createRecurringClass: { id: string | null, recurringScheduleId: string | null, classInstanceIds: Array<string> | null, classInstanceCount: number | null } | null };

export type RecurringScheduleQueryVariables = Exact<{
  id: string | number;
}>;


export type RecurringScheduleQuery = { recurringSchedule: { id: string | null, studentId: string | null, studentName: string | null, teacherId: string | null, teacherName: string | null, durationMinutes: number | null, defaultStartTime: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, days: Array<{ id: string | null, dayOfWeek: string | null, startTime: string | null, isActive: boolean | null }> | null } | null };

export type UpdateRecurringClassRateMutationVariables = Exact<{
  input: UpdateRecurringClassRateInput;
}>;


export type UpdateRecurringClassRateMutation = { updateRecurringClassRate: { id: string | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null } | null };

export type DeleteRecurringClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type DeleteRecurringClassMutation = { deleteRecurringClass: boolean | null };

export type ClearWeeklyScheduleMutationVariables = Exact<{
  teacherId: string | number;
}>;


export type ClearWeeklyScheduleMutation = { clearWeeklySchedule: boolean | null };

export type AdminDashboardScheduleQueryVariables = Exact<{
  input: AdminDashboardScheduleInput;
}>;


export type AdminDashboardScheduleQuery = { adminDashboardSchedule: { id: string | null, totalCount: number | null, metrics: { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null } | null, rows: Array<{ id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, teacherTimezone: IanaTimezone | null, studentTimezone: IanaTimezone | null, duration: number | null, scheduledStartAt: string | null, scheduledEndAt: string | null, outcome: ClassOutcome | null, executionState: ClassExecutionState | null, isFrozen: boolean | null, meetingJoinUrl: string | null, courseName: string | null, avatarUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null, student: { id: string | null, name: string | null, avatarUrl: string | null } | null, teacher: { id: string | null, name: string | null, avatarUrl: string | null } | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type DailyScheduleMetricsQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
}>;


export type DailyScheduleMetricsQuery = { dailyScheduleMetrics: { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null } | null };

export type DailyScheduleListQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
  search: string | null | undefined;
  metricFilter: string | null | undefined;
}>;


export type DailyScheduleListQuery = { dailyScheduleList: Array<{ id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, teacherTimezone: IanaTimezone | null, studentTimezone: IanaTimezone | null, duration: number | null, outcome: ClassOutcome | null, executionState: ClassExecutionState | null, isFrozen: boolean | null, meetingJoinUrl: string | null, courseName: string | null, avatarUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null, student: { id: string | null, name: string | null, avatarUrl: string | null } | null, teacher: { id: string | null, name: string | null, avatarUrl: string | null } | null }> | null };

export type RescheduleTrackingRowsQueryVariables = Exact<{
  search: string | null | undefined;
  status: LeaveRequestStatus | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type RescheduleTrackingRowsQuery = { rescheduleTrackingRows: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, originalClassId: string | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, status: LeaveRequestStatus | null, dateLabel: RescheduleDateLabel | null, remarks: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type RescheduleTrackingMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type RescheduleTrackingMetricsQuery = { rescheduleTrackingMetrics: { id: string | null, pending: number | null, approved: number | null, leave: number | null, rescheduled: number | null, cancelled: number | null } | null };

export type StatusTrackingScheduleQueryVariables = Exact<{
  date: string;
  search: string | null | undefined;
  viewerTimezone: IanaTimezone | null | undefined;
}>;


export type StatusTrackingScheduleQuery = { statusTrackingSchedule: Array<{ id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentAvatarUrl: string | null, studentStatus: StudentStatus | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, courseName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null };

export type TeacherWeeklyScheduleGridQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;


export type TeacherWeeklyScheduleGridQuery = { teacherWeeklyScheduleGrid: { id: string | null, teacherId: string | null, weekStart: string | null, weekEnd: string | null, classes: Array<{ id: string | null, studentName: string | null, studentId: string | null, duration: number | null, startTime: string | null, day: string | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, subjectName: string | null, classType: ClassType | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null } | null };

export type TeacherWorkloadMetricsQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;


export type TeacherWorkloadMetricsQuery = { teacherWorkloadMetrics: { id: string | null, weeklyHoursWorked: string | null, totalMinutes: number | null, classCount: number | null } | null };

export type EnvConfigEntryFieldsFragment = { id: string | null, key: string | null, category: string | null, displayStrategy: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSecret: boolean | null, excludeFromDb: boolean | null, value: string | null, source: string | null, hasDbOverride: boolean | null, editable: boolean | null };

export type EnvConfigUpsertResultFieldsFragment = { id: string | null, key: string | null, source: string | null, hasDbOverride: boolean | null, updatedAt: string | null };

export type EnvConfigDeleteResultFieldsFragment = { id: string | null, key: string | null, deleted: boolean | null, source: string | null };

export type EnvConfigEntriesQueryVariables = Exact<{ [key: string]: never; }>;


export type EnvConfigEntriesQuery = { envConfigEntries: Array<{ id: string | null, key: string | null, category: string | null, displayStrategy: string | null, description: Partial<Record<'ar' | 'en', string>> | null, isSecret: boolean | null, excludeFromDb: boolean | null, value: string | null, source: string | null, hasDbOverride: boolean | null, editable: boolean | null }> | null };

export type UpsertEnvConfigEntryMutationVariables = Exact<{
  input: EnvConfigUpsertInput;
}>;


export type UpsertEnvConfigEntryMutation = { upsertEnvConfigEntry: { id: string | null, key: string | null, source: string | null, hasDbOverride: boolean | null, updatedAt: string | null } | null };

export type DeleteEnvConfigEntryMutationVariables = Exact<{
  key: string;
}>;


export type DeleteEnvConfigEntryMutation = { deleteEnvConfigEntry: { id: string | null, key: string | null, deleted: boolean | null, source: string | null } | null };

export type SystemSettingFieldsFragment = { id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null };

export type SystemSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SystemSettingsQuery = { systemSettings: Array<{ id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null }> | null };

export type SystemSettingQueryVariables = Exact<{
  key: string;
}>;


export type SystemSettingQuery = { systemSetting: { id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null } | null };

export type UpsertSystemSettingMutationVariables = Exact<{
  input: SystemSettingUpsertInput;
}>;


export type UpsertSystemSettingMutation = { upsertSystemSetting: { id: string | null, key: string | null, value: string | null, dataType: SystemSettingDataType | null, description: string | null, category: SystemSettingCategory | null, updatedByUserId: string | null, updatedAt: string | null } | null };

export type DeleteSystemSettingMutationVariables = Exact<{
  key: string;
}>;


export type DeleteSystemSettingMutation = { deleteSystemSetting: boolean | null };

export type SessionConfigFieldsFragment = { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null };

export type SessionConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type SessionConfigsQuery = { sessionConfigs: Array<{ id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null }> | null };

export type SessionConfigQueryVariables = Exact<{
  roleName: string;
}>;


export type SessionConfigQuery = { sessionConfig: { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null } | null };

export type UpsertSessionConfigMutationVariables = Exact<{
  input: SessionConfigUpsertInput;
}>;


export type UpsertSessionConfigMutation = { upsertSessionConfig: { id: string | null, roleName: string | null, ttlSeconds: number | null, maxConcurrentSessions: number | null, createdAt: string | null, updatedAt: string | null } | null };

export type DeleteSessionConfigMutationVariables = Exact<{
  roleName: string;
}>;


export type DeleteSessionConfigMutation = { deleteSessionConfig: boolean | null };

export type AuditLogFieldsFragment = { id: string | null, actorUserId: string | null, actorType: string | null, entityType: string | null, entityId: string | null, action: string | null, description: string | null, previousState: unknown, newState: unknown, changes: unknown, ipAddress: string | null, userAgent: string | null, metadata: unknown, createdAt: string | null };

export type SettingsAuditLogsQueryVariables = Exact<{
  filter: SettingsAuditLogFilter | null | undefined;
}>;


export type SettingsAuditLogsQuery = { settingsAuditLogs: { id: string | null, total: number | null, hasMore: boolean | null, logs: Array<{ id: string | null, actorUserId: string | null, actorType: string | null, entityType: string | null, entityId: string | null, action: string | null, description: string | null, previousState: unknown, newState: unknown, changes: unknown, ipAddress: string | null, userAgent: string | null, metadata: unknown, createdAt: string | null }> | null } | null };

export type SiteContentEntryFieldsFragment = { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null };

export type SiteContentEntriesQueryVariables = Exact<{ [key: string]: never; }>;


export type SiteContentEntriesQuery = { siteContentEntries: Array<{ id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null }> | null };

export type SiteContentEntryQueryVariables = Exact<{
  id: string | number;
}>;


export type SiteContentEntryQuery = { siteContentEntry: { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type UpsertSiteContentMutationVariables = Exact<{
  input: SiteContentUpsertInput;
}>;


export type UpsertSiteContentMutation = { upsertSiteContent: { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type UpdateSiteContentPublishStateMutationVariables = Exact<{
  id: string | number;
  isPublished: boolean;
}>;


export type UpdateSiteContentPublishStateMutation = { updateSiteContentPublishState: { id: string | null, slug: string | null, title: string | null, body: string | null, contentType: string | null, isPublished: boolean | null, updatedByUserId: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type DeleteSiteContentMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteSiteContentMutation = { deleteSiteContent: boolean | null };

export type SettingsTimezoneFieldsFragment = { id: string | null, ianaId: string | null, name: string | null, baseOffsetMinutes: number | null, offsetMinutes: number | null, isDstSupported: boolean | null };

export type SettingsTimezonesQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type SettingsTimezonesQuery = { settingsTimezones: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, ianaId: string | null, name: string | null, baseOffsetMinutes: number | null, offsetMinutes: number | null, isDstSupported: boolean | null }> | null, pageInfo: { count: number, currentPage: number, endCursor: string | null, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, startCursor: string | null, total: number } | null } | null };

export type EnsureDemoUsersMutationVariables = Exact<{ [key: string]: never; }>;


export type EnsureDemoUsersMutation = { ensureDemoUsers: boolean | null };

export type CreateTestEntitiesMutationVariables = Exact<{
  prefix: string;
  classesRemaining: number | null | undefined;
}>;


export type CreateTestEntitiesMutation = { createTestEntities: { studentUserEmail: string | null, studentUserId: string | null, studentId: string | null, studentName: string | null, parentUserEmail: string | null, parentUserId: string | null, parentId: string | null, parentName: string | null, teacherUserEmail: string | null, teacherUserId: string | null, teacherId: string | null, teacherName: string | null } | null };

export type CleanupTestEntitiesMutationVariables = Exact<{
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  studentId: string;
  teacherId: string;
  parentId: string;
}>;


export type CleanupTestEntitiesMutation = { cleanupTestEntities: boolean | null };

export type CreateTestGroupClassMutationVariables = Exact<{
  classInstanceId: string;
  teacherName: string;
}>;


export type CreateTestGroupClassMutation = { createTestGroupClass: { groupClassId: string | null } | null };

export type CleanupTestGroupClassMutationVariables = Exact<{
  groupClassId: string;
}>;


export type CleanupTestGroupClassMutation = { cleanupTestGroupClass: boolean | null };

export type CleanupTestManagerMutationVariables = Exact<{
  userId: string;
}>;


export type CleanupTestManagerMutation = { cleanupTestManager: boolean | null };

export type CreateTestSuperAdminMutationVariables = Exact<{
  prefix: string;
}>;


export type CreateTestSuperAdminMutation = { createTestSuperAdmin: { userId: string | null, email: string | null } | null };

export type CleanupTestSuperAdminMutationVariables = Exact<{
  userId: string;
}>;


export type CleanupTestSuperAdminMutation = { cleanupTestSuperAdmin: boolean | null };

export type WelcomeMessageQueryVariables = Exact<{ [key: string]: never; }>;


export type WelcomeMessageQuery = { welcomeMessage: string | null };

export type TranslatedMessageQueryVariables = Exact<{
  key: string;
  namespace: string;
}>;


export type TranslatedMessageQuery = { translatedMessage: string | null };

export type StudentDirectoryRowFragmentFragment = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryDetailFragmentFragment = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, parentName: string | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  orderBy: Array<StudentsOrderByClause> | StudentsOrderByClause | null | undefined;
  filterArgs: StudentFilterArgs | null | undefined;
}>;


export type StudentDirectoryQuery = { studentDirectory: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null }> | null, pageInfo: { count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } | null } | null };

export type StudentsDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
}>;


export type StudentsDirectoryQuery = { studentsDirectory: Array<{ id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null }> };

export type StudentClassHistoryQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;


export type StudentClassHistoryQuery = { studentClassHistory: { id: string | null, studentName: string | null, metrics: { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null } | null, sessions: Array<{ id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, isFrozen: boolean | null, instructor: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null } | null };

export type StudentClassSessionDetailQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type StudentClassSessionDetailQuery = { studentClassSessionDetail: { id: string | null, durationMinutes: number | null, executionState: string | null, outcome: string | null, remarks: string | null, meetingJoinUrl: string | null, teacherName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null } | null };

export type ReassignStudentTeacherMutationVariables = Exact<{
  studentId: string;
  newTeacherId: string;
  expectedVersion: number | null | undefined;
}>;


export type ReassignStudentTeacherMutation = { reassignStudentTeacher: { id: string | null, primaryTeacherId: string | null, version: number | null } | null };

export type ChangeStudentStatusMutationVariables = Exact<{
  studentId: string;
  newStatus: StudentStatus;
  expectedVersion: number | null | undefined;
}>;


export type ChangeStudentStatusMutation = { changeStudentStatus: { id: string | null, status: StudentStatus | null, version: number | null } | null };

export type CreateStudentMutationVariables = Exact<{
  input: StudentOnboardingInput;
}>;


export type CreateStudentMutation = { createStudent: { studentId: string | null, parentId: string | null, name: string | null, status: StudentStatus | null, primaryTeacherId: string | null } | null };

export type StudentUpcomingClassFieldsFragment = { id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null };

export type StudentHistoryMetricsFieldsFragment = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentHistorySessionFieldsFragment = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, instructor: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null };

export type StudentProfileQueryVariables = Exact<{
  studentId: string | null | undefined;
  year: number | null | undefined;
  month: number | null | undefined;
}>;


export type StudentProfileQuery = { studentProfile: { id: string | null, name: string | null, status: StudentStatus | null, avatarUrl: string | null, dateOfBirth: string | null, gender: Gender | null, language: AppLanguage | null, timezoneOverride: string | null, email: string | null, phone: string | null, timezone: IanaTimezone | null, displayCurrency: CurrencyCode | null, parentId: string | null, parentUserId: string | null, parentName: string | null, parentEmail: string | null, parentPhone: string | null, isAssociatedViewer: boolean | null, primaryTeacherId: string | null, teacherUserId: string | null, teacherName: string | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null, version: number | null, createdAt: string | null, updatedAt: string | null, upcomingClasses: { id: string | null, studentId: string | null, studentName: string | null, status: StudentStatus | null, classes: Array<{ id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null } | null, classHistory: { id: string | null, studentName: string | null, metrics: { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null } | null, sessions: Array<{ id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, outcome: string | null, instructor: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null } | null } | null };

export type RecordStudentProfileEditMutationVariables = Exact<{
  input: StudentProfileEditInput;
}>;


export type RecordStudentProfileEditMutation = { recordStudentProfileEdit: { id: string | null, name: string | null, status: StudentStatus | null, avatarUrl: string | null, dateOfBirth: string | null, gender: Gender | null, language: AppLanguage | null, timezoneOverride: string | null, email: string | null, phone: string | null, parentPhone: string | null, version: number | null, updatedAt: string | null } | null };

export type StudentUpcomingClassesQueryVariables = Exact<{
  studentId: string;
}>;


export type StudentUpcomingClassesQuery = { studentUpcomingClasses: { id: string | null, studentId: string | null, studentName: string | null, status: StudentStatus | null, classes: Array<{ id: string | null, instructor: string | null, teacherId: string | null, teacherAvatarUrl: string | null, subjectId: string | null, subjectName: string | null, avatarUrl: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null } | null };

export type StudentsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  orderBy: Array<StudentsOrderByClause> | StudentsOrderByClause | null | undefined;
  filterArgs: StudentFilterArgs | null | undefined;
}>;


export type StudentsQuery = { students: { data: Array<{ id: string, name: string, avatarUrl: string | null }>, pageInfo: { total: number } } };

export type StudentByIdQueryVariables = Exact<{
  studentId: string;
}>;


export type StudentByIdQuery = { studentById: { id: string | null, name: string | null, avatarUrl: string | null, status: StudentStatus | null, primaryTeacherId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, version: number | null, updatedAt: string | null } | null };

export type AdminSuggestionsQueryVariables = Exact<{
  filter: SuggestionFilter;
}>;


export type AdminSuggestionsQuery = { adminSuggestions: { id: string | null, rows: Array<{ id: string | null, parentId: string | null, parentUserId: string | null, submitterName: string | null, body: string | null, status: SuggestionStatus | null, adminResponse: string | null, duplicateOfId: string | null, duplicateOfBody: string | null, duplicateOfSubmitterName: string | null, responseCount: number | null, emailSentAt: string | null, createdAt: string | null, parentName: string | null }> | null, metrics: { id: string | null, pending: number | null, reviewed: number | null, duplicate: number | null, avgResponseTime: string | null, totalCount: number | null } | null } | null };

export type SearchSuggestionsQueryVariables = Exact<{
  query: string;
  excludeId: string;
}>;


export type SearchSuggestionsQuery = { searchSuggestions: Array<{ id: string | null, submitterName: string | null, body: string | null, status: SuggestionStatus | null, parentName: string | null, createdAt: string | null }> | null };

export type SubmitSuggestionMutationVariables = Exact<{
  input: SubmitSuggestionInput;
}>;


export type SubmitSuggestionMutation = { submitSuggestion: { id: string | null, submitterName: string | null, body: string | null, createdAt: string | null } | null };

export type MarkSuggestionReviewedMutationVariables = Exact<{
  suggestionId: string;
}>;


export type MarkSuggestionReviewedMutation = { markSuggestionReviewed: { id: string | null, emailSentAt: string | null } | null };

export type RespondToSuggestionMutationVariables = Exact<{
  input: RespondToSuggestionInput;
}>;


export type RespondToSuggestionMutation = { respondToSuggestion: { id: string | null, adminResponse: string | null } | null };

export type MarkSuggestionDuplicateMutationVariables = Exact<{
  input: MarkSuggestionDuplicateInput;
}>;


export type MarkSuggestionDuplicateMutation = { markSuggestionDuplicate: { id: string | null, duplicateOfId: string | null } | null };

export type DeleteSuggestionMutationVariables = Exact<{
  suggestionId: string;
}>;


export type DeleteSuggestionMutation = { deleteSuggestion: boolean | null };

export type SuggestionContributorStatsQueryVariables = Exact<{
  days: number;
}>;


export type SuggestionContributorStatsQuery = { suggestionContributorStats: { id: string | null, uniqueContributorCount: number | null, contributors: Array<{ id: string | null, name: string | null, suggestionCount: number | null }> | null } | null };

export type SupervisorDashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type SupervisorDashboardQuery = { supervisorDashboard: { supervisorName: string | null, pendingReviewCount: number | null, pendingDuesSummary: { totalCount: number | null, totalAmount: number | null, currency: CurrencyCode | null } | null, recentApprovals: Array<{ id: string | null, classInstanceId: string | null, subjectName: string | null, classAvatarUrl: string | null, studentId: string | null, studentName: string | null, teacherId: string | null, teacherName: string | null, studentAvatarUrl: string | null, teacherAvatarUrl: string | null, studentUserId: string | null, teacherUserId: string | null, lessonDate: string | null, durationMinutes: number | null, attendanceEvaluation: AttendanceEvaluation | null, teacherNotes: string | null, studentNotes: string | null, completionPercentage: number | null, status: LessonReportStatus | null, submittedAt: string | null, reviewedAt: string | null, createdAt: string | null, updatedAt: string | null }> | null, monthlySnapshot: { year: number | null, month: number | null, label: string | null } | null } | null };

export type TeacherDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type TeacherDirectoryQuery = { teacherDirectory: { id: string | null, totalTeachers: number | null, metrics: { id: string | null, activated: number | null, deactivated: number | null } | null, rows: Array<{ id: string | null, userId: string | null, index: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: AccountStatus | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type ManagerDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  roleFilter: string | null | undefined;
  statusFilter: string | null | undefined;
}>;


export type ManagerDirectoryQuery = { managerDirectory: { id: string | null, totalCount: number | null, metrics: { id: string | null, totalAdmin: number | null, systemStaff: number | null, activeNow: number | null, alerts: number | null } | null, rows: Array<{ id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type UpdateManagerProfileMutationVariables = Exact<{
  staffProfileId: string | number;
  input: UpdateManagerProfileInput;
}>;


export type UpdateManagerProfileMutation = { updateManagerProfile: { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null } | null };

export type OnboardingMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingMetricsQuery = { onboardingMetrics: { id: string | null, activeStaff: number | null, pendingApproval: number | null, avgOnboardingDays: number | null } | null };

export type StaffDirectoryAutocompleteRowFragmentFragment = { id: string | null, name: string | null, avatarUrl: string | null, email: string | null };

export type StaffDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
  permissionGroupFilter: string | null | undefined;
}>;


export type StaffDirectoryQuery = { staffDirectory: Array<{ id: string | null, name: string | null, avatarUrl: string | null, email: string | null }> };

export type CreateManagerMutationVariables = Exact<{
  input: ManagerOnboardingInput;
}>;


export type CreateManagerMutation = { createManager: { id: string | null, userId: string | null, staffProfileId: string | null, name: string | null, email: string | null, status: string | null, assignedGroupSlug: string | null } | null };

export type TeacherProfileForEditQueryVariables = Exact<{
  teacherId: string | number;
}>;


export type TeacherProfileForEditQuery = { teacherProfileForEdit: { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null } | null };

export type UpdateTeacherProfileMutationVariables = Exact<{
  teacherId: string | number;
  input: TeacherProfileUpdateInput;
}>;


export type UpdateTeacherProfileMutation = { updateTeacherProfile: { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, status: AccountStatus | null, updatedAt: string | null, totalClasses: number | null, avgEngagementScore: number | null } | null };

export type TeacherDashboardQueryVariables = Exact<{
  date: string;
  pagination: PaginationArgs | null | undefined;
}>;


export type TeacherDashboardQuery = { teacherDashboard: { id: string | null, totalCount: number | null, metrics: { total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null } | null, scheduleRows: Array<{ id: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, yourTimeFormatted: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null, progressFeed: Array<{ id: string | null, studentId: string | null, studentName: string | null, scheduledTimeFormatted: string | null, durationMinutes: number | null, eventKind: TeacherProgressFeedEventKind | null, occurredAt: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, lastItem: number | null, hasMorePages: boolean, lastPage: number, perPage: number, total: number } | null } | null };

export type CreateTeacherManualClassEntryMutationVariables = Exact<{
  input: CreateManualClassEntryInput;
}>;


export type CreateTeacherManualClassEntryMutation = { createTeacherManualClassEntry: { id: string | null, status: ClassExecutionState | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null } | null };

export type LogTeacherSupportRequestMutationVariables = Exact<{
  input: LogSupportRequestInput;
}>;


export type LogTeacherSupportRequestMutation = { logTeacherSupportRequest: { id: string | null, success: boolean | null } | null };

export type TeacherFutureScheduleQueryVariables = Exact<{
  teacherId: string | null | undefined;
}>;


export type TeacherFutureScheduleQuery = { teacherFutureSchedule: { id: string | null, leaveQuotaUsed: number | null, leaveQuotaTotal: number | null, totalClasses: number | null, classes: Array<{ id: string | null, courseName: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, isRescheduled: boolean | null, leaveRequestDisabled: boolean | null, leaveRequestDisabledReason: string | null, studentCount: number | null, location: string | null, subjectId: string | null, subjectName: string | null, classType: ClassType | null, executionState: string | null, outcome: string | null, meetingJoinUrl: string | null, avatarUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null, importantNotes: Array<{ id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null }> | null, supportContact: { id: string | null, name: string | null, role: string | null, avatarUrl: string | null, phone: string | null } | null } | null };

export type TeacherHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherHandbookUrlQuery = { teacherHandbookUrl: { id: string | null, url: string | null } | null };

export type TeacherPendingDuesQueryVariables = Exact<{
  teacherId: string | number | null | undefined;
}>;


export type TeacherPendingDuesQuery = { teacherPendingDues: Array<{ id: string | null, teacherId: string | null, teacherName: string | null, teacherUserId: string | null, teacherAvatarUrl: string | null, classInstanceId: string | null, studentId: string | null, studentName: string | null, studentAvatarUrl: string | null, classDate: string | null, hours: string | null, amount: string | null, currency: CurrencyCode | null, status: TeacherDueStatus | null, approvedByUserId: string | null, approvedAt: string | null, teacherPaymentId: string | null, createdAt: string | null, updatedAt: string | null, rateSource: RateSource | null }> | null };

export type TeacherPendingDuesSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherPendingDuesSummaryQuery = { teacherPendingDuesSummary: { totalCount: number | null, totalAmount: number | null, currency: CurrencyCode | null } | null };

export type TeacherMonthlyReportQueryVariables = Exact<{
  teacherId: string | number;
  year: number;
  month: number;
}>;


export type TeacherMonthlyReportQuery = { teacherMonthlyReport: { teacherId: string | null, teacherName: string | null, year: number | null, month: number | null, lessonsTaught: number | null, approvedCount: number | null, cancelledCount: number | null, totalAccruedHours: number | null, totalDueAmount: number | null, totalPaidAmount: number | null, currency: CurrencyCode | null } | null };

export type MarkTeacherDuesPaidMutationVariables = Exact<{
  dueIds: Array<string | number> | string | number;
  teacherPaymentId: string | number;
}>;


export type MarkTeacherDuesPaidMutation = { markTeacherDuesPaid: Array<{ id: string | null, teacherId: string | null, teacherName: string | null, teacherUserId: string | null, teacherAvatarUrl: string | null, classInstanceId: string | null, studentId: string | null, studentName: string | null, studentAvatarUrl: string | null, classDate: string | null, hours: string | null, amount: string | null, currency: CurrencyCode | null, status: TeacherDueStatus | null, approvedByUserId: string | null, approvedAt: string | null, teacherPaymentId: string | null, createdAt: string | null, updatedAt: string | null }> | null };

export type TeacherImportantNoteFieldsFragment = { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null };

export type CreateTeacherImportantNoteMutationVariables = Exact<{
  input: CreateTeacherNoteInput;
}>;


export type CreateTeacherImportantNoteMutation = { createTeacherImportantNote: { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null } | null };

export type UpdateTeacherImportantNoteMutationVariables = Exact<{
  id: string | number;
  input: UpdateTeacherNoteInput;
}>;


export type UpdateTeacherImportantNoteMutation = { updateTeacherImportantNote: { id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null } | null };

export type DeleteTeacherImportantNoteMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTeacherImportantNoteMutation = { deleteTeacherImportantNote: boolean | null };

export type CreateTeacherMutationVariables = Exact<{
  input: TeacherOnboardingInput;
}>;


export type CreateTeacherMutation = { createTeacher: { userId: string | null, id: string | null, name: string | null, email: string | null, status: string | null, gender: Gender | null, timezoneDisplay: string | null } | null };

export type TeacherAssignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherAssignedStudentsQuery = { teacherAssignedStudents: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, name: string | null, status: StudentStatus | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null }> | null } | null };

export type TeacherOwnProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherOwnProfileQuery = { teacherOwnProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, timezone: IanaTimezone | null, hourlyRate: string | null, rateCurrency: CurrencyCode | null, displayAmount: { id: string | null, amount: string | null, currency: CurrencyCode | null, stale: boolean | null } | null } | null };

export type TeacherAssignedClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherAssignedClassesQuery = { teacherAssignedClasses: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null, meetingJoinUrl: string | null, effectiveMeeting: { joinUrl: string | null, providerSlug: string | null, providerName: Partial<Record<'ar' | 'en', string>> | null, logoUrl: string | null, meetingId: string | null, source: EffectiveMeetingSource | null, configId: string | null, providerId: string | null } | null }> | null } | null };

export type TeachersQueryVariables = Exact<{
  search: string;
  limit: number;
}>;


export type TeachersQuery = { teachers: Array<{ id: string | null, name: string | null, avatarUrl: string | null }> | null };

export type UserFieldsFragmentFragment = { id: string | null, name: string | null, email: string | null, emailVerifiedAt: string | null, createdAt: string | null, updatedAt: string | null, avatarUrl: string | null, phone: string | null, status: AccountStatus | null, permissions: Array<AppPermission> | null, role: string | null, notificationCount: number | null, teacherId: string | null, parentId: string | null, displayCurrency: CurrencyCode | null };

export const SupportedCurrencyFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedCurrencyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"decimals"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<SupportedCurrencyFieldsFragment, unknown>;
export const PaymentMethodDetailsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<PaymentMethodDetailsFieldsFragment, unknown>;
export const PaymentMethodTransactionSnapshotFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<PaymentMethodTransactionSnapshotFieldsFragment, unknown>;
export const UserPaymentMethodFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<UserPaymentMethodFieldsFragment, unknown>;
export const PaymentMethodDefaultsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDefaults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"payinDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<PaymentMethodDefaultsFieldsFragment, unknown>;
export const SupportedMobileWalletFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedMobileWalletFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedMobileWallet"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"phoneRegion"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedMobileWalletFieldsFragment, unknown>;
export const SupportedPaymentLinkFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedPaymentLinkFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedPaymentLink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedPaymentLinkFieldsFragment, unknown>;
export const SupportedOnlineAccountFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedOnlineAccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedOnlineAccount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"identifierKind"}},{"kind":"Field","name":{"kind":"Name","value":"identifierLabel"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDirections"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SupportedOnlineAccountFieldsFragment, unknown>;
export const ClassCategoryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<ClassCategoryFieldsFragment, unknown>;
export const ClassSubjectFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<ClassSubjectFieldsFragment, unknown>;
export const SubjectResourceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<SubjectResourceFieldsFragment, unknown>;
export const MeetingProviderFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MeetingProviderFieldsFragment, unknown>;
export const UserMeetingConfigFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserMeetingConfigFieldsFragment, unknown>;
export const ClassMeetingConfigFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ClassMeetingConfigFieldsFragment, unknown>;
export const ParentDirectoryAutocompleteRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<ParentDirectoryAutocompleteRowFragmentFragment, unknown>;
export const PermissionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Permission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]} as unknown as DocumentNode<PermissionFieldsFragment, unknown>;
export const PermissionGroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}}]}}]} as unknown as DocumentNode<PermissionGroupFieldsFragment, unknown>;
export const PermissionGroupDetailFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<PermissionGroupDetailFieldsFragment, unknown>;
export const UserOverrideFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserOverrideFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserOverride"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionId"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedBy"}}]}}]} as unknown as DocumentNode<UserOverrideFieldsFragment, unknown>;
export const LearningResourceRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LearningResourceRowFragmentFragment, unknown>;
export const EnvConfigEntryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"displayStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSecret"}},{"kind":"Field","name":{"kind":"Name","value":"excludeFromDb"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}}]} as unknown as DocumentNode<EnvConfigEntryFieldsFragment, unknown>;
export const EnvConfigUpsertResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigUpsertResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigUpsertResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<EnvConfigUpsertResultFieldsFragment, unknown>;
export const EnvConfigDeleteResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigDeleteResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigDeleteResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]} as unknown as DocumentNode<EnvConfigDeleteResultFieldsFragment, unknown>;
export const SystemSettingFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SystemSettingFieldsFragment, unknown>;
export const SessionConfigFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SessionConfigFieldsFragment, unknown>;
export const AuditLogFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuditLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuditLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"actorUserId"}},{"kind":"Field","name":{"kind":"Name","value":"actorType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"previousState"}},{"kind":"Field","name":{"kind":"Name","value":"newState"}},{"kind":"Field","name":{"kind":"Name","value":"changes"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AuditLogFieldsFragment, unknown>;
export const SiteContentEntryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SiteContentEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SiteContentEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"isPublished"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SiteContentEntryFieldsFragment, unknown>;
export const SettingsTimezoneFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SettingsTimezoneFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SettingsTimezone"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ianaId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseOffsetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"offsetMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDstSupported"}}]}}]} as unknown as DocumentNode<SettingsTimezoneFieldsFragment, unknown>;
export const StudentDirectoryRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryRowFragmentFragment, unknown>;
export const StudentDirectoryDetailFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryDetailFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryDetailFragmentFragment, unknown>;
export const EffectiveMeetingFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<EffectiveMeetingFieldsFragment, unknown>;
export const StudentUpcomingClassFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentUpcomingClassFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentUpcomingClass"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<StudentUpcomingClassFieldsFragment, unknown>;
export const StudentHistoryMetricsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistoryMetricsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistoryMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"hoursStudied"}},{"kind":"Field","name":{"kind":"Name","value":"performance"}}]}}]} as unknown as DocumentNode<StudentHistoryMetricsFieldsFragment, unknown>;
export const StudentHistorySessionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistorySessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistorySession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<StudentHistorySessionFieldsFragment, unknown>;
export const StaffDirectoryAutocompleteRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<StaffDirectoryAutocompleteRowFragmentFragment, unknown>;
export const TeacherImportantNoteFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<TeacherImportantNoteFieldsFragment, unknown>;
export const UserFieldsFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<UserFieldsFragmentFragment, unknown>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFieldsFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const UserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"user"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFieldsFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<UserQuery, UserQueryVariables>;
export const UsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"users"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFieldsFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<UsersQuery, UsersQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFieldsFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const DemoLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"demoLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DemoLoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"demoLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFieldsFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<DemoLoginMutation, DemoLoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"refreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFieldsFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const ImpersonationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"impersonationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"impersonationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"targetUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<ImpersonationStatusQuery, ImpersonationStatusQueryVariables>;
export const StartImpersonationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"startImpersonation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startImpersonation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targetUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"impersonationSessionId"}},{"kind":"Field","name":{"kind":"Name","value":"targetUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}}]}}]}}]}}]} as unknown as DocumentNode<StartImpersonationMutation, StartImpersonationMutationVariables>;
export const EndImpersonationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"endImpersonation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endImpersonation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<EndImpersonationMutation, EndImpersonationMutationVariables>;
export const PermissionGroupSimulationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"permissionGroupSimulationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionGroupSimulationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"groupSlug"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<PermissionGroupSimulationStatusQuery, PermissionGroupSimulationStatusQueryVariables>;
export const SimulatablePermissionGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"simulatablePermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulatablePermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<SimulatablePermissionGroupsQuery, SimulatablePermissionGroupsQueryVariables>;
export const StartPermissionGroupSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"startPermissionGroupSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startPermissionGroupSimulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"groupSlug"}}]}}]}}]} as unknown as DocumentNode<StartPermissionGroupSimulationMutation, StartPermissionGroupSimulationMutationVariables>;
export const EndPermissionGroupSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"endPermissionGroupSimulation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endPermissionGroupSimulation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<EndPermissionGroupSimulationMutation, EndPermissionGroupSimulationMutationVariables>;
export const ChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"changePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const UnpaidInvoicesAlertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"unpaidInvoicesAlert"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpaidInvoicesAlert"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalOverdueInvoices"}},{"kind":"Field","name":{"kind":"Name","value":"totalOverdueAmount"}},{"kind":"Field","name":{"kind":"Name","value":"overdueAmountsByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalUnpaidAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"overdueCount"}},{"kind":"Field","name":{"kind":"Name","value":"oldestDueDate"}},{"kind":"Field","name":{"kind":"Name","value":"amountsByCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<UnpaidInvoicesAlertQuery, UnpaidInvoicesAlertQueryVariables>;
export const CreateManualInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateManualInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InvoiceType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"issueDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dueDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSnapshot"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSource"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"billingMonths"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BillingMonthInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sendEmail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createManualInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"invoiceType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceType"}}},{"kind":"Argument","name":{"kind":"Name","value":"issueDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"issueDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"dueDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dueDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"exchangeRateSnapshot"},"value":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSnapshot"}}},{"kind":"Argument","name":{"kind":"Name","value":"exchangeRateSource"},"value":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSource"}}},{"kind":"Argument","name":{"kind":"Name","value":"billingMonths"},"value":{"kind":"Variable","name":{"kind":"Name","value":"billingMonths"}}},{"kind":"Argument","name":{"kind":"Name","value":"sendEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sendEmail"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]} as unknown as DocumentNode<CreateManualInvoiceMutation, CreateManualInvoiceMutationVariables>;
export const MarkInvoicePaidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkInvoicePaid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markInvoicePaid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"proofFileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<MarkInvoicePaidMutation, MarkInvoicePaidMutationVariables>;
export const SubmitPaymentProofDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitPaymentProof"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitPaymentProof"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"proofFileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proofFileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<SubmitPaymentProofMutation, SubmitPaymentProofMutationVariables>;
export const ApprovePaymentProofDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApprovePaymentProof"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvePaymentProof"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<ApprovePaymentProofMutation, ApprovePaymentProofMutationVariables>;
export const RejectPaymentProofDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectPaymentProof"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rejectionReason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectPaymentProof"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rejectionReason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rejectionReason"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<RejectPaymentProofMutation, RejectPaymentProofMutationVariables>;
export const InvoicePaymentSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InvoicePaymentSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoicePaymentSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceId"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}}]}}]}}]} as unknown as DocumentNode<InvoicePaymentSubmissionQuery, InvoicePaymentSubmissionQueryVariables>;
export const DeleteInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>;
export const SendPaymentReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendPaymentReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendPaymentReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<SendPaymentReminderMutation, SendPaymentReminderMutationVariables>;
export const InvoicePaymentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InvoicePayments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invoicePayments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentDate"}},{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodType"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodSnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transactionId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}}]} as unknown as DocumentNode<InvoicePaymentsQuery, InvoicePaymentsQueryVariables>;
export const RecordPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordPayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordPayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"userPaymentMethodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}}},{"kind":"Argument","name":{"kind":"Name","value":"transactionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentDate"}},{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodType"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodSnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}}]} as unknown as DocumentNode<RecordPaymentMutation, RecordPaymentMutationVariables>;
export const CreateTeacherPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTeacherPayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paymentDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isTestPayment"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherPayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"userPaymentMethodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userPaymentMethodId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paymentDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paymentDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"isTestPayment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isTestPayment"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"paymentDate"}},{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodType"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodSnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isTestPayment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshotFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodTransactionSnapshot"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPaymentMethodId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogId"}},{"kind":"Field","name":{"kind":"Name","value":"catalogSlug"}},{"kind":"Field","name":{"kind":"Name","value":"catalogName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snapshottedAt"}}]}}]} as unknown as DocumentNode<CreateTeacherPaymentMutation, CreateTeacherPaymentMutationVariables>;
export const StudentCreditBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentCreditBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentCreditBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]} as unknown as DocumentNode<StudentCreditBalanceQuery, StudentCreditBalanceQueryVariables>;
export const StudentCreditTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentCreditTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentCreditTransactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"changeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"creditedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<StudentCreditTransactionsQuery, StudentCreditTransactionsQueryVariables>;
export const RecordCreditPurchaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordCreditPurchase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hours"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordCreditPurchase"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"hours"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hours"}}},{"kind":"Argument","name":{"kind":"Name","value":"notes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"changeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"creditedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RecordCreditPurchaseMutation, RecordCreditPurchaseMutationVariables>;
export const SupportedCurrenciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SupportedCurrencies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supportedCurrencies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedCurrencyFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedCurrencyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"decimals"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<SupportedCurrenciesQuery, SupportedCurrenciesQueryVariables>;
export const ActivateSupportedCurrencyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateSupportedCurrency"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrencyUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateSupportedCurrency"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupportedCurrencyFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupportedCurrencyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupportedCurrency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"decimals"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<ActivateSupportedCurrencyMutation, ActivateSupportedCurrencyMutationVariables>;
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
export const RecentApprovedLessonReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentApprovedLessonReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentApprovedLessonReports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"idempotencyKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RecentApprovedLessonReportsQuery, RecentApprovedLessonReportsQueryVariables>;
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
export const MeetingProvidersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meetingProviders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingProviders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MeetingProvidersQuery, MeetingProvidersQueryVariables>;
export const MeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MeetingProviderQuery, MeetingProviderQueryVariables>;
export const UserMeetingConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userMeetingConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userMeetingConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserMeetingConfigsQuery, UserMeetingConfigsQueryVariables>;
export const UserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserMeetingConfigQuery, UserMeetingConfigQueryVariables>;
export const CreateMeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createMeetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProviderCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMeetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateMeetingProviderMutation, CreateMeetingProviderMutationVariables>;
export const UpdateMeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateMeetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProviderUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMeetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateMeetingProviderMutation, UpdateMeetingProviderMutationVariables>;
export const DeleteMeetingProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteMeetingProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMeetingProvider"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteMeetingProviderMutation, DeleteMeetingProviderMutationVariables>;
export const CreateUserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createUserMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfigCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUserMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateUserMeetingConfigMutation, CreateUserMeetingConfigMutationVariables>;
export const UpdateUserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateUserMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfigUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateUserMeetingConfigMutation, UpdateUserMeetingConfigMutationVariables>;
export const DeleteUserMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteUserMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUserMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteUserMeetingConfigMutation, DeleteUserMeetingConfigMutationVariables>;
export const SetDefaultMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setDefaultMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SetDefaultMeetingConfigMutation, SetDefaultMeetingConfigMutationVariables>;
export const ClassMeetingConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classMeetingConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classMeetingConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ClassMeetingConfigsQuery, ClassMeetingConfigsQueryVariables>;
export const RecurringMeetingConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"recurringMeetingConfigs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recurringScheduleId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recurringMeetingConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"recurringScheduleId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recurringScheduleId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<RecurringMeetingConfigsQuery, RecurringMeetingConfigsQueryVariables>;
export const CreateClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfigCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateClassMeetingConfigMutation, CreateClassMeetingConfigMutationVariables>;
export const UpdateClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfigUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateClassMeetingConfigMutation, UpdateClassMeetingConfigMutationVariables>;
export const DeleteClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteClassMeetingConfigMutation, DeleteClassMeetingConfigMutationVariables>;
export const SetDefaultClassMeetingConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setDefaultClassMeetingConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultClassMeetingConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassMeetingConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingProviderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingProvider"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}},{"kind":"Field","name":{"kind":"Name","value":"urlAllowlist"}},{"kind":"Field","name":{"kind":"Name","value":"urlExample"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"fieldSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requiresMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportsUsername"}},{"kind":"Field","name":{"kind":"Name","value":"supportsPassword"}},{"kind":"Field","name":{"kind":"Name","value":"supportsTenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassMeetingConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassMeetingConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingProviderFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SetDefaultClassMeetingConfigMutation, SetDefaultClassMeetingConfigMutationVariables>;
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
export const ParentDashboardScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDashboardSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDashboardSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentInitials"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"bookingStatus"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"classTimeFormatted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<ParentDashboardScheduleQuery, ParentDashboardScheduleQueryVariables>;
export const ParentDashboardMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDashboardMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDashboardMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalStudents"}},{"kind":"Field","name":{"kind":"Name","value":"todaysClasses"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvoicesCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvoicesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"performanceAvg"}},{"kind":"Field","name":{"kind":"Name","value":"performanceAvgMobile"}},{"kind":"Field","name":{"kind":"Name","value":"pendingMessages"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studentProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workshopPromo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}}]} as unknown as DocumentNode<ParentDashboardMetricsQuery, ParentDashboardMetricsQueryVariables>;
export const ParentDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lifecycleStatusFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"lifecycleStatusFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lifecycleStatusFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"onLeave"}},{"kind":"Field","name":{"kind":"Name","value":"onTrial"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"guardianOf"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidInvoices"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentDirectoryQuery, ParentDirectoryQueryVariables>;
export const ParentsDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentsDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentsDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRowFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ParentDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<ParentsDirectoryQuery, ParentsDirectoryQueryVariables>;
export const ParentDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentDocuments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDocuments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"isProtected"}},{"kind":"Field","name":{"kind":"Name","value":"usageType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ParentDocumentsQuery, ParentDocumentsQueryVariables>;
export const LinkDocumentToParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkDocumentToParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"usageType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkDocumentToParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"usageType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"usageType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"isProtected"}},{"kind":"Field","name":{"kind":"Name","value":"usageType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<LinkDocumentToParentMutation, LinkDocumentToParentMutationVariables>;
export const ChangeParentLifecycleStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeParentLifecycleStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeParentLifecycleStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}}]}}]}}]} as unknown as DocumentNode<ChangeParentLifecycleStatusMutation, ChangeParentLifecycleStatusMutationVariables>;
export const CreateParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<CreateParentMutation, CreateParentMutationVariables>;
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
export const UserOverridesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userOverrides"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userOverrides"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserOverrideFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserOverrideFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserOverride"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionId"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedBy"}}]}}]} as unknown as DocumentNode<UserOverridesQuery, UserOverridesQueryVariables>;
export const EffectiveUserPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"effectiveUserPermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effectiveUserPermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<EffectiveUserPermissionsQuery, EffectiveUserPermissionsQueryVariables>;
export const CreatePermissionGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createPermissionGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePermissionGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPermissionGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionGroupDetailFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreatePermissionGroupMutation, CreatePermissionGroupMutationVariables>;
export const UpdatePermissionGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updatePermissionGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePermissionGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePermissionGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionGroupDetailFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<UpdatePermissionGroupMutation, UpdatePermissionGroupMutationVariables>;
export const DeletePermissionGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deletePermissionGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePermissionGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}]}]}}]} as unknown as DocumentNode<DeletePermissionGroupMutation, DeletePermissionGroupMutationVariables>;
export const AssignPermissionGroupToUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"assignPermissionGroupToUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AssignPermissionGroupToUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignPermissionGroupToUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<AssignPermissionGroupToUserMutation, AssignPermissionGroupToUserMutationVariables>;
export const RevokePermissionGroupFromUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"revokePermissionGroupFromUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RevokePermissionGroupFromUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokePermissionGroupFromUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<RevokePermissionGroupFromUserMutation, RevokePermissionGroupFromUserMutationVariables>;
export const BulkAssignUsersToGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"bulkAssignUsersToGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkAssignUsersToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}}}]}]}}]} as unknown as DocumentNode<BulkAssignUsersToGroupMutation, BulkAssignUsersToGroupMutationVariables>;
export const BulkRevokeUsersFromGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"bulkRevokeUsersFromGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkRevokeUsersFromGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}}}]}]}}]} as unknown as DocumentNode<BulkRevokeUsersFromGroupMutation, BulkRevokeUsersFromGroupMutationVariables>;
export const UpdateUserOverridesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateUserOverrides"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"overrides"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserOverrideInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserOverrides"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"overrides"},"value":{"kind":"Variable","name":{"kind":"Name","value":"overrides"}}}]}]}}]} as unknown as DocumentNode<UpdateUserOverridesMutation, UpdateUserOverridesMutationVariables>;
export const ProfileByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileByUserId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profileByUserId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacherAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodDefaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"associatedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffPermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffPermissionOverrides"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"permissionId"}},{"kind":"Field","name":{"kind":"Name","value":"permissionKey"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetingConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"hasSecret"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDefaults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"payinDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}}]} as unknown as DocumentNode<ProfileByUserIdQuery, ProfileByUserIdQueryVariables>;
export const UpdateOwnProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOwnProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOwnProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOwnProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOwnProfileMutation, UpdateOwnProfileMutationVariables>;
export const UpdateUserProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"audience"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationalId"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}},{"kind":"Field","name":{"kind":"Name","value":"parentAdminProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lifecycleStatus"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethodDefaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"staffProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"walletId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"paymentLinkId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"onlineAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"iban"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"beneficiaryName"}},{"kind":"Field","name":{"kind":"Name","value":"swiftBic"}},{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"routingNumber"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserPaymentMethodFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserPaymentMethod"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentMethodDetailsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentMethodDefaultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethodDefaults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"payinDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutDefault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserPaymentMethodFields"}}]}}]}}]} as unknown as DocumentNode<UpdateUserProfileMutation, UpdateUserProfileMutationVariables>;
export const StudentMonthlyReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentMonthlyReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentMonthlyReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"totalLessons"}},{"kind":"Field","name":{"kind":"Name","value":"completedLessons"}},{"kind":"Field","name":{"kind":"Name","value":"cancelledLessons"}},{"kind":"Field","name":{"kind":"Name","value":"presentCount"}},{"kind":"Field","name":{"kind":"Name","value":"absentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lateCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalHours"}},{"kind":"Field","name":{"kind":"Name","value":"creditsPurchased"}},{"kind":"Field","name":{"kind":"Name","value":"creditsDeducted"}},{"kind":"Field","name":{"kind":"Name","value":"creditsRefunded"}},{"kind":"Field","name":{"kind":"Name","value":"creditsBalance"}}]}}]}}]} as unknown as DocumentNode<StudentMonthlyReportQuery, StudentMonthlyReportQueryVariables>;
export const GenerateAttendanceReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GenerateAttendanceReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttendanceReportFiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateAttendanceReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"groupKey"}},{"kind":"Field","name":{"kind":"Name","value":"groupLabel"}},{"kind":"Field","name":{"kind":"Name","value":"takenClasses"}},{"kind":"Field","name":{"kind":"Name","value":"absentClasses"}},{"kind":"Field","name":{"kind":"Name","value":"leaveClasses"}},{"kind":"Field","name":{"kind":"Name","value":"pendingClasses"}},{"kind":"Field","name":{"kind":"Name","value":"totalHours"}},{"kind":"Field","name":{"kind":"Name","value":"paidAmounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"engagementGrowth"}}]}},{"kind":"Field","name":{"kind":"Name","value":"engagementGrowth"}}]}}]}}]} as unknown as DocumentNode<GenerateAttendanceReportQuery, GenerateAttendanceReportQueryVariables>;
export const DeleteBookMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBookMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteBookMutationMutation, DeleteBookMutationMutationVariables>;
export const LearningResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"learningResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"learningResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LearningResourceRowFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LearningResourcesQuery, LearningResourcesQueryVariables>;
export const UploadLearningResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"uploadLearningResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResourceUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadLearningResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LearningResourceRowFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UploadLearningResourceMutation, UploadLearningResourceMutationVariables>;
export const PrepareUploadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"prepareUpload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UploadPreparationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"prepareUpload"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"uploadType"}}]}}]}}]} as unknown as DocumentNode<PrepareUploadMutation, PrepareUploadMutationVariables>;
export const DeleteLearningResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLearningResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLearningResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteLearningResourceMutation, DeleteLearningResourceMutationVariables>;
export const SearchTeacherAvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchTeacherAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AvailabilitySearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchTeacherAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalGaps"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"availableDaysCount"}},{"kind":"Field","name":{"kind":"Name","value":"gaps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherGender"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"calendarDate"}},{"kind":"Field","name":{"kind":"Name","value":"gapStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"gapEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SearchTeacherAvailabilityQuery, SearchTeacherAvailabilityQueryVariables>;
export const ClassInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"hasTimezoneMismatch"}},{"kind":"Field","name":{"kind":"Name","value":"studentTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payrollCredited"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"subjectAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"rateAmount"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"isRateOverridden"}},{"kind":"Field","name":{"kind":"Name","value":"rateSource"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"grade"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"performance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"engagementScore"}},{"kind":"Field","name":{"kind":"Name","value":"assessmentProgress"}},{"kind":"Field","name":{"kind":"Name","value":"assessmentTotal"}},{"kind":"Field","name":{"kind":"Name","value":"focusLevel"}},{"kind":"Field","name":{"kind":"Name","value":"sessionHealth"}},{"kind":"Field","name":{"kind":"Name","value":"heatmapData"}},{"kind":"Field","name":{"kind":"Name","value":"latencyMs"}},{"kind":"Field","name":{"kind":"Name","value":"authorizationLabel"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgGrade"}},{"kind":"Field","name":{"kind":"Name","value":"lastClassDaysAgo"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<ClassInstanceQuery, ClassInstanceQueryVariables>;
export const ClassStatusEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classStatusEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classStatusEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ClassStatusEventsQuery, ClassStatusEventsQueryVariables>;
export const ActivateClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"activateClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}}]}}]}}]} as unknown as DocumentNode<ActivateClassMutation, ActivateClassMutationVariables>;
export const ActivateOverrideClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"activateOverrideClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateOverrideClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}}]}}]}}]} as unknown as DocumentNode<ActivateOverrideClassMutation, ActivateOverrideClassMutationVariables>;
export const ResetClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"resetClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<ResetClassMutation, ResetClassMutationVariables>;
export const UpdateSessionStatusStartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusStart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusStart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusStartMutation, UpdateSessionStatusStartMutationVariables>;
export const UpdateSessionStatusAbsentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusAbsent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusAbsent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"payrollCredited"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusAbsentMutation, UpdateSessionStatusAbsentMutationVariables>;
export const UpdateSessionStatusLeaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusLeave"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"leaveReason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusLeave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"leaveReason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"leaveReason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completedInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"completedInstance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledInstance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusLeaveMutation, UpdateSessionStatusLeaveMutationVariables>;
export const StopClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"stopClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<StopClassMutation, StopClassMutationVariables>;
export const RescheduleClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"rescheduleClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RescheduleClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}}]}}]} as unknown as DocumentNode<RescheduleClassMutation, RescheduleClassMutationVariables>;
export const DeleteClassInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<DeleteClassInstanceMutation, DeleteClassInstanceMutationVariables>;
export const OverrideClassInstanceRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"overrideClassInstanceRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rateAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rateCurrency"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrencyCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overrideClassInstanceRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rateAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rateAmount"}}},{"kind":"Argument","name":{"kind":"Name","value":"rateCurrency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rateCurrency"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rateAmount"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"isRateOverridden"}},{"kind":"Field","name":{"kind":"Name","value":"rateSource"}}]}}]}}]} as unknown as DocumentNode<OverrideClassInstanceRateMutation, OverrideClassInstanceRateMutationVariables>;
export const ExecuteDstBulkUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"executeDstBulkUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offsetMinutes"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executeDstBulkUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"offsetMinutes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offsetMinutes"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"updated"}},{"kind":"Field","name":{"kind":"Name","value":"conflicts"}},{"kind":"Field","name":{"kind":"Name","value":"unchanged"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"fromTime"}},{"kind":"Field","name":{"kind":"Name","value":"toTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conflictGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"conflicts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"checkedEmptyItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}}]}}]}}]} as unknown as DocumentNode<ExecuteDstBulkUpdateMutation, ExecuteDstBulkUpdateMutationVariables>;
export const CreateRecurringClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createRecurringClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRecurringClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRecurringClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceIds"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceCount"}}]}}]}}]} as unknown as DocumentNode<CreateRecurringClassMutation, CreateRecurringClassMutationVariables>;
export const RecurringScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"recurringSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recurringSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"defaultStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]} as unknown as DocumentNode<RecurringScheduleQuery, RecurringScheduleQueryVariables>;
export const UpdateRecurringClassRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateRecurringClassRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRecurringClassRateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecurringClassRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}}]}}]}}]} as unknown as DocumentNode<UpdateRecurringClassRateMutation, UpdateRecurringClassRateMutationVariables>;
export const DeleteRecurringClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteRecurringClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRecurringClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<DeleteRecurringClassMutation, DeleteRecurringClassMutationVariables>;
export const ClearWeeklyScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"clearWeeklySchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearWeeklySchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}]}]}}]} as unknown as DocumentNode<ClearWeeklyScheduleMutation, ClearWeeklyScheduleMutationVariables>;
export const AdminDashboardScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"adminDashboardSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminDashboardScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"yourTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTime"}},{"kind":"Field","name":{"kind":"Name","value":"studentTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"studentTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<AdminDashboardScheduleQuery, AdminDashboardScheduleQueryVariables>;
export const DailyScheduleMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dailyScheduleMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyScheduleMetrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}}]}}]} as unknown as DocumentNode<DailyScheduleMetricsQuery, DailyScheduleMetricsQueryVariables>;
export const DailyScheduleListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dailyScheduleList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metricFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyScheduleList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"metricFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metricFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"yourTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTime"}},{"kind":"Field","name":{"kind":"Name","value":"studentTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"studentTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<DailyScheduleListQuery, DailyScheduleListQueryVariables>;
export const RescheduleTrackingRowsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"rescheduleTrackingRows"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LeaveRequestStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleTrackingRows"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"originalClassId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dateLabel"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<RescheduleTrackingRowsQuery, RescheduleTrackingRowsQueryVariables>;
export const RescheduleTrackingMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"rescheduleTrackingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleTrackingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"approved"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"cancelled"}}]}}]}}]} as unknown as DocumentNode<RescheduleTrackingMetricsQuery, RescheduleTrackingMetricsQueryVariables>;
export const StatusTrackingScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"statusTrackingSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"viewerTimezone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"IanaTimezone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statusTrackingSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"viewerTimezone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"viewerTimezone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentInitials"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<StatusTrackingScheduleQuery, StatusTrackingScheduleQueryVariables>;
export const TeacherWeeklyScheduleGridDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherWeeklyScheduleGrid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherWeeklyScheduleGrid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<TeacherWeeklyScheduleGridQuery, TeacherWeeklyScheduleGridQueryVariables>;
export const TeacherWorkloadMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherWorkloadMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherWorkloadMetrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weeklyHoursWorked"}},{"kind":"Field","name":{"kind":"Name","value":"totalMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"classCount"}}]}}]}}]} as unknown as DocumentNode<TeacherWorkloadMetricsQuery, TeacherWorkloadMetricsQueryVariables>;
export const EnvConfigEntriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"envConfigEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"envConfigEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvConfigEntryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"displayStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSecret"}},{"kind":"Field","name":{"kind":"Name","value":"excludeFromDb"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}}]} as unknown as DocumentNode<EnvConfigEntriesQuery, EnvConfigEntriesQueryVariables>;
export const UpsertEnvConfigEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertEnvConfigEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertEnvConfigEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvConfigUpsertResultFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigUpsertResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigUpsertResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"hasDbOverride"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpsertEnvConfigEntryMutation, UpsertEnvConfigEntryMutationVariables>;
export const DeleteEnvConfigEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteEnvConfigEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEnvConfigEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EnvConfigDeleteResultFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EnvConfigDeleteResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EnvConfigDeleteResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]} as unknown as DocumentNode<DeleteEnvConfigEntryMutation, DeleteEnvConfigEntryMutationVariables>;
export const SystemSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"systemSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SystemSettingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SystemSettingsQuery, SystemSettingsQueryVariables>;
export const SystemSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"systemSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SystemSettingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SystemSettingQuery, SystemSettingQueryVariables>;
export const UpsertSystemSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertSystemSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSettingUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSystemSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SystemSettingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SystemSettingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SystemSetting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"updatedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpsertSystemSettingMutation, UpsertSystemSettingMutationVariables>;
export const DeleteSystemSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteSystemSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSystemSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}]}]}}]} as unknown as DocumentNode<DeleteSystemSettingMutation, DeleteSystemSettingMutationVariables>;
export const SessionConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"sessionConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SessionConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SessionConfigsQuery, SessionConfigsQueryVariables>;
export const SessionConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"sessionConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sessionConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roleName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SessionConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SessionConfigQuery, SessionConfigQueryVariables>;
export const UpsertSessionConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertSessionConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfigUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSessionConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SessionConfigFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionConfigFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SessionConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}},{"kind":"Field","name":{"kind":"Name","value":"ttlSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"maxConcurrentSessions"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpsertSessionConfigMutation, UpsertSessionConfigMutationVariables>;
export const DeleteSessionConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteSessionConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSessionConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roleName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleName"}}}]}]}}]} as unknown as DocumentNode<DeleteSessionConfigMutation, DeleteSessionConfigMutationVariables>;
export const SettingsAuditLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"settingsAuditLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SettingsAuditLogFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settingsAuditLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"logs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuditLogFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuditLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuditLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"actorUserId"}},{"kind":"Field","name":{"kind":"Name","value":"actorType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"previousState"}},{"kind":"Field","name":{"kind":"Name","value":"newState"}},{"kind":"Field","name":{"kind":"Name","value":"changes"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<SettingsAuditLogsQuery, SettingsAuditLogsQueryVariables>;
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
export const StudentDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentsOrderByClause"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentFilterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentDirectoryRowFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryQuery, StudentDirectoryQueryVariables>;
export const StudentsDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentsDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentDirectoryRowFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentsDirectoryQuery, StudentsDirectoryQueryVariables>;
export const StudentClassHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentClassHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentClassHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"hoursStudied"}},{"kind":"Field","name":{"kind":"Name","value":"performance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<StudentClassHistoryQuery, StudentClassHistoryQueryVariables>;
export const StudentClassSessionDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentClassSessionDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentClassSessionDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<StudentClassSessionDetailQuery, StudentClassSessionDetailQueryVariables>;
export const ReassignStudentTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReassignStudentTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newTeacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reassignStudentTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newTeacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newTeacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ReassignStudentTeacherMutation, ReassignStudentTeacherMutationVariables>;
export const ChangeStudentStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeStudentStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeStudentStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ChangeStudentStatusMutation, ChangeStudentStatusMutationVariables>;
export const CreateStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}}]}}]}}]} as unknown as DocumentNode<CreateStudentMutation, CreateStudentMutationVariables>;
export const StudentProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"timezoneOverride"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"displayCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentEmail"}},{"kind":"Field","name":{"kind":"Name","value":"parentPhone"}},{"kind":"Field","name":{"kind":"Name","value":"isAssociatedViewer"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"upcomingClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentUpcomingClassFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"classHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentHistoryMetricsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentHistorySessionFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentUpcomingClassFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentUpcomingClass"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistoryMetricsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistoryMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"hoursStudied"}},{"kind":"Field","name":{"kind":"Name","value":"performance"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentHistorySessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentHistorySession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfMonth"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]} as unknown as DocumentNode<StudentProfileQuery, StudentProfileQueryVariables>;
export const RecordStudentProfileEditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecordStudentProfileEdit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentProfileEditInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordStudentProfileEdit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"timezoneOverride"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"parentPhone"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RecordStudentProfileEditMutation, RecordStudentProfileEditMutationVariables>;
export const StudentUpcomingClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentUpcomingClasses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentUpcomingClasses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<StudentUpcomingClassesQuery, StudentUpcomingClassesQueryVariables>;
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
export const SupervisorDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"supervisorDashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supervisorDashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supervisorName"}},{"kind":"Field","name":{"kind":"Name","value":"pendingReviewCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingDuesSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentApprovals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"lessonDate"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceEvaluation"}},{"kind":"Field","name":{"kind":"Name","value":"teacherNotes"}},{"kind":"Field","name":{"kind":"Name","value":"studentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"monthlySnapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<SupervisorDashboardQuery, SupervisorDashboardQueryVariables>;
export const TeacherDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"deactivated"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalTeachers"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherDirectoryQuery, TeacherDirectoryQueryVariables>;
export const ManagerDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"managerDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"managerDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"roleFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleFilter"}}},{"kind":"Argument","name":{"kind":"Name","value":"statusFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"systemStaff"}},{"kind":"Field","name":{"kind":"Name","value":"activeNow"}},{"kind":"Field","name":{"kind":"Name","value":"alerts"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ManagerDirectoryQuery, ManagerDirectoryQueryVariables>;
export const UpdateManagerProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateManagerProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"staffProfileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateManagerProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateManagerProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"staffProfileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"staffProfileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}}]}}]}}]} as unknown as DocumentNode<UpdateManagerProfileMutation, UpdateManagerProfileMutationVariables>;
export const OnboardingMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onboardingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activeStaff"}},{"kind":"Field","name":{"kind":"Name","value":"pendingApproval"}},{"kind":"Field","name":{"kind":"Name","value":"avgOnboardingDays"}}]}}]}}]} as unknown as DocumentNode<OnboardingMetricsQuery, OnboardingMetricsQueryVariables>;
export const StaffDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"staffDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"permissionGroupFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"staffDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"permissionGroupFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"permissionGroupFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRowFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StaffDirectoryAutocompleteRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode<StaffDirectoryQuery, StaffDirectoryQueryVariables>;
export const CreateManagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createManager"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ManagerOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createManager"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignedGroupSlug"}}]}}]}}]} as unknown as DocumentNode<CreateManagerMutation, CreateManagerMutationVariables>;
export const TeacherProfileForEditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherProfileForEdit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherProfileForEdit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}}]}}]} as unknown as DocumentNode<TeacherProfileForEditQuery, TeacherProfileForEditQueryVariables>;
export const UpdateTeacherProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateTeacherProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherProfileUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeacherProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}}]}}]} as unknown as DocumentNode<UpdateTeacherProfileMutation, UpdateTeacherProfileMutationVariables>;
export const TeacherDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scheduleRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"yourTimeFormatted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"progressFeed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTimeFormatted"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"eventKind"}},{"kind":"Field","name":{"kind":"Name","value":"occurredAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<TeacherDashboardQuery, TeacherDashboardQueryVariables>;
export const CreateTeacherManualClassEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacherManualClassEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateManualClassEntryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherManualClassEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}}]}}]} as unknown as DocumentNode<CreateTeacherManualClassEntryMutation, CreateTeacherManualClassEntryMutationVariables>;
export const LogTeacherSupportRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"logTeacherSupportRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogSupportRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logTeacherSupportRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<LogTeacherSupportRequestMutation, LogTeacherSupportRequestMutationVariables>;
export const TeacherFutureScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherFutureSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherFutureSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"leaveQuotaUsed"}},{"kind":"Field","name":{"kind":"Name","value":"leaveQuotaTotal"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"leaveRequestDisabled"}},{"kind":"Field","name":{"kind":"Name","value":"leaveRequestDisabledReason"}},{"kind":"Field","name":{"kind":"Name","value":"studentCount"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"importantNotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportContact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<TeacherFutureScheduleQuery, TeacherFutureScheduleQueryVariables>;
export const TeacherHandbookUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<TeacherHandbookUrlQuery, TeacherHandbookUrlQueryVariables>;
export const TeacherPendingDuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherPendingDues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherPendingDues"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classDate"}},{"kind":"Field","name":{"kind":"Name","value":"hours"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"approvedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teacherPaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rateSource"}}]}}]}}]} as unknown as DocumentNode<TeacherPendingDuesQuery, TeacherPendingDuesQueryVariables>;
export const TeacherPendingDuesSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherPendingDuesSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherPendingDuesSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<TeacherPendingDuesSummaryQuery, TeacherPendingDuesSummaryQueryVariables>;
export const TeacherMonthlyReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherMonthlyReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherMonthlyReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"lessonsTaught"}},{"kind":"Field","name":{"kind":"Name","value":"approvedCount"}},{"kind":"Field","name":{"kind":"Name","value":"cancelledCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAccruedHours"}},{"kind":"Field","name":{"kind":"Name","value":"totalDueAmount"}},{"kind":"Field","name":{"kind":"Name","value":"totalPaidAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<TeacherMonthlyReportQuery, TeacherMonthlyReportQueryVariables>;
export const MarkTeacherDuesPaidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkTeacherDuesPaid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dueIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherPaymentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markTeacherDuesPaid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dueIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dueIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherPaymentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherPaymentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classDate"}},{"kind":"Field","name":{"kind":"Name","value":"hours"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"approvedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teacherPaymentId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MarkTeacherDuesPaidMutation, MarkTeacherDuesPaidMutationVariables>;
export const CreateTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeacherNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TeacherImportantNoteFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<CreateTeacherImportantNoteMutation, CreateTeacherImportantNoteMutationVariables>;
export const UpdateTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeacherNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TeacherImportantNoteFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<UpdateTeacherImportantNoteMutation, UpdateTeacherImportantNoteMutationVariables>;
export const DeleteTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTeacherImportantNoteMutation, DeleteTeacherImportantNoteMutationVariables>;
export const CreateTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"timezoneDisplay"}}]}}]}}]} as unknown as DocumentNode<CreateTeacherMutation, CreateTeacherMutationVariables>;
export const TeacherAssignedStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherAssignedStudentsQuery, TeacherAssignedStudentsQueryVariables>;
export const TeacherOwnProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"displayAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"stale"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherOwnProfileQuery, TeacherOwnProfileQueryVariables>;
export const TeacherAssignedClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherAssignedClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherAssignedClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"Field","name":{"kind":"Name","value":"meetingJoinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveMeeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectiveMeetingFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectiveMeetingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectiveMeeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerSlug"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"configId"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]} as unknown as DocumentNode<TeacherAssignedClassesQuery, TeacherAssignedClassesQueryVariables>;
export const TeachersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teachers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<TeachersQuery, TeachersQueryVariables>;