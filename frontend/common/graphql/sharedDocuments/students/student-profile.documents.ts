import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const studentProfileQueryDocument: TypedDocumentNode<
  Operations.StudentProfileQuery,
  Types.QueryStudentProfileArgs
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query StudentProfile($studentId: String, $year: Int, $month: Int) {
    studentProfile(studentId: $studentId, year: $year, month: $month) {
      id
      name
      status
      avatarUrl
      dateOfBirth
      gender
      language
      email
      phone
      parentId
      parentUserId
      parentName
      parentEmail
      parentPhone
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

// NOTE: `Operations.RecordStudentProfileEditMutation` /
// `Types.MutationRecordStudentProfileEditArgs` are produced by GraphQL Code
// Generator after codegen. Until then, use a temporary local type mirroring
// the expected codegen shape. Replace after
// `bun run generate:gqlSchema && bun codegen` regenerates `operations.ts`.
interface RecordStudentProfileEditMutationShape {
  recordStudentProfileEdit: {
    id: string | null;
    name: string | null;
    status: string | null;
    avatarUrl: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    language: string | null;
    email: string | null;
    phone: string | null;
    parentPhone: string | null;
    version: number | null;
    updatedAt: string | null;
  } | null;
}

interface RecordStudentProfileEditMutationArgs {
  input: {
    phone?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    language?: string | null;
    parentPhone?: string | null;
    avatarUrl?: string | null;
  };
}

export const recordStudentProfileEditMutationDocument: TypedDocumentNode<
  RecordStudentProfileEditMutationShape,
  RecordStudentProfileEditMutationArgs
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
      email
      phone
      parentPhone
      version
      updatedAt
    }
  }
`;
