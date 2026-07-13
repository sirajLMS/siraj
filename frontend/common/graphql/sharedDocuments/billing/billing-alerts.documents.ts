import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const unpaidInvoicesAlertQueryDocument: TypedDocumentNode<Operations.UnpaidInvoicesAlertQuery> = gql`
  query unpaidInvoicesAlert {
    unpaidInvoicesAlert {
      id
      totalOverdueInvoices
      totalOverdueAmount
      overdueAmountsByCurrency {
        id
        currency
        amount
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      items {
        id
        userId
        userName
        userEmail
        totalUnpaidAmount
        currency
        overdueCount
        oldestDueDate
        amountsByCurrency {
          id
          currency
          amount
          displayAmount {
            id
            amount
            currency
            stale
          }
        }
      }
    }
  }
`;
