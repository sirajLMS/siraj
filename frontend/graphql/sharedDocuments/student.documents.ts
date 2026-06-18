import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const studentsQueryDocument: TypedDocumentNode<Operations.StudentsQuery, Types.QueryStudentsArgs> = gql`
  query students(
    $paginationArgs: PaginationArgs
    $orderBy: [StudentsOrderByClause!]
    $filterArgs: StudentFilterArgs
  ) {
    students(
      paginationArgs: $paginationArgs
      orderBy: $orderBy
      filterArgs: $filterArgs
    ) {
      data {
        id
        name
      }
      pageInfo {
        total
      }
    }
  }
`;
