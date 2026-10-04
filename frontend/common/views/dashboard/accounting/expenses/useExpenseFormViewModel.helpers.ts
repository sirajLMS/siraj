import { format, isValid, parse } from "date-fns";
import { formatDateInput, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import {
  type CreateExpenseInput,
  type ExpensesQuery_expenses_rows,
  ExpenseType,
  type UpdateExpenseInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/frontend/common/views/dashboard/accounting/__shared__";
import type {
  ExpenseFormInput,
  ValidExpenseData,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.schema";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Terminal domain rejections mapped onto inline field errors instead of toasts. */
const SALARIES_CREATE_ERROR_CODE = "EXPENSE_SALARIES_VIA_CARRYOVER_ONLY";
const TYPE_IMMUTABLE_ERROR_CODE = "EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES";
const VALUE_IMMUTABLE_ERROR_CODE = "EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES";

/** Root field holding the expense ledger page; dropped from the cache after writes. */
export const EXPENSES_LIST_FIELD = "expenses";

/** Display + wire format for the accounting-month picker (year-month only). */
const EXPENSE_MONTH_FORMAT = "yyyy-MM";

/** Editable snapshot of an existing expense; `null` on the dialog props means add mode. */
export type ExpenseFormRow = Pick<
  ExpensesQuery_expenses_rows,
  | "id"
  | "title"
  | "type"
  | "teacherId"
  | "teacherName"
  | "expenseValue"
  | "expenseCurrency"
  | "paymentDate"
  | "expenseDate"
  | "note"
>;

function buildTeacherOption(row: ExpenseFormRow): PersonOption | null {
  if (row.teacherId === null) return null;
  return { id: row.teacherId, name: row.teacherName ?? "", avatarUrl: null };
}

/** Parses the stored `YYYY-MM` accounting month into a calendar date for the month picker. */
function parseExpenseMonth(expenseDate: string | null): Date | null {
  if (expenseDate === null || expenseDate === "") return null;
  const parsed = parse(expenseDate, EXPENSE_MONTH_FORMAT, new Date());
  if (!isValid(parsed)) return null;
  return parsed;
}

/**
 * Fresh form values for a dialog session: blank for add mode, prefilled from
 * the expense snapshot in edit mode.
 */
export function buildFormDefaults(row: ExpenseFormRow | null): ExpenseFormInput {
  return {
    title: row?.title ?? "",
    type: row?.type ?? null,
    teacher: row === null ? null : buildTeacherOption(row),
    expenseValue: row?.expenseValue ?? "",
    expenseCurrency: row?.expenseCurrency ?? null,
    paymentDate: parseDateInput(row?.paymentDate),
    expenseMonth: parseExpenseMonth(row?.expenseDate ?? null),
    note: row?.note ?? "",
  };
}

/** Omitted (null) when blank so an untouched optional field never reaches the wire. */
function toOptionalText(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

/** Editable fields shared by the create payload and the update patch. */
function buildEditableExpenseFields(data: ValidExpenseData) {
  return {
    title: data.title.trim(),
    expenseValue: data.expenseValue.trim(),
    expenseCurrency: data.expenseCurrency,
    paymentDate: formatDateInput(data.paymentDate),
    expenseDate: format(data.expenseMonth, EXPENSE_MONTH_FORMAT),
    note: toOptionalText(data.note),
  };
}

export function buildCreateExpenseInput(data: ValidExpenseData, clientRequestId: string): CreateExpenseInput {
  return {
    ...buildEditableExpenseFields(data),
    type: data.type,
    teacherId: data.teacher === null ? null : data.teacher.id,
    clientRequestId,
  };
}

/** Type and value stay off the patch for Salaries rows; the server rejects changing them. */
export function buildUpdateExpenseInput(data: ValidExpenseData, row: ExpenseFormRow, id: string): UpdateExpenseInput {
  const isSalaries = row.type === ExpenseType.Salaries;
  return {
    id,
    ...buildEditableExpenseFields(data),
    type: isSalaries ? null : data.type,
    expenseValue: isSalaries ? null : data.expenseValue.trim(),
    // The name snapshot rides along with the id so a teacher change updates both.
    teacherId: data.teacher === null ? null : data.teacher.id,
    teacherName: data.teacher === null ? null : data.teacher.name,
  };
}

export { getGraphQLErrorCode, getGraphQLErrorMessage };

/**
 * Maps a terminal domain error code onto the inline field error it belongs to,
 * or null when the rejection should surface as a toast instead.
 */
export function resolveSubmitFieldError(
  code: string | undefined,
  error: unknown,
  labels: ExpensesLabels
): { readonly field: "type" | "expenseValue"; readonly message: string } | null {
  if (code === SALARIES_CREATE_ERROR_CODE) {
    return { field: "type", message: getGraphQLErrorMessage(error) ?? labels.error.typeImmutableForSalaries };
  }
  if (code === TYPE_IMMUTABLE_ERROR_CODE) {
    return { field: "type", message: labels.error.typeImmutableForSalaries };
  }
  if (code === VALUE_IMMUTABLE_ERROR_CODE) {
    return { field: "expenseValue", message: labels.error.valueImmutableForSalaries };
  }
  return null;
}
