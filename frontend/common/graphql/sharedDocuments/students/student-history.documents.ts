import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  StudentClassHistoryQuery,
  StudentClassHistoryQueryVariables,
  StudentClassSessionDetailQuery,
  StudentClassSessionDetailQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const studentClassHistoryQueryDocument: TypedDocumentNode<
  StudentClassHistoryQuery,
  StudentClassHistoryQueryVariables
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query studentClassHistory($studentId: ID!, $year: Int!, $month: Int!) {
    studentClassHistory(studentId: $studentId, year: $year, month: $month) {
      id
      studentName
      metrics {
        id
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
        teacherId
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
  StudentClassSessionDetailQuery,
  StudentClassSessionDetailQueryVariables
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
