import { isSearchWithinLimit, readValidatedParam } from "@/app/api/__shared__/export/export-params.helpers";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { ValidationError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type { ExpenseFilters } from "@/backend/types";
import { isCalendarDate } from "@/shared/lib/datetime/calendar-date";
import { readTrimmedParam } from "@/shared/lib/query-params.helpers";
import type { ErrorsLabels } from "@/shared/locale";

const EXPENSE_TYPE_VALUES: ReadonlySet<string> = new Set<string>(Object.values(ExpenseType));

/** Strict `YYYY-MM` accounting-month check; month must be 01–12. */
function isAccountingMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

function isExpenseType(value: string): value is ExpenseType {
  return EXPENSE_TYPE_VALUES.has(value);
}

/** Reads the `types` multi-value filter (comma-separated, trimmed); absent → null, unknown value → localized 400 error. */
function parseExpenseTypes(searchParams: URLSearchParams, tErrors: ErrorsLabels): ExpenseType[] | null {
  const value = readTrimmedParam(searchParams, "types");
  if (value === null) {
    return null;
  }
  const parsed: ExpenseType[] = [];
  for (const part of value.split(",")) {
    const candidate = part.trim();
    if (!isExpenseType(candidate)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    parsed.push(candidate);
  }
  return parsed;
}

/** Reads the `includeDeleted` flag; absent → null (the service default excludes deleted), anything but `true` or `false` → 400. */
function parseIncludeDeleted(searchParams: URLSearchParams, tErrors: ErrorsLabels): boolean | null {
  const value = readTrimmedParam(searchParams, "includeDeleted");
  if (value === null) {
    return null;
  }
  if (value !== "true" && value !== "false") {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value === "true";
}

/**
 * `includeDeleted` holds for manage-capable callers only; a view-only caller
 * requesting it gets the flag cleared, mirroring the ledger GraphQL query —
 * soft-deleted rows must never surface through one entry point when the
 * other would strip them.
 */
async function resolveIncludeDeleted(
  searchParams: URLSearchParams,
  userId: string,
  tErrors: ErrorsLabels
): Promise<boolean | null> {
  const requested = parseIncludeDeleted(searchParams, tErrors);
  if (requested !== true) {
    return requested;
  }
  return PermissionsService.hasPermission(userId, AppPermission.ACCOUNTING_EXPENSES_MANAGE);
}

/** Maps the export query string onto the expense filter contract; malformed values reject with 400. */
export async function parseExportFilters(
  searchParams: URLSearchParams,
  userId: string,
  tErrors: ErrorsLabels
): Promise<ExpenseFilters> {
  return {
    title: readValidatedParam(searchParams, "title", isSearchWithinLimit, tErrors),
    types: parseExpenseTypes(searchParams, tErrors),
    expenseDate: readValidatedParam(searchParams, "expenseDate", isAccountingMonth, tErrors),
    paymentDateFrom: readValidatedParam(searchParams, "paymentDateFrom", isCalendarDate, tErrors),
    paymentDateTo: readValidatedParam(searchParams, "paymentDateTo", isCalendarDate, tErrors),
    includeDeleted: await resolveIncludeDeleted(searchParams, userId, tErrors),
  };
}
