import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const studentClassHistoryQueryDocument: TypedDocumentNode<
  Operations.StudentClassHistoryQuery,
  Types.QueryStudentClassHistoryArgs
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
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
        outcome
        isFrozen
        instructor
        timeSlot
        room
        notes
        dayOfMonth
        meetingJoinUrl
        effectiveMeeting {
          ...EffectiveMeetingFields
        }
      }
    }
  }
`;

export const studentClassSessionDetailQueryDocument: TypedDocumentNode<
  Operations.StudentClassSessionDetailQuery,
  Types.QueryStudentClassSessionDetailArgs
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query studentClassSessionDetail($classInstanceId: ID!) {
    studentClassSessionDetail(classInstanceId: $classInstanceId) {
      id
      durationMinutes
      executionState
      outcome
      remarks
      meetingJoinUrl
      effectiveMeeting {
        ...EffectiveMeetingFields
      }
      teacherName
      scheduledStartAt
      scheduledEndAt
    }
  }
`;
