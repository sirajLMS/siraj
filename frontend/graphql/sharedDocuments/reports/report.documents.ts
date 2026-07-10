import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const generateAttendanceReportQueryDocument: TypedDocumentNode<
  Operations.GenerateAttendanceReportQuery,
  Operations.GenerateAttendanceReportQueryVariables
> = gql`
  query GenerateAttendanceReport($filters: AttendanceReportFiltersInput!) {
    generateAttendanceReport(filters: $filters) {
      rows {
        id
        groupKey
        groupLabel
        takenClasses
        absentClasses
        leaveClasses
        pendingClasses
        totalHours
        paidAmounts {
          id
          amount
          currency
          displayAmount {
            id
            amount
            currency
            stale
          }
        }
        engagementGrowth
      }
      engagementGrowth
    }
  }
`;
