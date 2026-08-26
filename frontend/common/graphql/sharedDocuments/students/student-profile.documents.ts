import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  RecordStudentProfileEditMutation,
  RecordStudentProfileEditMutationVariables,
  StudentProfileQuery,
  StudentProfileQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

/**
 * In-file GraphQL fragments used to compose `StudentProfile`. Keeping these as
 * named fragment consts (instead of one giant inline selection) keeps the
 * `studentProfileQueryDocument` initializer under CodeScene's Large Method
 * threshold.
 *
 * Naming follows the in-file fragment convention used by sibling documents
 * files (e.g. `MEETING_PROVIDER_FIELDS` in `meeting/meeting.documents.ts`).
 */

const STUDENT_UPCOMING_CLASS_FIELDS = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  fragment StudentUpcomingClassFields on StudentUpcomingClass {
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
`;

const STUDENT_HISTORY_METRICS_FIELDS = gql`
  fragment StudentHistoryMetricsFields on StudentHistoryMetrics {
    id
    totalClasses
    attendanceRate
    hoursStudied
    performance
  }
`;

const STUDENT_HISTORY_SESSION_FIELDS = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  fragment StudentHistorySessionFields on StudentHistorySession {
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
`;

export const studentProfileQueryDocument: TypedDocumentNode<StudentProfileQuery, StudentProfileQueryVariables> = gql`
  ${STUDENT_UPCOMING_CLASS_FIELDS}
  ${STUDENT_HISTORY_METRICS_FIELDS}
  ${STUDENT_HISTORY_SESSION_FIELDS}
  query StudentProfile($studentId: String, $year: Int, $month: Int, $includeUpcomingClasses: Boolean) {
    studentProfile(
      studentId: $studentId
      year: $year
      month: $month
      includeUpcomingClasses: $includeUpcomingClasses
    ) {
      id
      name
      status
      avatarUrl
      dateOfBirth
      gender
      language
      timezoneOverride
      email
      phone
      timezone
      displayCurrency
      parentId
      parentUserId
      parentName
      parentEmail
      parentPhone
      isAssociatedViewer
      isOwnStudentProfile
      primaryTeacherId
      teacherUserId
      teacherName
      hoursPerWeek
      classesRemaining
      classesTotal
      version
      createdAt
      updatedAt
      upcomingClasses {
        id
        studentId
        studentName
        status
        classes {
          ...StudentUpcomingClassFields
        }
      }
      classHistory {
        id
        studentName
        metrics {
          ...StudentHistoryMetricsFields
        }
        sessions {
          ...StudentHistorySessionFields
        }
      }
    }
  }
`;

export const recordStudentProfileEditMutationDocument: TypedDocumentNode<
  RecordStudentProfileEditMutation,
  RecordStudentProfileEditMutationVariables
> = gql`
  mutation RecordStudentProfileEdit($input: StudentProfileEditInput!) {
    recordStudentProfileEdit(input: $input) {
      id
      name
      status
      avatarUrl
      dateOfBirth
      gender
      language
      timezoneOverride
      email
      phone
      parentPhone
      version
      updatedAt
    }
  }
`;
