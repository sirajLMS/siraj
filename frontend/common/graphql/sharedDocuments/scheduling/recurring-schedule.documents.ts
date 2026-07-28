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
      hourlyRate
      rateCurrency
      days {
        id
        dayOfWeek
        startTime
        isActive
      }
    }
  }
`;

export const updateRecurringClassRateMutationDocument: TypedDocumentNode<
  Operations.UpdateRecurringClassRateMutation,
  Types.MutationUpdateRecurringClassRateArgs
> = gql`
  mutation updateRecurringClassRate($input: UpdateRecurringClassRateInput!) {
    updateRecurringClassRate(input: $input) {
      id
      hourlyRate
      rateCurrency
    }
  }
`;
