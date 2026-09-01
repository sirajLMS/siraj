import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateGeneralUserMutation,
  CreateGeneralUserMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { USER_FIELDS } from "@/frontend/common/graphql/sharedDocuments/users/user-fields.documents";

export const createGeneralUserMutationDocument: TypedDocumentNode<
  CreateGeneralUserMutation,
  CreateGeneralUserMutationVariables
> = gql`
  ${USER_FIELDS}
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
