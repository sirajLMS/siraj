import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  StudentClassesRangeQuery,
  StudentClassesRangeQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const studentClassesRangeQueryDocument: TypedDocumentNode<
  StudentClassesRangeQuery,
  StudentClassesRangeQueryVariables
> = gql`
  query StudentClassesRange($studentId: String!, $from: DateTime, $to: DateTime) {
    studentUpcomingClasses(studentId: $studentId, from: $from, to: $to) {
      id
      classes {
        id
        scheduledStartAt
        scheduledEndAt
        subjectName
        instructor
        outcome
        executionState
      }
    }
  }
`;
