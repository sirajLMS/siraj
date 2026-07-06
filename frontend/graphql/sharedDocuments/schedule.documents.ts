import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const adminDashboardScheduleQueryDocument: TypedDocumentNode<
  Operations.AdminDashboardScheduleQuery,
  Types.QueryAdminDashboardScheduleArgs
> = gql`
  query adminDashboardSchedule($input: AdminDashboardScheduleInput!) {
    adminDashboardSchedule(input: $input) {
      id
      totalCount
      metrics {
        id
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
      rows {
        id
        yourTime
        teacherTime
        studentTime
        duration
        scheduledStartAt
        scheduledEndAt
        outcome
        executionState
        student {
          id
          name
        }
        teacher {
          id
          name
        }
      }
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

export const dailyScheduleMetricsQueryDocument: TypedDocumentNode<
  Operations.DailyScheduleMetricsQuery,
  Types.QueryDailyScheduleMetricsArgs
> = gql`
  query dailyScheduleMetrics($date: String!, $teacherId: String) {
    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {
      id
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
  }
`;

export const dailyScheduleListQueryDocument: TypedDocumentNode<
  Operations.DailyScheduleListQuery,
  Types.QueryDailyScheduleListArgs
> = gql`
  query dailyScheduleList($date: String!, $teacherId: String, $search: String, $metricFilter: String) {
    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search, metricFilter: $metricFilter) {
      id
      yourTime
      teacherTime
      studentTime
      duration
      outcome
      executionState
      student {
        id
        name
      }
      teacher {
        id
        name
      }
    }
  }
`;
export const rescheduleTrackingRowsQueryDocument: TypedDocumentNode<
  Operations.RescheduleTrackingRowsQuery,
  Types.QueryRescheduleTrackingRowsArgs
> = gql`
  query rescheduleTrackingRows($search: String, $status: LeaveRequestStatus, $paginationArgs: PaginationArgs) {
    rescheduleTrackingRows(search: $search, status: $status, paginationArgs: $paginationArgs) {
      id
      totalCount
      rows {
        id
        originalClassId
        teacherId
        teacherName
        teacherAvatarUrl
        studentId
        studentName
        scheduledStartAt
        scheduledEndAt
        status
        dateLabel
        remarks
      }
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

export const rescheduleTrackingMetricsQueryDocument: TypedDocumentNode<Operations.RescheduleTrackingMetricsQuery> = gql`
  query rescheduleTrackingMetrics {
    rescheduleTrackingMetrics {
      id
      pending
      approved
      leave
      rescheduled
      cancelled
    }
  }
`;

// ─── Status Tracking Schedule Query ───────────────────────────────────────────

/**
 * Fetches all class instances for the status tracking admin dashboard.
 *
 * Returns class rows for a given date, enriched with student status and
 * isFrozen flag. Used by StatusTrackingContainer to display real data
 * with correct session status badges and action button states.
 *
 * Permission required: SCHEDULE_VIEW_ALL or DASHBOARD_VIEW_METRICS
 * (checked in ScheduleQueryService — unauthorized actors get an error)
 *
 * @param date - ISO date string (YYYY-MM-DD) for which to fetch classes
 * @param search - Optional search filter (matches student name or teacher name)
 * @param viewerTimezone - Optional IANA timezone for day boundary calculation
 */
export const statusTrackingScheduleQueryDocument: TypedDocumentNode<
  Operations.StatusTrackingScheduleQuery,
  Types.QueryStatusTrackingScheduleArgs
> = gql`
  query statusTrackingSchedule($date: String!, $search: String, $viewerTimezone: String) {
    statusTrackingSchedule(date: $date, search: $search, viewerTimezone: $viewerTimezone) {
      id
      studentId
      studentName
      studentInitials
      studentStatus
      teacherId
      teacherName
      scheduledStartAt
      scheduledEndAt
      durationMinutes
      executionState
      outcome
      isFrozen
    }
  }
`;
