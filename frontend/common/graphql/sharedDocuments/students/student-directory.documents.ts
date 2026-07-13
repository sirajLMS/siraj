import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const studentDirectoryRowFragment = gql`
  fragment StudentDirectoryRowFragment on StudentDirectoryRow {
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

export const studentDirectoryDetailFragment = gql`
  fragment StudentDirectoryDetailFragment on StudentDirectoryRow {
    id
    name
    email
    avatarUrl
    status
    classesRemaining
    classesTotal
    hoursPerWeek
    parentName
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
        ...StudentDirectoryRowFragment
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
