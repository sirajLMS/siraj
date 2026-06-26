import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const teacherDashboardQueryDocument: TypedDocumentNode<
  Operations.TeacherDashboardQuery,
  Types.QueryTeacherDashboardArgs
> = gql`
  query teacherDashboard($date: String!, $pagination: PaginationArgs) {
    teacherDashboard(date: $date, pagination: $pagination) {
      id
      metrics {
        total
        regular
        trial
        advance
        rescheduled
        suspended
        taken
        pending
        activated
        running
        absent
        leave
      }
      scheduleRows {
        id
        studentId
        studentName
        scheduledStartAt
        durationMinutes
        executionState
        outcome
        zoomMeetingUrl
        yourTimeFormatted
      }
      progressFeed {
        id
        title
        type
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        lastItem
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
`;

export const teacherActiveDashboardQueryDocument: TypedDocumentNode<
  Operations.TeacherActiveDashboardQuery,
  Types.QueryTeacherActiveDashboardArgs
> = gql`
  query teacherActiveDashboard($date: String!, $pagination: PaginationArgs) {
    teacherActiveDashboard(date: $date, pagination: $pagination) {
      id
      metrics {
        total
        regular
        trial
        advance
        rescheduled
        suspended
        taken
        pending
        activated
        running
        absent
        leave
      }
      scheduleRows {
        id
        studentId
        studentName
        scheduledStartAt
        durationMinutes
        executionState
        outcome
        zoomMeetingUrl
        yourTimeFormatted
      }
      progressFeed {
        id
        title
        type
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        lastItem
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
`;

export const createTeacherManualClassEntryMutationDocument: TypedDocumentNode<
  Operations.CreateTeacherManualClassEntryMutation,
  Types.MutationCreateTeacherManualClassEntryArgs
> = gql`
  mutation createTeacherManualClassEntry($input: CreateManualClassEntryInput!) {
    createTeacherManualClassEntry(input: $input) {
      id
      status
      scheduledDate
      startTime
      endTime
      durationMinutes
    }
  }
`;

export const logTeacherSupportRequestMutationDocument: TypedDocumentNode<
  Operations.LogTeacherSupportRequestMutation,
  Types.MutationLogTeacherSupportRequestArgs
> = gql`
  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {
    logTeacherSupportRequest(input: $input) {
      id
      success
    }
  }
`;

export const teacherFutureScheduleQueryDocument: TypedDocumentNode<Operations.TeacherFutureScheduleQuery> = gql`
  query teacherFutureSchedule {
    teacherFutureSchedule {
      id
      leaveQuotaUsed
      leaveQuotaTotal
      totalClasses
      classes {
        id
        courseName
        scheduledDate
        startTime
        endTime
        durationMinutes
        isRescheduled
        leaveRequestDisabled
        leaveRequestDisabledReason
        studentCount
        location
      }
    }
  }
`;

export const teacherHandbookUrlQueryDocument: TypedDocumentNode<Operations.TeacherHandbookUrlQuery> = gql`
  query teacherHandbookUrl {
    teacherHandbookUrl {
      id
      url
    }
  }
`;
