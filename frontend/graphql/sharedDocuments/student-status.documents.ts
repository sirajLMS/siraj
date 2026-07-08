import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const studentUpcomingClassesQueryDocument: TypedDocumentNode<
  Operations.StudentUpcomingClassesQuery,
  Types.QueryStudentUpcomingClassesArgs
> = gql`
  query StudentUpcomingClasses($studentId: String!) {
    studentUpcomingClasses(studentId: $studentId) {
      id
      studentId
      studentName
      status
      classes {
        id
        instructor
        teacherId
        scheduledStartAt
        scheduledEndAt
        durationMinutes
        executionState
        isFrozen
      }
    }
  }
`;
