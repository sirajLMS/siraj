import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const studentMonthlyReportQueryDocument: TypedDocumentNode<
  Operations.StudentMonthlyReportQuery,
  Types.QueryStudentMonthlyReportArgs
> = gql`
  query StudentMonthlyReport($studentId: ID!, $year: Int!, $month: Int!) {
    studentMonthlyReport(studentId: $studentId, year: $year, month: $month) {
      id
      studentId
      studentName
      year
      month
      totalLessons
      completedLessons
      cancelledLessons
      presentCount
      absentCount
      lateCount
      totalHours
      creditsPurchased
      creditsDeducted
      creditsRefunded
      creditsBalance
    }
  }
`;
