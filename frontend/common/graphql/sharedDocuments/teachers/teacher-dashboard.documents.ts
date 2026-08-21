import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateTeacherManualClassEntryMutation,
  CreateTeacherManualClassEntryMutationVariables,
  LogTeacherSupportRequestMutation,
  LogTeacherSupportRequestMutationVariables,
  TeacherDashboardQuery,
  TeacherDashboardQueryVariables,
  TeacherFutureScheduleQuery,
  TeacherFutureScheduleQueryVariables,
  TeacherHandbookUrlQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const teacherDashboardQueryDocument: TypedDocumentNode<TeacherDashboardQuery, TeacherDashboardQueryVariables> =
  gql`
  ${EFFECTIVE_MEETING_FIELDS}
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
        scheduledEndAt
        durationMinutes
        executionState
        outcome
        isFrozen
        effectiveMeeting {
          ...EffectiveMeetingFields
        }
        yourTimeFormatted
      }
      progressFeed {
        id
        studentId
        studentName
        scheduledTimeFormatted
        durationMinutes
        eventKind
        occurredAt
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
  CreateTeacherManualClassEntryMutation,
  CreateTeacherManualClassEntryMutationVariables
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
  LogTeacherSupportRequestMutation,
  LogTeacherSupportRequestMutationVariables
> = gql`
  mutation logTeacherSupportRequest($input: LogSupportRequestInput!) {
    logTeacherSupportRequest(input: $input) {
      id
      success
    }
  }
`;

export const teacherFutureScheduleQueryDocument: TypedDocumentNode<
  TeacherFutureScheduleQuery,
  TeacherFutureScheduleQueryVariables
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query teacherFutureSchedule($teacherId: String) {
    teacherFutureSchedule(teacherId: $teacherId) {
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
        subjectId
        subjectName
        classType
        executionState
        outcome
        effectiveMeeting {
          ...EffectiveMeetingFields
        }
        avatarUrl
      }
      importantNotes {
        id
        title
        body
        priority
        startsAt
        expiresAt
      }
      supportContact {
        id
        name
        role
        avatarUrl
        phone
      }
    }
  }
`;

export const teacherHandbookUrlQueryDocument: TypedDocumentNode<TeacherHandbookUrlQuery> = gql`
  query teacherHandbookUrl {
    teacherHandbookUrl {
      id
      url
    }
  }
`;
