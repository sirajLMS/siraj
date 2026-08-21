import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  TeacherWeeklyScheduleGridQuery,
  TeacherWeeklyScheduleGridQueryVariables,
  TeacherWorkloadMetricsQuery,
  TeacherWorkloadMetricsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { EFFECTIVE_MEETING_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";

export const teacherWeeklyScheduleGridQueryDocument: TypedDocumentNode<
  TeacherWeeklyScheduleGridQuery,
  TeacherWeeklyScheduleGridQueryVariables
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
  TeacherWorkloadMetricsQuery,
  TeacherWorkloadMetricsQueryVariables
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
