import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

/**
 * Query: Generate Attendance Report
 * Fetches dynamic aggregations of class instances grouped by Day or Teacher.
 * Warning: Financial columns (totalHours, paidEGP, paidUSD) will return '0'
 * if the user lacks the 'report.view_financials' permission.
 */
export const generateAttendanceReportQueryDocument: TypedDocumentNode<
  Operations.GenerateAttendanceReportQuery,
  Types.QueryGenerateAttendanceReportArgs
> = gql`
  query GenerateAttendanceReport($filters: AttendanceReportFiltersInput!) {
    generateAttendanceReport(filters: $filters) {
      id
      groupKey
      groupLabel
      takenClasses
      absentClasses
      leaveClasses
      pendingClasses
      totalHours
      paidEGP
      paidUSD
    }
  }
`;
