import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const deleteBookMutationDocument = gql`
  mutation DeleteBookMutation($id: ID!) {
    deleteBook(id: $id)
  }
` as TypedDocumentNode<Operations.DeleteBookMutationMutation, Types.MutationDeleteBookArgs>;
