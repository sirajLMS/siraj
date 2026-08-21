import { gql, type TypedDocumentNode } from "@apollo/client";
import type { DeleteBookMutation, DeleteBookMutationVariables } from "@/frontend/common/graphql/generated/gql/graphql";

export const deleteBookMutationDocument = gql`
  mutation deleteBook($id: ID!) {
    deleteBook(id: $id)
  }
` as TypedDocumentNode<DeleteBookMutation, DeleteBookMutationVariables>;
