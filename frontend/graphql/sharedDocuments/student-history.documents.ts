import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const studentClassHistoryQueryDocument: TypedDocumentNode<
  Operations.StudentClassHistoryQuery,
  Types.QueryStudentClassHistoryArgs
> = gql`
  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {
    studentClassHistory(studentId: $studentId, year: $year, month: $month) {
      id
      studentName
      metrics {
        totalClasses
        attendanceRate
        hoursStudied
        performance
      }
      sessions {
        id
        title
        time
        duration
        status
        instructor
        timeSlot
        room
        notes
        dayOfMonth
      }
    }
  }
`;

export const studentClassSessionDetailQueryDocument: TypedDocumentNode<
  Operations.StudentClassSessionDetailQuery,
  Types.QueryStudentClassSessionDetailArgs
> = gql`
  query studentClassSessionDetail($classInstanceId: ID!) {
    studentClassSessionDetail(classInstanceId: $classInstanceId) {
      id
      durationMinutes
      executionState
      outcome
      remarks
      zoomMeetingUrl
      teacherName
      scheduledStartAt
      scheduledEndAt
    }
  }
`;
