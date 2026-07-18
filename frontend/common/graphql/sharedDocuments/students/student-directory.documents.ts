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

// NOTE: `Operations.StudentsDirectoryQuery` / `Types.QueryStudentsDirectoryArgs`
// are produced by GraphQL Code Generator after codegen. Until then, use a
// temporary local type mirroring the expected codegen shape. Replace after
// `bun run generate:gqlSchema && bun codegen` regenerates `operations.ts`.
interface StudentsDirectoryQueryShape {
  studentsDirectory: Array<{
    id: string | null;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    status: string | null;
    classesRemaining: number | null;
    classesTotal: number | null;
    hoursPerWeek: number | null;
    teacherName: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
}

interface StudentsDirectoryQueryArgs {
  search?: string | null;
  limit?: number | null;
}

export const studentsDirectoryQueryDocument: TypedDocumentNode<
  StudentsDirectoryQueryShape,
  StudentsDirectoryQueryArgs
> = gql`
  ${studentDirectoryRowFragment}
  query studentsDirectory($search: String, $limit: Int) {
    studentsDirectory(search: $search, limit: $limit) {
      ...StudentDirectoryRowFragment
    }
  }
`;
