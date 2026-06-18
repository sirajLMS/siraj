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
    "\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n": typeof types.ClassInstanceDocument,
    "\n  query classStatusEvents($classInstanceId: ID!) {\n    classStatusEvents(classInstanceId: $classInstanceId) {\n      id\n      eventType\n      description\n      createdAt\n    }\n  }\n": typeof types.ClassStatusEventsDocument,
    "\n  mutation activateClass($classInstanceId: ID!) {\n    activateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": typeof types.ActivateClassDocument,
    "\n  mutation forceActivateClass($classInstanceId: ID!) {\n    forceActivateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": typeof types.ForceActivateClassDocument,
    "\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.StopClassDocument,
    "\n  mutation startClass($classInstanceId: ID!) {\n    startClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.StartClassDocument,
    "\n  mutation markClassAbsent($classInstanceId: ID!) {\n    markClassAbsent(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.MarkClassAbsentDocument,
    "\n  mutation requestClassLeave($classInstanceId: ID!, $reason: String) {\n    requestClassLeave(classInstanceId: $classInstanceId, reason: $reason) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.RequestClassLeaveDocument,
    "\n  mutation adminExcuseClassLeave($classInstanceId: ID!) {\n    adminExcuseClassLeave(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.AdminExcuseClassLeaveDocument,
    "\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": typeof types.RescheduleClassDocument,
    "\n  mutation revertClass($classInstanceId: ID!) {\n    revertClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": typeof types.RevertClassDocument,
    "\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n": typeof types.DeleteClassInstanceDocument,
    "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n": typeof types.DailyScheduleMetricsDocument,
    "\n  query dailyScheduleList($date: String!, $teacherId: String, $search: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {\n      id\n      yourTime\n      teacherTime\n      studentTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n": typeof types.DailyScheduleListDocument,
    "\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n": typeof types.StudentClassHistoryDocument,
    "\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n": typeof types.StudentClassSessionDetailDocument,
    "\n  query teacherDashboard($date: String!) {\n    teacherDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": typeof types.TeacherDashboardDocument,
    "\n  query teacherActiveDashboard($date: String!) {\n    teacherActiveDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": typeof types.TeacherActiveDashboardDocument,
    "\n  mutation createTeacherManualClassEntry($input: CreateManualClassEntryInput!) {\n    createTeacherManualClassEntry(input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": typeof types.CreateTeacherManualClassEntryDocument,
    "\n  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {\n    logTeacherSupportRequest(input: $input) {\n      id\n      success\n    }\n  }\n": typeof types.LogTeacherSupportRequestDocument,
    "\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n": typeof types.TeacherHandbookUrlDocument,
    "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n": typeof types.TeachersDocument,
    "\n  query welcomeMessage {\n    welcomeMessage\n  }\n": typeof types.WelcomeMessageDocument,
    "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n": typeof types.TranslatedMessageDocument,
};
const documents: Documents = {
    "\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.MeDocument,
    "\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.UserDocument,
    "\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.UsersDocument,
    "\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.DemoLoginDocument,
    "\n  mutation logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.RefreshTokenDocument,
    "\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n": types.ClassInstanceDocument,
    "\n  query classStatusEvents($classInstanceId: ID!) {\n    classStatusEvents(classInstanceId: $classInstanceId) {\n      id\n      eventType\n      description\n      createdAt\n    }\n  }\n": types.ClassStatusEventsDocument,
    "\n  mutation activateClass($classInstanceId: ID!) {\n    activateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": types.ActivateClassDocument,
    "\n  mutation forceActivateClass($classInstanceId: ID!) {\n    forceActivateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n": types.ForceActivateClassDocument,
    "\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.StopClassDocument,
    "\n  mutation startClass($classInstanceId: ID!) {\n    startClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.StartClassDocument,
    "\n  mutation markClassAbsent($classInstanceId: ID!) {\n    markClassAbsent(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.MarkClassAbsentDocument,
    "\n  mutation requestClassLeave($classInstanceId: ID!, $reason: String) {\n    requestClassLeave(classInstanceId: $classInstanceId, reason: $reason) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.RequestClassLeaveDocument,
    "\n  mutation adminExcuseClassLeave($classInstanceId: ID!) {\n    adminExcuseClassLeave(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.AdminExcuseClassLeaveDocument,
    "\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": types.RescheduleClassDocument,
    "\n  mutation revertClass($classInstanceId: ID!) {\n    revertClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n": types.RevertClassDocument,
    "\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n": types.DeleteClassInstanceDocument,
    "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n": types.DailyScheduleMetricsDocument,
    "\n  query dailyScheduleList($date: String!, $teacherId: String, $search: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {\n      id\n      yourTime\n      teacherTime\n      studentTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n": types.DailyScheduleListDocument,
    "\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n": types.StudentClassHistoryDocument,
    "\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n": types.StudentClassSessionDetailDocument,
    "\n  query teacherDashboard($date: String!) {\n    teacherDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": types.TeacherDashboardDocument,
    "\n  query teacherActiveDashboard($date: String!) {\n    teacherActiveDashboard(date: $date) {\n      id\n      metrics {\n        total\n        regular\n        trial\n        advance\n        rescheduled\n        suspended\n        taken\n        pending\n        activated\n        running\n        absent\n        leave\n      }\n      scheduleRows {\n        id\n        studentId\n        studentName\n        scheduledStartAt\n        durationMinutes\n        executionState\n        outcome\n        zoomMeetingUrl\n        yourTimeFormatted\n      }\n      progressFeed {\n        id\n        title\n        type\n      }\n    }\n  }\n": types.TeacherActiveDashboardDocument,
    "\n  mutation createTeacherManualClassEntry($input: CreateManualClassEntryInput!) {\n    createTeacherManualClassEntry(input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n": types.CreateTeacherManualClassEntryDocument,
    "\n  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {\n    logTeacherSupportRequest(input: $input) {\n      id\n      success\n    }\n  }\n": types.LogTeacherSupportRequestDocument,
    "\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n": types.TeacherHandbookUrlDocument,
    "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n": types.TeachersDocument,
    "\n  query welcomeMessage {\n    welcomeMessage\n  }\n": types.WelcomeMessageDocument,
    "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n": types.TranslatedMessageDocument,
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
export function graphql(source: "\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n"): (typeof documents)["\n  query classInstance($id: ID!) {\n    classInstance(id: $id) {\n      id\n      courseName\n      instanceId\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n      status\n      remarks\n      hasTimezoneMismatch\n      studentTimezone\n      zoomMeetingUrl\n      student {\n        id\n        name\n        grade\n        level\n        avatarUrl\n      }\n      teacher {\n        id\n        name\n        title\n        avatarUrl\n      }\n      performance {\n        engagementScore\n        assessmentProgress\n        assessmentTotal\n        focusLevel\n        sessionHealth\n        heatmapData\n        latencyMs\n        attendanceRate\n        avgGrade\n        lastClassDaysAgo\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation forceActivateClass($classInstanceId: ID!) {\n    forceActivateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n"): (typeof documents)["\n  mutation forceActivateClass($classInstanceId: ID!) {\n    forceActivateClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n      zoomMeetingUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation stopClass($classInstanceId: ID!) {\n    stopClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation startClass($classInstanceId: ID!) {\n    startClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation startClass($classInstanceId: ID!) {\n    startClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation markClassAbsent($classInstanceId: ID!) {\n    markClassAbsent(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation markClassAbsent($classInstanceId: ID!) {\n    markClassAbsent(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation requestClassLeave($classInstanceId: ID!, $reason: String) {\n    requestClassLeave(classInstanceId: $classInstanceId, reason: $reason) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation requestClassLeave($classInstanceId: ID!, $reason: String) {\n    requestClassLeave(classInstanceId: $classInstanceId, reason: $reason) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation adminExcuseClassLeave($classInstanceId: ID!) {\n    adminExcuseClassLeave(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation adminExcuseClassLeave($classInstanceId: ID!) {\n    adminExcuseClassLeave(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n"): (typeof documents)["\n  mutation rescheduleClass($classInstanceId: ID!, $input: RescheduleClassInput!) {\n    rescheduleClass(classInstanceId: $classInstanceId, input: $input) {\n      id\n      status\n      scheduledDate\n      startTime\n      endTime\n      durationMinutes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation revertClass($classInstanceId: ID!) {\n    revertClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"): (typeof documents)["\n  mutation revertClass($classInstanceId: ID!) {\n    revertClass(classInstanceId: $classInstanceId) {\n      id\n      status\n      durationMinutes\n      remarks\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n"): (typeof documents)["\n  mutation deleteClassInstance($classInstanceId: ID!) {\n    deleteClassInstance(classInstanceId: $classInstanceId)\n  }\n"];
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
export function graphql(source: "\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n"): (typeof documents)["\n  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {\n    studentClassHistory(studentId: $studentId, year: $year, month: $month) {\n      id\n      studentName\n      metrics {\n        totalClasses\n        attendanceRate\n        hoursStudied\n        performance\n      }\n      sessions {\n        id\n        title\n        time\n        duration\n        status\n        instructor\n        timeSlot\n        room\n        notes\n        dayOfMonth\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n"): (typeof documents)["\n  query studentClassSessionDetail($classInstanceId: ID!) {\n    studentClassSessionDetail(classInstanceId: $classInstanceId) {\n      id\n      durationMinutes\n      executionState\n      outcome\n      remarks\n      zoomMeetingUrl\n      teacherName\n      scheduledStartAt\n      scheduledEndAt\n    }\n  }\n"];
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
export function graphql(source: "\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n"): (typeof documents)["\n  query teacherHandbookUrl {\n    teacherHandbookUrl {\n      id\n      url\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query welcomeMessage {\n    welcomeMessage\n  }\n"): (typeof documents)["\n  query welcomeMessage {\n    welcomeMessage\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n"): (typeof documents)["\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;