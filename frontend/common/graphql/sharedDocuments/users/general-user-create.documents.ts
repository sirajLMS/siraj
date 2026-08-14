import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { UserFieldsFragmentDoc } from "@/frontend/common/graphql/sharedDocuments/users/userFields.documents";

export const createGeneralUserMutationDocument: TypedDocumentNode<
  Operations.CreateGeneralUserMutation,
  Types.MutationCreateGeneralUserArgs
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
