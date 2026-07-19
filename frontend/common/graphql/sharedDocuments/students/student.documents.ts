import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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
        avatarUrl
      }
      pageInfo {
        total
      }
    }
  }
`;

export const studentByIdQueryDocument: TypedDocumentNode<Operations.StudentByIdQuery, Types.QueryStudentByIdArgs> = gql`
  query StudentById($studentId: String!) {
    studentById(studentId: $studentId) {
      id
      name
      status
      primaryTeacherId
      teacherName
      hoursPerWeek
      classesRemaining
      classesTotal
      language
      gender
      version
      updatedAt
    }
  }
`;
