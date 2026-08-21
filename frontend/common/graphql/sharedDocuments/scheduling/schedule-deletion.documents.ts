import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ClearWeeklyScheduleMutation,
  ClearWeeklyScheduleMutationVariables,
  DeleteRecurringClassMutation,
  DeleteRecurringClassMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const deleteRecurringClassMutationDocument: TypedDocumentNode<
  DeleteRecurringClassMutation,
  DeleteRecurringClassMutationVariables
> = gql`
  mutation deleteRecurringClass($classInstanceId: ID!) {
    deleteRecurringClass(classInstanceId: $classInstanceId)
  }
`;

export const clearWeeklyScheduleMutationDocument: TypedDocumentNode<
  ClearWeeklyScheduleMutation,
  ClearWeeklyScheduleMutationVariables
> = gql`
  mutation clearWeeklySchedule($teacherId: ID!) {
    clearWeeklySchedule(teacherId: $teacherId)
  }
`;
