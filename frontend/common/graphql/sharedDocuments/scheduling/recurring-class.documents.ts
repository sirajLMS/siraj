import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateRecurringClassMutation,
  CreateRecurringClassMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const createRecurringClassMutationDocument: TypedDocumentNode<
  CreateRecurringClassMutation,
  CreateRecurringClassMutationVariables
> = gql`
  mutation createRecurringClass($input: CreateRecurringClassInput!) {
    createRecurringClass(input: $input) {
      id
      recurringScheduleId
      classInstanceIds
      classInstanceCount
      meetingUrl
    }
  }
`;
