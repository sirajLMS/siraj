import { gql } from "@apollo/client";

export const deleteBookMutationDocument = gql`
  mutation DeleteBookMutation($id: ID!) {
    deleteBook(id: $id)
  }
`;
