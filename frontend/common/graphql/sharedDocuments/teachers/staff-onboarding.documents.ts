import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateManagerMutation,
  CreateManagerMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const createManagerMutationDocument: TypedDocumentNode<CreateManagerMutation, CreateManagerMutationVariables> =
  gql`
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
