import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  SessionAuditReportQuery,
  SessionAuditReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const sessionAuditReportQueryDocument: TypedDocumentNode<
  SessionAuditReportQuery,
  SessionAuditReportQueryVariables
> = gql`
  query SessionAuditReport(
    $filter: SessionAuditReportFilter
    $sort: SessionAuditReportSort
    $limit: Int
    $offset: Int
  ) {
    sessionAuditReport(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
      id
      rows {
        id
        instanceId
        scheduledStartAt
        scheduledEndAt
        durationMinutes
        actualStartAt
        actualEndAt
        bookingTimezone
        currentStatus
        calculatedDuration
        teacherPaidAmount
        teacherPaidCurrency
        calculationStatus
        isPartialPercentage
        payrollNote
        teacherId
        teacherName
        studentId
        studentName
        subjectName
        teacherDuePaymentDate
      }
      totalCount
      aggregates {
        id
        rowCountByStatus
        rowCountByPaid
        totalPaidAmount
        totalPaidCurrency
      }
    }
  }
`;
