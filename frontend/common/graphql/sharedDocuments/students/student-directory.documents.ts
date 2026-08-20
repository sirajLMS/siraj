import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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

export const studentDirectoryQueryDocument: TypedDocumentNode<
  Operations.StudentDirectoryQuery,
  Types.QueryStudentDirectoryArgs
> = gql`
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
  Operations.StudentsDirectoryQuery,
  Types.QueryStudentsDirectoryArgs
> = gql`
  ${studentDirectoryRowFragment}
  query studentsDirectory($search: String, $limit: Int) {
    studentsDirectory(search: $search, limit: $limit) {
      id
      ...StudentDirectoryRow
    }
  }
`;
