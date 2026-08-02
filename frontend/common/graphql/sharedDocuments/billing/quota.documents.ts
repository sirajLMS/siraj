import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

const QuotaFieldsFragment = gql`
  fragment QuotaFields on Quota {
    id
    studentId
    name
    kind
    totalClasses
    remaining
    reservedClasses
    validFrom
    validUntil
    status
    periodType
    periodDays
    priority
    createdAt
    updatedAt
  }
`;

export const quotaQueryDocument: TypedDocumentNode<Operations.QuotaQuery, Types.QueryQuotaArgs> = gql`
  ${QuotaFieldsFragment}
  query Quota($id: ID!) {
    quota(id: $id) {
      ...QuotaFields
    }
  }
`;

export const quotasQueryDocument: TypedDocumentNode<Operations.QuotasQuery, Types.QueryQuotasArgs> = gql`
  ${QuotaFieldsFragment}
  query Quotas($filter: QuotaPaginatedFilterInput, $pagination: PaginationArgs) {
    quotas(filter: $filter, pagination: $pagination) {
      rows {
        ...QuotaFields
      }
      totalCount
    }
  }
`;

export const quotaLedgerQueryDocument: TypedDocumentNode<Operations.QuotaLedgerQuery, Types.QueryQuotaLedgerArgs> = gql`
  query QuotaLedger($quotaId: ID!, $pagination: PaginationArgs) {
    quotaLedger(quotaId: $quotaId, pagination: $pagination) {
      rows {
        id
        quotaId
        studentId
        recurringScheduleId
        classInstanceId
        delta
        reason
        reasonNote
        actorUserId
        createdAt
      }
      totalCount
    }
  }
`;

export const createQuotaMutationDocument: TypedDocumentNode<
  Operations.CreateQuotaMutation,
  Types.MutationCreateQuotaArgs
> = gql`
  ${QuotaFieldsFragment}
  mutation CreateQuota($input: QuotaSubmitInput!) {
    createQuota(input: $input) {
      ...QuotaFields
    }
  }
`;

export const updateQuotaMutationDocument: TypedDocumentNode<
  Operations.UpdateQuotaMutation,
  Types.MutationUpdateQuotaArgs
> = gql`
  ${QuotaFieldsFragment}
  mutation UpdateQuota($id: ID!, $input: QuotaUpdateInput!) {
    updateQuota(id: $id, input: $input) {
      ...QuotaFields
    }
  }
`;

export const deleteQuotaMutationDocument: TypedDocumentNode<
  Operations.DeleteQuotaMutation,
  Types.MutationDeleteQuotaArgs
> = gql`
  mutation DeleteQuota($id: ID!) {
    deleteQuota(id: $id) {
      id
      studentId
      name
      kind
      status
    }
  }
`;

export const studentQuotasQueryDocument: TypedDocumentNode<
  Operations.StudentQuotasQuery,
  Types.QueryStudentQuotasArgs
> = gql`
  ${QuotaFieldsFragment}
  query StudentQuotas($studentId: ID!) {
    studentQuotas(studentId: $studentId) {
      ...QuotaFields
    }
  }
`;

export const studentOpenQuotasQueryDocument: TypedDocumentNode<
  Operations.StudentOpenQuotasQuery,
  Types.QueryStudentOpenQuotasArgs
> = gql`
  ${QuotaFieldsFragment}
  query StudentOpenQuotas($studentId: ID!) {
    studentOpenQuotas(studentId: $studentId) {
      ...QuotaFields
    }
  }
`;

export const quotaBalanceQueryDocument: TypedDocumentNode<Operations.QuotaBalanceQuery, Types.QueryQuotaBalanceArgs> =
  gql`
  query QuotaBalance($studentId: ID!) {
    quotaBalance(studentId: $studentId) {
      id
      studentId
      totalActiveClasses
      totalRemaining
      totalReserved
      breakdownByExpiration {
        quotaId
        quotaName
        remaining
        validUntil
      }
    }
  }
`;
