import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const deleteRecurringClassMutationDocument: TypedDocumentNode<
  Operations.DeleteRecurringClassMutation,
  Types.MutationDeleteRecurringClassArgs
> = gql`
  mutation deleteRecurringClass($classInstanceId: ID!) {
    deleteRecurringClass(classInstanceId: $classInstanceId)
  }
`;

export const clearWeeklyScheduleMutationDocument: TypedDocumentNode<
  Operations.ClearWeeklyScheduleMutation,
  Types.MutationClearWeeklyScheduleArgs
> = gql`
  mutation clearWeeklySchedule($teacherId: ID!) {
    clearWeeklySchedule(teacherId: $teacherId)
  }
`;
