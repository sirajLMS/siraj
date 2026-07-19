import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const lessonReportQueryDocument: TypedDocumentNode<Operations.LessonReportQuery, Types.QueryLessonReportArgs> =
  gql`
  query LessonReport($classInstanceId: ID!) {
    lessonReport(classInstanceId: $classInstanceId) {
      id
      classInstanceId
      studentId
      teacherId
      teacherName
      studentName
      subjectName
      classAvatarUrl
      lessonDate
      durationMinutes
      attendanceEvaluation
      teacherNotes
      studentNotes
      completionPercentage
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;

export const lessonReportByIdQueryDocument: TypedDocumentNode<
  Operations.LessonReportByIdQuery,
  Types.QueryLessonReportByIdArgs
> = gql`
  query LessonReportById($reportId: ID!) {
    lessonReportById(reportId: $reportId) {
      id
      classInstanceId
      studentId
      teacherId
      teacherName
      studentName
      subjectName
      classAvatarUrl
      lessonDate
      durationMinutes
      attendanceEvaluation
      teacherNotes
      studentNotes
      completionPercentage
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;

export const pendingLessonReportsQueryDocument: TypedDocumentNode<
  Operations.PendingLessonReportsQuery,
  Types.QueryPendingLessonReportsArgs
> = gql`
  query PendingLessonReports($teacherId: ID, $studentId: ID, $paginationArgs: PaginationArgs) {
    pendingLessonReports(teacherId: $teacherId, studentId: $studentId, paginationArgs: $paginationArgs) {
      totalCount
      rows {
        id
        classInstanceId
        studentId
        teacherId
        teacherName
        studentName
        subjectName
        classAvatarUrl
        lessonDate
        durationMinutes
        attendanceEvaluation
        teacherNotes
        studentNotes
        completionPercentage
        status
        submittedByUserId
        submittedAt
        reviewedByUserId
        reviewedAt
        rejectionReason
        idempotencyKey
        createdAt
        updatedAt
      }
    }
  }
`;

export const recentApprovedLessonReportsQueryDocument: TypedDocumentNode<
  Operations.RecentApprovedLessonReportsQuery,
  Types.QueryRecentApprovedLessonReportsArgs
> = gql`
  query RecentApprovedLessonReports($limit: Int) {
    recentApprovedLessonReports(limit: $limit) {
      id
      classInstanceId
      studentId
      teacherId
      teacherName
      studentName
      subjectName
      classAvatarUrl
      lessonDate
      durationMinutes
      attendanceEvaluation
      teacherNotes
      studentNotes
      completionPercentage
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;

export const studentRecentLessonReportsQueryDocument: TypedDocumentNode<
  Operations.StudentRecentLessonReportsQuery,
  Types.QueryStudentRecentLessonReportsArgs
> = gql`
  query StudentRecentLessonReports($paginationArgs: PaginationArgs) {
    studentRecentLessonReports(paginationArgs: $paginationArgs) {
      totalCount
      rows {
        id
        classInstanceId
        studentId
        teacherId
        teacherName
        studentName
        subjectName
        classAvatarUrl
        lessonDate
        durationMinutes
        attendanceEvaluation
        teacherNotes
        studentNotes
        completionPercentage
        status
        submittedByUserId
        submittedAt
        reviewedByUserId
        reviewedAt
        rejectionReason
        idempotencyKey
        createdAt
        updatedAt
      }
    }
  }
`;

export const lessonReportCountQueryDocument: TypedDocumentNode<
  Operations.LessonReportCountQuery,
  Types.QueryLessonReportCountArgs
> = gql`
  query LessonReportCount($teacherId: ID, $studentId: ID) {
    lessonReportCount(teacherId: $teacherId, studentId: $studentId) {
      pendingCount
    }
  }
`;

export const submitLessonReportMutationDocument: TypedDocumentNode<
  Operations.SubmitLessonReportMutation,
  Types.MutationSubmitLessonReportArgs
> = gql`
  mutation SubmitLessonReport($classInstanceId: ID!, $input: LessonReportSubmitInput!) {
    submitLessonReport(classInstanceId: $classInstanceId, input: $input) {
      id
      classInstanceId
      studentId
      teacherId
      teacherName
      studentName
      subjectName
      classAvatarUrl
      lessonDate
      durationMinutes
      attendanceEvaluation
      teacherNotes
      studentNotes
      completionPercentage
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;

export const approveLessonReportMutationDocument: TypedDocumentNode<
  Operations.ApproveLessonReportMutation,
  Types.MutationApproveLessonReportArgs
> = gql`
  mutation ApproveLessonReport($reportId: ID!) {
    approveLessonReport(reportId: $reportId) {
      id
      classInstanceId
      studentId
      teacherId
      teacherName
      studentName
      subjectName
      classAvatarUrl
      lessonDate
      durationMinutes
      attendanceEvaluation
      teacherNotes
      studentNotes
      completionPercentage
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;

export const rejectLessonReportMutationDocument: TypedDocumentNode<
  Operations.RejectLessonReportMutation,
  Types.MutationRejectLessonReportArgs
> = gql`
  mutation RejectLessonReport($reportId: ID!, $rejectionReason: String!) {
    rejectLessonReport(reportId: $reportId, rejectionReason: $rejectionReason) {
      id
      classInstanceId
      studentId
      teacherId
      teacherName
      studentName
      subjectName
      classAvatarUrl
      lessonDate
      durationMinutes
      attendanceEvaluation
      teacherNotes
      studentNotes
      completionPercentage
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;

export const submitStudentReflectionMutationDocument: TypedDocumentNode<
  Operations.SubmitStudentLessonReportReflectionMutation,
  Types.MutationSubmitStudentLessonReportReflectionArgs
> = gql`
  mutation SubmitStudentLessonReportReflection($classInstanceId: ID!, $studentNotes: String!) {
    submitStudentLessonReportReflection(classInstanceId: $classInstanceId, studentNotes: $studentNotes) {
      id
      classInstanceId
      studentId
      teacherId
      teacherName
      studentName
      subjectName
      classAvatarUrl
      lessonDate
      durationMinutes
      attendanceEvaluation
      teacherNotes
      studentNotes
      completionPercentage
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;
