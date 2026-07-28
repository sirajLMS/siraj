import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const supervisorDashboardQueryDocument: TypedDocumentNode<Operations.SupervisorDashboardQuery> = gql`
  query supervisorDashboard {
    supervisorDashboard {
      supervisorName
      pendingReviewCount
      pendingDuesSummary {
        totalCount
        totalAmount
        currency
      }
      recentApprovals {
        id
        classInstanceId
        subjectName
        classAvatarUrl
        studentId
        studentName
        teacherId
        teacherName
        studentAvatarUrl
        teacherAvatarUrl
        studentUserId
        teacherUserId
        lessonDate
        durationMinutes
        attendanceEvaluation
        teacherNotes
        studentNotes
        completionPercentage
        status
        submittedAt
        reviewedAt
        createdAt
        updatedAt
      }
      monthlySnapshot {
        year
        month
        label
      }
    }
  }
`;
