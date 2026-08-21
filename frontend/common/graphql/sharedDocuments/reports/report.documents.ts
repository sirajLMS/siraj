import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  GenerateAttendanceReportQuery,
  GenerateAttendanceReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const generateAttendanceReportQueryDocument: TypedDocumentNode<
  GenerateAttendanceReportQuery,
  GenerateAttendanceReportQueryVariables
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
