import type { Theme } from "@mui/material/styles";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { type ExpenseQuery_expense, ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export type ExpenseDetail = ExpenseQuery_expense;

export const EXPENSE_DETAIL_PAPER_SX = { width: { xs: "100%", sm: 460 }, maxWidth: "100%" } as const;

export const EXPENSE_DETAIL_SUMMARY_GRID_SX = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

export const EXPENSE_DETAIL_FULL_WIDTH_SX = { gridColumn: "1 / -1" } as const;

export const EXPENSE_DETAIL_HEADER_SX = (theme: Theme) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 1,
  px: 2.5,
  py: 2,
  borderBottom: `1px solid ${theme.palette.divider}`,
});

/** Localized label for an expense type, so badge cells carry the full copy. */
export function expenseTypeLabel(labels: ExpensesLabels, type: ExpenseType): string {
  const labelsByType: Record<ExpenseType, string> = {
    [ExpenseType.Salaries]: labels.type.Salaries,
    [ExpenseType.Marketing]: labels.type.Marketing,
    [ExpenseType.Logistics]: labels.type.Logistics,
    [ExpenseType.Technology]: labels.type.Technology,
  };
  return labelsByType[type];
}

/** Null-safe wrapper: renders the not-set label when the record lacks the timestamp. */
export function formatOptionalDate(value: string | null, locale: string, notSet: string): string {
  return value === null ? notSet : formatDate(value, locale, notSet);
}
