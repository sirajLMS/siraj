import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const unpaidInvoicesAlertQueryDocument: TypedDocumentNode<Operations.UnpaidInvoicesAlertQuery> = gql`
  query unpaidInvoicesAlert {
    unpaidInvoicesAlert {
      id
      totalOverdueInvoices
      totalOverdueAmount
      items {
        id
        userId
        userName
        userEmail
        totalUnpaidAmount
        currency
        overdueCount
        oldestDueDate
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
    }
  }
`;
