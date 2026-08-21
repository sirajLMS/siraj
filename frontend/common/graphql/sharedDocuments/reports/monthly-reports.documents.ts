import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  StudentMonthlyReportQuery,
  StudentMonthlyReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const studentMonthlyReportQueryDocument: TypedDocumentNode<
  StudentMonthlyReportQuery,
  StudentMonthlyReportQueryVariables
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
