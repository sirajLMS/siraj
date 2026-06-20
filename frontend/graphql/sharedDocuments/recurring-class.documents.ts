import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createRecurringClassMutationDocument: TypedDocumentNode<
  Operations.CreateRecurringClassMutation,
  Types.MutationCreateRecurringClassArgs
> = gql`
  mutation createRecurringClass($input: CreateRecurringClassInput!) {
    createRecurringClass(input: $input) {
      id
      recurringScheduleId
      classInstanceIds
      classInstanceCount
    }
  }
`;
