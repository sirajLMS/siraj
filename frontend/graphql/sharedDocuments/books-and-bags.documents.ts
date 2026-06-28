import { gql } from "@apollo/client";

export const booksAndBagsQueryDocument = gql`
  query BooksAndBagsQuery {
    booksAndBags {
      id
      name
      availabilityStatus
    }
  }
`;

export const deleteBookMutationDocument = gql`
  mutation DeleteBookMutation($id: ID!) {
    deleteBook(id: $id)
  }
`;
