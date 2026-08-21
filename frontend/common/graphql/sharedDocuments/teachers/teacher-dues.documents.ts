import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  MarkTeacherDuesPaidMutation,
  MarkTeacherDuesPaidMutationVariables,
  TeacherMonthlyReportQuery,
  TeacherMonthlyReportQueryVariables,
  TeacherPendingDuesQuery,
  TeacherPendingDuesQueryVariables,
  TeacherPendingDuesSummaryQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const teacherPendingDuesQueryDocument: TypedDocumentNode<
  TeacherPendingDuesQuery,
  TeacherPendingDuesQueryVariables
> = gql`
  query TeacherPendingDues($teacherId: ID) {
    teacherPendingDues(teacherId: $teacherId) {
      id
      teacherId
      teacherName
      teacherUserId
      teacherAvatarUrl
      classInstanceId
      studentId
      studentName
      studentAvatarUrl
      classDate
      hours
      amount
      currency
      status
      approvedByUserId
      approvedAt
      teacherPaymentId
      createdAt
      updatedAt
      rateSource
    }
  }
`;

export const teacherPendingDuesSummaryQueryDocument: TypedDocumentNode<TeacherPendingDuesSummaryQuery> = gql`
  query TeacherPendingDuesSummary {
    teacherPendingDuesSummary {
      totalCount
      totalAmount
      currency
    }
  }
`;

export const teacherMonthlyReportQueryDocument: TypedDocumentNode<
  TeacherMonthlyReportQuery,
  TeacherMonthlyReportQueryVariables
> = gql`
  query TeacherMonthlyReport($teacherId: ID!, $year: Int!, $month: Int!) {
    teacherMonthlyReport(teacherId: $teacherId, year: $year, month: $month) {
      id
      teacherId
      teacherName
      year
      month
      lessonsTaught
      approvedCount
      cancelledCount
      totalAccruedHours
      totalDueAmount
      totalPaidAmount
      currency
    }
  }
`;

export const markTeacherDuesPaidMutationDocument: TypedDocumentNode<
  MarkTeacherDuesPaidMutation,
  MarkTeacherDuesPaidMutationVariables
> = gql`
  mutation MarkTeacherDuesPaid($dueIds: [ID!]!, $teacherPaymentId: ID!) {
    markTeacherDuesPaid(dueIds: $dueIds, teacherPaymentId: $teacherPaymentId) {
      id
      teacherId
      teacherName
      teacherUserId
      teacherAvatarUrl
      classInstanceId
      studentId
      studentName
      studentAvatarUrl
      classDate
      hours
      amount
      currency
      status
      approvedByUserId
      approvedAt
      teacherPaymentId
      createdAt
      updatedAt
    }
  }
`;
