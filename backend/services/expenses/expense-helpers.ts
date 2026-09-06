import { ExpenseType } from "@/backend/enum";
import { DomainError, ValidationError } from "@/backend/lib";
import type { CreateExpenseInput, ExpenseSelectType, ExpenseUpdatePatch, UpdateExpenseInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

/** Column limits mirrored from the `expenses` table definition. */
export const EXPENSE_TITLE_MAX_LENGTH = 200;
export const EXPENSE_TEACHER_NAME_MAX_LENGTH = 200;
export const EXPENSE_NOTE_MAX_LENGTH = 2_000;
export const EXPENSE_DELETE_REASON_MAX_LENGTH = 500;

const MINOR_UNITS_BASE = 100n;

/** Canonical hyphenated uuid shape; anything else cannot name a row in the uuid-typed id columns. */
const UUID_CANONICAL_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ISO calendar date (payment date) and accounting-month (expense date) formats. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EXPENSE_MONTH_PATTERN = /^\d{4}-\d{2}$/;

/** Two-decimal non-negative money shape; negative or malformed amounts are rejected. */
const AMOUNT_PATTERN = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

/** Fallback aggregate currency when a filtered page carries no rows. */
const FALLBACK_REPORT_CURRENCY = CurrencyCode.SAR;

/**
 * Rejects malformed identifiers before they reach the query layer: the uuid
 * columns would reject them with a raw database syntax error, leaking a 500
 * where a plain not-found is the correct contract.
 */
export function assertExpenseIdShape(id: string, tErrors: ErrorsLabels): void {
  if (!UUID_CANONICAL_PATTERN.test(id)) {
    throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
  }
}

/** Optional foreign-key id: only the shape is checked; absence is valid. */
export function assertOptionalUuidShape(id: string | null | undefined, error: () => Error): void {
  if (id != null && !UUID_CANONICAL_PATTERN.test(id)) {
    throw error();
  }
}

function assertAmountShape(amount: string, tErrors: ErrorsLabels): void {
  const match = AMOUNT_PATTERN.exec(amount.trim());
  if (match == null) {
    throw new ValidationError(tErrors.expenses.valueInvalid);
  }
  if (match[1] === "-") {
    throw new ValidationError(tErrors.expenses.valueNegative);
  }
}

function assertPaymentDateShape(paymentDate: string, tErrors: ErrorsLabels): void {
  if (!ISO_DATE_PATTERN.test(paymentDate)) {
    throw new DomainError("PAYMENT_DATE_INVALID", tErrors.expenses.paymentDateInvalid);
  }
}

function assertExpenseMonthShape(expenseDate: string, tErrors: ErrorsLabels): void {
  if (!EXPENSE_MONTH_PATTERN.test(expenseDate)) {
    throw new DomainError("EXPENSE_DATE_INVALID", tErrors.expenses.expenseDateInvalid);
  }
}

/** Full validation for the create entry points (manual and internal settlement writes). */
export function validateCreateInput(input: CreateExpenseInput, tErrors: ErrorsLabels): void {
  if (!input.title?.trim()) {
    throw new ValidationError(tErrors.expenses.titleRequired);
  }
  if (!input.expenseValue) {
    throw new ValidationError(tErrors.expenses.valueRequired);
  }
  assertAmountShape(input.expenseValue, tErrors);
  if (!input.expenseCurrency) {
    throw new ValidationError(tErrors.expenses.currencyRequired);
  }
  if (!input.paymentDate) {
    throw new DomainError("PAYMENT_DATE_INVALID", tErrors.expenses.paymentDateInvalid);
  }
  assertPaymentDateShape(input.paymentDate, tErrors);
  if (!input.expenseDate) {
    throw new DomainError("EXPENSE_DATE_INVALID", tErrors.expenses.expenseDateInvalid);
  }
  assertExpenseMonthShape(input.expenseDate, tErrors);
  assertOptionalUuidShape(
    input.teacherId,
    () => new DomainError("TEACHER_NOT_FOUND", tErrors.teacher.teacherNotFound(input.teacherId ?? ""))
  );
  assertOptionalUuidShape(input.sourceEntityId, () => new ValidationError(tErrors.invalidInput));
}

/**
 * Partial-patch validation for the update entry point. Only fields actually
 * present in the patch are validated; a blank title can never become the
 * stored value (the column is NOT NULL), so an empty patch title is rejected.
 */
export function validateUpdateInput(input: UpdateExpenseInput, tErrors: ErrorsLabels): void {
  if (input.title?.trim() === "") {
    throw new ValidationError(tErrors.expenses.titleRequired);
  }
  if (input.expenseValue !== undefined && input.expenseValue !== null) {
    assertAmountShape(input.expenseValue, tErrors);
  }
  if (input.expenseDate != null) {
    assertExpenseMonthShape(input.expenseDate, tErrors);
  }
  if (input.paymentDate != null) {
    assertPaymentDateShape(input.paymentDate, tErrors);
  }
}
/**
 * Previous values of the fields a patch actually changed — the
 * `previousValues` half of the update audit metadata. Fields absent from the
 * patch, or patched to the same value, are omitted.
 */
const PATCH_TRACKED_KEYS = [
  "title",
  "type",
  "expenseValue",
  "expenseCurrency",
  "paymentDate",
  "expenseDate",
  "note",
  "teacherId",
  "teacherName",
] as const satisfies readonly (keyof ExpenseUpdatePatch)[];

export function pickChanged(existing: ExpenseSelectType, patch: ExpenseUpdatePatch): Record<string, unknown> {
  const previous: Record<string, unknown> = {};
  for (const key of PATCH_TRACKED_KEYS) {
    const value = patch[key];
    if (value === undefined) continue;
    if (existing[key] !== value) previous[key] = existing[key];
  }
  return previous;
}

function toMinorUnits(amount: string): bigint | null {
  const match = AMOUNT_PATTERN.exec(amount.trim());
  if (match?.[2] == null) return null;
  const units = BigInt(match[2]) * MINOR_UNITS_BASE + BigInt((match[3] ?? "").padEnd(2, "0"));
  return match[1] === "-" ? -units : units;
}

/**
 * Sums the page's amounts as exact integer minor units (no float drift) and
 * renders the canonical two-decimal string. Rows whose stored amount fails to
 * parse contribute zero — the write path guarantees the shape.
 */
export function sumExpenseValues(rows: readonly { expenseValue: string }[]): string {
  const total = rows.reduce((acc, row) => acc + (toMinorUnits(row.expenseValue) ?? 0n), 0n);
  const sign = total < 0n ? "-" : "";
  const absolute = total < 0n ? -total : total;
  const fraction = `${absolute % MINOR_UNITS_BASE}`.padStart(2, "0");
  return `${sign}${absolute / MINOR_UNITS_BASE}.${fraction}`;
}

/**
 * Currency carried by the most rows on the page. A page with rows always has a
 * leading currency; an empty page falls back so the aggregate type stays
 * non-null.
 */
export function pickDominantExpenseCurrency(rows: readonly { expenseCurrency: CurrencyCode }[]): CurrencyCode {
  const counts = new Map<CurrencyCode, number>();
  for (const row of rows) {
    counts.set(row.expenseCurrency, (counts.get(row.expenseCurrency) ?? 0) + 1);
  }
  let dominant: CurrencyCode | null = null;
  let leadingCount = 0;
  for (const [currency, count] of counts) {
    if (count > leadingCount) {
      dominant = currency;
      leadingCount = count;
    }
  }
  return dominant ?? FALLBACK_REPORT_CURRENCY;
}

/** Row counts bucketed by expense type; every type reports, even at zero. */
export function countExpensesByType(rows: readonly { type: ExpenseType }[]): Record<ExpenseType, number> {
  const counts: Record<ExpenseType, number> = {
    [ExpenseType.SALARIES]: 0,
    [ExpenseType.MARKETING]: 0,
    [ExpenseType.LOGISTICS]: 0,
    [ExpenseType.TECHNOLOGY]: 0,
  };
  for (const row of rows) {
    counts[row.type] += 1;
  }
  return counts;
}
