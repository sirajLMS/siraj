import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateGeneralUserMutation,
  CreateGeneralUserMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { UserFieldsFragmentDoc } from "@/frontend/common/graphql/sharedDocuments/users/userFields.documents";

export const createGeneralUserMutationDocument: TypedDocumentNode<
  CreateGeneralUserMutation,
  CreateGeneralUserMutationVariables
> = gql`
  ${UserFieldsFragmentDoc}
  mutation CreateGeneralUser($input: GeneralUserCreateInput!) {
    createGeneralUser(input: $input) {
      id
      user {
        ...UserFields
      }
      assignedGroupSlug
    }
  }
`;
