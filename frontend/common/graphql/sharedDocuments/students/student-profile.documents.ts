import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const studentProfileQueryDocument: TypedDocumentNode<
  Operations.StudentProfileQuery,
  Types.QueryStudentProfileArgs
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query StudentProfile($studentId: String!, $year: Int, $month: Int) {
    studentProfile(studentId: $studentId, year: $year, month: $month) {
      id
      name
      status
      avatarUrl
      dateOfBirth
      gender
      language
      parentId
      parentUserId
      parentName
      isAssociatedViewer
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
          id
          instructor
          teacherId
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
      classHistory {
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
  }
`;
