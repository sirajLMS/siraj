import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const parentDashboardScheduleQueryDocument: TypedDocumentNode<
  Operations.ParentDashboardScheduleQuery,
  Types.QueryParentDashboardScheduleArgs
> = gql`
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
        scheduledStartAt
        scheduledEndAt
        durationMinutes
        bookingStatus
        executionState
        outcome
        zoomMeetingUrl
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
