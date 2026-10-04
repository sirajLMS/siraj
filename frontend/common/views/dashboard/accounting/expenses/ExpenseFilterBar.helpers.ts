import { isValid, parse } from "date-fns";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";

/** Delay before settled title text is pushed into the expense filter store. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Title length accepted by both the expenses query and the CSV export route. */
export const TITLE_INPUT_MAX_LENGTH = 200;

/** Type chips previewed inside the collapsed multi-select before the overflow chip. */
export const TYPE_CHIP_PREVIEW_LIMIT = 2;

/** Display + wire format for the expense-month filter (year-month only). */
export const EXPENSE_MONTH_FORMAT = "yyyy-MM";

export const EXPENSE_TYPES: readonly ExpenseType[] = Object.values(ExpenseType);

/** String view of the enum values so the type guard avoids enum/string comparisons. */
const EXPENSE_TYPE_VALUES: readonly string[] = EXPENSE_TYPES;

export function isExpenseType(value: string): value is ExpenseType {
  return EXPENSE_TYPE_VALUES.includes(value);
}

/** Parses the `YYYY-MM` store value into a calendar date for the month picker. */
export function parseExpenseMonth(expenseDate: string): Date | null {
  const parsed = parse(expenseDate, EXPENSE_MONTH_FORMAT, new Date());
  if (!isValid(parsed)) return null;
  return parsed;
}
