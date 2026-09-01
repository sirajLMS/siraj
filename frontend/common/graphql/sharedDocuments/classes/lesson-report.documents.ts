import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ApproveLessonReportMutation,
  ApproveLessonReportMutationVariables,
  LessonReportByIdQuery,
  LessonReportByIdQueryVariables,
  PendingLessonReportsQuery,
  PendingLessonReportsQueryVariables,
  RecentApprovedLessonReportsQuery,
  RecentApprovedLessonReportsQueryVariables,
  RejectLessonReportMutation,
  RejectLessonReportMutationVariables,
  StudentRecentLessonReportsQuery,
  StudentRecentLessonReportsQueryVariables,
  SubmitStudentLessonReportReflectionMutation,
  SubmitStudentLessonReportReflectionMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const lessonReportByIdQueryDocument: TypedDocumentNode<LessonReportByIdQuery, LessonReportByIdQueryVariables> =
  gql`
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
      teacherAvatarUrl
      studentAvatarUrl
      teacherUserId
      studentUserId
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
  PendingLessonReportsQuery,
  PendingLessonReportsQueryVariables
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
        teacherAvatarUrl
        studentAvatarUrl
        teacherUserId
        studentUserId
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
  RecentApprovedLessonReportsQuery,
  RecentApprovedLessonReportsQueryVariables
> = gql`
  query RecentApprovedLessonReports($paginationArgs: PaginationArgs) {
    recentApprovedLessonReports(paginationArgs: $paginationArgs) {
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
        teacherAvatarUrl
        studentAvatarUrl
        teacherUserId
        studentUserId
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

export const studentRecentLessonReportsQueryDocument: TypedDocumentNode<
  StudentRecentLessonReportsQuery,
  StudentRecentLessonReportsQueryVariables
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
        teacherAvatarUrl
        studentAvatarUrl
        teacherUserId
        studentUserId
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

export const approveLessonReportMutationDocument: TypedDocumentNode<
  ApproveLessonReportMutation,
  ApproveLessonReportMutationVariables
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
      teacherAvatarUrl
      studentAvatarUrl
      teacherUserId
      studentUserId
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
  RejectLessonReportMutation,
  RejectLessonReportMutationVariables
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
      teacherAvatarUrl
      studentAvatarUrl
      teacherUserId
      studentUserId
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
  SubmitStudentLessonReportReflectionMutation,
  SubmitStudentLessonReportReflectionMutationVariables
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
      teacherAvatarUrl
      studentAvatarUrl
      teacherUserId
      studentUserId
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
