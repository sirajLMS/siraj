import { gql } from "@apollo/client";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";

export const studentProfileQueryDocument = gql`
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
