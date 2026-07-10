import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const teacherAssignedStudentsQueryDocument: TypedDocumentNode<Operations.TeacherAssignedStudentsQuery> = gql`
  query teacherAssignedStudents {
    teacherAssignedStudents {
      id
      totalCount
      rows {
        id
        name
        status
        hoursPerWeek
        classesRemaining
        classesTotal
      }
    }
  }
`;

export const teacherOwnProfileQueryDocument: TypedDocumentNode<Operations.TeacherOwnProfileQuery> = gql`
  query teacherOwnProfile {
    teacherOwnProfile {
      id
      name
      email
      phone
      timezone
      hourlyRate
      rateCurrency
      displayAmount {
        id
        amount
        currency
        stale
      }
    }
  }
`;

export const teacherAssignedClassesQueryDocument: TypedDocumentNode<Operations.TeacherAssignedClassesQuery> = gql`
  query teacherAssignedClasses {
    teacherAssignedClasses {
      id
      totalCount
      rows {
        id
        studentName
        scheduledStartAt
        scheduledEndAt
        durationMinutes
        executionState
        outcome
      }
    }
  }
`;
