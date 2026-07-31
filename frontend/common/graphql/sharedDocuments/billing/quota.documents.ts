import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const quotaQueryDocument: TypedDocumentNode<Operations.QuotaQuery, Types.QueryQuotaArgs> = gql`
  query Quota($id: ID!) {
    quota(id: $id) {
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
      version
      createdAt
      updatedAt
    }
  }
`;

export const quotasQueryDocument: TypedDocumentNode<Operations.QuotasQuery, Types.QueryQuotasArgs> = gql`
  query Quotas($filter: QuotaPaginatedFilterInput, $pagination: PaginationArgs) {
    quotas(filter: $filter, pagination: $pagination) {
      rows {
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
        version
        createdAt
        updatedAt
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
  mutation CreateQuota($input: QuotaSubmitInput!) {
    createQuota(input: $input) {
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
      version
      createdAt
      updatedAt
    }
  }
`;

export const updateQuotaMutationDocument: TypedDocumentNode<
  Operations.UpdateQuotaMutation,
  Types.MutationUpdateQuotaArgs
> = gql`
  mutation UpdateQuota($id: ID!, $input: QuotaUpdateInput!) {
    updateQuota(id: $id, input: $input) {
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
      version
      createdAt
      updatedAt
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
