import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AccountingPaymentQuery,
  AccountingPaymentQueryVariables,
  AccountingPaymentsQuery,
  AccountingPaymentsQueryVariables,
  ArchivePackagePlanMutation,
  ArchivePackagePlanMutationVariables,
  CreatePackagePlanMutation,
  CreatePackagePlanMutationVariables,
  PackagePlanQuery,
  PackagePlanQueryVariables,
  PackagePlansQuery,
  PackagePlansQueryVariables,
  RecordAccountingPaymentMutation,
  RecordAccountingPaymentMutationVariables,
  StudentCreditHourBalanceQuery,
  StudentCreditHourBalanceQueryVariables,
  ToggleAccountingPaymentPaidStatusMutation,
  ToggleAccountingPaymentPaidStatusMutationVariables,
  UpdateAccountingPaymentMutation,
  UpdateAccountingPaymentMutationVariables,
  UpdatePackagePlanMutation,
  UpdatePackagePlanMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const packagePlansQueryDocument: TypedDocumentNode<PackagePlansQuery, PackagePlansQueryVariables> = gql`
  query PackagePlans($activeOnly: Boolean, $paginationArgs: PaginationArgs) {
    packagePlans(activeOnly: $activeOnly, paginationArgs: $paginationArgs) {
      id
      codename
      displayName
      description
      creditHours
      priceAmount
      currency
      active
      sortOrder
      validityMonths
      version
      createdAt
      updatedAt
    }
  }
`;

export const packagePlanQueryDocument: TypedDocumentNode<PackagePlanQuery, PackagePlanQueryVariables> = gql`
  query PackagePlan($id: ID!) {
    packagePlan(id: $id) {
      id
      codename
      displayName
      description
      creditHours
      priceAmount
      currency
      active
      sortOrder
      validityMonths
      version
      createdAt
      updatedAt
    }
  }
`;

export const accountingPaymentsQueryDocument: TypedDocumentNode<
  AccountingPaymentsQuery,
  AccountingPaymentsQueryVariables
> = gql`
  query AccountingPayments($filter: AccountingPaymentFilterInput, $paginationArgs: PaginationArgs) {
    accountingPayments(filter: $filter, paginationArgs: $paginationArgs) {
      id
      invoiceId
      amount
      currency
      paymentDate
      packagePlanId
      packageCodename
      packageName
      paymentGateway
      creditHours
      isPaidStatusOn
      paymentNote
      studentId
      studentName
      parentId
      parentName
      invoiceStatus
      createdAt
      updatedAt
    }
  }
`;

export const accountingPaymentQueryDocument: TypedDocumentNode<
  AccountingPaymentQuery,
  AccountingPaymentQueryVariables
> = gql`
  query AccountingPayment($id: ID!) {
    accountingPayment(id: $id) {
      id
      invoiceId
      amount
      currency
      paymentDate
      packagePlanId
      packageCodename
      packageName
      paymentGateway
      creditHours
      isPaidStatusOn
      paymentNote
      studentId
      studentName
      parentId
      parentName
      invoiceStatus
      transactionId
      createdAt
      updatedAt
      history {
        id
        kind
        occurredAt
        hoursDelta
        notes
      }
    }
  }
`;

export const studentCreditHourBalanceQueryDocument: TypedDocumentNode<
  StudentCreditHourBalanceQuery,
  StudentCreditHourBalanceQueryVariables
> = gql`
  query StudentCreditHourBalance($studentId: ID!) {
    studentCreditHourBalance(studentId: $studentId) {
      id
      studentId
      creditHoursTotal
      creditHoursRemaining
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createPackagePlanMutationDocument: TypedDocumentNode<
  CreatePackagePlanMutation,
  CreatePackagePlanMutationVariables
> = gql`
  mutation CreatePackagePlan($input: PackagePlanInput!) {
    createPackagePlan(input: $input) {
      id
      codename
      displayName
      description
      creditHours
      priceAmount
      currency
      active
      sortOrder
      version
      createdAt
      updatedAt
    }
  }
`;

export const updatePackagePlanMutationDocument: TypedDocumentNode<
  UpdatePackagePlanMutation,
  UpdatePackagePlanMutationVariables
> = gql`
  mutation UpdatePackagePlan($input: PackagePlanUpdateInput!) {
    updatePackagePlan(input: $input) {
      id
      codename
      displayName
      description
      creditHours
      priceAmount
      currency
      active
      sortOrder
      version
      createdAt
      updatedAt
    }
  }
`;

export const archivePackagePlanMutationDocument: TypedDocumentNode<
  ArchivePackagePlanMutation,
  ArchivePackagePlanMutationVariables
> = gql`
  mutation ArchivePackagePlan($id: ID!) {
    archivePackagePlan(id: $id) {
      id
      codename
      displayName
      active
      version
    }
  }
`;

export const recordAccountingPaymentMutationDocument: TypedDocumentNode<
  RecordAccountingPaymentMutation,
  RecordAccountingPaymentMutationVariables
> = gql`
  mutation RecordAccountingPayment($input: AccountingPaymentInput!) {
    recordAccountingPayment(input: $input) {
      id
      invoiceId
      amount
      currency
      paymentDate
      packagePlanId
      packageCodename
      packageName
      paymentGateway
      creditHours
      isPaidStatusOn
      paymentNote
      studentId
      studentName
      parentId
      parentName
      invoiceStatus
      createdAt
      updatedAt
    }
  }
`;

export const updateAccountingPaymentMutationDocument: TypedDocumentNode<
  UpdateAccountingPaymentMutation,
  UpdateAccountingPaymentMutationVariables
> = gql`
  mutation UpdateAccountingPayment($input: AccountingPaymentEditInput!) {
    updateAccountingPayment(input: $input) {
      id
      invoiceId
      amount
      currency
      paymentDate
      packagePlanId
      packageCodename
      packageName
      paymentGateway
      creditHours
      isPaidStatusOn
      paymentNote
      studentId
      studentName
      parentId
      parentName
      invoiceStatus
      createdAt
      updatedAt
    }
  }
`;

export const toggleAccountingPaymentPaidStatusMutationDocument: TypedDocumentNode<
  ToggleAccountingPaymentPaidStatusMutation,
  ToggleAccountingPaymentPaidStatusMutationVariables
> = gql`
  mutation ToggleAccountingPaymentPaidStatus($input: AccountingPaymentTogglePaidInput!) {
    toggleAccountingPaymentPaidStatus(input: $input) {
      id
      invoiceId
      amount
      currency
      paymentDate
      packagePlanId
      packageCodename
      packageName
      paymentGateway
      creditHours
      isPaidStatusOn
      paymentNote
      studentId
      studentName
      parentId
      parentName
      invoiceStatus
      createdAt
      updatedAt
    }
  }
`;
