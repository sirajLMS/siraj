import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ParentDashboardMetricsQuery,
  ParentDashboardScheduleQuery,
  ParentDashboardScheduleQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const parentDashboardScheduleQueryDocument: TypedDocumentNode<
  ParentDashboardScheduleQuery,
  ParentDashboardScheduleQueryVariables
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query parentDashboardSchedule($date: String, $search: String, $paginationArgs: PaginationArgs) {
    parentDashboardSchedule(date: $date, search: $search, paginationArgs: $paginationArgs) {
      id
      rows {
        id
        studentId
        studentName
        studentInitials
        studentAvatarUrl
        teacherId
        teacherName
        teacherAvatarUrl
        scheduledStartAt
        scheduledEndAt
        durationMinutes
        bookingStatus
        executionState
        outcome
        isFrozen
        effectiveMeeting {
          ...EffectiveMeetingFields
        }
        classTimeFormatted
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const parentDashboardMetricsQueryDocument: TypedDocumentNode<ParentDashboardMetricsQuery> = gql`
  query parentDashboardMetrics {
    parentDashboardMetrics {
      id
      metrics {
        id
        totalStudents
        todaysClasses
        pendingInvoicesCount
        pendingInvoicesAmount
        performanceAvg
        performanceAvgMobile
        pendingMessages
      }
      studentProgress {
        id
        name
        completionPercent
      }
      workshopPromo {
        id
        title
        description
        imageUrl
      }
    }
  }
`;
