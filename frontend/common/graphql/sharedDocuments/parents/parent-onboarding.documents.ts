import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateParentMutation,
  CreateParentMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const createParentMutationDocument: TypedDocumentNode<CreateParentMutation, CreateParentMutationVariables> = gql`
  mutation createParent($input: ParentOnboardingInput!) {
    createParent(input: $input) {
      id
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
