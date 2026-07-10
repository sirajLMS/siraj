import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";

export const teacherWeeklyScheduleGridQueryDocument: TypedDocumentNode<
  Operations.TeacherWeeklyScheduleGridQuery,
  Types.QueryTeacherWeeklyScheduleGridArgs
> = gql`
  ${EFFECTIVE_MEETING_FIELDS}
  query teacherWeeklyScheduleGrid($teacherId: String, $weekDate: String!) {
    teacherWeeklyScheduleGrid(teacherId: $teacherId, weekDate: $weekDate) {
      id
      teacherId
      weekStart
      weekEnd
      classes {
        id
        studentName
        studentId
        duration
        startTime
        day
        executionState
        outcome
        isFrozen
        subjectName
        classType
        meetingJoinUrl
        effectiveMeeting {
          ...EffectiveMeetingFields
        }
      }
    }
  }
`;

export const teacherWorkloadMetricsQueryDocument: TypedDocumentNode<
  Operations.TeacherWorkloadMetricsQuery,
  Types.QueryTeacherWorkloadMetricsArgs
> = gql`
  query teacherWorkloadMetrics($teacherId: String, $weekDate: String!) {
    teacherWorkloadMetrics(teacherId: $teacherId, weekDate: $weekDate) {
      id
      weeklyHoursWorked
      totalMinutes
      classCount
    }
  }
`;
