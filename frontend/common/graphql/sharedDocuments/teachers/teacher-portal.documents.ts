import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  TeacherAssignedClassesQuery,
  TeacherAssignedStudentsQuery,
  TeacherOwnProfileQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const teacherAssignedStudentsQueryDocument: TypedDocumentNode<TeacherAssignedStudentsQuery> = gql`
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

export const teacherOwnProfileQueryDocument: TypedDocumentNode<TeacherOwnProfileQuery> = gql`
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

export const teacherAssignedClassesQueryDocument: TypedDocumentNode<TeacherAssignedClassesQuery> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
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
        isFrozen
        meetingJoinUrl
        effectiveMeeting {
          ...EffectiveMeetingFields
        }
      }
    }
  }
`;
