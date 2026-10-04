import type { FxWarning } from "@/backend/types";
import type {
  CurrencyCode,
  ProfitLossReportQuery_profitLossReport_expensesPage,
  ProfitLossReportQuery_profitLossReport_fxWarnings,
  ProfitLossReportQuery_profitLossReport_incomePaymentsPage,
  ProfitLossReportQuery_profitLossReport_paymentsPage,
  ProfitLossReportQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  EMPTY_EXPENSES_PAGE,
  EMPTY_INCOME_PAGE,
  EMPTY_PAYMENTS_PAGE,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.constants";
import type {
  ProfitLossExpensesPage,
  ProfitLossIncomePage,
  ProfitLossPaymentsPage,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.types";
import { CurrencyCode as DomainCurrencyCode } from "@/shared/constants/currency.enum";

interface ReportVariablesArgs {
  readonly month: string;
  readonly currency: ProfitLossReportQueryVariables["currency"];
  readonly pageSize: number;
  readonly paymentsPageIndex: number;
  readonly expensesPageIndex: number;
  readonly incomePageIndex: number;
}

/** Assembles the per-tab page windows the profit & loss report query consumes. */
export function buildReportVariables({
  month,
  currency,
  pageSize,
  paymentsPageIndex,
  expensesPageIndex,
  incomePageIndex,
}: ReportVariablesArgs): ProfitLossReportQueryVariables {
  return {
    month,
    currency,
    paymentsLimit: pageSize,
    paymentsOffset: paymentsPageIndex * pageSize,
    expensesLimit: pageSize,
    expensesOffset: expensesPageIndex * pageSize,
    incomePaymentsLimit: pageSize,
    incomePaymentsOffset: incomePageIndex * pageSize,
  };
}

/** Type guard for the JSON-scalar per-type tallies the API reports as `unknown`. */
function isRowCountByType(value: unknown): value is Readonly<Record<string, number>> {
  if (typeof value !== "object" || value === null) return false;
  for (const key of Object.keys(value)) {
    if (typeof Reflect.get(value, key) !== "number") return false;
  }
  return true;
}

export function toPaymentsPage(
  page: ProfitLossReportQuery_profitLossReport_paymentsPage | null
): ProfitLossPaymentsPage {
  if (page === null) return EMPTY_PAYMENTS_PAGE;
  return { rows: page.rows ?? [], totalCount: page.totalCount ?? 0, aggregate: page.aggregate ?? null };
}

export function toExpensesPage(
  page: ProfitLossReportQuery_profitLossReport_expensesPage | null
): ProfitLossExpensesPage {
  if (page === null) return EMPTY_EXPENSES_PAGE;
  const aggregate =
    page.aggregate == null
      ? null
      : {
          ...page.aggregate,
          rowCountByType: isRowCountByType(page.aggregate.rowCountByType) ? page.aggregate.rowCountByType : {},
        };
  return { rows: page.rows ?? [], totalCount: page.totalCount ?? 0, aggregate };
}

export function toIncomePage(
  page: ProfitLossReportQuery_profitLossReport_incomePaymentsPage | null
): ProfitLossIncomePage {
  if (page === null) return EMPTY_INCOME_PAGE;
  return { rows: page.rows ?? [], totalCount: page.totalCount ?? 0, aggregate: page.aggregate ?? null };
}

const DOMAIN_CURRENCY_CODE_VALUES: readonly string[] = Object.values(DomainCurrencyCode);

function isDomainCurrencyCode(value: string): value is DomainCurrencyCode {
  return DOMAIN_CURRENCY_CODE_VALUES.includes(value);
}

/** Bridges a codegen currency code onto the domain enum via its string value. */
function toDomainCurrencyCode(code: CurrencyCode | null): DomainCurrencyCode | null {
  if (code === null) return null;
  return isDomainCurrencyCode(code) ? code : null;
}

/**
 * Drops warnings with incomplete data (a non-null pair with a row count is
 * guaranteed by the schema, but a partially written cache entry still renders
 * safely) and exposes the rest in the shape the filter bar's chip and
 * tooltip consume. Currency codes are bridged from the codegen enum onto the
 * domain enum — both enumerate the same ISO 4217 value strings.
 */
export function toFxWarnings(
  warnings: readonly ProfitLossReportQuery_profitLossReport_fxWarnings[]
): readonly FxWarning[] {
  return warnings.flatMap(warning => {
    const originalCurrency = toDomainCurrencyCode(warning.originalCurrency);
    const targetCurrency = toDomainCurrencyCode(warning.targetCurrency);
    if (originalCurrency === null || targetCurrency === null || warning.rowCount === null) {
      return [];
    }
    return [{ originalCurrency, targetCurrency, rowCount: warning.rowCount }];
  });
}
