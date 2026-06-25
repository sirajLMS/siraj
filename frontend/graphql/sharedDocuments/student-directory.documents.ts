import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const studentDirectoryRowFragment = gql`
  fragment StudentDirectoryRowFragment on Student {
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
      ...StudentDirectoryRowFragment
    }
  }
`;
