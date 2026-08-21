import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  StudentUpcomingClassesQuery,
  StudentUpcomingClassesQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const studentUpcomingClassesQueryDocument: TypedDocumentNode<
  StudentUpcomingClassesQuery,
  StudentUpcomingClassesQueryVariables
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
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
        teacherAvatarUrl
        subjectId
        subjectName
        avatarUrl
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
