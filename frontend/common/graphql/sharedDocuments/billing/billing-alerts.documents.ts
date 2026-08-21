import { gql, type TypedDocumentNode } from "@apollo/client";
import type { UnpaidInvoicesAlertQuery } from "@/frontend/common/graphql/generated/gql/graphql";

export const unpaidInvoicesAlertQueryDocument: TypedDocumentNode<UnpaidInvoicesAlertQuery> = gql`
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
