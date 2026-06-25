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
  /** A type representing a validated phone number */
  PhoneNumber: { input: string; output: string; }
  /** A map of string keys to string values (Record<string, string>) */
  StringMap: { input: Record<string, string>; output: Record<string, string>; }
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
  AuthLogin = 'AUTH_LOGIN',
  AuthViewOwnProfile = 'AUTH_VIEW_OWN_PROFILE',
  BillingCreateInvoice = 'BILLING_CREATE_INVOICE',
  BillingDeleteInvoice = 'BILLING_DELETE_INVOICE',
  BillingUpdateStatusPaid = 'BILLING_UPDATE_STATUS_PAID',
  BillingViewHistory = 'BILLING_VIEW_HISTORY',
  BillingViewUnpaidInvoices = 'BILLING_VIEW_UNPAID_INVOICES',
  CommunicationSubmitSuggestion = 'COMMUNICATION_SUBMIT_SUGGESTION',
  ComplaintsDelete = 'COMPLAINTS_DELETE',
  ComplaintsList = 'COMPLAINTS_LIST',
  ComplaintsRespond = 'COMPLAINTS_RESPOND',
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
  NotificationViewAlerts = 'NOTIFICATION_VIEW_ALERTS',
  ParentsCreate = 'PARENTS_CREATE',
  ParentsEdit = 'PARENTS_EDIT',
  ParentsList = 'PARENTS_LIST',
  ParentManageStatus = 'PARENT_MANAGE_STATUS',
  ParentViewDirectory = 'PARENT_VIEW_DIRECTORY',
  ParentViewProfile = 'PARENT_VIEW_PROFILE',
  PermissionGroupsAssign = 'PERMISSION_GROUPS_ASSIGN',
  PermissionGroupsManage = 'PERMISSION_GROUPS_MANAGE',
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
  StaffCreate = 'STAFF_CREATE',
  StaffEdit = 'STAFF_EDIT',
  StaffEditProfile = 'STAFF_EDIT_PROFILE',
  StaffList = 'STAFF_LIST',
  StaffViewDirectory = 'STAFF_VIEW_DIRECTORY',
  StudentsChangeStatus = 'STUDENTS_CHANGE_STATUS',
  StudentsChangeTeacher = 'STUDENTS_CHANGE_TEACHER',
  StudentsEdit = 'STUDENTS_EDIT',
  StudentsList = 'STUDENTS_LIST',
  StudentsOverrideQuota = 'STUDENTS_OVERRIDE_QUOTA',
  StudentEditQuota = 'STUDENT_EDIT_QUOTA',
  StudentManageStatus = 'STUDENT_MANAGE_STATUS',
  StudentReassignTeacher = 'STUDENT_REASSIGN_TEACHER',
  StudentViewAssociated = 'STUDENT_VIEW_ASSOCIATED',
  SuggestionsDelete = 'SUGGESTIONS_DELETE',
  SuggestionsList = 'SUGGESTIONS_LIST',
  SuggestionsReview = 'SUGGESTIONS_REVIEW',
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
  TeacherViewDashboard = 'TEACHER_VIEW_DASHBOARD',
  TestCustomOnly = 'TEST_CUSTOM_ONLY',
  TestSystemOnly = 'TEST_SYSTEM_ONLY',
  UserViewProfile = 'USER_VIEW_PROFILE'
}

export type AssignPermissionGroupToUserInput = {
  groupId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type AssociatedStudent = {
  __typename?: 'AssociatedStudent';
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  gender: Maybe<Scalars['String']['output']>;
  hoursPerWeek: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  language: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

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

/** A single row of the aggregated attendance report. */
export type AttendanceReportRow = {
  __typename?: 'AttendanceReportRow';
  absentClasses: Maybe<Scalars['Int']['output']>;
  groupKey: Maybe<Scalars['String']['output']>;
  groupLabel: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  leaveClasses: Maybe<Scalars['Int']['output']>;
  paidEGP: Maybe<Scalars['Float']['output']>;
  paidUSD: Maybe<Scalars['Float']['output']>;
  pendingClasses: Maybe<Scalars['Int']['output']>;
  takenClasses: Maybe<Scalars['Int']['output']>;
  totalHours: Maybe<Scalars['Float']['output']>;
};

export type AvailabilitySearchInput = {
  fromTime: Scalars['String']['input'];
  gender: InputMaybe<Scalars['String']['input']>;
  toTime: Scalars['String']['input'];
};

export type AvailabilitySearchResult = {
  __typename?: 'AvailabilitySearchResult';
  id: Maybe<Scalars['String']['output']>;
  teachers: Maybe<Array<AvailabilitySearchTeacher>>;
  totalGaps: Maybe<Scalars['Int']['output']>;
};

export type AvailabilitySearchTeacher = {
  __typename?: 'AvailabilitySearchTeacher';
  gaps: Maybe<Array<TeacherAvailabilityGap>>;
  gender: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  timezone: Maybe<Scalars['String']['output']>;
};

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

export type ChangeStudentStatusResult = {
  __typename?: 'ChangeStudentStatusResult';
  id: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type ClassInstanceDetail = {
  __typename?: 'ClassInstanceDetail';
  courseName: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  endTime: Maybe<Scalars['String']['output']>;
  executionState: Maybe<Scalars['String']['output']>;
  hasTimezoneMismatch: Maybe<Scalars['Boolean']['output']>;
  id: Maybe<Scalars['String']['output']>;
  instanceId: Maybe<Scalars['String']['output']>;
  isRescheduled: Maybe<Scalars['Boolean']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  payrollCredited: Maybe<Scalars['Boolean']['output']>;
  performance: Maybe<ClassInstancePerformance>;
  remarks: Maybe<Scalars['String']['output']>;
  scheduledDate: Maybe<Scalars['String']['output']>;
  startTime: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  student: Maybe<ClassInstanceStudentInfo>;
  studentTimezone: Maybe<Scalars['String']['output']>;
  teacher: Maybe<ClassInstanceTeacherInfo>;
  zoomMeetingUrl: Maybe<Scalars['String']['output']>;
};

export type ClassInstancePerformance = {
  __typename?: 'ClassInstancePerformance';
  assessmentProgress: Maybe<Scalars['Int']['output']>;
  assessmentTotal: Maybe<Scalars['Int']['output']>;
  attendanceRate: Maybe<Scalars['Int']['output']>;
  avgGrade: Maybe<Scalars['String']['output']>;
  engagementScore: Maybe<Scalars['Int']['output']>;
  focusLevel: Maybe<Scalars['String']['output']>;
  heatmapData: Maybe<Array<Scalars['JSON']['output']>>;
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

export type ClassStatusEvent = {
  __typename?: 'ClassStatusEvent';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  description: Maybe<Scalars['String']['output']>;
  eventType: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
};

/** A parent complaint with full details and responses. */
export type Complaint = {
  __typename?: 'Complaint';
  body: Maybe<Scalars['String']['output']>;
  category: Maybe<ComplaintCategory>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  files: Maybe<Array<ComplaintFile>>;
  id: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  parentName: Maybe<Scalars['String']['output']>;
  responses: Maybe<Array<ComplaintResponse>>;
  status: Maybe<ComplaintStatus>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  submitterEmail: Maybe<Scalars['String']['output']>;
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
  filePath: Maybe<Scalars['String']['output']>;
  isProtected: Maybe<Scalars['Boolean']['output']>;
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

/** Filter and pagination options for the admin complaint queue. */
export type ComplaintQueueFilter = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<ComplaintStatus>;
};

/** Paginated admin complaint queue with metrics. */
export type ComplaintQueueResult = {
  __typename?: 'ComplaintQueueResult';
  complaints: Maybe<Array<Complaint>>;
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<ComplaintMetrics>;
  rows: Maybe<Array<Complaint>>;
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
  responderUserId: Maybe<Scalars['String']['output']>;
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
  classType: InputMaybe<Scalars['String']['input']>;
  durationMinutes: Scalars['Int']['input'];
  scheduledEndAt: Scalars['String']['input'];
  scheduledStartAt: Scalars['String']['input'];
  studentId: Scalars['ID']['input'];
  teacherId: Scalars['ID']['input'];
};

export type CreatePermissionGroupInput = {
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  permissionIds: Array<Scalars['String']['input']>;
};

export type CreateRecurringClassInput = {
  classType: InputMaybe<Scalars['String']['input']>;
  days: Array<RecurringClassDayInput>;
  defaultStartTime: Scalars['String']['input'];
  durationMinutes: Scalars['Int']['input'];
  effectiveFrom: InputMaybe<Scalars['String']['input']>;
  effectiveUntil: InputMaybe<Scalars['String']['input']>;
  generateInstancesForWeeks: InputMaybe<Scalars['Int']['input']>;
  studentId: Scalars['String']['input'];
  teacherId: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
  timezoneId: InputMaybe<Scalars['Int']['input']>;
};

export type CreateRecurringClassResult = {
  __typename?: 'CreateRecurringClassResult';
  classInstanceCount: Maybe<Scalars['Int']['output']>;
  classInstanceIds: Maybe<Array<Scalars['String']['output']>>;
  id: Maybe<Scalars['String']['output']>;
  recurringScheduleId: Maybe<Scalars['String']['output']>;
};

export type DailyScheduleList = {
  __typename?: 'DailyScheduleList';
  duration: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  student: Maybe<DailyScheduleListUserItem>;
  studentTime: Maybe<Scalars['String']['output']>;
  teacher: Maybe<DailyScheduleListUserItem>;
  teacherTime: Maybe<Scalars['String']['output']>;
  yourTime: Maybe<Scalars['String']['output']>;
};

export type DailyScheduleListUserItem = {
  __typename?: 'DailyScheduleListUserItem';
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

export type DeactivateParentResult = {
  __typename?: 'DeactivateParentResult';
  id: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type DeleteInvoiceResult = {
  __typename?: 'DeleteInvoiceResult';
  deletedAt: Maybe<Scalars['String']['output']>;
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

export type DstMigrationReport = {
  __typename?: 'DstMigrationReport';
  conflicts: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  runId: Maybe<Scalars['String']['output']>;
  total: Maybe<Scalars['Int']['output']>;
  unchanged: Maybe<Scalars['Int']['output']>;
  updated: Maybe<Scalars['Int']['output']>;
};

export type EditQuotaResult = {
  __typename?: 'EditQuotaResult';
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
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
  type: Maybe<FileType>;
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
  courseName: Maybe<Scalars['String']['output']>;
  durationMinutes: Maybe<Scalars['Int']['output']>;
  endTime: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isRescheduled: Maybe<Scalars['Boolean']['output']>;
  leaveRequestDisabled: Maybe<Scalars['Boolean']['output']>;
  leaveRequestDisabledReason: Maybe<Scalars['String']['output']>;
  location: Maybe<Scalars['String']['output']>;
  scheduledDate: Maybe<Scalars['String']['output']>;
  startTime: Maybe<Scalars['String']['output']>;
  studentCount: Maybe<Scalars['Int']['output']>;
};

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE'
}

export type GroupUser = {
  __typename?: 'GroupUser';
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export enum InvoiceType {
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

/** Account type for new manager */
export enum ManagerAccountType {
  Admin = 'admin',
  Manager = 'manager'
}

export type ManagerDirectoryRow = {
  __typename?: 'ManagerDirectoryRow';
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  roleName: Maybe<Scalars['String']['output']>;
  roleSlug: Maybe<Scalars['String']['output']>;
  skypeId: Maybe<Scalars['String']['output']>;
  staffProfileId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
};

/** Input for creating a new manager/staff account with RBAC assignment */
export type ManagerOnboardingInput = {
  accountType: ManagerAccountType;
  email: Scalars['Email']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone: InputMaybe<Scalars['String']['input']>;
  skypeId: InputMaybe<Scalars['String']['input']>;
};

/** Result of manager onboarding operation */
export type ManagerOnboardingResult = {
  __typename?: 'ManagerOnboardingResult';
  assignedGroupSlug: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  staffProfileId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ManualInvoiceResult = {
  __typename?: 'ManualInvoiceResult';
  amount: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<Scalars['String']['output']>;
  dueDate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<Scalars['String']['output']>;
  issueDate: Maybe<Scalars['String']['output']>;
  paidDate: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type MarkInvoicePaidResult = {
  __typename?: 'MarkInvoicePaidResult';
  id: Maybe<Scalars['String']['output']>;
  notificationSummaryUpdated: Maybe<Scalars['Boolean']['output']>;
  paidDate: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

/** Input for marking a suggestion as a duplicate of another suggestion. */
export type MarkSuggestionDuplicateInput = {
  duplicateOfId: Scalars['String']['input'];
  suggestionId: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  activateClass: Maybe<ClassInstanceDetail>;
  activateOverrideClass: Maybe<ClassInstanceDetail>;
  assignPermissionGroupToUser: Maybe<Scalars['Boolean']['output']>;
  bulkAssignUsersToGroup: Maybe<Scalars['Boolean']['output']>;
  bulkRevokeUsersFromGroup: Maybe<Scalars['Boolean']['output']>;
  changeStudentStatus: Maybe<ChangeStudentStatusResult>;
  cleanupTestEntities: Maybe<Scalars['Boolean']['output']>;
  clearWeeklySchedule: Maybe<Scalars['Boolean']['output']>;
  copyStorageItems: Maybe<BulkOperationResult>;
  createFolder: Maybe<FileOperationResult>;
  /** Create a new manager/staff account (System Admin only) */
  createManager: Maybe<ManagerOnboardingResult>;
  createManualInvoice: Maybe<ManualInvoiceResult>;
  /** Create a new parent account with billing configuration */
  createParent: Maybe<ParentOnboardingResult>;
  createPermissionGroup: Maybe<PermissionGroup>;
  createRecurringClass: Maybe<CreateRecurringClassResult>;
  /** Create a new teacher account with comprehensive profile */
  createTeacher: Maybe<TeacherOnboardingResult>;
  createTeacherManualClassEntry: Maybe<ClassInstanceDetail>;
  createTestEntities: Maybe<TestEntities>;
  deactivateParent: Maybe<DeactivateParentResult>;
  deleteClassInstance: Maybe<Scalars['Boolean']['output']>;
  /** Soft-deletes a complaint (admin only). Returns true on success. */
  deleteComplaint: Maybe<Scalars['Boolean']['output']>;
  deleteFile: Maybe<FileOperationResult>;
  deleteInvoice: Maybe<DeleteInvoiceResult>;
  /** Permanently deletes a learning resource from physical storage and the database. */
  deleteLearningResource: Maybe<Scalars['Boolean']['output']>;
  deletePermissionGroup: Maybe<Scalars['Boolean']['output']>;
  deleteRecurringClass: Maybe<Scalars['Boolean']['output']>;
  deleteStorageItems: Maybe<BulkOperationResult>;
  deleteStudent: Maybe<Student>;
  /** Soft-deletes a suggestion (super admin only). Returns true on success. */
  deleteSuggestion: Maybe<Scalars['Boolean']['output']>;
  /** Special GraphQL endpoint for demo fast login. It bypasses password checks and logs in a user using the provided permission group slug. Intended strictly for demonstration purposes and secured by environment variables. */
  demoLogin: Maybe<LoginResponse>;
  executeDstBulkUpdate: Maybe<DstMigrationReport>;
  linkDocumentToParent: Maybe<ParentDocument>;
  logTeacherSupportRequest: Maybe<SupportRequestResult>;
  login: Maybe<LoginResponse>;
  logout: Maybe<Scalars['Boolean']['output']>;
  markInvoicePaid: Maybe<MarkInvoicePaidResult>;
  /** Marks a suggestion as a duplicate of another suggestion (admin only). */
  markSuggestionDuplicate: Maybe<Suggestion>;
  /** Marks a suggestion as reviewed (admin only). */
  markSuggestionReviewed: Maybe<Suggestion>;
  moveStorageItems: Maybe<BulkOperationResult>;
  partiallyUpdateStudent: Maybe<Student>;
  prepareUpload: Maybe<UploadPreparation>;
  reassignStudentTeacher: Maybe<ReassignStudentTeacherResult>;
  refreshToken: Maybe<RefreshTokenResponse>;
  renameFile: Maybe<FileOperationResult>;
  rescheduleClass: Maybe<ClassInstanceDetail>;
  resetClass: Maybe<Scalars['Boolean']['output']>;
  /** Creates a response to an existing complaint (admin only). */
  respondToComplaint: Maybe<ComplaintResponse>;
  /** Responds to a suggestion with an admin text response (admin only). */
  respondToSuggestion: Maybe<Suggestion>;
  revokePermissionGroupFromUser: Maybe<Scalars['Boolean']['output']>;
  setStorageItemProtection: Maybe<FileOperationResult>;
  stopClass: Maybe<ClassInstanceDetail>;
  /** Submits a new complaint from the authenticated parent. */
  submitComplaint: Maybe<Complaint>;
  /** Submits a new suggestion from the authenticated parent. */
  submitSuggestion: Maybe<Suggestion>;
  updateDirectoryPermissions: Maybe<FileOperationResult>;
  /** Updates a manager's profile fields. */
  updateManagerProfile: Maybe<ManagerDirectoryRow>;
  updatePermissionGroup: Maybe<PermissionGroup>;
  updateSessionStatusAbsent: Maybe<ClassInstanceDetail>;
  updateSessionStatusLeave: Maybe<LeaveProcessResult>;
  updateSessionStatusStart: Maybe<ClassInstanceDetail>;
  updateStudentQuota: Maybe<EditQuotaResult>;
  updateTeacherProfile: Maybe<TeacherProfileResult>;
  updateUserOverrides: Maybe<Scalars['Boolean']['output']>;
  /** Uploads a new learning resource to the academy library. */
  uploadLearningResource: Maybe<LearningResourceRow>;
};


export type MutationActivateClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationActivateOverrideClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationAssignPermissionGroupToUserArgs = {
  input: AssignPermissionGroupToUserInput;
};


export type MutationBulkAssignUsersToGroupArgs = {
  groupId: Scalars['String']['input'];
  userIds: Array<Scalars['String']['input']>;
};


export type MutationBulkRevokeUsersFromGroupArgs = {
  groupId: Scalars['String']['input'];
  userIds: Array<Scalars['String']['input']>;
};


export type MutationChangeStudentStatusArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  newStatus: Scalars['String']['input'];
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


export type MutationClearWeeklyScheduleArgs = {
  teacherId: Scalars['ID']['input'];
};


export type MutationCopyStorageItemsArgs = {
  input: StorageItemsCopyInput;
};


export type MutationCreateFolderArgs = {
  input: FolderCreateInput;
};


export type MutationCreateManagerArgs = {
  input: ManagerOnboardingInput;
};


export type MutationCreateManualInvoiceArgs = {
  amount: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  dueDate: Scalars['String']['input'];
  exchangeRateSnapshot: InputMaybe<Scalars['String']['input']>;
  exchangeRateSource: InputMaybe<Scalars['String']['input']>;
  invoiceType: Scalars['String']['input'];
  issueDate: Scalars['String']['input'];
  parentId: Scalars['String']['input'];
  studentId: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateParentArgs = {
  input: ParentOnboardingInput;
};


export type MutationCreatePermissionGroupArgs = {
  input: CreatePermissionGroupInput;
};


export type MutationCreateRecurringClassArgs = {
  input: CreateRecurringClassInput;
};


export type MutationCreateTeacherArgs = {
  input: TeacherOnboardingInput;
};


export type MutationCreateTeacherManualClassEntryArgs = {
  input: CreateManualClassEntryInput;
};


export type MutationCreateTestEntitiesArgs = {
  classesRemaining: InputMaybe<Scalars['Int']['input']>;
  prefix: Scalars['String']['input'];
};


export type MutationDeactivateParentArgs = {
  parentId: Scalars['String']['input'];
};


export type MutationDeleteClassInstanceArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationDeleteComplaintArgs = {
  complaintId: Scalars['String']['input'];
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


export type MutationDeletePermissionGroupArgs = {
  groupId: Scalars['String']['input'];
};


export type MutationDeleteRecurringClassArgs = {
  classInstanceId: Scalars['ID']['input'];
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


export type MutationDemoLoginArgs = {
  input: DemoLoginInput;
};


export type MutationExecuteDstBulkUpdateArgs = {
  description: Scalars['String']['input'];
  offsetMinutes: Scalars['Int']['input'];
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
};


export type MutationMarkSuggestionDuplicateArgs = {
  input: MarkSuggestionDuplicateInput;
};


export type MutationMarkSuggestionReviewedArgs = {
  suggestionId: Scalars['String']['input'];
};


export type MutationMoveStorageItemsArgs = {
  input: StorageItemsMoveInput;
};


export type MutationPartiallyUpdateStudentArgs = {
  input: PartialStudentUpdateInput;
};


export type MutationPrepareUploadArgs = {
  input: UploadPreparationInput;
};


export type MutationReassignStudentTeacherArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  newTeacherId: Scalars['String']['input'];
  studentId: Scalars['String']['input'];
};


export type MutationRenameFileArgs = {
  input: FileRenameInput;
};


export type MutationRescheduleClassArgs = {
  classInstanceId: Scalars['ID']['input'];
  input: RescheduleClassInput;
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


export type MutationSetStorageItemProtectionArgs = {
  input: StorageItemProtectionUpdateInput;
};


export type MutationStopClassArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type MutationSubmitComplaintArgs = {
  input: ComplaintSubmitInput;
};


export type MutationSubmitSuggestionArgs = {
  input: SubmitSuggestionInput;
};


export type MutationUpdateDirectoryPermissionsArgs = {
  input: DirectoryPermissionsUpdateInput;
};


export type MutationUpdateManagerProfileArgs = {
  input: UpdateManagerProfileInput;
  staffProfileId: Scalars['ID']['input'];
};


export type MutationUpdatePermissionGroupArgs = {
  input: UpdatePermissionGroupInput;
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


export type MutationUpdateStudentQuotaArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;
  newClassesRemaining: Scalars['Int']['input'];
  studentId: Scalars['String']['input'];
};


export type MutationUpdateTeacherProfileArgs = {
  input: TeacherProfileUpdateInput;
  teacherId: Scalars['ID']['input'];
};


export type MutationUpdateUserOverridesArgs = {
  overrides: Array<UserOverrideInput>;
  userId: Scalars['String']['input'];
};


export type MutationUploadLearningResourceArgs = {
  input: ResourceUploadInput;
};

export type NotificationAlertsResult = {
  __typename?: 'NotificationAlertsResult';
  alerts: Maybe<Array<SystemAlert>>;
  id: Maybe<Scalars['String']['output']>;
  totalCount: Maybe<Scalars['Int']['output']>;
  unreadCount: Maybe<Scalars['Int']['output']>;
};

export enum OrderSortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
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

export type ParentDirectory = {
  __typename?: 'ParentDirectory';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<ParentDirectoryMetrics>;
  rows: Maybe<Array<ParentDirectoryRow>>;
  totalParents: Maybe<Scalars['Int']['output']>;
};

export type ParentDirectoryMetrics = {
  __typename?: 'ParentDirectoryMetrics';
  activated: Maybe<Scalars['Int']['output']>;
  deactivated: Maybe<Scalars['Int']['output']>;
  id: Maybe<Scalars['String']['output']>;
  onLeave: Maybe<Scalars['Int']['output']>;
  onTrial: Maybe<Scalars['Int']['output']>;
  regular: Maybe<Scalars['Int']['output']>;
  suspended: Maybe<Scalars['Int']['output']>;
};

export type ParentDirectoryRow = {
  __typename?: 'ParentDirectoryRow';
  accountStatus: Maybe<Scalars['String']['output']>;
  avatarUrl: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  guardianOf: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  index: Maybe<Scalars['Int']['output']>;
  name: Maybe<Scalars['String']['output']>;
  time: Maybe<Scalars['String']['output']>;
  unpaidInvoices: Maybe<Scalars['Int']['output']>;
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

export type ParentInvoiceRow = {
  __typename?: 'ParentInvoiceRow';
  amount: Maybe<Scalars['String']['output']>;
  currency: Maybe<Scalars['String']['output']>;
  dueDate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<Scalars['String']['output']>;
  issueDate: Maybe<Scalars['String']['output']>;
  paidDate: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
};

/** Input for creating a new parent account with billing configuration */
export type ParentOnboardingInput = {
  address: InputMaybe<Scalars['String']['input']>;
  currency: InputMaybe<Scalars['String']['input']>;
  defaultZoomLink: InputMaybe<Scalars['String']['input']>;
  email: Scalars['Email']['input'];
  facebook: InputMaybe<Scalars['String']['input']>;
  feeAmount: InputMaybe<Scalars['String']['input']>;
  invoiceType: InputMaybe<InvoiceType>;
  name: Scalars['String']['input'];
  nationality: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  paymentMethod: InputMaybe<PaymentMethod>;
  phone: InputMaybe<Scalars['String']['input']>;
  skype: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<Scalars['String']['input']>;
  twitter: InputMaybe<Scalars['String']['input']>;
  whatsapp: InputMaybe<Scalars['String']['input']>;
};

/** Result of parent onboarding operation */
export type ParentOnboardingResult = {
  __typename?: 'ParentOnboardingResult';
  currency: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  parentId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ParentProfile = {
  __typename?: 'ParentProfile';
  address: Maybe<Scalars['String']['output']>;
  avatarUrl: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  currency: Maybe<Scalars['String']['output']>;
  defaultZoomLink: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  facebook: Maybe<Scalars['String']['output']>;
  feeAmount: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  invoiceType: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nationality: Maybe<Scalars['String']['output']>;
  paymentMethod: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  skype: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  timezone: Maybe<Scalars['String']['output']>;
  twitter: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  whatsapp: Maybe<Scalars['String']['output']>;
};

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
};

export enum PaymentMethod {
  BankAccount = 'BANK_ACCOUNT',
  Paypal = 'PAYPAL'
}

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
  description: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isSystem: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  permissionIds: Maybe<Array<Scalars['String']['output']>>;
  slug: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type Query = {
  __typename?: 'Query';
  /** Returns the paginated admin complaint queue with metrics. */
  adminComplaintQueue: Maybe<ComplaintQueueResult>;
  /** Returns the paginated admin suggestion list with metrics. */
  adminSuggestions: Maybe<AdminSuggestionResult>;
  classInstance: Maybe<ClassInstanceDetail>;
  classStatusEvents: Maybe<Array<ClassStatusEvent>>;
  /** Returns file attachments for a specific complaint. Accessible by the owning parent or admins. */
  complaintFiles: Maybe<Array<ComplaintFile>>;
  dailyScheduleList: Maybe<Array<DailyScheduleList>>;
  dailyScheduleMetrics: Maybe<DailyScheduleMetrics>;
  directoryChildren: Maybe<Array<DirectoryInfo>>;
  /** Return effective permissions for a user, combining groups and overrides. */
  effectiveUserPermissions: Maybe<Array<Scalars['String']['output']>>;
  fileInfo: Maybe<FileInfo>;
  fileUsage: Maybe<FileUsageResult>;
  folderInfo: Maybe<DirectoryInfo>;
  /** Generates dynamic attendance and financial reports. */
  generateAttendanceReport: Maybe<Array<AttendanceReportRow>>;
  /** Lists all learning resources available to the academy. */
  learningResources: Maybe<Array<LearningResourceRow>>;
  listFiles: Maybe<StorageObjectList>;
  /** Lists all staff members with administrative access. */
  managerDirectory: Maybe<Array<ManagerDirectoryRow>>;
  me: Maybe<User>;
  notificationAlerts: Maybe<NotificationAlertsResult>;
  parentAssociatedStudents: Maybe<Array<AssociatedStudent>>;
  /** Returns the authenticated parent's complaint history with responses. */
  parentComplaints: Maybe<Array<Complaint>>;
  parentDirectory: Maybe<ParentDirectory>;
  parentDocuments: Maybe<Array<ParentDocument>>;
  parentInvoiceHistory: Maybe<Array<ParentInvoiceRow>>;
  parentProfile: Maybe<ParentProfile>;
  /** Returns the authenticated parent's suggestion history with review status. */
  parentSuggestions: Maybe<Array<Suggestion>>;
  /** Fetch a single permission group by ID. */
  permissionGroup: Maybe<PermissionGroup>;
  /** List all permission groups with their permission IDs. */
  permissionGroups: Maybe<Array<PermissionGroup>>;
  /** List all permission catalog entries. */
  permissions: Maybe<Array<Permission>>;
  rescheduleTrackingMetrics: Maybe<RescheduleTrackingMetrics>;
  rescheduleTrackingRows: Maybe<Array<RescheduleTrackingRow>>;
  searchFiles: Maybe<StorageObjectList>;
  /** Search suggestions for duplicate marking autocomplete. Requires suggestions.review permission. */
  searchSuggestions: Maybe<Array<SuggestionSearchResult>>;
  searchTeacherAvailability: Maybe<AvailabilitySearchResult>;
  statusTrackingSchedule: Maybe<Array<StatusTrackingScheduleRow>>;
  storageStats: Maybe<StorageStats>;
  student: Maybe<Student>;
  studentById: Maybe<AssociatedStudent>;
  studentClassHistory: Maybe<StudentClassHistory>;
  studentClassSessionDetail: Maybe<StudentSessionDetail>;
  /** Fetches the global student directory with cross-relational data. */
  studentDirectory: Maybe<Array<StudentDirectoryRow>>;
  students: StudentsWithFiltersResponse;
  teacherActiveDashboard: Maybe<TeacherDashboard>;
  teacherDashboard: Maybe<TeacherDashboard>;
  teacherDirectory: Maybe<TeacherDirectory>;
  teacherFutureSchedule: Maybe<TeacherFutureSchedule>;
  teacherHandbookUrl: Maybe<TeacherHandbookUrl>;
  teacherProfileForEdit: Maybe<TeacherProfileResult>;
  teacherWeeklyScheduleGrid: Maybe<WeeklyScheduleGrid>;
  teacherWorkloadMetrics: Maybe<WeeklyWorkloadMetrics>;
  teachers: Maybe<Array<TeacherSimple>>;
  translatedMessage: Maybe<Scalars['String']['output']>;
  unpaidInvoicesAlert: Maybe<UnpaidInvoicesSummary>;
  user: Maybe<User>;
  /** List overrides for a user. */
  userOverrides: Maybe<Array<UserOverride>>;
  /** Return group IDs assigned to a user. */
  userPermissionGroups: Maybe<Array<Scalars['String']['output']>>;
  users: Maybe<Array<User>>;
  welcomeMessage: Maybe<Scalars['String']['output']>;
};


export type QueryAdminComplaintQueueArgs = {
  filter: ComplaintQueueFilter;
};


export type QueryAdminSuggestionsArgs = {
  filter: SuggestionFilter;
};


export type QueryClassInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryClassStatusEventsArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type QueryComplaintFilesArgs = {
  complaintId: Scalars['String']['input'];
};


export type QueryDailyScheduleListArgs = {
  date: Scalars['String']['input'];
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


export type QueryLearningResourcesArgs = {
  searchQuery: InputMaybe<Scalars['String']['input']>;
};


export type QueryListFilesArgs = {
  input: FilesListInput;
};


export type QueryParentAssociatedStudentsArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryParentDirectoryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryParentDocumentsArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryParentInvoiceHistoryArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryParentProfileArgs = {
  parentId: Scalars['String']['input'];
};


export type QueryParentSuggestionsArgs = {
  options: ParentSuggestionOptions;
};


export type QueryPermissionGroupArgs = {
  id: Scalars['String']['input'];
};


export type QueryRescheduleTrackingRowsArgs = {
  input: RescheduleTrackingInput;
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


export type QueryStatusTrackingScheduleArgs = {
  date: Scalars['String']['input'];
  search: InputMaybe<Scalars['String']['input']>;
  viewerTimezone: InputMaybe<Scalars['String']['input']>;
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
  studentId: Scalars['ID']['input'];
  year: Scalars['Int']['input'];
};


export type QueryStudentClassSessionDetailArgs = {
  classInstanceId: Scalars['ID']['input'];
};


export type QueryStudentDirectoryArgs = {
  filterArgs: InputMaybe<StudentFilterArgs>;
  orderBy: InputMaybe<Array<StudentsOrderByClause>>;
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryStudentsArgs = {
  filterArgs: InputMaybe<StudentFilterArgs>;
  orderBy: InputMaybe<Array<StudentsOrderByClause>>;
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryTeacherActiveDashboardArgs = {
  date: Scalars['String']['input'];
};


export type QueryTeacherDashboardArgs = {
  date: Scalars['String']['input'];
};


export type QueryTeacherDirectoryArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
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


export type QueryUserOverridesArgs = {
  userId: Scalars['String']['input'];
};


export type QueryUserPermissionGroupsArgs = {
  userId: Scalars['String']['input'];
};

export type ReassignStudentTeacherResult = {
  __typename?: 'ReassignStudentTeacherResult';
  id: Maybe<Scalars['String']['output']>;
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['Int']['output']>;
};

export type RecurringClassDayInput = {
  dayOfWeek: Scalars['String']['input'];
  isActive: Scalars['Boolean']['input'];
  startTime: Scalars['String']['input'];
};

export type RefreshTokenResponse = {
  __typename?: 'RefreshTokenResponse';
  token: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
};

/** Determines how the attendance data is aggregated. */
export enum ReportGroupingMode {
  Date = 'DATE',
  Teacher = 'TEACHER'
}

export type RescheduleClassInput = {
  durationMinutes: Scalars['Int']['input'];
  scheduledEndAt: Scalars['String']['input'];
  scheduledStartAt: Scalars['String']['input'];
};

export type RescheduleTrackingInput = {
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
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

export type RescheduleTrackingRow = {
  __typename?: 'RescheduleTrackingRow';
  dateLabel: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  originalClassId: Maybe<Scalars['String']['output']>;
  remarks: Maybe<Scalars['String']['output']>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  status: Maybe<Scalars['String']['output']>;
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
  emailSent: Scalars['Boolean']['input'];
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

export type StatusTrackingScheduleRow = {
  __typename?: 'StatusTrackingScheduleRow';
  durationMinutes: Maybe<Scalars['Int']['output']>;
  executionState: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  isFrozen: Maybe<Scalars['Boolean']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentInitials: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  studentStatus: Maybe<Scalars['String']['output']>;
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
  hoursPerWeek: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  language: Maybe<AppLanguage>;
  name: Scalars['String']['output'];
  parentId: Scalars['String']['output'];
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
};

export type StudentDirectoryRow = {
  __typename?: 'StudentDirectoryRow';
  avatarUrl: Maybe<Scalars['String']['output']>;
  classesRemaining: Maybe<Scalars['Int']['output']>;
  classesTotal: Maybe<Scalars['Int']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  hoursPerWeek: Maybe<Scalars['Int']['output']>;
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
  id: Maybe<Scalars['String']['output']>;
  instructor: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  room: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  time: Maybe<Scalars['String']['output']>;
  timeSlot: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type StudentSessionDetail = {
  __typename?: 'StudentSessionDetail';
  durationMinutes: Maybe<Scalars['Int']['output']>;
  executionState: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  remarks: Maybe<Scalars['String']['output']>;
  scheduledEndAt: Maybe<Scalars['DateTime']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  zoomMeetingUrl: Maybe<Scalars['String']['output']>;
};

export enum StudentStatus {
  Deactivated = 'DEACTIVATED',
  Graduated = 'GRADUATED',
  OnLeave = 'ON_LEAVE',
  OnTrial = 'ON_TRIAL',
  Regular = 'REGULAR',
  Suspended = 'SUSPENDED'
}

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
  responseCount: Maybe<Scalars['Int']['output']>;
  reviewedAt: Maybe<Scalars['DateTime']['output']>;
  reviewedByName: Maybe<Scalars['String']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  status: Maybe<SuggestionStatus>;
  submitterName: Maybe<Scalars['String']['output']>;
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

export type SupportRequestResult = {
  __typename?: 'SupportRequestResult';
  id: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
};

export type SystemAlert = {
  __typename?: 'SystemAlert';
  body: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  severity: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export type TeacherAvailabilityGap = {
  __typename?: 'TeacherAvailabilityGap';
  dayOfWeek: Maybe<Scalars['String']['output']>;
  gapEndTime: Maybe<Scalars['String']['output']>;
  gapStartTime: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  teacherGender: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherName: Maybe<Scalars['String']['output']>;
  timezone: Maybe<Scalars['String']['output']>;
};

export type TeacherDashboard = {
  __typename?: 'TeacherDashboard';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<TeacherDashboardMetrics>;
  progressFeed: Maybe<Array<TeacherProgressFeedItem>>;
  scheduleRows: Maybe<Array<TeacherDashboardScheduleRow>>;
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
  executionState: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  scheduledStartAt: Maybe<Scalars['DateTime']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
  yourTimeFormatted: Maybe<Scalars['String']['output']>;
  zoomMeetingUrl: Maybe<Scalars['String']['output']>;
};

export type TeacherDirectory = {
  __typename?: 'TeacherDirectory';
  id: Maybe<Scalars['String']['output']>;
  metrics: Maybe<TeacherDirectoryMetrics>;
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
  status: Maybe<Scalars['String']['output']>;
  zoomLink: Maybe<Scalars['String']['output']>;
};

export type TeacherFutureSchedule = {
  __typename?: 'TeacherFutureSchedule';
  classes: Maybe<Array<FutureClass>>;
  id: Maybe<Scalars['String']['output']>;
  leaveQuotaTotal: Maybe<Scalars['Int']['output']>;
  leaveQuotaUsed: Maybe<Scalars['Int']['output']>;
  totalClasses: Maybe<Scalars['Int']['output']>;
};

export type TeacherHandbookUrl = {
  __typename?: 'TeacherHandbookUrl';
  id: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

/** Input for creating a new teacher account with comprehensive profile */
export type TeacherOnboardingInput = {
  /** Bank account number */
  accountNumber: InputMaybe<Scalars['String']['input']>;
  /** Teacher address */
  address: InputMaybe<Scalars['String']['input']>;
  /** Bank name */
  bankName: InputMaybe<Scalars['String']['input']>;
  /** Banking beneficiary name */
  beneficiaryName: InputMaybe<Scalars['String']['input']>;
  /** Teacher country code */
  countryCode: InputMaybe<CountryCode>;
  /** Teacher date of birth (ISO date string) */
  dateOfBirth: InputMaybe<Scalars['String']['input']>;
  /** Teacher email address */
  email: Scalars['Email']['input'];
  /** Teacher gender */
  gender: InputMaybe<Gender>;
  /** Teacher hourly rate */
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  /** IBAN */
  iban: InputMaybe<Scalars['String']['input']>;
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
  rateCurrency: InputMaybe<Scalars['String']['input']>;
  /** Bank routing number */
  routingNumber: InputMaybe<Scalars['String']['input']>;
  /** Teacher Skype ID */
  skypeId: InputMaybe<Scalars['String']['input']>;
  /** SWIFT/BIC code */
  swiftBic: InputMaybe<Scalars['String']['input']>;
  /** IANA timezone identifier */
  timezone: Scalars['String']['input'];
  /** Timezone ID reference */
  timezoneId: InputMaybe<Scalars['Int']['input']>;
  /** Teacher Zoom meeting link */
  zoomLink: InputMaybe<Scalars['String']['input']>;
  /** Teacher Zoom password (encrypted) */
  zoomPassword: InputMaybe<Scalars['String']['input']>;
  /** Teacher Zoom username */
  zoomUsername: InputMaybe<Scalars['String']['input']>;
};

/** Result of teacher onboarding operation */
export type TeacherOnboardingResult = {
  __typename?: 'TeacherOnboardingResult';
  /** Teacher email */
  email: Maybe<Scalars['String']['output']>;
  /** Teacher name */
  name: Maybe<Scalars['String']['output']>;
  /** Teacher account status */
  status: Maybe<Scalars['String']['output']>;
  /** Created teacher profile ID */
  teacherId: Maybe<Scalars['String']['output']>;
  /** Created user ID */
  userId: Maybe<Scalars['String']['output']>;
};

export type TeacherProfileResult = {
  __typename?: 'TeacherProfileResult';
  address: Maybe<Scalars['String']['output']>;
  dateOfBirth: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  gender: Maybe<Scalars['String']['output']>;
  hourlyRate: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nationalId: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  qualifications: Maybe<Scalars['String']['output']>;
  rateCurrency: Maybe<Scalars['String']['output']>;
  skypeId: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  timezone: Maybe<Scalars['String']['output']>;
  zoomLink: Maybe<Scalars['String']['output']>;
  zoomUsername: Maybe<Scalars['String']['output']>;
};

export type TeacherProfileUpdateInput = {
  address: InputMaybe<Scalars['String']['input']>;
  dateOfBirth: InputMaybe<Scalars['String']['input']>;
  gender: InputMaybe<Scalars['String']['input']>;
  hourlyRate: InputMaybe<Scalars['String']['input']>;
  nationalId: InputMaybe<Scalars['String']['input']>;
  phone: InputMaybe<Scalars['String']['input']>;
  qualifications: InputMaybe<Scalars['String']['input']>;
  rateCurrency: InputMaybe<Scalars['String']['input']>;
  skypeId: InputMaybe<Scalars['String']['input']>;
  timezone: InputMaybe<Scalars['String']['input']>;
  zoomLink: InputMaybe<Scalars['String']['input']>;
  zoomPassword: InputMaybe<Scalars['String']['input']>;
  zoomUsername: InputMaybe<Scalars['String']['input']>;
};

export type TeacherProgressFeedItem = {
  __typename?: 'TeacherProgressFeedItem';
  id: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export type TeacherSimple = {
  __typename?: 'TeacherSimple';
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type TestEntities = {
  __typename?: 'TestEntities';
  parentId: Maybe<Scalars['String']['output']>;
  parentUserEmail: Maybe<Scalars['String']['output']>;
  parentUserId: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentUserEmail: Maybe<Scalars['String']['output']>;
  studentUserId: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
  teacherUserEmail: Maybe<Scalars['String']['output']>;
  teacherUserId: Maybe<Scalars['String']['output']>;
};

export type UnpaidInvoiceItem = {
  __typename?: 'UnpaidInvoiceItem';
  currency: Maybe<Scalars['String']['output']>;
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
  totalOverdueAmount: Maybe<Scalars['String']['output']>;
  totalOverdueInvoices: Maybe<Scalars['Int']['output']>;
};

export type UpdateManagerProfileInput = {
  phone: InputMaybe<Scalars['String']['input']>;
  skypeId: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePermissionGroupInput = {
  description: InputMaybe<Scalars['String']['input']>;
  groupId: Scalars['String']['input'];
  name: InputMaybe<Scalars['String']['input']>;
  permissionIds: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UploadPreparation = {
  __typename?: 'UploadPreparation';
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

export type User = {
  __typename?: 'User';
  avatarUrl: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  emailVerifiedAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  notificationCount: Maybe<Scalars['Int']['output']>;
  permissions: Maybe<Array<AppPermission>>;
  role: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type UserOverride = {
  __typename?: 'UserOverride';
  assignedBy: Maybe<Scalars['String']['output']>;
  permissionId: Maybe<Scalars['String']['output']>;
  state: Maybe<Scalars['String']['output']>;
};

export type UserOverrideInput = {
  permissionId: Scalars['String']['input'];
  state: Scalars['String']['input'];
};

export type WeeklyScheduleClass = {
  __typename?: 'WeeklyScheduleClass';
  day: Maybe<Scalars['String']['output']>;
  duration: Maybe<Scalars['Int']['output']>;
  executionState: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  outcome: Maybe<Scalars['String']['output']>;
  startTime: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
  studentName: Maybe<Scalars['String']['output']>;
};

export type WeeklyScheduleGrid = {
  __typename?: 'WeeklyScheduleGrid';
  classes: Maybe<Array<WeeklyScheduleClass>>;
  id: Maybe<Scalars['String']['output']>;
  teacherId: Maybe<Scalars['String']['output']>;
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
