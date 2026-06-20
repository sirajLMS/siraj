import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const teacherDirectoryQueryDocument: TypedDocumentNode<
  Operations.TeacherDirectoryQuery,
  Types.QueryTeacherDirectoryArgs
> = gql`
  query teacherDirectory($search: String, $limit: Int, $offset: Int) {
    teacherDirectory(search: $search, limit: $limit, offset: $offset) {
      id
      metrics {
        id
        activated
        deactivated
      }
      rows {
        id
        index
        name
        email
        avatarUrl
        status
        zoomLink
      }
      totalTeachers
    }
  }
`;
