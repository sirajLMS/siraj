import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  StudentDirectoryQuery,
  StudentDirectoryQueryVariables,
  StudentsDirectoryQuery,
  StudentsDirectoryQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const studentDirectoryRowFragment = gql`
  fragment StudentDirectoryRow on StudentDirectoryRow {
    id
    name
    email
    avatarUrl
    status
    classesRemaining
    classesTotal
    hoursPerWeek
    teacherName
    createdAt
    updatedAt
  }
`;

export const studentDirectoryQueryDocument: TypedDocumentNode<StudentDirectoryQuery, StudentDirectoryQueryVariables> =
  gql`
  ${studentDirectoryRowFragment}
  query studentDirectory(
    $paginationArgs: PaginationArgs
    $orderBy: [StudentsOrderByClause!]
    $filterArgs: StudentFilterArgs
  ) {
    studentDirectory(
      paginationArgs: $paginationArgs
      orderBy: $orderBy
      filterArgs: $filterArgs
    ) {
      id
      totalCount
      rows {
        ...StudentDirectoryRow
      }
      pageInfo {
        count
        currentPage
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
`;

export const studentsDirectoryQueryDocument: TypedDocumentNode<
  StudentsDirectoryQuery,
  StudentsDirectoryQueryVariables
> = gql`
  ${studentDirectoryRowFragment}
  query studentsDirectory($search: String, $limit: Int) {
    studentsDirectory(search: $search, limit: $limit) {
      id
      ...StudentDirectoryRow
    }
  }
`;
