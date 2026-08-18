import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const teacherPendingDuesQueryDocument: TypedDocumentNode<
  Operations.TeacherPendingDuesQuery,
  Types.QueryTeacherPendingDuesArgs
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

export const teacherPendingDuesSummaryQueryDocument: TypedDocumentNode<Operations.TeacherPendingDuesSummaryQuery> = gql`
  query TeacherPendingDuesSummary {
    teacherPendingDuesSummary {
      totalCount
      totalAmount
      currency
    }
  }
`;

export const teacherMonthlyReportQueryDocument: TypedDocumentNode<
  Operations.TeacherMonthlyReportQuery,
  Types.QueryTeacherMonthlyReportArgs
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
  Operations.MarkTeacherDuesPaidMutation,
  Types.MutationMarkTeacherDuesPaidArgs
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
