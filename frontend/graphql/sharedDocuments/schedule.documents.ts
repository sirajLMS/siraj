import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

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
  query dailyScheduleList($date: String!, $teacherId: String, $search: String) {
    dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {
      id
      yourTime
      teacherTime
      studentTime
      duration
      status
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
