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
  | 'AUTH_VIEW_OWN_PROFILE'
  | 'BILLING_CREATE_INVOICE'
  | 'BILLING_DELETE_INVOICE'
  | 'BILLING_UPDATE_STATUS_PAID'
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
  | 'PARENT_VIEW_PROFILE'
  | 'PERMISSION_GROUPS_ASSIGN'
  | 'PERMISSION_GROUPS_MANAGE'
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
  | 'STAFF_CREATE'
  | 'STAFF_EDIT'
  | 'STAFF_EDIT_PROFILE'
  | 'STAFF_LIST'
  | 'STAFF_VIEW_DIRECTORY'
  | 'STORAGE_MANAGE'
  | 'STUDENTS_CHANGE_STATUS'
  | 'STUDENTS_CHANGE_TEACHER'
  | 'STUDENTS_EDIT'
  | 'STUDENTS_LIST'
  | 'STUDENTS_OVERRIDE_QUOTA'
  | 'STUDENT_EDIT_QUOTA'
  | 'STUDENT_MANAGE_STATUS'
  | 'STUDENT_REASSIGN_TEACHER'
  | 'STUDENT_VIEW_ASSOCIATED'
  | 'SUBJECTS_CREATE'
  | 'SUBJECTS_DELETE'
  | 'SUBJECTS_LIST'
  | 'SUBJECTS_MANAGE_RESOURCES'
  | 'SUBJECTS_UPDATE'
  | 'SUBJECTS_VIEW_RESOURCES'
  | 'SUGGESTIONS_DELETE'
  | 'SUGGESTIONS_LIST'
  | 'SUGGESTIONS_REVIEW'
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
  | 'TEACHER_VIEW_DASHBOARD'
  | 'TEACHER_VIEW_OWN_PROFILE'
  | 'TEACHER_VIEW_STUDENTS'
  | 'TEST_CUSTOM_ALT'
  | 'TEST_CUSTOM_ONLY'
  | 'TEST_SYSTEM_ONLY'
  | 'USER_VIEW_PROFILE';

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
  fromTime: string;
  gender: Gender | null | undefined;
  toTime: string;
};

export type BillingMonthInput = {
  month: number;
  year: number;
};

export type BookingStatus =
  | 'CONFIRMED'
  | 'RESCHEDULED';

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

export type ClassOutcome =
  | 'ABSENT'
  | 'LEAVE'
  | 'PENDING'
  | 'TAKEN';

export type ClassSubjectCreateInput = {
  categoryId: string;
  description: string | null | undefined;
  isActive: boolean | null | undefined;
  name: string;
  slug: string;
  sortOrder: number | null | undefined;
};

export type ClassSubjectUpdateInput = {
  categoryId: string | null | undefined;
  description: string | null | undefined;
  isActive: boolean | null | undefined;
  name: string | null | undefined;
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
  teacherId: string | number;
};

export type CreatePermissionGroupInput = {
  description: string | null | undefined;
  name: string;
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
  studentId: string;
  teacherId: string;
  timezone: string;
  timezoneId: number | null | undefined;
};

export type CreateTeacherNoteInput = {
  body: string | null | undefined;
  expiresAt: string | null | undefined;
  isPublished: boolean | null | undefined;
  priority: number | null | undefined;
  startsAt: string | null | undefined;
  title: string;
};

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

export type Gender =
  | 'FEMALE'
  | 'MALE';

export type GroupClassAttendanceStatus =
  | 'ABSENT'
  | 'LATE'
  | 'PENDING'
  | 'PRESENT';

export type InvoiceStatus =
  | 'CANCELLED'
  | 'PAID'
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

export type LogSupportRequestInput = {
  reason: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

/** Account type for new manager */
export type ManagerAccountType =
  | 'admin'
  | 'manager';

/** Input for creating a new manager/staff account with RBAC assignment */
export type ManagerOnboardingInput = {
  accountType: ManagerAccountType;
  email: string;
  name: string;
  password: string;
  phone: string | null | undefined;
  skypeId: string | null | undefined;
};

/** Input for marking a suggestion as a duplicate of another suggestion. */
export type MarkSuggestionDuplicateInput = {
  duplicateOfId: string;
  suggestionId: string;
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

/** Input for creating a new parent account with billing configuration */
export type ParentOnboardingInput = {
  address: string | null | undefined;
  currency: string | null | undefined;
  defaultZoomLink: string | null | undefined;
  email: string;
  facebook: string | null | undefined;
  feeAmount: string | null | undefined;
  invoiceType: InvoiceType | null | undefined;
  name: string;
  nationality: string | null | undefined;
  password: string;
  paymentMethod: PaymentMethod | null | undefined;
  phone: string | null | undefined;
  skype: string | null | undefined;
  timezone: string | null | undefined;
  twitter: string | null | undefined;
  whatsapp: string | null | undefined;
};

export type ParentStatus =
  | 'ACTIVATED'
  | 'DEACTIVATED'
  | 'ON_LEAVE'
  | 'ON_TRIAL'
  | 'REGULAR'
  | 'SUSPENDED';

export type PaymentMethod =
  | 'BANK_ACCOUNT'
  | 'PAYPAL';

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

/** Input for creating a new teacher account with comprehensive profile */
export type TeacherOnboardingInput = {
  /** Bank account number */
  accountNumber: string | null | undefined;
  /** Teacher address */
  address: string | null | undefined;
  /** Bank name */
  bankName: string | null | undefined;
  /** Banking beneficiary name */
  beneficiaryName: string | null | undefined;
  /** Teacher country code */
  countryCode: CountryCode | null | undefined;
  /** Teacher date of birth (ISO date string) */
  dateOfBirth: string | null | undefined;
  /** Teacher email address */
  email: string;
  /** Teacher gender */
  gender: Gender | null | undefined;
  /** Teacher hourly rate */
  hourlyRate: string | null | undefined;
  /** IBAN */
  iban: string | null | undefined;
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
  rateCurrency: string | null | undefined;
  /** Bank routing number */
  routingNumber: string | null | undefined;
  /** Teacher Skype ID */
  skypeId: string | null | undefined;
  /** SWIFT/BIC code */
  swiftBic: string | null | undefined;
  /** IANA timezone identifier */
  timezone: string;
  /** Timezone ID reference */
  timezoneId: number | null | undefined;
  /** Teacher Zoom meeting link */
  zoomLink: string | null | undefined;
  /** Teacher Zoom password (encrypted) */
  zoomPassword: string | null | undefined;
  /** Teacher Zoom username */
  zoomUsername: string | null | undefined;
};

export type TeacherProfileUpdateInput = {
  address: string | null | undefined;
  dateOfBirth: string | null | undefined;
  gender: Gender | null | undefined;
  hourlyRate: string | null | undefined;
  nationalId: string | null | undefined;
  paymentMethod: PaymentMethod | null | undefined;
  phone: string | null | undefined;
  qualifications: string | null | undefined;
  rateCurrency: string | null | undefined;
  skypeId: string | null | undefined;
  timezone: string | null | undefined;
  zoomLink: string | null | undefined;
  zoomPassword: string | null | undefined;
  zoomUsername: string | null | undefined;
};

export type UpdateManagerProfileInput = {
  phone: string | null | undefined;
  skypeId: string | null | undefined;
  status: AccountStatus | null | undefined;
};

export type UpdatePermissionGroupInput = {
  description: string | null | undefined;
  groupId: string;
  name: string | null | undefined;
  permissionIds: Array<string> | null | undefined;
};

export type UpdateTeacherNoteInput = {
  body: string | null | undefined;
  expiresAt: string | null | undefined;
  isPublished: boolean | null | undefined;
  priority: number | null | undefined;
  startsAt: string | null | undefined;
  title: string | null | undefined;
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

export type UserOverrideInput = {
  permissionId: string;
  state: OverrideState;
};

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null } | null };

export type UserQueryVariables = Exact<{
  id: string;
}>;


export type UserQuery = { user: { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null } | null };

export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = { users: Array<{ createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null }> | null };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { token: string | null, user: { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null } | null } | null };

export type DemoLoginMutationVariables = Exact<{
  input: DemoLoginInput;
}>;


export type DemoLoginMutation = { demoLogin: { token: string | null, user: { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null } | null } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean | null };

export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = { refreshToken: { token: string | null, user: { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null } | null } | null };

export type ImpersonationStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type ImpersonationStatusQuery = { impersonationStatus: { isActive: boolean | null, startedAt: string | null, expiresAt: string | null, reason: string | null, targetUser: { id: string | null, name: string | null, email: string | null } | null, actorUser: { id: string | null, name: string | null, email: string | null } | null } | null };

export type StartImpersonationMutationVariables = Exact<{
  targetUserId: string;
  reason: string | null | undefined;
}>;


export type StartImpersonationMutation = { startImpersonation: { token: string | null, expiresAt: string | null, impersonationSessionId: string | null, targetUser: { id: string | null, name: string | null, email: string | null, permissions: Array<AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null, teacherId: string | null } | null } | null };

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

export type SearchTeacherAvailabilityQueryVariables = Exact<{
  input: AvailabilitySearchInput;
}>;


export type SearchTeacherAvailabilityQuery = { searchTeacherAvailability: { id: string | null, totalGaps: number | null, teachers: Array<{ id: string | null, name: string | null, gender: Gender | null, timezone: string | null, gaps: Array<{ id: string | null, teacherId: string | null, teacherName: string | null, teacherGender: string | null, dayOfWeek: DayOfWeek | null, gapStartTime: string | null, gapEndTime: string | null, timezone: string | null }> | null }> | null } | null };

export type UnpaidInvoicesAlertQueryVariables = Exact<{ [key: string]: never; }>;


export type UnpaidInvoicesAlertQuery = { unpaidInvoicesAlert: { id: string | null, totalOverdueInvoices: number | null, totalOverdueAmount: string | null, items: Array<{ id: string | null, userId: string | null, userName: string | null, userEmail: string | null, totalUnpaidAmount: string | null, currency: string | null, overdueCount: number | null, oldestDueDate: string | null }> | null } | null };

export type CreateManualInvoiceMutationVariables = Exact<{
  parentId: string;
  studentId: string | null | undefined;
  amount: string;
  currency: string;
  invoiceType: InvoiceType;
  issueDate: string;
  dueDate: string;
  exchangeRateSnapshot: string | null | undefined;
  exchangeRateSource: string | null | undefined;
  billingMonths: Array<BillingMonthInput> | BillingMonthInput | null | undefined;
  sendEmail: boolean | null | undefined;
}>;


export type CreateManualInvoiceMutation = { createManualInvoice: { id: string | null, parentId: string | null, studentId: string | null, amount: string | null, currency: string | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, version: number | null, createdAt: string | null } | null };

export type MarkInvoicePaidMutationVariables = Exact<{
  invoiceId: string;
  expectedVersion: number | null | undefined;
}>;


export type MarkInvoicePaidMutation = { markInvoicePaid: { id: string | null, parentId: string | null, status: InvoiceStatus | null, paidDate: string | null, version: number | null, notificationSummaryUpdated: boolean | null } | null };

export type DeleteInvoiceMutationVariables = Exact<{
  invoiceId: string;
}>;


export type DeleteInvoiceMutation = { deleteInvoice: { id: string | null, parentId: string | null, version: number | null, notificationSummaryUpdated: boolean | null } | null };

export type SendPaymentReminderMutationVariables = Exact<{
  studentId: string;
}>;


export type SendPaymentReminderMutation = { sendPaymentReminder: { id: string | null, success: boolean | null } | null };

export type DeleteBookMutationMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteBookMutationMutation = { deleteBook: boolean | null };

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

export type ClassInstanceQueryVariables = Exact<{
  id: string | number;
}>;


export type ClassInstanceQuery = { classInstance: { id: string | null, courseName: string | null, classType: ClassType | null, instanceId: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, status: ClassExecutionState | null, remarks: string | null, hasTimezoneMismatch: boolean | null, studentTimezone: string | null, teacherTimezone: string | null, zoomMeetingUrl: string | null, payrollCredited: boolean | null, isRescheduled: boolean | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, student: { id: string | null, name: string | null, grade: string | null, level: string | null, avatarUrl: string | null } | null, teacher: { id: string | null, name: string | null, title: string | null, avatarUrl: string | null } | null, performance: { id: string | null, engagementScore: number | null, assessmentProgress: number | null, assessmentTotal: number | null, focusLevel: string | null, sessionHealth: string | null, heatmapData: Array<unknown> | null, latencyMs: number | null, authorizationLabel: string | null, attendanceRate: number | null, avgGrade: string | null, lastClassDaysAgo: number | null } | null } | null };

export type ClassStatusEventsQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ClassStatusEventsQuery = { classStatusEvents: Array<{ id: string | null, eventType: string | null, description: string | null, createdAt: string | null }> | null };

export type ActivateClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ActivateClassMutation = { activateClass: { id: string | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null, zoomMeetingUrl: string | null } | null };

export type ActivateOverrideClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ActivateOverrideClassMutation = { activateOverrideClass: { id: string | null, executionState: ClassExecutionState | null, status: ClassExecutionState | null, durationMinutes: number | null, remarks: string | null, zoomMeetingUrl: string | null } | null };

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

export type ClassSubjectFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, category: { id: string | null, name: string | null, slug: string | null } | null };

export type SubjectResourceFieldsFragment = { id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null };

export type ClassSubjectsQueryVariables = Exact<{
  categoryId: string | null | undefined;
}>;


export type ClassSubjectsQuery = { classSubjects: Array<{ id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, resources: Array<{ id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null }> | null, category: { id: string | null, name: string | null, slug: string | null } | null }> | null };

export type ClassSubjectByIdQueryVariables = Exact<{
  id: string | number;
}>;


export type ClassSubjectByIdQuery = { classSubject: { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, resources: Array<{ id: string | null, subjectId: string | null, learningResourceId: string | null, resourceType: string | null, sortOrder: number | null, displayName: string | null, filePath: string | null }> | null, category: { id: string | null, name: string | null, slug: string | null } | null } | null };

export type CreateClassSubjectMutationVariables = Exact<{
  input: ClassSubjectCreateInput;
}>;


export type CreateClassSubjectMutation = { createClassSubject: { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, category: { id: string | null, name: string | null, slug: string | null } | null } | null };

export type UpdateClassSubjectMutationVariables = Exact<{
  id: string | number;
  input: ClassSubjectUpdateInput;
}>;


export type UpdateClassSubjectMutation = { updateClassSubject: { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, sortOrder: number | null, categoryId: string | null, category: { id: string | null, name: string | null, slug: string | null } | null } | null };

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

export type ExecuteDstBulkUpdateMutationVariables = Exact<{
  offsetMinutes: number;
  description: string;
}>;


export type ExecuteDstBulkUpdateMutation = { executeDstBulkUpdate: { id: string | null, runId: string | null, updated: number | null, conflicts: number | null, unchanged: number | null, total: number | null, status: string | null, updatedSessions: Array<{ id: string | null, studentName: string | null, teacherName: string | null, fromTime: string | null, toTime: string | null }> | null, conflictGroups: Array<{ id: string | null, teacherName: string | null, conflicts: Array<{ id: string | null, studentName: string | null, message: string | null }> | null }> | null, checkedEmptyItems: Array<{ id: string | null, studentName: string | null, reason: string | null }> | null } | null };

export type GroupClassAuditQueryVariables = Exact<{
  classInstanceId: string;
}>;


export type GroupClassAuditQuery = { groupClassAudit: { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: ClassExecutionState | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<{ id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: GroupClassAttendanceStatus | null, avatarUrl: string | null }> | null, meetingInfo: { platform: string | null, meetingId: string | null, joinUrl: string | null } | null, communications: Array<{ id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null }> | null, adminNote: { content: string | null, lastUpdated: string | null } | null } | null };

export type UpdateClassAdminNoteMutationVariables = Exact<{
  classInstanceId: string;
  content: string;
}>;


export type UpdateClassAdminNoteMutation = { updateClassAdminNote: { id: string | null, className: string | null, courseCode: string | null, teacherName: string | null, originalDate: string | null, rescheduledDate: string | null, timeSlot: string | null, venue: string | null, status: ClassExecutionState | null, auditRemark: string | null, auditLoggedAt: string | null, registeredStudentCount: number | null, totalStudentCount: number | null, students: Array<{ id: string | null, name: string | null, studentId: string | null, initials: string | null, attendanceStatus: GroupClassAttendanceStatus | null, avatarUrl: string | null }> | null, meetingInfo: { platform: string | null, meetingId: string | null, joinUrl: string | null } | null, communications: Array<{ id: string | null, type: string | null, title: string | null, description: string | null, isActive: boolean | null, isDelivered: boolean | null, timestamp: string | null }> | null, adminNote: { content: string | null, lastUpdated: string | null } | null } | null };

export type ResendClassNotificationsMutationVariables = Exact<{
  classInstanceId: string;
}>;


export type ResendClassNotificationsMutation = { resendClassNotifications: { id: string | null, success: boolean | null } | null };

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

export type CreateManagerMutationVariables = Exact<{
  input: ManagerOnboardingInput;
}>;


export type CreateManagerMutation = { createManager: { id: string | null, userId: string | null, staffProfileId: string | null, name: string | null, email: string | null, status: string | null, assignedGroupSlug: string | null } | null };

export type NotificationAlertsQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationAlertsQuery = { notificationAlerts: { id: string | null, totalCount: number | null, unreadCount: number | null, alerts: Array<{ id: string | null, type: string | null, title: string | null, body: string | null, createdAt: string | null, severity: string | null }> | null } | null };

export type ParentInvoiceHistoryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type ParentInvoiceHistoryQuery = { parentInvoiceHistory: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: string | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type AdminInvoicesQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type AdminInvoicesQuery = { adminInvoices: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: string | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type AdminBillingSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminBillingSummaryQuery = { adminBillingSummary: { id: string | null, totalOutstanding: string | null, pendingCount: number | null, mtdRevenue: string | null, negativeBalanceCount: number | null } | null };

export type StudentCreditStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type StudentCreditStatusQuery = { studentCreditStatus: Array<{ id: string | null, studentName: string | null, parentEmail: string | null, planType: InvoiceType | null, classesRemaining: number | null, classesTotal: number | null, status: StudentStatus | null }> | null };

export type ParentBillingSummaryQueryVariables = Exact<{
  parentId: string | null | undefined;
  userId: string | null | undefined;
}>;


export type ParentBillingSummaryQuery = { parentBillingSummary: { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null } | null };

export type ParentDashboardScheduleQueryVariables = Exact<{
  date: string | null | undefined;
  search: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type ParentDashboardScheduleQuery = { parentDashboardSchedule: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentAvatarUrl: string | null, teacherId: string | null, teacherName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, bookingStatus: BookingStatus | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, zoomMeetingUrl: string | null, classTimeFormatted: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type ParentDashboardMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentDashboardMetricsQuery = { parentDashboardMetrics: { id: string | null, metrics: { id: string | null, totalStudents: number | null, todaysClasses: number | null, pendingInvoicesCount: number | null, pendingInvoicesAmount: string | null, performanceAvg: number | null, performanceAvgMobile: number | null, pendingMessages: number | null } | null, studentProgress: Array<{ id: string | null, name: string | null, completionPercent: number | null }> | null, workshopPromo: { id: string | null, title: string | null, description: string | null, imageUrl: string | null } | null } | null };

export type ParentDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  search: string | null | undefined;
  statusFilter: ParentStatus | null | undefined;
}>;


export type ParentDirectoryQuery = { parentDirectory: { id: string | null, totalCount: number | null, metrics: { id: string | null, activated: number | null, deactivated: number | null, regular: number | null, onLeave: number | null, onTrial: number | null, suspended: number | null } | null, rows: Array<{ id: string | null, userId: string | null, index: number | null, name: string | null, email: string | null, avatarUrl: string | null, guardianOf: string | null, time: string | null, accountStatus: ParentStatus | null, unpaidInvoices: number | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

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

export type CreateParentMutationVariables = Exact<{
  input: ParentOnboardingInput;
}>;


export type CreateParentMutation = { createParent: { userId: string | null, parentId: string | null, name: string | null, email: string | null, status: string | null, invoiceType: string | null, currency: string | null } | null };

export type ParentProfileQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentProfileQuery = { parentProfile: { id: string | null, userId: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, phone: string | null, nationality: string | null, address: string | null, facebook: string | null, whatsapp: string | null, twitter: string | null, skype: string | null, defaultZoomLink: string | null, invoiceType: string | null, feeAmount: string | null, paymentMethod: string | null, currency: string | null, timezone: string | null, createdAt: string | null, updatedAt: string | null } | null };

export type ParentAssociatedStudentsQueryVariables = Exact<{
  parentId: string;
}>;


export type ParentAssociatedStudentsQuery = { parentAssociatedStudents: Array<{ id: string | null, name: string | null, status: string | null, primaryTeacherId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, updatedAt: string | null }> | null };

export type DeactivateParentMutationVariables = Exact<{
  parentId: string;
}>;


export type DeactivateParentMutation = { deactivateParent: { id: string | null, status: string | null } | null };

export type UpdateStudentQuotaMutationVariables = Exact<{
  studentId: string;
  newClassesRemaining: number;
  expectedVersion: number | null | undefined;
}>;


export type UpdateStudentQuotaMutation = { updateStudentQuota: { id: string | null, classesRemaining: number | null, classesTotal: number | null, version: number | null } | null };

export type PermissionFieldsFragment = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionGroupFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null };

export type PermissionGroupDetailFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null };

export type UserOverrideFieldsFragment = { permissionId: string | null, state: OverrideState | null, assignedBy: string | null };

export type PermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionsQuery = { permissions: Array<{ id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null }> | null };

export type PermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionGroupsQuery = { permissionGroups: Array<{ id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null }> | null };

export type PermissionGroupQueryVariables = Exact<{
  id: string;
}>;


export type PermissionGroupQuery = { permissionGroup: { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null } | null };

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


export type CreatePermissionGroupMutation = { createPermissionGroup: { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null } | null };

export type UpdatePermissionGroupMutationVariables = Exact<{
  input: UpdatePermissionGroupInput;
}>;


export type UpdatePermissionGroupMutation = { updatePermissionGroup: { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<{ id: string | null, name: string | null, email: string | null }> | null } | null };

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

export type CreateRecurringClassMutationVariables = Exact<{
  input: CreateRecurringClassInput;
}>;


export type CreateRecurringClassMutation = { createRecurringClass: { id: string | null, recurringScheduleId: string | null, classInstanceIds: Array<string> | null, classInstanceCount: number | null } | null };

export type GenerateAttendanceReportQueryVariables = Exact<{
  filters: AttendanceReportFiltersInput;
}>;


export type GenerateAttendanceReportQuery = { generateAttendanceReport: { engagementGrowth: number | null, rows: Array<{ id: string | null, groupKey: string | null, groupLabel: string | null, takenClasses: number | null, absentClasses: number | null, leaveClasses: number | null, pendingClasses: number | null, totalHours: number | null, paidEGP: number | null, paidUSD: number | null, engagementGrowth: number | null }> | null } | null };

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


export type AdminDashboardScheduleQuery = { adminDashboardSchedule: { id: string | null, totalCount: number | null, metrics: { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null } | null, rows: Array<{ id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, duration: number | null, scheduledStartAt: string | null, scheduledEndAt: string | null, outcome: ClassOutcome | null, executionState: ClassExecutionState | null, student: { id: string | null, name: string | null } | null, teacher: { id: string | null, name: string | null } | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

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


export type DailyScheduleListQuery = { dailyScheduleList: Array<{ id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, duration: number | null, outcome: ClassOutcome | null, executionState: ClassExecutionState | null, student: { id: string | null, name: string | null } | null, teacher: { id: string | null, name: string | null } | null }> | null };

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
  viewerTimezone: string | null | undefined;
}>;


export type StatusTrackingScheduleQuery = { statusTrackingSchedule: Array<{ id: string | null, studentId: string | null, studentName: string | null, studentInitials: string | null, studentStatus: StudentStatus | null, teacherId: string | null, teacherName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, isFrozen: boolean | null }> | null };

export type TeacherDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type TeacherDirectoryQuery = { teacherDirectory: { id: string | null, totalTeachers: number | null, metrics: { id: string | null, activated: number | null, deactivated: number | null } | null, rows: Array<{ id: string | null, userId: string | null, index: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: AccountStatus | null, zoomLink: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type ManagerDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  roleFilter: string | null | undefined;
  statusFilter: string | null | undefined;
}>;


export type ManagerDirectoryQuery = { managerDirectory: { id: string | null, totalCount: number | null, metrics: { id: string | null, totalAdmin: number | null, systemStaff: number | null, activeNow: number | null, alerts: number | null } | null, rows: Array<{ id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, skypeId: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type UpdateManagerProfileMutationVariables = Exact<{
  staffProfileId: string | number;
  input: UpdateManagerProfileInput;
}>;


export type UpdateManagerProfileMutation = { updateManagerProfile: { id: string | null, staffProfileId: string | null, name: string | null, email: string | null, avatarUrl: string | null, phone: string | null, skypeId: string | null, status: AccountStatus | null, roleSlug: string | null, roleName: string | null } | null };

export type OnboardingMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingMetricsQuery = { onboardingMetrics: { id: string | null, activeStaff: number | null, pendingApproval: number | null, avgOnboardingDays: number | null } | null };

export type TeacherProfileForEditQueryVariables = Exact<{
  teacherId: string | number;
}>;


export type TeacherProfileForEditQuery = { teacherProfileForEdit: { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, skypeId: string | null, zoomLink: string | null, zoomUsername: string | null, timezone: string | null, hourlyRate: string | null, rateCurrency: string | null, status: AccountStatus | null, updatedAt: string | null, paymentMethod: PaymentMethod | null, totalClasses: number | null, avgEngagementScore: number | null } | null };

export type UpdateTeacherProfileMutationVariables = Exact<{
  teacherId: string | number;
  input: TeacherProfileUpdateInput;
}>;


export type UpdateTeacherProfileMutation = { updateTeacherProfile: { id: string | null, userId: string | null, name: string | null, email: string | null, phone: string | null, dateOfBirth: string | null, gender: Gender | null, address: string | null, qualifications: string | null, skypeId: string | null, zoomLink: string | null, zoomUsername: string | null, timezone: string | null, hourlyRate: string | null, rateCurrency: string | null, status: AccountStatus | null, updatedAt: string | null, paymentMethod: PaymentMethod | null, totalClasses: number | null, avgEngagementScore: number | null } | null };

export type StudentDirectoryRowFragmentFragment = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryDetailFragmentFragment = { id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, parentName: string | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null };

export type StudentDirectoryQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  orderBy: Array<StudentsOrderByClause> | StudentsOrderByClause | null | undefined;
  filterArgs: StudentFilterArgs | null | undefined;
}>;


export type StudentDirectoryQuery = { studentDirectory: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, classesRemaining: number | null, classesTotal: number | null, hoursPerWeek: number | null, teacherName: string | null, createdAt: string | null, updatedAt: string | null }> | null, pageInfo: { count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } | null } | null };

export type StudentClassHistoryQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;


export type StudentClassHistoryQuery = { studentClassHistory: { id: string | null, studentName: string | null, metrics: { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null } | null, sessions: Array<{ id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, instructor: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null }> | null } | null };

export type StudentClassSessionDetailQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type StudentClassSessionDetailQuery = { studentClassSessionDetail: { id: string | null, durationMinutes: number | null, executionState: string | null, outcome: string | null, remarks: string | null, zoomMeetingUrl: string | null, teacherName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null } | null };

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

export type StudentUpcomingClassesQueryVariables = Exact<{
  studentId: string;
}>;


export type StudentUpcomingClassesQuery = { studentUpcomingClasses: { id: string | null, studentId: string | null, studentName: string | null, status: StudentStatus | null, classes: Array<{ id: string | null, instructor: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, isFrozen: boolean | null }> | null } | null };

export type StudentsQueryVariables = Exact<{
  paginationArgs: PaginationArgs | null | undefined;
  orderBy: Array<StudentsOrderByClause> | StudentsOrderByClause | null | undefined;
  filterArgs: StudentFilterArgs | null | undefined;
}>;


export type StudentsQuery = { students: { data: Array<{ id: string, name: string }>, pageInfo: { total: number } } };

export type StudentByIdQueryVariables = Exact<{
  studentId: string;
}>;


export type StudentByIdQuery = { studentById: { id: string | null, name: string | null, status: string | null, primaryTeacherId: string | null, teacherName: string | null, hoursPerWeek: string | null, classesRemaining: number | null, classesTotal: number | null, language: string | null, gender: string | null, version: number | null, updatedAt: string | null } | null };

export type AdminSuggestionsQueryVariables = Exact<{
  filter: SuggestionFilter;
}>;


export type AdminSuggestionsQuery = { adminSuggestions: { id: string | null, rows: Array<{ id: string | null, parentId: string | null, submitterName: string | null, body: string | null, status: SuggestionStatus | null, adminResponse: string | null, duplicateOfId: string | null, duplicateOfBody: string | null, duplicateOfSubmitterName: string | null, responseCount: number | null, emailSentAt: string | null, createdAt: string | null, parentName: string | null }> | null, metrics: { id: string | null, pending: number | null, reviewed: number | null, duplicate: number | null, avgResponseTime: string | null, totalCount: number | null } | null } | null };

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

export type TeacherDashboardQueryVariables = Exact<{
  date: string;
  pagination: PaginationArgs | null | undefined;
}>;


export type TeacherDashboardQuery = { teacherDashboard: { id: string | null, totalCount: number | null, metrics: { total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null } | null, scheduleRows: Array<{ id: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, zoomMeetingUrl: string | null, yourTimeFormatted: string | null }> | null, progressFeed: Array<{ id: string | null, title: string | null, type: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, lastItem: number | null, hasMorePages: boolean, lastPage: number, perPage: number, total: number } | null } | null };

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


export type TeacherFutureScheduleQuery = { teacherFutureSchedule: { id: string | null, leaveQuotaUsed: number | null, leaveQuotaTotal: number | null, totalClasses: number | null, classes: Array<{ id: string | null, courseName: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, isRescheduled: boolean | null, leaveRequestDisabled: boolean | null, leaveRequestDisabledReason: string | null, studentCount: number | null, location: string | null, subjectId: string | null, subjectName: string | null, classType: ClassType | null, zoomMeetingUrl: string | null }> | null, importantNotes: Array<{ id: string | null, title: string | null, body: string | null, priority: number | null, startsAt: string | null, expiresAt: string | null }> | null, supportContact: { id: string | null, name: string | null, role: string | null, avatarUrl: string | null, phone: string | null, skypeId: string | null } | null } | null };

export type TeacherHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherHandbookUrlQuery = { teacherHandbookUrl: { id: string | null, url: string | null } | null };

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


export type CreateTeacherMutation = { createTeacher: { userId: string | null, teacherId: string | null, name: string | null, email: string | null, status: string | null } | null };

export type TeacherAssignedStudentsQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherAssignedStudentsQuery = { teacherAssignedStudents: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, name: string | null, status: StudentStatus | null, hoursPerWeek: number | null, classesRemaining: number | null, classesTotal: number | null }> | null } | null };

export type TeacherOwnProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherOwnProfileQuery = { teacherOwnProfile: { id: string | null, name: string | null, email: string | null, phone: string | null, timezone: string | null, hourlyRate: string | null, rateCurrency: string | null, paymentMethod: PaymentMethod | null, zoomLink: string | null } | null };

export type TeacherAssignedClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherAssignedClassesQuery = { teacherAssignedClasses: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, durationMinutes: number | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null }> | null } | null };

export type TeachersQueryVariables = Exact<{
  search: string;
  limit: number;
}>;


export type TeachersQuery = { teachers: Array<{ id: string | null, name: string | null }> | null };

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

export type UserBillingProfileSummaryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
}>;


export type UserBillingProfileSummaryQuery = { parentBillingSummary: { id: string | null, outstandingBalance: string | null, paidThisTerm: string | null, nextDueDate: string | null, activeStudents: number | null } | null };

export type UserBillingProfileInvoiceHistoryQueryVariables = Exact<{
  userId: string | null | undefined;
  parentId: string | null | undefined;
  paginationArgs: PaginationArgs | null | undefined;
}>;


export type UserBillingProfileInvoiceHistoryQuery = { parentInvoiceHistory: { id: string | null, totalCount: number | null, rows: Array<{ id: string | null, issueDate: string | null, dueDate: string | null, paidDate: string | null, amount: string | null, currency: string | null, status: InvoiceStatus | null, invoiceType: InvoiceType | null, studentId: string | null, studentName: string | null }> | null, pageInfo: { count: number, currentPage: number, firstItem: number | null, hasMorePages: boolean, lastItem: number | null, lastPage: number, perPage: number, total: number } | null } | null };

export type TeacherWeeklyScheduleGridQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;


export type TeacherWeeklyScheduleGridQuery = { teacherWeeklyScheduleGrid: { id: string | null, teacherId: string | null, weekStart: string | null, weekEnd: string | null, classes: Array<{ id: string | null, studentName: string | null, studentId: string | null, duration: number | null, startTime: string | null, day: string | null, executionState: ClassExecutionState | null, outcome: ClassOutcome | null, subjectName: string | null, classType: ClassType | null }> | null } | null };

export type TeacherWorkloadMetricsQueryVariables = Exact<{
  teacherId: string | null | undefined;
  weekDate: string;
}>;


export type TeacherWorkloadMetricsQuery = { teacherWorkloadMetrics: { id: string | null, weeklyHoursWorked: string | null, totalMinutes: number | null, classCount: number | null } | null };

export const ClassCategoryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<ClassCategoryFieldsFragment, unknown>;
export const ClassSubjectFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<ClassSubjectFieldsFragment, unknown>;
export const SubjectResourceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<SubjectResourceFieldsFragment, unknown>;
export const LearningResourceRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LearningResourceRowFragmentFragment, unknown>;
export const PermissionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Permission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]} as unknown as DocumentNode<PermissionFieldsFragment, unknown>;
export const PermissionGroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}}]}}]} as unknown as DocumentNode<PermissionGroupFieldsFragment, unknown>;
export const PermissionGroupDetailFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionGroupDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PermissionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissionIds"}},{"kind":"Field","name":{"kind":"Name","value":"assignedUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<PermissionGroupDetailFieldsFragment, unknown>;
export const UserOverrideFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserOverrideFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserOverride"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionId"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedBy"}}]}}]} as unknown as DocumentNode<UserOverrideFieldsFragment, unknown>;
export const StudentDirectoryRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryRowFragmentFragment, unknown>;
export const StudentDirectoryDetailFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryDetailFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryDetailFragmentFragment, unknown>;
export const TeacherImportantNoteFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<TeacherImportantNoteFieldsFragment, unknown>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const UserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"user"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}}]}}]}}]} as unknown as DocumentNode<UserQuery, UserQueryVariables>;
export const UsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}}]}}]}}]} as unknown as DocumentNode<UsersQuery, UsersQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const DemoLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"demoLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DemoLoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"demoLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}}]}}]}}]}}]} as unknown as DocumentNode<DemoLoginMutation, DemoLoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"refreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}}]}}]}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const ImpersonationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"impersonationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"impersonationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"targetUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actorUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<ImpersonationStatusQuery, ImpersonationStatusQueryVariables>;
export const StartImpersonationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"startImpersonation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startImpersonation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targetUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"impersonationSessionId"}},{"kind":"Field","name":{"kind":"Name","value":"targetUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notificationCount"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}}]}}]}}]}}]} as unknown as DocumentNode<StartImpersonationMutation, StartImpersonationMutationVariables>;
export const EndImpersonationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"endImpersonation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endImpersonation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<EndImpersonationMutation, EndImpersonationMutationVariables>;
export const PermissionGroupSimulationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"permissionGroupSimulationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissionGroupSimulationStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"groupSlug"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<PermissionGroupSimulationStatusQuery, PermissionGroupSimulationStatusQueryVariables>;
export const SimulatablePermissionGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"simulatablePermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulatablePermissionGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<SimulatablePermissionGroupsQuery, SimulatablePermissionGroupsQueryVariables>;
export const StartPermissionGroupSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"startPermissionGroupSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startPermissionGroupSimulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"groupSlug"}}]}}]}}]} as unknown as DocumentNode<StartPermissionGroupSimulationMutation, StartPermissionGroupSimulationMutationVariables>;
export const EndPermissionGroupSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"endPermissionGroupSimulation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endPermissionGroupSimulation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<EndPermissionGroupSimulationMutation, EndPermissionGroupSimulationMutationVariables>;
export const SearchTeacherAvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchTeacherAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AvailabilitySearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchTeacherAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalGaps"}},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"gaps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherGender"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"gapStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"gapEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SearchTeacherAvailabilityQuery, SearchTeacherAvailabilityQueryVariables>;
export const UnpaidInvoicesAlertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"unpaidInvoicesAlert"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpaidInvoicesAlert"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalOverdueInvoices"}},{"kind":"Field","name":{"kind":"Name","value":"totalOverdueAmount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalUnpaidAmount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"overdueCount"}},{"kind":"Field","name":{"kind":"Name","value":"oldestDueDate"}}]}}]}}]}}]} as unknown as DocumentNode<UnpaidInvoicesAlertQuery, UnpaidInvoicesAlertQueryVariables>;
export const CreateManualInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateManualInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InvoiceType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"issueDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dueDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSnapshot"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSource"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"billingMonths"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BillingMonthInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sendEmail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createManualInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"invoiceType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceType"}}},{"kind":"Argument","name":{"kind":"Name","value":"issueDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"issueDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"dueDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dueDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"exchangeRateSnapshot"},"value":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSnapshot"}}},{"kind":"Argument","name":{"kind":"Name","value":"exchangeRateSource"},"value":{"kind":"Variable","name":{"kind":"Name","value":"exchangeRateSource"}}},{"kind":"Argument","name":{"kind":"Name","value":"billingMonths"},"value":{"kind":"Variable","name":{"kind":"Name","value":"billingMonths"}}},{"kind":"Argument","name":{"kind":"Name","value":"sendEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sendEmail"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateManualInvoiceMutation, CreateManualInvoiceMutationVariables>;
export const MarkInvoicePaidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkInvoicePaid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markInvoicePaid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<MarkInvoicePaidMutation, MarkInvoicePaidMutationVariables>;
export const DeleteInvoiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInvoice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteInvoice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invoiceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invoiceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"notificationSummaryUpdated"}}]}}]}}]} as unknown as DocumentNode<DeleteInvoiceMutation, DeleteInvoiceMutationVariables>;
export const SendPaymentReminderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendPaymentReminder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendPaymentReminder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<SendPaymentReminderMutation, SendPaymentReminderMutationVariables>;
export const DeleteBookMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBookMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteBookMutationMutation, DeleteBookMutationMutationVariables>;
export const ClassCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<ClassCategoriesQuery, ClassCategoriesQueryVariables>;
export const CreateClassCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createClassCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategoryCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<CreateClassCategoryMutation, CreateClassCategoryMutationVariables>;
export const UpdateClassCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategoryUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]} as unknown as DocumentNode<UpdateClassCategoryMutation, UpdateClassCategoryMutationVariables>;
export const DeleteClassCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteClassCategoryMutation, DeleteClassCategoryMutationVariables>;
export const ClassInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"hasTimezoneMismatch"}},{"kind":"Field","name":{"kind":"Name","value":"studentTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTimezone"}},{"kind":"Field","name":{"kind":"Name","value":"zoomMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"payrollCredited"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"grade"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"performance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"engagementScore"}},{"kind":"Field","name":{"kind":"Name","value":"assessmentProgress"}},{"kind":"Field","name":{"kind":"Name","value":"assessmentTotal"}},{"kind":"Field","name":{"kind":"Name","value":"focusLevel"}},{"kind":"Field","name":{"kind":"Name","value":"sessionHealth"}},{"kind":"Field","name":{"kind":"Name","value":"heatmapData"}},{"kind":"Field","name":{"kind":"Name","value":"latencyMs"}},{"kind":"Field","name":{"kind":"Name","value":"authorizationLabel"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgGrade"}},{"kind":"Field","name":{"kind":"Name","value":"lastClassDaysAgo"}}]}}]}}]}}]} as unknown as DocumentNode<ClassInstanceQuery, ClassInstanceQueryVariables>;
export const ClassStatusEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classStatusEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classStatusEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ClassStatusEventsQuery, ClassStatusEventsQueryVariables>;
export const ActivateClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"activateClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"zoomMeetingUrl"}}]}}]}}]} as unknown as DocumentNode<ActivateClassMutation, ActivateClassMutationVariables>;
export const ActivateOverrideClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"activateOverrideClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateOverrideClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"zoomMeetingUrl"}}]}}]}}]} as unknown as DocumentNode<ActivateOverrideClassMutation, ActivateOverrideClassMutationVariables>;
export const ResetClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"resetClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<ResetClassMutation, ResetClassMutationVariables>;
export const UpdateSessionStatusStartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusStart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusStart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusStartMutation, UpdateSessionStatusStartMutationVariables>;
export const UpdateSessionStatusAbsentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusAbsent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusAbsent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"payrollCredited"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusAbsentMutation, UpdateSessionStatusAbsentMutationVariables>;
export const UpdateSessionStatusLeaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSessionStatusLeave"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"leaveReason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSessionStatusLeave"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"leaveReason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"leaveReason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completedInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledInstanceId"}},{"kind":"Field","name":{"kind":"Name","value":"completedInstance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledInstance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSessionStatusLeaveMutation, UpdateSessionStatusLeaveMutationVariables>;
export const StopClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"stopClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}}]}}]} as unknown as DocumentNode<StopClassMutation, StopClassMutationVariables>;
export const RescheduleClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"rescheduleClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RescheduleClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}}]}}]} as unknown as DocumentNode<RescheduleClassMutation, RescheduleClassMutationVariables>;
export const DeleteClassInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<DeleteClassInstanceMutation, DeleteClassInstanceMutationVariables>;
export const ClassSubjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classSubjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classSubjects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"categoryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubjectResourceFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<ClassSubjectsQuery, ClassSubjectsQueryVariables>;
export const ClassSubjectByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"classSubjectById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}},{"kind":"Field","name":{"kind":"Name","value":"resources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubjectResourceFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<ClassSubjectByIdQuery, ClassSubjectByIdQueryVariables>;
export const CreateClassSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createClassSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubjectCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<CreateClassSubjectMutation, CreateClassSubjectMutationVariables>;
export const UpdateClassSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubjectUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ClassSubjectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ClassSubjectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClassSubject"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<UpdateClassSubjectMutation, UpdateClassSubjectMutationVariables>;
export const DeleteClassSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteClassSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteClassSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteClassSubjectMutation, DeleteClassSubjectMutationVariables>;
export const AttachSubjectResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"attachSubjectResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttachSubjectResourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachSubjectResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubjectResourceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SubjectResourceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubjectResource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"learningResourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceType"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}}]}}]} as unknown as DocumentNode<AttachSubjectResourceMutation, AttachSubjectResourceMutationVariables>;
export const DetachSubjectResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"detachSubjectResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"learningResourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"detachSubjectResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"subjectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"learningResourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"learningResourceId"}}}]}]}}]} as unknown as DocumentNode<DetachSubjectResourceMutation, DetachSubjectResourceMutationVariables>;
export const ParentComplaintsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentComplaints"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentComplaints"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"complaints"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"responses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"emailSent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"responderName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentComplaintsQuery, ParentComplaintsQueryVariables>;
export const AdminComplaintQueueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminComplaintQueue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ComplaintQueueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminComplaintQueue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"responses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"responderName"}},{"kind":"Field","name":{"kind":"Name","value":"emailSent"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"unanswered"}},{"kind":"Field","name":{"kind":"Name","value":"answered"}},{"kind":"Field","name":{"kind":"Name","value":"avgResolutionTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<AdminComplaintQueueQuery, AdminComplaintQueueQueryVariables>;
export const SubmitComplaintDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitComplaint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ComplaintSubmitInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitComplaint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SubmitComplaintMutation, SubmitComplaintMutationVariables>;
export const RespondToComplaintDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RespondToComplaint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RespondToComplaintInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondToComplaint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"emailSent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"responderName"}}]}}]}}]} as unknown as DocumentNode<RespondToComplaintMutation, RespondToComplaintMutationVariables>;
export const DeleteComplaintDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteComplaint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complaintId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteComplaint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complaintId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complaintId"}}}]}]}}]} as unknown as DocumentNode<DeleteComplaintMutation, DeleteComplaintMutationVariables>;
export const ExecuteDstBulkUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"executeDstBulkUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offsetMinutes"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executeDstBulkUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"offsetMinutes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offsetMinutes"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"updated"}},{"kind":"Field","name":{"kind":"Name","value":"conflicts"}},{"kind":"Field","name":{"kind":"Name","value":"unchanged"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"fromTime"}},{"kind":"Field","name":{"kind":"Name","value":"toTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conflictGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"conflicts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"checkedEmptyItems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}}]}}]}}]} as unknown as DocumentNode<ExecuteDstBulkUpdateMutation, ExecuteDstBulkUpdateMutationVariables>;
export const GroupClassAuditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"groupClassAudit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupClassAudit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"courseCode"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"originalDate"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"auditRemark"}},{"kind":"Field","name":{"kind":"Name","value":"auditLoggedAt"}},{"kind":"Field","name":{"kind":"Name","value":"registeredStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"students"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceStatus"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetingInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"communications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adminNote"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]}}]} as unknown as DocumentNode<GroupClassAuditQuery, GroupClassAuditQueryVariables>;
export const UpdateClassAdminNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateClassAdminNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassAdminNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"courseCode"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"originalDate"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"venue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"auditRemark"}},{"kind":"Field","name":{"kind":"Name","value":"auditLoggedAt"}},{"kind":"Field","name":{"kind":"Name","value":"registeredStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalStudentCount"}},{"kind":"Field","name":{"kind":"Name","value":"students"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceStatus"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetingInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"joinUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"communications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adminNote"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateClassAdminNoteMutation, UpdateClassAdminNoteMutationVariables>;
export const ResendClassNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"resendClassNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendClassNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<ResendClassNotificationsMutation, ResendClassNotificationsMutationVariables>;
export const LearningResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"learningResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"learningResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LearningResourceRowFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LearningResourcesQuery, LearningResourcesQueryVariables>;
export const UploadLearningResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"uploadLearningResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResourceUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadLearningResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LearningResourceRowFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LearningResourceRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LearningResourceRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedByUserName"}},{"kind":"Field","name":{"kind":"Name","value":"fileSize"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UploadLearningResourceMutation, UploadLearningResourceMutationVariables>;
export const PrepareUploadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"prepareUpload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UploadPreparationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"prepareUpload"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"uploadType"}}]}}]}}]} as unknown as DocumentNode<PrepareUploadMutation, PrepareUploadMutationVariables>;
export const DeleteLearningResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLearningResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLearningResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteLearningResourceMutation, DeleteLearningResourceMutationVariables>;
export const CreateManagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createManager"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ManagerOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createManager"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignedGroupSlug"}}]}}]}}]} as unknown as DocumentNode<CreateManagerMutation, CreateManagerMutationVariables>;
export const NotificationAlertsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"notificationAlerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationAlerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"alerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}}]}}]}}]}}]} as unknown as DocumentNode<NotificationAlertsQuery, NotificationAlertsQueryVariables>;
export const ParentInvoiceHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentInvoiceHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentInvoiceHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentInvoiceHistoryQuery, ParentInvoiceHistoryQueryVariables>;
export const AdminInvoicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminInvoices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminInvoices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<AdminInvoicesQuery, AdminInvoicesQueryVariables>;
export const AdminBillingSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminBillingSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminBillingSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalOutstanding"}},{"kind":"Field","name":{"kind":"Name","value":"pendingCount"}},{"kind":"Field","name":{"kind":"Name","value":"mtdRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"negativeBalanceCount"}}]}}]}}]} as unknown as DocumentNode<AdminBillingSummaryQuery, AdminBillingSummaryQueryVariables>;
export const StudentCreditStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentCreditStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentCreditStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentEmail"}},{"kind":"Field","name":{"kind":"Name","value":"planType"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<StudentCreditStatusQuery, StudentCreditStatusQueryVariables>;
export const ParentBillingSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentBillingSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentBillingSummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingBalance"}},{"kind":"Field","name":{"kind":"Name","value":"paidThisTerm"}},{"kind":"Field","name":{"kind":"Name","value":"nextDueDate"}},{"kind":"Field","name":{"kind":"Name","value":"activeStudents"}}]}}]}}]} as unknown as DocumentNode<ParentBillingSummaryQuery, ParentBillingSummaryQueryVariables>;
export const ParentDashboardScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDashboardSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDashboardSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentInitials"}},{"kind":"Field","name":{"kind":"Name","value":"studentAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"bookingStatus"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"zoomMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classTimeFormatted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentDashboardScheduleQuery, ParentDashboardScheduleQueryVariables>;
export const ParentDashboardMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDashboardMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDashboardMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalStudents"}},{"kind":"Field","name":{"kind":"Name","value":"todaysClasses"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvoicesCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvoicesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"performanceAvg"}},{"kind":"Field","name":{"kind":"Name","value":"performanceAvgMobile"}},{"kind":"Field","name":{"kind":"Name","value":"pendingMessages"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studentProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"completionPercent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workshopPromo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}}]} as unknown as DocumentNode<ParentDashboardMetricsQuery, ParentDashboardMetricsQueryVariables>;
export const ParentDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"parentDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"statusFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"deactivated"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"onLeave"}},{"kind":"Field","name":{"kind":"Name","value":"onTrial"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"guardianOf"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidInvoices"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ParentDirectoryQuery, ParentDirectoryQueryVariables>;
export const ParentDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentDocuments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentDocuments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"isProtected"}},{"kind":"Field","name":{"kind":"Name","value":"usageType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ParentDocumentsQuery, ParentDocumentsQueryVariables>;
export const LinkDocumentToParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkDocumentToParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"usageType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkDocumentToParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"usageType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"usageType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"isProtected"}},{"kind":"Field","name":{"kind":"Name","value":"usageType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<LinkDocumentToParentMutation, LinkDocumentToParentMutationVariables>;
export const CreateParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ParentOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<CreateParentMutation, CreateParentMutationVariables>;
export const ParentProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nationality"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"facebook"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"twitter"}},{"kind":"Field","name":{"kind":"Name","value":"skype"}},{"kind":"Field","name":{"kind":"Name","value":"defaultZoomLink"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ParentProfileQuery, ParentProfileQueryVariables>;
export const ParentAssociatedStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentAssociatedStudents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentAssociatedStudents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ParentAssociatedStudentsQuery, ParentAssociatedStudentsQueryVariables>;
export const DeactivateParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<DeactivateParentMutation, DeactivateParentMutationVariables>;
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
export const CreateRecurringClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createRecurringClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRecurringClassInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRecurringClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"recurringScheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceIds"}},{"kind":"Field","name":{"kind":"Name","value":"classInstanceCount"}}]}}]}}]} as unknown as DocumentNode<CreateRecurringClassMutation, CreateRecurringClassMutationVariables>;
export const GenerateAttendanceReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GenerateAttendanceReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AttendanceReportFiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateAttendanceReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"groupKey"}},{"kind":"Field","name":{"kind":"Name","value":"groupLabel"}},{"kind":"Field","name":{"kind":"Name","value":"takenClasses"}},{"kind":"Field","name":{"kind":"Name","value":"absentClasses"}},{"kind":"Field","name":{"kind":"Name","value":"leaveClasses"}},{"kind":"Field","name":{"kind":"Name","value":"pendingClasses"}},{"kind":"Field","name":{"kind":"Name","value":"totalHours"}},{"kind":"Field","name":{"kind":"Name","value":"paidEGP"}},{"kind":"Field","name":{"kind":"Name","value":"paidUSD"}},{"kind":"Field","name":{"kind":"Name","value":"engagementGrowth"}}]}},{"kind":"Field","name":{"kind":"Name","value":"engagementGrowth"}}]}}]}}]} as unknown as DocumentNode<GenerateAttendanceReportQuery, GenerateAttendanceReportQueryVariables>;
export const DeleteRecurringClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteRecurringClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRecurringClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}]}]}}]} as unknown as DocumentNode<DeleteRecurringClassMutation, DeleteRecurringClassMutationVariables>;
export const ClearWeeklyScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"clearWeeklySchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearWeeklySchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}]}]}}]} as unknown as DocumentNode<ClearWeeklyScheduleMutation, ClearWeeklyScheduleMutationVariables>;
export const AdminDashboardScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"adminDashboardSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminDashboardScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"yourTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTime"}},{"kind":"Field","name":{"kind":"Name","value":"studentTime"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<AdminDashboardScheduleQuery, AdminDashboardScheduleQueryVariables>;
export const DailyScheduleMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dailyScheduleMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyScheduleMetrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}}]}}]} as unknown as DocumentNode<DailyScheduleMetricsQuery, DailyScheduleMetricsQueryVariables>;
export const DailyScheduleListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dailyScheduleList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metricFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyScheduleList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"metricFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metricFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"yourTime"}},{"kind":"Field","name":{"kind":"Name","value":"teacherTime"}},{"kind":"Field","name":{"kind":"Name","value":"studentTime"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<DailyScheduleListQuery, DailyScheduleListQueryVariables>;
export const RescheduleTrackingRowsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"rescheduleTrackingRows"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LeaveRequestStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleTrackingRows"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"originalClassId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dateLabel"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<RescheduleTrackingRowsQuery, RescheduleTrackingRowsQueryVariables>;
export const RescheduleTrackingMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"rescheduleTrackingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rescheduleTrackingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"approved"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"cancelled"}}]}}]}}]} as unknown as DocumentNode<RescheduleTrackingMetricsQuery, RescheduleTrackingMetricsQueryVariables>;
export const StatusTrackingScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"statusTrackingSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"viewerTimezone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statusTrackingSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"viewerTimezone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"viewerTimezone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentInitials"}},{"kind":"Field","name":{"kind":"Name","value":"studentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}}]}}]}}]} as unknown as DocumentNode<StatusTrackingScheduleQuery, StatusTrackingScheduleQueryVariables>;
export const TeacherDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"deactivated"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"zoomLink"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalTeachers"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherDirectoryQuery, TeacherDirectoryQueryVariables>;
export const ManagerDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"managerDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"managerDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"roleFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleFilter"}}},{"kind":"Argument","name":{"kind":"Name","value":"statusFilter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statusFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"systemStaff"}},{"kind":"Field","name":{"kind":"Name","value":"activeNow"}},{"kind":"Field","name":{"kind":"Name","value":"alerts"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"skypeId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ManagerDirectoryQuery, ManagerDirectoryQueryVariables>;
export const UpdateManagerProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateManagerProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"staffProfileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateManagerProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateManagerProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"staffProfileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"staffProfileId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"staffProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"skypeId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"roleSlug"}},{"kind":"Field","name":{"kind":"Name","value":"roleName"}}]}}]}}]} as unknown as DocumentNode<UpdateManagerProfileMutation, UpdateManagerProfileMutationVariables>;
export const OnboardingMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onboardingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activeStaff"}},{"kind":"Field","name":{"kind":"Name","value":"pendingApproval"}},{"kind":"Field","name":{"kind":"Name","value":"avgOnboardingDays"}}]}}]}}]} as unknown as DocumentNode<OnboardingMetricsQuery, OnboardingMetricsQueryVariables>;
export const TeacherProfileForEditDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherProfileForEdit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherProfileForEdit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"skypeId"}},{"kind":"Field","name":{"kind":"Name","value":"zoomLink"}},{"kind":"Field","name":{"kind":"Name","value":"zoomUsername"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}}]}}]} as unknown as DocumentNode<TeacherProfileForEditQuery, TeacherProfileForEditQueryVariables>;
export const UpdateTeacherProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateTeacherProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherProfileUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeacherProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"dateOfBirth"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"qualifications"}},{"kind":"Field","name":{"kind":"Name","value":"skypeId"}},{"kind":"Field","name":{"kind":"Name","value":"zoomLink"}},{"kind":"Field","name":{"kind":"Name","value":"zoomUsername"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"avgEngagementScore"}}]}}]}}]} as unknown as DocumentNode<UpdateTeacherProfileMutation, UpdateTeacherProfileMutationVariables>;
export const StudentDirectoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentDirectory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentsOrderByClause"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentFilterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentDirectory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StudentDirectoryRowFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StudentDirectoryRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StudentDirectoryRow"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StudentDirectoryQuery, StudentDirectoryQueryVariables>;
export const StudentClassHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentClassHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentClassHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRate"}},{"kind":"Field","name":{"kind":"Name","value":"hoursStudied"}},{"kind":"Field","name":{"kind":"Name","value":"performance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlot"}},{"kind":"Field","name":{"kind":"Name","value":"room"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfMonth"}}]}}]}}]}}]} as unknown as DocumentNode<StudentClassHistoryQuery, StudentClassHistoryQueryVariables>;
export const StudentClassSessionDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"studentClassSessionDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentClassSessionDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"remarks"}},{"kind":"Field","name":{"kind":"Name","value":"zoomMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}}]}}]}}]} as unknown as DocumentNode<StudentClassSessionDetailQuery, StudentClassSessionDetailQueryVariables>;
export const ReassignStudentTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReassignStudentTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newTeacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reassignStudentTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newTeacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newTeacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ReassignStudentTeacherMutation, ReassignStudentTeacherMutationVariables>;
export const ChangeStudentStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeStudentStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeStudentStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedVersion"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ChangeStudentStatusMutation, ChangeStudentStatusMutationVariables>;
export const StudentUpcomingClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentUpcomingClasses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentUpcomingClasses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instructor"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}}]}}]}}]}}]} as unknown as DocumentNode<StudentUpcomingClassesQuery, StudentUpcomingClassesQueryVariables>;
export const StudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"students"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentsOrderByClause"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"StudentFilterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"students"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"filterArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<StudentsQuery, StudentsQueryVariables>;
export const StudentByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"primaryTeacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<StudentByIdQuery, StudentByIdQueryVariables>;
export const AdminSuggestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SuggestionFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"submitterName"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"adminResponse"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfId"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfBody"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfSubmitterName"}},{"kind":"Field","name":{"kind":"Name","value":"responseCount"}},{"kind":"Field","name":{"kind":"Name","value":"emailSentAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"reviewed"}},{"kind":"Field","name":{"kind":"Name","value":"duplicate"}},{"kind":"Field","name":{"kind":"Name","value":"avgResponseTime"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<AdminSuggestionsQuery, AdminSuggestionsQueryVariables>;
export const SearchSuggestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitterName"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SearchSuggestionsQuery, SearchSuggestionsQueryVariables>;
export const SubmitSuggestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitSuggestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitSuggestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitSuggestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitterName"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SubmitSuggestionMutation, SubmitSuggestionMutationVariables>;
export const MarkSuggestionReviewedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkSuggestionReviewed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markSuggestionReviewed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"suggestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"emailSentAt"}}]}}]}}]} as unknown as DocumentNode<MarkSuggestionReviewedMutation, MarkSuggestionReviewedMutationVariables>;
export const RespondToSuggestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RespondToSuggestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RespondToSuggestionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondToSuggestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"adminResponse"}}]}}]}}]} as unknown as DocumentNode<RespondToSuggestionMutation, RespondToSuggestionMutationVariables>;
export const MarkSuggestionDuplicateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkSuggestionDuplicate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkSuggestionDuplicateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markSuggestionDuplicate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"duplicateOfId"}}]}}]}}]} as unknown as DocumentNode<MarkSuggestionDuplicateMutation, MarkSuggestionDuplicateMutationVariables>;
export const DeleteSuggestionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSuggestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSuggestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"suggestionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"suggestionId"}}}]}]}}]} as unknown as DocumentNode<DeleteSuggestionMutation, DeleteSuggestionMutationVariables>;
export const SuggestionContributorStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SuggestionContributorStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"days"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suggestionContributorStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"days"},"value":{"kind":"Variable","name":{"kind":"Name","value":"days"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueContributorCount"}},{"kind":"Field","name":{"kind":"Name","value":"contributors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"suggestionCount"}}]}}]}}]}}]} as unknown as DocumentNode<SuggestionContributorStatsQuery, SuggestionContributorStatsQueryVariables>;
export const TeacherDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"regular"}},{"kind":"Field","name":{"kind":"Name","value":"trial"}},{"kind":"Field","name":{"kind":"Name","value":"advance"}},{"kind":"Field","name":{"kind":"Name","value":"rescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"suspended"}},{"kind":"Field","name":{"kind":"Name","value":"taken"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"activated"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"leave"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scheduleRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"zoomMeetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"yourTimeFormatted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"progressFeed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherDashboardQuery, TeacherDashboardQueryVariables>;
export const CreateTeacherManualClassEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacherManualClassEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateManualClassEntryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherManualClassEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}}]}}]} as unknown as DocumentNode<CreateTeacherManualClassEntryMutation, CreateTeacherManualClassEntryMutationVariables>;
export const LogTeacherSupportRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"logTeacherSupportRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogSupportRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logTeacherSupportRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<LogTeacherSupportRequestMutation, LogTeacherSupportRequestMutationVariables>;
export const TeacherFutureScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherFutureSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherFutureSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"leaveQuotaUsed"}},{"kind":"Field","name":{"kind":"Name","value":"leaveQuotaTotal"}},{"kind":"Field","name":{"kind":"Name","value":"totalClasses"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDate"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isRescheduled"}},{"kind":"Field","name":{"kind":"Name","value":"leaveRequestDisabled"}},{"kind":"Field","name":{"kind":"Name","value":"leaveRequestDisabledReason"}},{"kind":"Field","name":{"kind":"Name","value":"studentCount"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}},{"kind":"Field","name":{"kind":"Name","value":"zoomMeetingUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"importantNotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportContact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"skypeId"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherFutureScheduleQuery, TeacherFutureScheduleQueryVariables>;
export const TeacherHandbookUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherHandbookUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<TeacherHandbookUrlQuery, TeacherHandbookUrlQueryVariables>;
export const CreateTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeacherNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TeacherImportantNoteFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<CreateTeacherImportantNoteMutation, CreateTeacherImportantNoteMutationVariables>;
export const UpdateTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeacherNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TeacherImportantNoteFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeacherImportantNoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherImportantNote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode<UpdateTeacherImportantNoteMutation, UpdateTeacherImportantNoteMutationVariables>;
export const DeleteTeacherImportantNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteTeacherImportantNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeacherImportantNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTeacherImportantNoteMutation, DeleteTeacherImportantNoteMutationVariables>;
export const CreateTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TeacherOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreateTeacherMutation, CreateTeacherMutationVariables>;
export const TeacherAssignedStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherAssignedStudents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hoursPerWeek"}},{"kind":"Field","name":{"kind":"Name","value":"classesRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"classesTotal"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherAssignedStudentsQuery, TeacherAssignedStudentsQueryVariables>;
export const TeacherOwnProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherOwnProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRate"}},{"kind":"Field","name":{"kind":"Name","value":"rateCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"zoomLink"}}]}}]}}]} as unknown as DocumentNode<TeacherOwnProfileQuery, TeacherOwnProfileQueryVariables>;
export const TeacherAssignedClassesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherAssignedClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherAssignedClasses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledStartAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledEndAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherAssignedClassesQuery, TeacherAssignedClassesQueryVariables>;
export const TeachersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teachers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<TeachersQuery, TeachersQueryVariables>;
export const CreateTestEntitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTestEntities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classesRemaining"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTestEntities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"prefix"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}}},{"kind":"Argument","name":{"kind":"Name","value":"classesRemaining"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classesRemaining"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentUserEmail"}},{"kind":"Field","name":{"kind":"Name","value":"studentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserEmail"}},{"kind":"Field","name":{"kind":"Name","value":"parentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parentName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserEmail"}},{"kind":"Field","name":{"kind":"Name","value":"teacherUserId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}}]}}]}}]} as unknown as DocumentNode<CreateTestEntitiesMutation, CreateTestEntitiesMutationVariables>;
export const CleanupTestEntitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestEntities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestEntities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestEntitiesMutation, CleanupTestEntitiesMutationVariables>;
export const CreateTestGroupClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTestGroupClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTestGroupClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classInstanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classInstanceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"teacherName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupClassId"}}]}}]}}]} as unknown as DocumentNode<CreateTestGroupClassMutation, CreateTestGroupClassMutationVariables>;
export const CleanupTestGroupClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestGroupClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupClassId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestGroupClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupClassId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupClassId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestGroupClassMutation, CleanupTestGroupClassMutationVariables>;
export const CleanupTestManagerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestManager"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestManager"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestManagerMutation, CleanupTestManagerMutationVariables>;
export const CreateTestSuperAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTestSuperAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTestSuperAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"prefix"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreateTestSuperAdminMutation, CreateTestSuperAdminMutationVariables>;
export const CleanupTestSuperAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"cleanupTestSuperAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cleanupTestSuperAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<CleanupTestSuperAdminMutation, CleanupTestSuperAdminMutationVariables>;
export const WelcomeMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"welcomeMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"welcomeMessage"}}]}}]} as unknown as DocumentNode<WelcomeMessageQuery, WelcomeMessageQueryVariables>;
export const TranslatedMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"translatedMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"translatedMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"namespace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"namespace"}}}]}]}}]} as unknown as DocumentNode<TranslatedMessageQuery, TranslatedMessageQueryVariables>;
export const UserBillingProfileSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserBillingProfileSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentBillingSummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingBalance"}},{"kind":"Field","name":{"kind":"Name","value":"paidThisTerm"}},{"kind":"Field","name":{"kind":"Name","value":"nextDueDate"}},{"kind":"Field","name":{"kind":"Name","value":"activeStudents"}}]}}]}}]} as unknown as DocumentNode<UserBillingProfileSummaryQuery, UserBillingProfileSummaryQueryVariables>;
export const UserBillingProfileInvoiceHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserBillingProfileInvoiceHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parentInvoiceHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paginationArgs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paginationArgs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueDate"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"paidDate"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceType"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<UserBillingProfileInvoiceHistoryQuery, UserBillingProfileInvoiceHistoryQueryVariables>;
export const TeacherWeeklyScheduleGridDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherWeeklyScheduleGrid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherWeeklyScheduleGrid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"classes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"executionState"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"subjectName"}},{"kind":"Field","name":{"kind":"Name","value":"classType"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherWeeklyScheduleGridQuery, TeacherWeeklyScheduleGridQueryVariables>;
export const TeacherWorkloadMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"teacherWorkloadMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacherWorkloadMetrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teacherId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weeklyHoursWorked"}},{"kind":"Field","name":{"kind":"Name","value":"totalMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"classCount"}}]}}]}}]} as unknown as DocumentNode<TeacherWorkloadMetricsQuery, TeacherWorkloadMetricsQueryVariables>;