import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateTeacherPaymentMutation,
  CreateTeacherPaymentMutationVariables,
  InvoicePaymentsQuery,
  InvoicePaymentsQueryVariables,
  RecordPaymentMutation,
  RecordPaymentMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { PAYMENT_METHOD_TRANSACTION_SNAPSHOT_FIELDS } from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";

export const invoicePaymentsQueryDocument: TypedDocumentNode<InvoicePaymentsQuery, InvoicePaymentsQueryVariables> = gql`
  query InvoicePayments($invoiceId: ID!) {
    invoicePayments(invoiceId: $invoiceId) {
      id
      invoiceId
      amount
      currency
      displayAmount {
        id
        amount
        currency
        stale
      }
      paymentDate
      userPaymentMethodId
      paymentMethodType
      paymentMethodSnapshot {
        ...PaymentMethodTransactionSnapshotFields
      }
      transactionId
      createdAt
    }
  }
  ${PAYMENT_METHOD_TRANSACTION_SNAPSHOT_FIELDS}
`;

export const recordPaymentMutationDocument: TypedDocumentNode<RecordPaymentMutation, RecordPaymentMutationVariables> =
  gql`
  mutation RecordPayment(
    $invoiceId: ID!
    $amount: String!
    $currency: CurrencyCode!
    $userPaymentMethodId: ID!
    $transactionId: String
  ) {
    recordPayment(
      invoiceId: $invoiceId
      amount: $amount
      currency: $currency
      userPaymentMethodId: $userPaymentMethodId
      transactionId: $transactionId
    ) {
      id
      invoiceId
      amount
      currency
      displayAmount {
        id
        amount
        currency
        stale
      }
      paymentDate
      userPaymentMethodId
      paymentMethodType
      paymentMethodSnapshot {
        ...PaymentMethodTransactionSnapshotFields
      }
    }
  }
  ${PAYMENT_METHOD_TRANSACTION_SNAPSHOT_FIELDS}
`;

export const createTeacherPaymentMutationDocument: TypedDocumentNode<
  CreateTeacherPaymentMutation,
  CreateTeacherPaymentMutationVariables
> = gql`
  mutation CreateTeacherPayment(
    $teacherId: ID!
    $amount: String!
    $currency: CurrencyCode!
    $userPaymentMethodId: ID!
    $paymentDate: String
    $isTestPayment: Boolean
  ) {
    createTeacherPayment(
      teacherId: $teacherId
      amount: $amount
      currency: $currency
      userPaymentMethodId: $userPaymentMethodId
      paymentDate: $paymentDate
      isTestPayment: $isTestPayment
    ) {
      id
      teacherId
      amount
      currency
      paymentDate
      userPaymentMethodId
      paymentMethodType
      paymentMethodSnapshot {
        ...PaymentMethodTransactionSnapshotFields
      }
      isTestPayment
    }
  }
  ${PAYMENT_METHOD_TRANSACTION_SNAPSHOT_FIELDS}
`;
