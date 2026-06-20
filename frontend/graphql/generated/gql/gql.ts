/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": typeof types.MeDocument,
    "\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": typeof types.UserDocument,
    "\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": typeof types.UsersDocument,
    "\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": typeof types.DemoLoginDocument,
    "\n  mutation logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": typeof types.RefreshTokenDocument,
    "\n  query searchTeacherAvailability($input: AvailabilitySearchInput!) {\n    searchTeacherAvailability(input: $input) {\n      id\n      totalGaps\n      teachers {\n        id\n        name\n        gender\n        timezone\n        gaps {\n          id\n          teacherId\n          teacherName\n          teacherGender\n          dayOfWeek\n          gapStartTime\n          gapEndTime\n          timezone\n        }\n      }\n    }\n  }\n": typeof types.SearchTeacherAvailabilityDocument,
    "\n  query unpaidInvoicesAlert {\n    unpaidInvoicesAlert {\n      id\n      totalOverdueInvoices\n      totalOverdueAmount\n      items {\n        id\n        userId\n        userName\n        userEmail\n        totalUnpaidAmount\n        currency\n        overdueCount\n        oldestDueDate\n      }\n    }\n  }\n": typeof types.UnpaidInvoicesAlertDocument,
    "\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      payrollCredited\n      isRescheduled\n      executionState\n      outcome\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n": typeof types.ClassInstanceDocument,
    "\n  query classStatusEvents($classInstanceId: ID!) {\n    classStatusEvents(classInstanceId: $classInstanceId) {\n      id\n      eventType\n      description\n      createdAt\n    }\n  }\n": typeof types.ClassStatusEventsDocument,
    "\n  mutation activateClass($classInstanceId: ID!) {\n    activateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": typeof types.ActivateClassDocument,
    "\n  mutation activateOverrideClass($classInstanceId: ID!) {\n    activateOverrideClass(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": typeof types.ActivateOverrideClassDocument,
    "\n  mutation resetClass($classInstanceId: ID!) {\n    resetClass(classInstanceId: $classInstanceId)\n  }\n": typeof types.ResetClassDocument,
    "\n  mutation updateSessionStatusStart($classInstanceId: ID!) {\n    updateSessionStatusStart(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.UpdateSessionStatusStartDocument,
    "\n  mutation updateSessionStatusAbsent($classInstanceId: ID!) {\n    updateSessionStatusAbsent(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      outcome\n      payrollCredited\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.UpdateSessionStatusAbsentDocument,
    "\n  mutation updateSessionStatusLeave($classInstanceId: ID!, $leaveReason: String!) {\n    updateSessionStatusLeave(classInstanceId: $classInstanceId, leaveReason: $leaveReason) {\n      completedInstanceId\n      rescheduledInstanceId\n      completedInstance {\n        id\n        outcome\n        isRescheduled\n      }\n      rescheduledInstance {\n        id\n        scheduledDate\n        startTime\n        endTime\n      }\n    }\n  }\n": typeof types.UpdateSessionStatusLeaveDocument,
    "\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.StopClassDocument,
    "\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": typeof types.RescheduleClassDocument,
    "\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n": typeof types.DeleteClassInstanceDocument,
    "\n  query notificationAlerts {\n    notificationAlerts {\n      id\n      totalCount\n      unreadCount\n      alerts {\n        id\n        type\n        title\n        body\n        createdAt\n        severity\n      }\n    }\n  }\n": typeof types.NotificationAlertsDocument,
    "\n  fragment PermissionFields on Permission {\n    id\n    key\n    resource\n    action\n    description\n    category\n    isSystem\n  }\n": typeof types.PermissionFieldsFragmentDoc,
    "\n  fragment PermissionGroupFields on PermissionGroup {\n    id\n    name\n    slug\n    description\n    isSystem\n    createdAt\n    updatedAt\n    permissionIds\n    assignedUsers {\n      id\n      name\n      email\n    }\n  }\n": typeof types.PermissionGroupFieldsFragmentDoc,
    "\n  fragment UserOverrideFields on UserOverride {\n    permissionId\n    state\n    assignedBy\n  }\n": typeof types.UserOverrideFieldsFragmentDoc,
    "\n  \n  query permissions {\n    permissions {\n      ...PermissionFields\n    }\n  }\n": typeof types.PermissionsDocument,
    "\n  \n  query permissionGroups {\n    permissionGroups {\n      ...PermissionGroupFields\n    }\n  }\n": typeof types.PermissionGroupsDocument,
    "\n  \n  query permissionGroup($id: String!) {\n    permissionGroup(id: $id) {\n      ...PermissionGroupFields\n    }\n  }\n": typeof types.PermissionGroupDocument,
    "\n  query userPermissionGroups($userId: String!) {\n    userPermissionGroups(userId: $userId)\n  }\n": typeof types.UserPermissionGroupsDocument,
    "\n  \n  query userOverrides($userId: String!) {\n    userOverrides(userId: $userId) {\n      ...UserOverrideFields\n    }\n  }\n": typeof types.UserOverridesDocument,
    "\n  query effectiveUserPermissions($userId: String!) {\n    effectiveUserPermissions(userId: $userId)\n  }\n": typeof types.EffectiveUserPermissionsDocument,
    "\n  \n  mutation createPermissionGroup($input: CreatePermissionGroupInput!) {\n    createPermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n": typeof types.CreatePermissionGroupDocument,
    "\n  \n  mutation updatePermissionGroup($input: UpdatePermissionGroupInput!) {\n    updatePermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n": typeof types.UpdatePermissionGroupDocument,
    "\n  mutation deletePermissionGroup($groupId: String!) {\n    deletePermissionGroup(groupId: $groupId)\n  }\n": typeof types.DeletePermissionGroupDocument,
    "\n  mutation assignPermissionGroupToUser($input: AssignPermissionGroupToUserInput!) {\n    assignPermissionGroupToUser(input: $input)\n  }\n": typeof types.AssignPermissionGroupToUserDocument,
    "\n  mutation revokePermissionGroupFromUser($input: RevokePermissionGroupFromUserInput!) {\n    revokePermissionGroupFromUser(input: $input)\n  }\n": typeof types.RevokePermissionGroupFromUserDocument,
    "\n  mutation bulkAssignUsersToGroup($groupId: String!, $userIds: [String!]!) {\n    bulkAssignUsersToGroup(groupId: $groupId, userIds: $userIds)\n  }\n": typeof types.BulkAssignUsersToGroupDocument,
    "\n  mutation bulkRevokeUsersFromGroup($groupId: String!, $userIds: [String!]!) {\n    bulkRevokeUsersFromGroup(groupId: $groupId, userIds: $userIds)\n  }\n": typeof types.BulkRevokeUsersFromGroupDocument,
    "\n  mutation updateUserOverrides($userId: String!, $overrides: [UserOverrideInput!]!) {\n    updateUserOverrides(userId: $userId, overrides: $overrides)\n  }\n": typeof types.UpdateUserOverridesDocument,
    "\n  mutation createRecurringClass($input: CreateRecurringClassInput!) {\n    createRecurringClass(input: $input) {\n      id\n      recurringScheduleId\n      classInstanceIds\n      classInstanceCount\n    }\n  }\n": typeof types.CreateRecurringClassDocument,
    "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n": typeof types.DailyScheduleMetricsDocument,
    "\n  query dailyScheduleList($date: String!, $teacherId: String, $search: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {\n      id\n      yourTime\n      teacherTime\n      studentTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n": typeof types.DailyScheduleListDocument,
    "\n  query rescheduleTrackingRows($input: RescheduleTrackingInput!) {\n    rescheduleTrackingRows(input: $input) {\n      id\n      originalClassId\n      teacherId\n      teacherName\n      teacherAvatarUrl\n      studentId\n      studentName\n      scheduledStartAt\n      scheduledEndAt\n      status\n      dateLabel\n      remarks\n    }\n  }\n": typeof types.RescheduleTrackingRowsDocument,
    "\n  query rescheduleTrackingMetrics {\n    rescheduleTrackingMetrics {\n      id\n      pending\n      approved\n      leave\n      rescheduled\n      cancelled\n    }\n  }\n": typeof types.RescheduleTrackingMetricsDocument,
    "\n  query teacherDirectory($search: String, $limit: Int, $offset: Int) {\n    teacherDirectory(search: $search, limit: $limit, offset: $offset) {\n      id\n      metrics {\n        id\n        activated\n        deactivated\n      }\n      rows {\n        id\n        index\n        name\n        email\n        avatarUrl\n        status\n        zoomLink\n      }\n      totalTeachers\n    }\n  }\n": typeof types.TeacherDirectoryDocument,
    "\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n": typeof types.StudentClassHistoryDocument,
    "\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n": typeof types.StudentClassSessionDetailDocument,
    "\n  query students(\n    $paginationArgs: PaginationArgs\n    $orderBy: [StudentsOrderByClause!]\n    $filterArgs: StudentFilterArgs\n  ) {\n    students(\n      paginationArgs: $paginationArgs\n      orderBy: $orderBy\n      filterArgs: $filterArgs\n    ) {\n      data {\n        id\n        name\n      }\n      pageInfo {\n        total\n      }\n    }\n  }\n": typeof types.StudentsDocument,
    "\n  query teacherDashboard($date: String!) {\n    teacherDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": typeof types.TeacherDashboardDocument,
    "\n  query teacherActiveDashboard($date: String!) {\n    teacherActiveDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": typeof types.TeacherActiveDashboardDocument,
    "\n  mutation createTeacherManualClassEntry($input: CreateManualClassEntryInput!) {\n    createTeacherManualClassEntry(input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": typeof types.CreateTeacherManualClassEntryDocument,
    "\n  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {\n    logTeacherSupportRequest(input: $input) {\n      id\n      success\n    }\n  }\n": typeof types.LogTeacherSupportRequestDocument,
    "\n  query teacherFutureSchedule {\n    teacherFutureSchedule {\n      id\n      leaveQuotaUsed\n      leaveQuotaTotal\n      totalClasses\n      classes {\n        id\n        courseName\n        scheduledDate\n        startTime\n        endTime\n        durationMinutes\n        isRescheduled\n        leaveRequestDisabled\n        leaveRequestDisabledReason\n        studentCount\n        location\n      }\n    }\n  }\n": typeof types.TeacherFutureScheduleDocument,
    "\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n": typeof types.TeacherHandbookUrlDocument,
    "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n": typeof types.TeachersDocument,
    "\n  mutation createTestEntities($prefix: String!, $classesRemaining: Int) {\n    createTestEntities(prefix: $prefix, classesRemaining: $classesRemaining) {\n      studentUserEmail\n      studentUserId\n      studentId\n      parentUserEmail\n      parentUserId\n      parentId\n      teacherUserEmail\n      teacherUserId\n      teacherId\n    }\n  }\n": typeof types.CreateTestEntitiesDocument,
    "\n  mutation cleanupTestEntities(\n    $studentUserId: String!\n    $teacherUserId: String!\n    $parentUserId: String!\n    $studentId: String!\n    $teacherId: String!\n    $parentId: String!\n  ) {\n    cleanupTestEntities(\n      studentUserId: $studentUserId\n      teacherUserId: $teacherUserId\n      parentUserId: $parentUserId\n      studentId: $studentId\n      teacherId: $teacherId\n      parentId: $parentId\n    )\n  }\n": typeof types.CleanupTestEntitiesDocument,
    "\n  query welcomeMessage {\n    welcomeMessage\n  }\n": typeof types.WelcomeMessageDocument,
    "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n": typeof types.TranslatedMessageDocument,
    "\n  query teacherWeeklyScheduleGrid($teacherId: String, $weekDate: String!) {\n    teacherWeeklyScheduleGrid(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      teacherId\n      weekStart\n      weekEnd\n      classes {\n        id\n        studentName\n        studentId\n        duration\n        startTime\n        day\n        executionState\n        outcome\n      }\n    }\n  }\n": typeof types.TeacherWeeklyScheduleGridDocument,
    "\n  query teacherWorkloadMetrics($teacherId: String, $weekDate: String!) {\n    teacherWorkloadMetrics(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      weeklyHoursWorked\n      totalMinutes\n      classCount\n    }\n  }\n": typeof types.TeacherWorkloadMetricsDocument,
};
const documents: Documents = {
    "\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.MeDocument,
    "\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.UserDocument,
    "\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.UsersDocument,
    "\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.DemoLoginDocument,
    "\n  mutation logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.RefreshTokenDocument,
    "\n  query searchTeacherAvailability($input: AvailabilitySearchInput!) {\n    searchTeacherAvailability(input: $input) {\n      id\n      totalGaps\n      teachers {\n        id\n        name\n        gender\n        timezone\n        gaps {\n          id\n          teacherId\n          teacherName\n          teacherGender\n          dayOfWeek\n          gapStartTime\n          gapEndTime\n          timezone\n        }\n      }\n    }\n  }\n": types.SearchTeacherAvailabilityDocument,
    "\n  query unpaidInvoicesAlert {\n    unpaidInvoicesAlert {\n      id\n      totalOverdueInvoices\n      totalOverdueAmount\n      items {\n        id\n        userId\n        userName\n        userEmail\n        totalUnpaidAmount\n        currency\n        overdueCount\n        oldestDueDate\n      }\n    }\n  }\n": types.UnpaidInvoicesAlertDocument,
    "\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      payrollCredited\n      isRescheduled\n      executionState\n      outcome\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n": types.ClassInstanceDocument,
    "\n  query classStatusEvents($classInstanceId: ID!) {\n    classStatusEvents(classInstanceId: $classInstanceId) {\n      id\n      eventType\n      description\n      createdAt\n    }\n  }\n": types.ClassStatusEventsDocument,
    "\n  mutation activateClass($classInstanceId: ID!) {\n    activateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": types.ActivateClassDocument,
    "\n  mutation activateOverrideClass($classInstanceId: ID!) {\n    activateOverrideClass(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": types.ActivateOverrideClassDocument,
    "\n  mutation resetClass($classInstanceId: ID!) {\n    resetClass(classInstanceId: $classInstanceId)\n  }\n": types.ResetClassDocument,
    "\n  mutation updateSessionStatusStart($classInstanceId: ID!) {\n    updateSessionStatusStart(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.UpdateSessionStatusStartDocument,
    "\n  mutation updateSessionStatusAbsent($classInstanceId: ID!) {\n    updateSessionStatusAbsent(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      outcome\n      payrollCredited\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.UpdateSessionStatusAbsentDocument,
    "\n  mutation updateSessionStatusLeave($classInstanceId: ID!, $leaveReason: String!) {\n    updateSessionStatusLeave(classInstanceId: $classInstanceId, leaveReason: $leaveReason) {\n      completedInstanceId\n      rescheduledInstanceId\n      completedInstance {\n        id\n        outcome\n        isRescheduled\n      }\n      rescheduledInstance {\n        id\n        scheduledDate\n        startTime\n        endTime\n      }\n    }\n  }\n": types.UpdateSessionStatusLeaveDocument,
    "\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.StopClassDocument,
    "\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": types.RescheduleClassDocument,
    "\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n": types.DeleteClassInstanceDocument,
    "\n  query notificationAlerts {\n    notificationAlerts {\n      id\n      totalCount\n      unreadCount\n      alerts {\n        id\n        type\n        title\n        body\n        createdAt\n        severity\n      }\n    }\n  }\n": types.NotificationAlertsDocument,
    "\n  fragment PermissionFields on Permission {\n    id\n    key\n    resource\n    action\n    description\n    category\n    isSystem\n  }\n": types.PermissionFieldsFragmentDoc,
    "\n  fragment PermissionGroupFields on PermissionGroup {\n    id\n    name\n    slug\n    description\n    isSystem\n    createdAt\n    updatedAt\n    permissionIds\n    assignedUsers {\n      id\n      name\n      email\n    }\n  }\n": types.PermissionGroupFieldsFragmentDoc,
    "\n  fragment UserOverrideFields on UserOverride {\n    permissionId\n    state\n    assignedBy\n  }\n": types.UserOverrideFieldsFragmentDoc,
    "\n  \n  query permissions {\n    permissions {\n      ...PermissionFields\n    }\n  }\n": types.PermissionsDocument,
    "\n  \n  query permissionGroups {\n    permissionGroups {\n      ...PermissionGroupFields\n    }\n  }\n": types.PermissionGroupsDocument,
    "\n  \n  query permissionGroup($id: String!) {\n    permissionGroup(id: $id) {\n      ...PermissionGroupFields\n    }\n  }\n": types.PermissionGroupDocument,
    "\n  query userPermissionGroups($userId: String!) {\n    userPermissionGroups(userId: $userId)\n  }\n": types.UserPermissionGroupsDocument,
    "\n  \n  query userOverrides($userId: String!) {\n    userOverrides(userId: $userId) {\n      ...UserOverrideFields\n    }\n  }\n": types.UserOverridesDocument,
    "\n  query effectiveUserPermissions($userId: String!) {\n    effectiveUserPermissions(userId: $userId)\n  }\n": types.EffectiveUserPermissionsDocument,
    "\n  \n  mutation createPermissionGroup($input: CreatePermissionGroupInput!) {\n    createPermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n": types.CreatePermissionGroupDocument,
    "\n  \n  mutation updatePermissionGroup($input: UpdatePermissionGroupInput!) {\n    updatePermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n": types.UpdatePermissionGroupDocument,
    "\n  mutation deletePermissionGroup($groupId: String!) {\n    deletePermissionGroup(groupId: $groupId)\n  }\n": types.DeletePermissionGroupDocument,
    "\n  mutation assignPermissionGroupToUser($input: AssignPermissionGroupToUserInput!) {\n    assignPermissionGroupToUser(input: $input)\n  }\n": types.AssignPermissionGroupToUserDocument,
    "\n  mutation revokePermissionGroupFromUser($input: RevokePermissionGroupFromUserInput!) {\n    revokePermissionGroupFromUser(input: $input)\n  }\n": types.RevokePermissionGroupFromUserDocument,
    "\n  mutation bulkAssignUsersToGroup($groupId: String!, $userIds: [String!]!) {\n    bulkAssignUsersToGroup(groupId: $groupId, userIds: $userIds)\n  }\n": types.BulkAssignUsersToGroupDocument,
    "\n  mutation bulkRevokeUsersFromGroup($groupId: String!, $userIds: [String!]!) {\n    bulkRevokeUsersFromGroup(groupId: $groupId, userIds: $userIds)\n  }\n": types.BulkRevokeUsersFromGroupDocument,
    "\n  mutation updateUserOverrides($userId: String!, $overrides: [UserOverrideInput!]!) {\n    updateUserOverrides(userId: $userId, overrides: $overrides)\n  }\n": types.UpdateUserOverridesDocument,
    "\n  mutation createRecurringClass($input: CreateRecurringClassInput!) {\n    createRecurringClass(input: $input) {\n      id\n      recurringScheduleId\n      classInstanceIds\n      classInstanceCount\n    }\n  }\n": types.CreateRecurringClassDocument,
    "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n": types.DailyScheduleMetricsDocument,
    "\n  query dailyScheduleList($date: String!, $teacherId: String, $search: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {\n      id\n      yourTime\n      teacherTime\n      studentTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n": types.DailyScheduleListDocument,
    "\n  query rescheduleTrackingRows($input: RescheduleTrackingInput!) {\n    rescheduleTrackingRows(input: $input) {\n      id\n      originalClassId\n      teacherId\n      teacherName\n      teacherAvatarUrl\n      studentId\n      studentName\n      scheduledStartAt\n      scheduledEndAt\n      status\n      dateLabel\n      remarks\n    }\n  }\n": types.RescheduleTrackingRowsDocument,
    "\n  query rescheduleTrackingMetrics {\n    rescheduleTrackingMetrics {\n      id\n      pending\n      approved\n      leave\n      rescheduled\n      cancelled\n    }\n  }\n": types.RescheduleTrackingMetricsDocument,
    "\n  query teacherDirectory($search: String, $limit: Int, $offset: Int) {\n    teacherDirectory(search: $search, limit: $limit, offset: $offset) {\n      id\n      metrics {\n        id\n        activated\n        deactivated\n      }\n      rows {\n        id\n        index\n        name\n        email\n        avatarUrl\n        status\n        zoomLink\n      }\n      totalTeachers\n    }\n  }\n": types.TeacherDirectoryDocument,
    "\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n": types.StudentClassHistoryDocument,
    "\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n": types.StudentClassSessionDetailDocument,
    "\n  query students(\n    $paginationArgs: PaginationArgs\n    $orderBy: [StudentsOrderByClause!]\n    $filterArgs: StudentFilterArgs\n  ) {\n    students(\n      paginationArgs: $paginationArgs\n      orderBy: $orderBy\n      filterArgs: $filterArgs\n    ) {\n      data {\n        id\n        name\n      }\n      pageInfo {\n        total\n      }\n    }\n  }\n": types.StudentsDocument,
    "\n  query teacherDashboard($date: String!) {\n    teacherDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": types.TeacherDashboardDocument,
    "\n  query teacherActiveDashboard($date: String!) {\n    teacherActiveDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": types.TeacherActiveDashboardDocument,
    "\n  mutation createTeacherManualClassEntry($input: CreateManualClassEntryInput!) {\n    createTeacherManualClassEntry(input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": types.CreateTeacherManualClassEntryDocument,
    "\n  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {\n    logTeacherSupportRequest(input: $input) {\n      id\n      success\n    }\n  }\n": types.LogTeacherSupportRequestDocument,
    "\n  query teacherFutureSchedule {\n    teacherFutureSchedule {\n      id\n      leaveQuotaUsed\n      leaveQuotaTotal\n      totalClasses\n      classes {\n        id\n        courseName\n        scheduledDate\n        startTime\n        endTime\n        durationMinutes\n        isRescheduled\n        leaveRequestDisabled\n        leaveRequestDisabledReason\n        studentCount\n        location\n      }\n    }\n  }\n": types.TeacherFutureScheduleDocument,
    "\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n": types.TeacherHandbookUrlDocument,
    "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n": types.TeachersDocument,
    "\n  mutation createTestEntities($prefix: String!, $classesRemaining: Int) {\n    createTestEntities(prefix: $prefix, classesRemaining: $classesRemaining) {\n      studentUserEmail\n      studentUserId\n      studentId\n      parentUserEmail\n      parentUserId\n      parentId\n      teacherUserEmail\n      teacherUserId\n      teacherId\n    }\n  }\n": types.CreateTestEntitiesDocument,
    "\n  mutation cleanupTestEntities(\n    $studentUserId: String!\n    $teacherUserId: String!\n    $parentUserId: String!\n    $studentId: String!\n    $teacherId: String!\n    $parentId: String!\n  ) {\n    cleanupTestEntities(\n      studentUserId: $studentUserId\n      teacherUserId: $teacherUserId\n      parentUserId: $parentUserId\n      studentId: $studentId\n      teacherId: $teacherId\n      parentId: $parentId\n    )\n  }\n": types.CleanupTestEntitiesDocument,
    "\n  query welcomeMessage {\n    welcomeMessage\n  }\n": types.WelcomeMessageDocument,
    "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n": types.TranslatedMessageDocument,
    "\n  query teacherWeeklyScheduleGrid($teacherId: String, $weekDate: String!) {\n    teacherWeeklyScheduleGrid(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      teacherId\n      weekStart\n      weekEnd\n      classes {\n        id\n        studentName\n        studentId\n        duration\n        startTime\n        day\n        executionState\n        outcome\n      }\n    }\n  }\n": types.TeacherWeeklyScheduleGridDocument,
    "\n  query teacherWorkloadMetrics($teacherId: String, $weekDate: String!) {\n    teacherWorkloadMetrics(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      weeklyHoursWorked\n      totalMinutes\n      classCount\n    }\n  }\n": types.TeacherWorkloadMetricsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"): (typeof documents)["\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"): (typeof documents)["\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"): (typeof documents)["\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation logout {\n    logout\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query searchTeacherAvailability($input: AvailabilitySearchInput!) {\n    searchTeacherAvailability(input: $input) {\n      id\n      totalGaps\n      teachers {\n        id\n        name\n        gender\n        timezone\n        gaps {\n          id\n          teacherId\n          teacherName\n          teacherGender\n          dayOfWeek\n          gapStartTime\n          gapEndTime\n          timezone\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query searchTeacherAvailability($input: AvailabilitySearchInput!) {\n    searchTeacherAvailability(input: $input) {\n      id\n      totalGaps\n      teachers {\n        id\n        name\n        gender\n        timezone\n        gaps {\n          id\n          teacherId\n          teacherName\n          teacherGender\n          dayOfWeek\n          gapStartTime\n          gapEndTime\n          timezone\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query unpaidInvoicesAlert {\n    unpaidInvoicesAlert {\n      id\n      totalOverdueInvoices\n      totalOverdueAmount\n      items {\n        id\n        userId\n        userName\n        userEmail\n        totalUnpaidAmount\n        currency\n        overdueCount\n        oldestDueDate\n      }\n    }\n  }\n"): (typeof documents)["\n  query unpaidInvoicesAlert {\n    unpaidInvoicesAlert {\n      id\n      totalOverdueInvoices\n      totalOverdueAmount\n      items {\n        id\n        userId\n        userName\n        userEmail\n        totalUnpaidAmount\n        currency\n        overdueCount\n        oldestDueDate\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      payrollCredited\n      isRescheduled\n      executionState\n      outcome\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n"): (typeof documents)["\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      payrollCredited\n      isRescheduled\n      executionState\n      outcome\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query classStatusEvents($classInstanceId: ID!) {\n    classStatusEvents(classInstanceId: $classInstanceId) {\n      id\n      eventType\n      description\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query classStatusEvents($classInstanceId: ID!) {\n    classStatusEvents(classInstanceId: $classInstanceId) {\n      id\n      eventType\n      description\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation activateClass($classInstanceId: ID!) {\n    activateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n"): (typeof documents)["\n  mutation activateClass($classInstanceId: ID!) {\n    activateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation activateOverrideClass($classInstanceId: ID!) {\n    activateOverrideClass(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n"): (typeof documents)["\n  mutation activateOverrideClass($classInstanceId: ID!) {\n    activateOverrideClass(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation resetClass($classInstanceId: ID!) {\n    resetClass(classInstanceId: $classInstanceId)\n  }\n"): (typeof documents)["\n  mutation resetClass($classInstanceId: ID!) {\n    resetClass(classInstanceId: $classInstanceId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation updateSessionStatusStart($classInstanceId: ID!) {\n    updateSessionStatusStart(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation updateSessionStatusStart($classInstanceId: ID!) {\n    updateSessionStatusStart(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation updateSessionStatusAbsent($classInstanceId: ID!) {\n    updateSessionStatusAbsent(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      outcome\n      payrollCredited\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation updateSessionStatusAbsent($classInstanceId: ID!) {\n    updateSessionStatusAbsent(classInstanceId: $classInstanceId) {\n      id\n      executionState\n      outcome\n      payrollCredited\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation updateSessionStatusLeave($classInstanceId: ID!, $leaveReason: String!) {\n    updateSessionStatusLeave(classInstanceId: $classInstanceId, leaveReason: $leaveReason) {\n      completedInstanceId\n      rescheduledInstanceId\n      completedInstance {\n        id\n        outcome\n        isRescheduled\n      }\n      rescheduledInstance {\n        id\n        scheduledDate\n        startTime\n        endTime\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation updateSessionStatusLeave($classInstanceId: ID!, $leaveReason: String!) {\n    updateSessionStatusLeave(classInstanceId: $classInstanceId, leaveReason: $leaveReason) {\n      completedInstanceId\n      rescheduledInstanceId\n      completedInstance {\n        id\n        outcome\n        isRescheduled\n      }\n      rescheduledInstance {\n        id\n        scheduledDate\n        startTime\n        endTime\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n"): (typeof documents)["\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n"): (typeof documents)["\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query notificationAlerts {\n    notificationAlerts {\n      id\n      totalCount\n      unreadCount\n      alerts {\n        id\n        type\n        title\n        body\n        createdAt\n        severity\n      }\n    }\n  }\n"): (typeof documents)["\n  query notificationAlerts {\n    notificationAlerts {\n      id\n      totalCount\n      unreadCount\n      alerts {\n        id\n        type\n        title\n        body\n        createdAt\n        severity\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PermissionFields on Permission {\n    id\n    key\n    resource\n    action\n    description\n    category\n    isSystem\n  }\n"): (typeof documents)["\n  fragment PermissionFields on Permission {\n    id\n    key\n    resource\n    action\n    description\n    category\n    isSystem\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PermissionGroupFields on PermissionGroup {\n    id\n    name\n    slug\n    description\n    isSystem\n    createdAt\n    updatedAt\n    permissionIds\n    assignedUsers {\n      id\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  fragment PermissionGroupFields on PermissionGroup {\n    id\n    name\n    slug\n    description\n    isSystem\n    createdAt\n    updatedAt\n    permissionIds\n    assignedUsers {\n      id\n      name\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserOverrideFields on UserOverride {\n    permissionId\n    state\n    assignedBy\n  }\n"): (typeof documents)["\n  fragment UserOverrideFields on UserOverride {\n    permissionId\n    state\n    assignedBy\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  \n  query permissions {\n    permissions {\n      ...PermissionFields\n    }\n  }\n"): (typeof documents)["\n  \n  query permissions {\n    permissions {\n      ...PermissionFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  \n  query permissionGroups {\n    permissionGroups {\n      ...PermissionGroupFields\n    }\n  }\n"): (typeof documents)["\n  \n  query permissionGroups {\n    permissionGroups {\n      ...PermissionGroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  \n  query permissionGroup($id: String!) {\n    permissionGroup(id: $id) {\n      ...PermissionGroupFields\n    }\n  }\n"): (typeof documents)["\n  \n  query permissionGroup($id: String!) {\n    permissionGroup(id: $id) {\n      ...PermissionGroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query userPermissionGroups($userId: String!) {\n    userPermissionGroups(userId: $userId)\n  }\n"): (typeof documents)["\n  query userPermissionGroups($userId: String!) {\n    userPermissionGroups(userId: $userId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  \n  query userOverrides($userId: String!) {\n    userOverrides(userId: $userId) {\n      ...UserOverrideFields\n    }\n  }\n"): (typeof documents)["\n  \n  query userOverrides($userId: String!) {\n    userOverrides(userId: $userId) {\n      ...UserOverrideFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query effectiveUserPermissions($userId: String!) {\n    effectiveUserPermissions(userId: $userId)\n  }\n"): (typeof documents)["\n  query effectiveUserPermissions($userId: String!) {\n    effectiveUserPermissions(userId: $userId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  \n  mutation createPermissionGroup($input: CreatePermissionGroupInput!) {\n    createPermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n"): (typeof documents)["\n  \n  mutation createPermissionGroup($input: CreatePermissionGroupInput!) {\n    createPermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  \n  mutation updatePermissionGroup($input: UpdatePermissionGroupInput!) {\n    updatePermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n"): (typeof documents)["\n  \n  mutation updatePermissionGroup($input: UpdatePermissionGroupInput!) {\n    updatePermissionGroup(input: $input) {\n      ...PermissionGroupFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation deletePermissionGroup($groupId: String!) {\n    deletePermissionGroup(groupId: $groupId)\n  }\n"): (typeof documents)["\n  mutation deletePermissionGroup($groupId: String!) {\n    deletePermissionGroup(groupId: $groupId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation assignPermissionGroupToUser($input: AssignPermissionGroupToUserInput!) {\n    assignPermissionGroupToUser(input: $input)\n  }\n"): (typeof documents)["\n  mutation assignPermissionGroupToUser($input: AssignPermissionGroupToUserInput!) {\n    assignPermissionGroupToUser(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation revokePermissionGroupFromUser($input: RevokePermissionGroupFromUserInput!) {\n    revokePermissionGroupFromUser(input: $input)\n  }\n"): (typeof documents)["\n  mutation revokePermissionGroupFromUser($input: RevokePermissionGroupFromUserInput!) {\n    revokePermissionGroupFromUser(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation bulkAssignUsersToGroup($groupId: String!, $userIds: [String!]!) {\n    bulkAssignUsersToGroup(groupId: $groupId, userIds: $userIds)\n  }\n"): (typeof documents)["\n  mutation bulkAssignUsersToGroup($groupId: String!, $userIds: [String!]!) {\n    bulkAssignUsersToGroup(groupId: $groupId, userIds: $userIds)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation bulkRevokeUsersFromGroup($groupId: String!, $userIds: [String!]!) {\n    bulkRevokeUsersFromGroup(groupId: $groupId, userIds: $userIds)\n  }\n"): (typeof documents)["\n  mutation bulkRevokeUsersFromGroup($groupId: String!, $userIds: [String!]!) {\n    bulkRevokeUsersFromGroup(groupId: $groupId, userIds: $userIds)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation updateUserOverrides($userId: String!, $overrides: [UserOverrideInput!]!) {\n    updateUserOverrides(userId: $userId, overrides: $overrides)\n  }\n"): (typeof documents)["\n  mutation updateUserOverrides($userId: String!, $overrides: [UserOverrideInput!]!) {\n    updateUserOverrides(userId: $userId, overrides: $overrides)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation createRecurringClass($input: CreateRecurringClassInput!) {\n    createRecurringClass(input: $input) {\n      id\n      recurringScheduleId\n      classInstanceIds\n      classInstanceCount\n    }\n  }\n"): (typeof documents)["\n  mutation createRecurringClass($input: CreateRecurringClassInput!) {\n    createRecurringClass(input: $input) {\n      id\n      recurringScheduleId\n      classInstanceIds\n      classInstanceCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n"): (typeof documents)["\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query dailyScheduleList($date: String!, $teacherId: String, $search: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {\n      id\n      yourTime\n      teacherTime\n      studentTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query dailyScheduleList($date: String!, $teacherId: String, $search: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {\n      id\n      yourTime\n      teacherTime\n      studentTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query rescheduleTrackingRows($input: RescheduleTrackingInput!) {\n    rescheduleTrackingRows(input: $input) {\n      id\n      originalClassId\n      teacherId\n      teacherName\n      teacherAvatarUrl\n      studentId\n      studentName\n      scheduledStartAt\n      scheduledEndAt\n      status\n      dateLabel\n      remarks\n    }\n  }\n"): (typeof documents)["\n  query rescheduleTrackingRows($input: RescheduleTrackingInput!) {\n    rescheduleTrackingRows(input: $input) {\n      id\n      originalClassId\n      teacherId\n      teacherName\n      teacherAvatarUrl\n      studentId\n      studentName\n      scheduledStartAt\n      scheduledEndAt\n      status\n      dateLabel\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query rescheduleTrackingMetrics {\n    rescheduleTrackingMetrics {\n      id\n      pending\n      approved\n      leave\n      rescheduled\n      cancelled\n    }\n  }\n"): (typeof documents)["\n  query rescheduleTrackingMetrics {\n    rescheduleTrackingMetrics {\n      id\n      pending\n      approved\n      leave\n      rescheduled\n      cancelled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teacherDirectory($search: String, $limit: Int, $offset: Int) {\n    teacherDirectory(search: $search, limit: $limit, offset: $offset) {\n      id\n      metrics {\n        id\n        activated\n        deactivated\n      }\n      rows {\n        id\n        index\n        name\n        email\n        avatarUrl\n        status\n        zoomLink\n      }\n      totalTeachers\n    }\n  }\n"): (typeof documents)["\n  query teacherDirectory($search: String, $limit: Int, $offset: Int) {\n    teacherDirectory(search: $search, limit: $limit, offset: $offset) {\n      id\n      metrics {\n        id\n        activated\n        deactivated\n      }\n      rows {\n        id\n        index\n        name\n        email\n        avatarUrl\n        status\n        zoomLink\n      }\n      totalTeachers\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n"): (typeof documents)["\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n"): (typeof documents)["\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query students(\n    $paginationArgs: PaginationArgs\n    $orderBy: [StudentsOrderByClause!]\n    $filterArgs: StudentFilterArgs\n  ) {\n    students(\n      paginationArgs: $paginationArgs\n      orderBy: $orderBy\n      filterArgs: $filterArgs\n    ) {\n      data {\n        id\n        name\n      }\n      pageInfo {\n        total\n      }\n    }\n  }\n"): (typeof documents)["\n  query students(\n    $paginationArgs: PaginationArgs\n    $orderBy: [StudentsOrderByClause!]\n    $filterArgs: StudentFilterArgs\n  ) {\n    students(\n      paginationArgs: $paginationArgs\n      orderBy: $orderBy\n      filterArgs: $filterArgs\n    ) {\n      data {\n        id\n        name\n      }\n      pageInfo {\n        total\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teacherDashboard($date: String!) {\n    teacherDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n"): (typeof documents)["\n  query teacherDashboard($date: String!) {\n    teacherDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teacherActiveDashboard($date: String!) {\n    teacherActiveDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n"): (typeof documents)["\n  query teacherActiveDashboard($date: String!) {\n    teacherActiveDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation createTeacherManualClassEntry($input: CreateManualClassEntryInput!) {\n    createTeacherManualClassEntry(input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n"): (typeof documents)["\n  mutation createTeacherManualClassEntry($input: CreateManualClassEntryInput!) {\n    createTeacherManualClassEntry(input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {\n    logTeacherSupportRequest(input: $input) {\n      id\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {\n    logTeacherSupportRequest(input: $input) {\n      id\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teacherFutureSchedule {\n    teacherFutureSchedule {\n      id\n      leaveQuotaUsed\n      leaveQuotaTotal\n      totalClasses\n      classes {\n        id\n        courseName\n        scheduledDate\n        startTime\n        endTime\n        durationMinutes\n        isRescheduled\n        leaveRequestDisabled\n        leaveRequestDisabledReason\n        studentCount\n        location\n      }\n    }\n  }\n"): (typeof documents)["\n  query teacherFutureSchedule {\n    teacherFutureSchedule {\n      id\n      leaveQuotaUsed\n      leaveQuotaTotal\n      totalClasses\n      classes {\n        id\n        courseName\n        scheduledDate\n        startTime\n        endTime\n        durationMinutes\n        isRescheduled\n        leaveRequestDisabled\n        leaveRequestDisabledReason\n        studentCount\n        location\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n"): (typeof documents)["\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation createTestEntities($prefix: String!, $classesRemaining: Int) {\n    createTestEntities(prefix: $prefix, classesRemaining: $classesRemaining) {\n      studentUserEmail\n      studentUserId\n      studentId\n      parentUserEmail\n      parentUserId\n      parentId\n      teacherUserEmail\n      teacherUserId\n      teacherId\n    }\n  }\n"): (typeof documents)["\n  mutation createTestEntities($prefix: String!, $classesRemaining: Int) {\n    createTestEntities(prefix: $prefix, classesRemaining: $classesRemaining) {\n      studentUserEmail\n      studentUserId\n      studentId\n      parentUserEmail\n      parentUserId\n      parentId\n      teacherUserEmail\n      teacherUserId\n      teacherId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation cleanupTestEntities(\n    $studentUserId: String!\n    $teacherUserId: String!\n    $parentUserId: String!\n    $studentId: String!\n    $teacherId: String!\n    $parentId: String!\n  ) {\n    cleanupTestEntities(\n      studentUserId: $studentUserId\n      teacherUserId: $teacherUserId\n      parentUserId: $parentUserId\n      studentId: $studentId\n      teacherId: $teacherId\n      parentId: $parentId\n    )\n  }\n"): (typeof documents)["\n  mutation cleanupTestEntities(\n    $studentUserId: String!\n    $teacherUserId: String!\n    $parentUserId: String!\n    $studentId: String!\n    $teacherId: String!\n    $parentId: String!\n  ) {\n    cleanupTestEntities(\n      studentUserId: $studentUserId\n      teacherUserId: $teacherUserId\n      parentUserId: $parentUserId\n      studentId: $studentId\n      teacherId: $teacherId\n      parentId: $parentId\n    )\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query welcomeMessage {\n    welcomeMessage\n  }\n"): (typeof documents)["\n  query welcomeMessage {\n    welcomeMessage\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n"): (typeof documents)["\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teacherWeeklyScheduleGrid($teacherId: String, $weekDate: String!) {\n    teacherWeeklyScheduleGrid(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      teacherId\n      weekStart\n      weekEnd\n      classes {\n        id\n        studentName\n        studentId\n        duration\n        startTime\n        day\n        executionState\n        outcome\n      }\n    }\n  }\n"): (typeof documents)["\n  query teacherWeeklyScheduleGrid($teacherId: String, $weekDate: String!) {\n    teacherWeeklyScheduleGrid(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      teacherId\n      weekStart\n      weekEnd\n      classes {\n        id\n        studentName\n        studentId\n        duration\n        startTime\n        day\n        executionState\n        outcome\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teacherWorkloadMetrics($teacherId: String, $weekDate: String!) {\n    teacherWorkloadMetrics(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      weeklyHoursWorked\n      totalMinutes\n      classCount\n    }\n  }\n"): (typeof documents)["\n  query teacherWorkloadMetrics($teacherId: String, $weekDate: String!) {\n    teacherWorkloadMetrics(teacherId: $teacherId, weekDate: $weekDate) {\n      id\n      weeklyHoursWorked\n      totalMinutes\n      classCount\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;