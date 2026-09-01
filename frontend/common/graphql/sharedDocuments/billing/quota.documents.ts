import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateQuotaMutation,
  CreateQuotaMutationVariables,
  DeleteQuotaMutation,
  DeleteQuotaMutationVariables,
  QuotaLedgerQuery,
  QuotaLedgerQueryVariables,
  QuotaQuery,
  QuotaQueryVariables,
  QuotasQuery,
  QuotasQueryVariables,
  StudentOpenQuotasQuery,
  StudentOpenQuotasQueryVariables,
  StudentQuotasQuery,
  StudentQuotasQueryVariables,
  UpdateQuotaMutation,
  UpdateQuotaMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

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

export const quotaQueryDocument: TypedDocumentNode<QuotaQuery, QuotaQueryVariables> = gql`
  ${QuotaFieldsFragment}
  query Quota($id: ID!) {
    quota(id: $id) {
      ...QuotaFields
    }
  }
`;

export const quotasQueryDocument: TypedDocumentNode<QuotasQuery, QuotasQueryVariables> = gql`
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

export const quotaLedgerQueryDocument: TypedDocumentNode<QuotaLedgerQuery, QuotaLedgerQueryVariables> = gql`
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

export const createQuotaMutationDocument: TypedDocumentNode<CreateQuotaMutation, CreateQuotaMutationVariables> = gql`
  ${QuotaFieldsFragment}
  mutation CreateQuota($input: QuotaSubmitInput!) {
    createQuota(input: $input) {
      ...QuotaFields
    }
  }
`;

export const updateQuotaMutationDocument: TypedDocumentNode<UpdateQuotaMutation, UpdateQuotaMutationVariables> = gql`
  ${QuotaFieldsFragment}
  mutation UpdateQuota($id: ID!, $input: QuotaUpdateInput!) {
    updateQuota(id: $id, input: $input) {
      ...QuotaFields
    }
  }
`;

export const deleteQuotaMutationDocument: TypedDocumentNode<DeleteQuotaMutation, DeleteQuotaMutationVariables> = gql`
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

export const studentQuotasQueryDocument: TypedDocumentNode<StudentQuotasQuery, StudentQuotasQueryVariables> = gql`
  ${QuotaFieldsFragment}
  query StudentQuotas($studentId: ID!) {
    studentQuotas(studentId: $studentId) {
      ...QuotaFields
    }
  }
`;

export const studentOpenQuotasQueryDocument: TypedDocumentNode<
  StudentOpenQuotasQuery,
  StudentOpenQuotasQueryVariables
> = gql`
  ${QuotaFieldsFragment}
  query StudentOpenQuotas($studentId: ID!) {
    studentOpenQuotas(studentId: $studentId) {
      ...QuotaFields
    }
  }
`;
