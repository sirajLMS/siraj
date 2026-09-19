import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ProfitLossReportQuery,
  ProfitLossReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const profitLossReportQueryDocument: TypedDocumentNode<ProfitLossReportQuery, ProfitLossReportQueryVariables> =
  gql`
  query ProfitLossReport(
    $month: String!
    $currency: CurrencyCode!
    $paymentsLimit: Int
    $paymentsOffset: Int
    $expensesLimit: Int
    $expensesOffset: Int
    $incomePaymentsLimit: Int
    $incomePaymentsOffset: Int
  ) {
    profitLossReport(
      month: $month
      currency: $currency
      paymentsLimit: $paymentsLimit
      paymentsOffset: $paymentsOffset
      expensesLimit: $expensesLimit
      expensesOffset: $expensesOffset
      incomePaymentsLimit: $incomePaymentsLimit
      incomePaymentsOffset: $incomePaymentsOffset
    ) {
      id
      month
      currency
      paymentsPage {
        id
        rows {
          id
          instanceId
          scheduledStartAt
          teacherName
          studentName
          subjectName
          durationMinutes
          studentPaidAmount
          studentPaidCurrency
          convertedAmount
          manualSubtractCredits
          manualSubtractCreditsCurrency
          calculationStatus
        }
        totalCount
        aggregate {
          id
          totalPayments
          totalOriginalCurrency
          dominantCurrency
          excludedRowCount
        }
      }
      expensesPage {
        id
        rows {
          id
          title
          type
          teacherName
          expenseValue
          expenseCurrency
          convertedAmount
          paymentDate
          sourceEntity
          sourceEntityId
          note
        }
        totalCount
        aggregate {
          id
          totalExpenses
          dominantCurrency
          excludedRowCount
          rowCountByType
        }
      }
      incomePaymentsPage {
        id
        rows {
          id
          paymentId
          paymentDate
          studentName
          parentName
          amount
          currency
          convertedAmount
          paymentMethodType
          packageName
          invoiceId
        }
        totalCount
        aggregate {
          id
          totalIncomePayments
          dominantCurrency
          excludedRowCount
        }
      }
      profitsSummary {
        id
        totalIncomePayments
        totalPayments
        totalExpenses
        netProfit
        netProfitMargin
        currency
      }
      fxWarnings {
        id
        originalCurrency
        targetCurrency
        rowCount
      }
    }
  }
`;
