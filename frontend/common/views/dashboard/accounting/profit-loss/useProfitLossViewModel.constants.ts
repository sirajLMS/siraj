import type { FxWarning } from "@/backend/types";
import type {
  ProfitLossExpensesPage,
  ProfitLossIncomePage,
  ProfitLossPaymentsPage,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel.types";

/** Stable empty pages rendered while the first fetch is in flight. */
export const EMPTY_PAYMENTS_PAGE: ProfitLossPaymentsPage = { rows: [], totalCount: 0, aggregate: null };
export const EMPTY_EXPENSES_PAGE: ProfitLossExpensesPage = { rows: [], totalCount: 0, aggregate: null };
export const EMPTY_INCOME_PAGE: ProfitLossIncomePage = { rows: [], totalCount: 0, aggregate: null };
export const EMPTY_FX_WARNINGS: readonly FxWarning[] = [];
