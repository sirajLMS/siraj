import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const recurringScheduleQueryDocument: TypedDocumentNode<
  Operations.RecurringScheduleQuery,
  Types.QueryRecurringScheduleArgs
> = gql`
  query recurringSchedule($id: ID!) {
    recurringSchedule(id: $id) {
      id
      studentId
      studentName
      teacherId
      teacherName
      durationMinutes
      defaultStartTime
      timezone
      days {
        id
        dayOfWeek
        startTime
        isActive
      }
    }
  }
`;
