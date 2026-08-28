import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  MyPaymentsLedgerQuery,
  MyPaymentsLedgerQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const myPaymentsLedgerQueryDocument: TypedDocumentNode<MyPaymentsLedgerQuery, MyPaymentsLedgerQueryVariables> =
  gql`
  query MyPaymentsLedger {
    myPaymentsLedger {
      id
      studentId
      studentName
      creditsPurchased
      creditHours
      amount
      currency
      packageName
      paymentGateway
      paymentDate
    }
  }
`;
