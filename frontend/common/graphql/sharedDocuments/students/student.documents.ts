import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  StudentByIdQuery,
  StudentByIdQueryVariables,
  StudentsQuery,
  StudentsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const studentsQueryDocument: TypedDocumentNode<StudentsQuery, StudentsQueryVariables> = gql`
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

export const studentByIdQueryDocument: TypedDocumentNode<StudentByIdQuery, StudentByIdQueryVariables> = gql`
  query StudentById($studentId: String!) {
    studentById(studentId: $studentId) {
      id
      name
      avatarUrl
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
