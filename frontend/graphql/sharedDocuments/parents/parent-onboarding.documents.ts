import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createParentMutationDocument: TypedDocumentNode<
  Operations.CreateParentMutation,
  Types.MutationCreateParentArgs
> = gql`
  mutation createParent($input: ParentOnboardingInput!) {
    createParent(input: $input) {
      userId
      parentId
      name
      email
      status
      invoiceType
      currency
    }
  }
`;
