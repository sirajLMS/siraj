import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  InvoicePaymentsQuery,
  InvoicePaymentsQueryVariables,
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
