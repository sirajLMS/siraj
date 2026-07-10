import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createManagerMutationDocument: TypedDocumentNode<
  Operations.CreateManagerMutation,
  Types.MutationCreateManagerArgs
> = gql`
  mutation createManager($input: ManagerOnboardingInput!) {
    createManager(input: $input) {
      id
      userId
      staffProfileId
      name
      email
      status
      assignedGroupSlug
    }
  }
`;
