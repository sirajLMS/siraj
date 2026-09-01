import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ApplyPayrollOverrideMutation,
  ApplyPayrollOverrideMutationVariables,
  PayrollReportQuery,
  PayrollReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const payrollReportQueryDocument: TypedDocumentNode<PayrollReportQuery, PayrollReportQueryVariables> = gql`
  query PayrollReport($filter: PayrollReportFilter, $limit: Int, $offset: Int) {
    payrollReport(filter: $filter, limit: $limit, offset: $offset) {
      id
      rows {
        id
        instanceId
        scheduledStartAt
        scheduledEndAt
        scheduledDurationMinutes
        actualStartAt
        actualEndAt
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
        subjectId
        subjectName
        isStudentAbsence
        isTeacherAbsence
      }
      totalCount
      aggregates {
        id
        totalPaidAmount
        totalPaidCurrency
        rowCountByStatus
      }
    }
  }
`;

export const applyPayrollOverrideMutationDocument: TypedDocumentNode<
  ApplyPayrollOverrideMutation,
  ApplyPayrollOverrideMutationVariables
> = gql`
  mutation ApplyPayrollOverride($input: PayrollOverrideInput!) {
    applyPayrollOverride(input: $input) {
      id
      instanceId
      calculationStatus
      teacherPaidAmount
      teacherPaidCurrency
      calculatedDuration
      isPartialPercentage
      payrollNote
      auditEventId
    }
  }
`;
