import { gql, type TypedDocumentNode } from "@apollo/client";
import type { DeleteBookMutation, DeleteBookMutationVariables } from "@/frontend/common/graphql/generated/gql/graphql";

export const deleteBookMutationDocument: TypedDocumentNode<DeleteBookMutation, DeleteBookMutationVariables> = gql`
  mutation deleteBook($id: ID!) {
    deleteBook(id: $id)
  }
`;
