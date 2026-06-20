/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './graphql-types.ts';

export type AppLanguage =
  | 'ar'
  | 'en';

export type AppPermission =
  | 'AUTH_LOGIN'
  | 'AUTH_VIEW_OWN_PROFILE'
  | 'BILLING_VIEW_UNPAID_INVOICES'
  | 'COMPLAINTS_DELETE'
  | 'COMPLAINTS_LIST'
  | 'COMPLAINTS_RESPOND'
  | 'DASHBOARD_FILTER_METRICS'
  | 'DASHBOARD_METRICS_VIEW_ALL'
  | 'DASHBOARD_SEARCH'
  | 'DASHBOARD_VIEW'
  | 'DASHBOARD_VIEW_METRICS'
  | 'HISTORY_VIEW_CALENDAR'
  | 'HISTORY_VIEW_DETAILS'
  | 'INVOICES_CREATE'
  | 'INVOICES_DELETE'
  | 'INVOICES_EDIT'
  | 'INVOICES_LIST'
  | 'INVOICES_MARK_PAID'
  | 'NOTIFICATION_VIEW_ALERTS'
  | 'PARENTS_CREATE'
  | 'PARENTS_EDIT'
  | 'PARENTS_LIST'
  | 'PERMISSION_GROUPS_ASSIGN'
  | 'PERMISSION_GROUPS_MANAGE'
  | 'REPORTS_GENERATE'
  | 'RESOURCES_DELETE'
  | 'RESOURCES_LIST'
  | 'RESOURCES_UPLOAD'
  | 'SCHEDULE_CREATE_CLASS'
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
  | 'STAFF_LIST'
  | 'STAFF_VIEW_DIRECTORY'
  | 'STUDENTS_CHANGE_STATUS'
  | 'STUDENTS_CHANGE_TEACHER'
  | 'STUDENTS_EDIT'
  | 'STUDENTS_LIST'
  | 'STUDENTS_OVERRIDE_QUOTA'
  | 'SYSTEM_ENFORCE_LEAVE_LIMIT'
  | 'SYSTEM_ENFORCE_TIME_WINDOW'
  | 'TEACHERS_CREATE'
  | 'TEACHERS_EDIT'
  | 'TEACHERS_LIST'
  | 'TEACHERS_MANAGE_SCHEDULE'
  | 'TEACHER_VIEW_DASHBOARD'
  | 'TEST_CUSTOM_ONLY'
  | 'TEST_SYSTEM_ONLY'
  | 'USER_VIEW_PROFILE';

export type AssignPermissionGroupToUserInput = {
  groupId: string;
  userId: string;
};

export type AvailabilitySearchInput = {
  fromTime: string;
  gender: string | null | undefined;
  toTime: string;
};

export type CreateManualClassEntryInput = {
  classType: string | null | undefined;
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

/** Input for the demo fast login mutation. */
export type DemoLoginInput = {
  /** The unique slug of the permission group to authenticate as. */
  groupSlug: string;
};

export type Gender =
  | 'FEMALE'
  | 'MALE';

export type LogSupportRequestInput = {
  reason: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type OrderSortDirection =
  | 'ASC'
  | 'DESC';

export type PaginationArgs = {
  after: string | null | undefined;
  before: string | null | undefined;
  first: number | null | undefined;
  last: number | null | undefined;
  maxCount: number | null | undefined;
  page: number | null | undefined;
  skip: number | null | undefined;
};

export type RecurringClassDayInput = {
  dayOfWeek: string;
  isActive: boolean;
  startTime: string;
};

export type RescheduleClassInput = {
  durationMinutes: number;
  scheduledEndAt: string;
  scheduledStartAt: string;
};

export type RescheduleTrackingInput = {
  limit: number | null | undefined;
  offset: number | null | undefined;
  search: string | null | undefined;
  status: string | null | undefined;
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
  | 'GRADUATED'
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

export type UpdatePermissionGroupInput = {
  description: string | null | undefined;
  groupId: string;
  name: string | null | undefined;
  permissionIds: Array<string> | null | undefined;
};

export type UserOverrideInput = {
  permissionId: string;
  state: string;
};

export type MeQuery_me_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<Types.AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type MeQuery_Query = { me: MeQuery_me_User | null };


export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = MeQuery_Query;

export type UserQuery_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<Types.AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type UserQuery_Query = { user: UserQuery_user_User | null };


export type UserQueryVariables = Exact<{
  id: string;
}>;


export type UserQuery = UserQuery_Query;

export type UsersQuery_users_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<Types.AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type UsersQuery_Query = { users: Array<UsersQuery_users_User> | null };


export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = UsersQuery_Query;

export type LoginMutation_login_LoginResponse_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<Types.AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type LoginMutation_login_LoginResponse = { token: string | null, user: LoginMutation_login_LoginResponse_user_User | null };

export type LoginMutation_Mutation = { login: LoginMutation_login_LoginResponse | null };


export type LoginMutationVariables = Exact<{
  input: Types.LoginInput;
}>;


export type LoginMutation = LoginMutation_Mutation;

export type DemoLoginMutation_demoLogin_LoginResponse_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<Types.AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type DemoLoginMutation_demoLogin_LoginResponse = { token: string | null, user: DemoLoginMutation_demoLogin_LoginResponse_user_User | null };

export type DemoLoginMutation_Mutation = { demoLogin: DemoLoginMutation_demoLogin_LoginResponse | null };


export type DemoLoginMutationVariables = Exact<{
  input: Types.DemoLoginInput;
}>;


export type DemoLoginMutation = DemoLoginMutation_Mutation;

export type LogoutMutation_Mutation = { logout: boolean | null };


export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = LogoutMutation_Mutation;

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<Types.AppPermission> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse = { token: string | null, user: RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User | null };

export type RefreshTokenMutation_Mutation = { refreshToken: RefreshTokenMutation_refreshToken_RefreshTokenResponse | null };


export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = RefreshTokenMutation_Mutation;

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher_gaps_TeacherAvailabilityGap = { id: string | null, teacherId: string | null, teacherName: string | null, teacherGender: string | null, dayOfWeek: string | null, gapStartTime: string | null, gapEndTime: string | null, timezone: string | null };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher = { id: string | null, name: string | null, gender: string | null, timezone: string | null, gaps: Array<SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher_gaps_TeacherAvailabilityGap> | null };

export type SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult = { id: string | null, totalGaps: number | null, teachers: Array<SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult_teachers_AvailabilitySearchTeacher> | null };

export type SearchTeacherAvailabilityQuery_Query = { searchTeacherAvailability: SearchTeacherAvailabilityQuery_searchTeacherAvailability_AvailabilitySearchResult | null };


export type SearchTeacherAvailabilityQueryVariables = Exact<{
  input: Types.AvailabilitySearchInput;
}>;


export type SearchTeacherAvailabilityQuery = SearchTeacherAvailabilityQuery_Query;

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem = { id: string | null, userId: string | null, userName: string | null, userEmail: string | null, totalUnpaidAmount: string | null, currency: string | null, overdueCount: number | null, oldestDueDate: string | null };

export type UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary = { id: string | null, totalOverdueInvoices: number | null, totalOverdueAmount: string | null, items: Array<UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary_items_UnpaidInvoiceItem> | null };

export type UnpaidInvoicesAlertQuery_Query = { unpaidInvoicesAlert: UnpaidInvoicesAlertQuery_unpaidInvoicesAlert_UnpaidInvoicesSummary | null };


export type UnpaidInvoicesAlertQueryVariables = Exact<{ [key: string]: never; }>;


export type UnpaidInvoicesAlertQuery = UnpaidInvoicesAlertQuery_Query;

export type ClassInstanceQuery_classInstance_ClassInstanceDetail_student_ClassInstanceStudentInfo = { id: string | null, name: string | null, grade: string | null, level: string | null, avatarUrl: string | null };

export type ClassInstanceQuery_classInstance_ClassInstanceDetail_teacher_ClassInstanceTeacherInfo = { id: string | null, name: string | null, title: string | null, avatarUrl: string | null };

export type ClassInstanceQuery_classInstance_ClassInstanceDetail_performance_ClassInstancePerformance = { engagementScore: number | null, assessmentProgress: number | null, assessmentTotal: number | null, focusLevel: string | null, sessionHealth: string | null, heatmapData: Array<unknown> | null, latencyMs: number | null, attendanceRate: number | null, avgGrade: string | null, lastClassDaysAgo: number | null };

export type ClassInstanceQuery_classInstance_ClassInstanceDetail = { id: string | null, courseName: string | null, instanceId: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, status: string | null, remarks: string | null, hasTimezoneMismatch: boolean | null, studentTimezone: string | null, zoomMeetingUrl: string | null, payrollCredited: boolean | null, isRescheduled: boolean | null, executionState: string | null, outcome: string | null, student: ClassInstanceQuery_classInstance_ClassInstanceDetail_student_ClassInstanceStudentInfo | null, teacher: ClassInstanceQuery_classInstance_ClassInstanceDetail_teacher_ClassInstanceTeacherInfo | null, performance: ClassInstanceQuery_classInstance_ClassInstanceDetail_performance_ClassInstancePerformance | null };

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

export type ActivateClassMutation_activateClass_ClassInstanceDetail = { id: string | null, status: string | null, durationMinutes: number | null, remarks: string | null, zoomMeetingUrl: string | null };

export type ActivateClassMutation_Mutation = { activateClass: ActivateClassMutation_activateClass_ClassInstanceDetail | null };


export type ActivateClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type ActivateClassMutation = ActivateClassMutation_Mutation;

export type ActivateOverrideClassMutation_activateOverrideClass_ClassInstanceDetail = { id: string | null, executionState: string | null, status: string | null, durationMinutes: number | null, remarks: string | null, zoomMeetingUrl: string | null };

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

export type UpdateSessionStatusStartMutation_updateSessionStatusStart_ClassInstanceDetail = { id: string | null, executionState: string | null, status: string | null, durationMinutes: number | null, remarks: string | null };

export type UpdateSessionStatusStartMutation_Mutation = { updateSessionStatusStart: UpdateSessionStatusStartMutation_updateSessionStatusStart_ClassInstanceDetail | null };


export type UpdateSessionStatusStartMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type UpdateSessionStatusStartMutation = UpdateSessionStatusStartMutation_Mutation;

export type UpdateSessionStatusAbsentMutation_updateSessionStatusAbsent_ClassInstanceDetail = { id: string | null, executionState: string | null, outcome: string | null, payrollCredited: boolean | null, status: string | null, durationMinutes: number | null, remarks: string | null };

export type UpdateSessionStatusAbsentMutation_Mutation = { updateSessionStatusAbsent: UpdateSessionStatusAbsentMutation_updateSessionStatusAbsent_ClassInstanceDetail | null };


export type UpdateSessionStatusAbsentMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type UpdateSessionStatusAbsentMutation = UpdateSessionStatusAbsentMutation_Mutation;

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_completedInstance_ClassInstanceDetail = { id: string | null, outcome: string | null, isRescheduled: boolean | null };

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_rescheduledInstance_ClassInstanceDetail = { id: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null };

export type UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult = { completedInstanceId: string | null, rescheduledInstanceId: string | null, completedInstance: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_completedInstance_ClassInstanceDetail | null, rescheduledInstance: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult_rescheduledInstance_ClassInstanceDetail | null };

export type UpdateSessionStatusLeaveMutation_Mutation = { updateSessionStatusLeave: UpdateSessionStatusLeaveMutation_updateSessionStatusLeave_LeaveProcessResult | null };


export type UpdateSessionStatusLeaveMutationVariables = Exact<{
  classInstanceId: string | number;
  leaveReason: string;
}>;


export type UpdateSessionStatusLeaveMutation = UpdateSessionStatusLeaveMutation_Mutation;

export type StopClassMutation_stopClass_ClassInstanceDetail = { id: string | null, status: string | null, durationMinutes: number | null, remarks: string | null };

export type StopClassMutation_Mutation = { stopClass: StopClassMutation_stopClass_ClassInstanceDetail | null };


export type StopClassMutationVariables = Exact<{
  classInstanceId: string | number;
}>;


export type StopClassMutation = StopClassMutation_Mutation;

export type RescheduleClassMutation_rescheduleClass_ClassInstanceDetail = { id: string | null, status: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null };

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

export type NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult_alerts_SystemAlert = { id: string | null, type: string | null, title: string | null, body: string | null, createdAt: string | null, severity: string | null };

export type NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult = { id: string | null, totalCount: number | null, unreadCount: number | null, alerts: Array<NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult_alerts_SystemAlert> | null };

export type NotificationAlertsQuery_Query = { notificationAlerts: NotificationAlertsQuery_notificationAlerts_NotificationAlertsResult | null };


export type NotificationAlertsQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationAlertsQuery = NotificationAlertsQuery_Query;

export type PermissionFieldsFragment = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionGroupFieldsFragment_PermissionGroup_assignedUsers_GroupUser = { id: string | null, name: string | null, email: string | null };

export type PermissionGroupFieldsFragment = { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

export type UserOverrideFieldsFragment = { permissionId: string | null, state: string | null, assignedBy: string | null };

export type PermissionsQuery_permissions_Permission = { id: string | null, key: string | null, resource: string | null, action: string | null, description: string | null, category: string | null, isSystem: boolean | null };

export type PermissionsQuery_Query = { permissions: Array<PermissionsQuery_permissions_Permission> | null };


export type PermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionsQuery = PermissionsQuery_Query;

export type PermissionGroupsQuery_permissionGroups_PermissionGroup = { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

export type PermissionGroupsQuery_Query = { permissionGroups: Array<PermissionGroupsQuery_permissionGroups_PermissionGroup> | null };


export type PermissionGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type PermissionGroupsQuery = PermissionGroupsQuery_Query;

export type PermissionGroupQuery_permissionGroup_PermissionGroup = { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

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

export type UserOverridesQuery_userOverrides_UserOverride = { permissionId: string | null, state: string | null, assignedBy: string | null };

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

export type CreatePermissionGroupMutation_createPermissionGroup_PermissionGroup = { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

export type CreatePermissionGroupMutation_Mutation = { createPermissionGroup: CreatePermissionGroupMutation_createPermissionGroup_PermissionGroup | null };


export type CreatePermissionGroupMutationVariables = Exact<{
  input: Types.CreatePermissionGroupInput;
}>;


export type CreatePermissionGroupMutation = CreatePermissionGroupMutation_Mutation;

export type UpdatePermissionGroupMutation_updatePermissionGroup_PermissionGroup = { id: string | null, name: string | null, slug: string | null, description: string | null, isSystem: boolean | null, createdAt: string | null, updatedAt: string | null, permissionIds: Array<string> | null, assignedUsers: Array<PermissionGroupFieldsFragment_PermissionGroup_assignedUsers_GroupUser> | null };

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

export type CreateRecurringClassMutation_createRecurringClass_CreateRecurringClassResult = { id: string | null, recurringScheduleId: string | null, classInstanceIds: Array<string> | null, classInstanceCount: number | null };

export type CreateRecurringClassMutation_Mutation = { createRecurringClass: CreateRecurringClassMutation_createRecurringClass_CreateRecurringClassResult | null };


export type CreateRecurringClassMutationVariables = Exact<{
  input: Types.CreateRecurringClassInput;
}>;


export type CreateRecurringClassMutation = CreateRecurringClassMutation_Mutation;

export type DailyScheduleMetricsQuery_dailyScheduleMetrics_DailyScheduleMetrics = { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type DailyScheduleMetricsQuery_Query = { dailyScheduleMetrics: DailyScheduleMetricsQuery_dailyScheduleMetrics_DailyScheduleMetrics | null };


export type DailyScheduleMetricsQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
}>;


export type DailyScheduleMetricsQuery = DailyScheduleMetricsQuery_Query;

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_student_DailyScheduleListUserItem = { id: string | null, name: string | null };

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_teacher_DailyScheduleListUserItem = { id: string | null, name: string | null };

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList = { id: string | null, yourTime: string | null, teacherTime: string | null, studentTime: string | null, duration: number | null, status: string | null, student: DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_student_DailyScheduleListUserItem | null, teacher: DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_teacher_DailyScheduleListUserItem | null };

export type DailyScheduleListQuery_Query = { dailyScheduleList: Array<DailyScheduleListQuery_dailyScheduleList_DailyScheduleList> | null };


export type DailyScheduleListQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
  search: string | null | undefined;
}>;


export type DailyScheduleListQuery = DailyScheduleListQuery_Query;

export type RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingRow = { id: string | null, originalClassId: string | null, teacherId: string | null, teacherName: string | null, teacherAvatarUrl: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null, status: string | null, dateLabel: string | null, remarks: string | null };

export type RescheduleTrackingRowsQuery_Query = { rescheduleTrackingRows: Array<RescheduleTrackingRowsQuery_rescheduleTrackingRows_RescheduleTrackingRow> | null };


export type RescheduleTrackingRowsQueryVariables = Exact<{
  input: Types.RescheduleTrackingInput;
}>;


export type RescheduleTrackingRowsQuery = RescheduleTrackingRowsQuery_Query;

export type RescheduleTrackingMetricsQuery_rescheduleTrackingMetrics_RescheduleTrackingMetrics = { id: string | null, pending: number | null, approved: number | null, leave: number | null, rescheduled: number | null, cancelled: number | null };

export type RescheduleTrackingMetricsQuery_Query = { rescheduleTrackingMetrics: RescheduleTrackingMetricsQuery_rescheduleTrackingMetrics_RescheduleTrackingMetrics | null };


export type RescheduleTrackingMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type RescheduleTrackingMetricsQuery = RescheduleTrackingMetricsQuery_Query;

export type TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_metrics_TeacherDirectoryMetrics = { id: string | null, activated: number | null, deactivated: number | null };

export type TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_rows_TeacherDirectoryRow = { id: string | null, index: string | null, name: string | null, email: string | null, avatarUrl: string | null, status: string | null, zoomLink: string | null };

export type TeacherDirectoryQuery_teacherDirectory_TeacherDirectory = { id: string | null, totalTeachers: number | null, metrics: TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_metrics_TeacherDirectoryMetrics | null, rows: Array<TeacherDirectoryQuery_teacherDirectory_TeacherDirectory_rows_TeacherDirectoryRow> | null };

export type TeacherDirectoryQuery_Query = { teacherDirectory: TeacherDirectoryQuery_teacherDirectory_TeacherDirectory | null };


export type TeacherDirectoryQueryVariables = Exact<{
  search: string | null | undefined;
  limit: number | null | undefined;
  offset: number | null | undefined;
}>;


export type TeacherDirectoryQuery = TeacherDirectoryQuery_Query;

export type StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics = { totalClasses: number | null, attendanceRate: number | null, hoursStudied: number | null, performance: number | null };

export type StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession = { id: string | null, title: string | null, time: string | null, duration: number | null, status: string | null, instructor: string | null, timeSlot: string | null, room: string | null, notes: string | null, dayOfMonth: number | null };

export type StudentClassHistoryQuery_studentClassHistory_StudentClassHistory = { id: string | null, studentName: string | null, metrics: StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_metrics_StudentHistoryMetrics | null, sessions: Array<StudentClassHistoryQuery_studentClassHistory_StudentClassHistory_sessions_StudentHistorySession> | null };

export type StudentClassHistoryQuery_Query = { studentClassHistory: StudentClassHistoryQuery_studentClassHistory_StudentClassHistory | null };


export type StudentClassHistoryQueryVariables = Exact<{
  studentId: string | number;
  year: number;
  month: number;
}>;


export type StudentClassHistoryQuery = StudentClassHistoryQuery_Query;

export type StudentClassSessionDetailQuery_studentClassSessionDetail_StudentSessionDetail = { id: string | null, durationMinutes: number | null, executionState: string | null, outcome: string | null, remarks: string | null, zoomMeetingUrl: string | null, teacherName: string | null, scheduledStartAt: string | null, scheduledEndAt: string | null };

export type StudentClassSessionDetailQuery_Query = { studentClassSessionDetail: StudentClassSessionDetailQuery_studentClassSessionDetail_StudentSessionDetail | null };


export type StudentClassSessionDetailQueryVariables = Exact<{
  classInstanceId: string | number;
}>;


export type StudentClassSessionDetailQuery = StudentClassSessionDetailQuery_Query;

export type StudentsQuery_students_StudentsWithFiltersResponse_data_Student = { id: string, name: string };

export type StudentsQuery_students_StudentsWithFiltersResponse_pageInfo_PageInfo = { total: number };

export type StudentsQuery_students_StudentsWithFiltersResponse = { data: Array<StudentsQuery_students_StudentsWithFiltersResponse_data_Student>, pageInfo: StudentsQuery_students_StudentsWithFiltersResponse_pageInfo_PageInfo };

export type StudentsQuery_Query = { students: StudentsQuery_students_StudentsWithFiltersResponse };


export type StudentsQueryVariables = Exact<{
  paginationArgs: Types.PaginationArgs | null | undefined;
  orderBy: Array<Types.StudentsOrderByClause> | Types.StudentsOrderByClause | null | undefined;
  filterArgs: Types.StudentFilterArgs | null | undefined;
}>;


export type StudentsQuery = StudentsQuery_Query;

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics = { total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow = { id: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, durationMinutes: number | null, executionState: string | null, outcome: string | null, zoomMeetingUrl: string | null, yourTimeFormatted: string | null };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard_progressFeed_TeacherProgressFeedItem = { id: string | null, title: string | null, type: string | null };

export type TeacherDashboardQuery_teacherDashboard_TeacherDashboard = { id: string | null, metrics: TeacherDashboardQuery_teacherDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics | null, scheduleRows: Array<TeacherDashboardQuery_teacherDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow> | null, progressFeed: Array<TeacherDashboardQuery_teacherDashboard_TeacherDashboard_progressFeed_TeacherProgressFeedItem> | null };

export type TeacherDashboardQuery_Query = { teacherDashboard: TeacherDashboardQuery_teacherDashboard_TeacherDashboard | null };


export type TeacherDashboardQueryVariables = Exact<{
  date: string;
}>;


export type TeacherDashboardQuery = TeacherDashboardQuery_Query;

export type TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics = { total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow = { id: string | null, studentId: string | null, studentName: string | null, scheduledStartAt: string | null, durationMinutes: number | null, executionState: string | null, outcome: string | null, zoomMeetingUrl: string | null, yourTimeFormatted: string | null };

export type TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard_progressFeed_TeacherProgressFeedItem = { id: string | null, title: string | null, type: string | null };

export type TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard = { id: string | null, metrics: TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics | null, scheduleRows: Array<TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard_scheduleRows_TeacherDashboardScheduleRow> | null, progressFeed: Array<TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard_progressFeed_TeacherProgressFeedItem> | null };

export type TeacherActiveDashboardQuery_Query = { teacherActiveDashboard: TeacherActiveDashboardQuery_teacherActiveDashboard_TeacherDashboard | null };


export type TeacherActiveDashboardQueryVariables = Exact<{
  date: string;
}>;


export type TeacherActiveDashboardQuery = TeacherActiveDashboardQuery_Query;

export type CreateTeacherManualClassEntryMutation_createTeacherManualClassEntry_ClassInstanceDetail = { id: string | null, status: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null };

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

export type TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_classes_FutureClass = { id: string | null, courseName: string | null, scheduledDate: string | null, startTime: string | null, endTime: string | null, durationMinutes: number | null, isRescheduled: boolean | null, leaveRequestDisabled: boolean | null, leaveRequestDisabledReason: string | null, studentCount: number | null, location: string | null };

export type TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule = { id: string | null, leaveQuotaUsed: number | null, leaveQuotaTotal: number | null, totalClasses: number | null, classes: Array<TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule_classes_FutureClass> | null };

export type TeacherFutureScheduleQuery_Query = { teacherFutureSchedule: TeacherFutureScheduleQuery_teacherFutureSchedule_TeacherFutureSchedule | null };


export type TeacherFutureScheduleQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherFutureScheduleQuery = TeacherFutureScheduleQuery_Query;

export type TeacherHandbookUrlQuery_teacherHandbookUrl_TeacherHandbookUrl = { id: string | null, url: string | null };

export type TeacherHandbookUrlQuery_Query = { teacherHandbookUrl: TeacherHandbookUrlQuery_teacherHandbookUrl_TeacherHandbookUrl | null };


export type TeacherHandbookUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type TeacherHandbookUrlQuery = TeacherHandbookUrlQuery_Query;

export type TeachersQuery_teachers_TeacherSimple = { id: string | null, name: string | null };

export type TeachersQuery_Query = { teachers: Array<TeachersQuery_teachers_TeacherSimple> | null };


export type TeachersQueryVariables = Exact<{
  search: string;
  limit: number;
}>;


export type TeachersQuery = TeachersQuery_Query;

export type CreateTestEntitiesMutation_createTestEntities_TestEntities = { studentUserEmail: string | null, studentUserId: string | null, studentId: string | null, parentUserEmail: string | null, parentUserId: string | null, parentId: string | null, teacherUserEmail: string | null, teacherUserId: string | null, teacherId: string | null };

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

export type WelcomeMessageQuery_Query = { welcomeMessage: string | null };


export type WelcomeMessageQueryVariables = Exact<{ [key: string]: never; }>;


export type WelcomeMessageQuery = WelcomeMessageQuery_Query;

export type TranslatedMessageQuery_Query = { translatedMessage: string | null };


export type TranslatedMessageQueryVariables = Exact<{
  key: string;
  namespace: string;
}>;


export type TranslatedMessageQuery = TranslatedMessageQuery_Query;

export type TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass = { id: string | null, studentName: string | null, studentId: string | null, duration: number | null, startTime: string | null, day: string | null, executionState: string | null, outcome: string | null };

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
