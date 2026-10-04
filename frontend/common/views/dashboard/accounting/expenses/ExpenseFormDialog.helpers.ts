import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ExpenseFormViewModel } from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel";

/** HTML id of the dialog form so the submit button in DialogActions can target it. */
export const EXPENSE_FORM_ID = "expense-form";

export const EXPENSE_FORM_GRID_SX = {
  display: "grid",
  gap: 2,
  pt: 1,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

export const EXPENSE_FULL_WIDTH_CELL_SX = { gridColumn: "1 / -1" } as const;

/**
 * All selectable expense types; Salaries stays listed but disabled because
 * the create contract rejects it — salaries are written only by the carryover
 * settlement flow, and the disabled row with the hint explains where.
 */
export const EXPENSE_FORM_TYPES: readonly ExpenseType[] = Object.values(ExpenseType);

export type ExpenseFormControl = ExpenseFormViewModel["form"]["control"];

export function isExpenseType(value: unknown): value is ExpenseType {
  return typeof value === "string" && (EXPENSE_FORM_TYPES as readonly string[]).includes(value);
}
