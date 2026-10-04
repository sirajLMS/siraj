import { z } from "zod";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type { CurrencyCode, ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Column ceilings enforced server-side on `expenses.title` / `expenses.note`, mirrored so typing stops early. */
export const EXPENSE_TITLE_MAX_LENGTH = 200;
export const EXPENSE_NOTE_MAX_LENGTH = 2_000;

/** Decimal shape the amount field accepts: up to 12 integer digits plus 2 decimals. */
const AMOUNT_PATTERN = /^\d{1,12}(?:\.\d{1,2})?$/;

/**
 * Client mirror of the server-side expense form rules: title required and
 * capped, value a non-negative decimal amount, currency required, payment date
 * a valid calendar date, expense month a valid year-month. Messages come from
 * the expenses namespace so both locales render.
 */
interface ExpenseValidationCopy {
  readonly titleRequired: string;
  readonly titleTooLong: string;
  readonly typeRequired: string;
  readonly valueRequired: string;
  readonly valueNegative: string;
  readonly valueInvalid: string;
  readonly currencyRequired: string;
  readonly expenseDateInvalid: string;
  readonly paymentDateInvalid: string;
  readonly noteTooLong: string;
}

function addTextIssues(values: ExpenseFormData, copy: ExpenseValidationCopy, ctx: z.RefinementCtx) {
  if (values.title.trim() === "") {
    ctx.addIssue({ code: "custom", message: copy.titleRequired, path: ["title"] });
  }
  if (values.type === null) {
    ctx.addIssue({ code: "custom", message: copy.typeRequired, path: ["type"] });
  }
  if (values.expenseCurrency === null) {
    ctx.addIssue({ code: "custom", message: copy.currencyRequired, path: ["expenseCurrency"] });
  }
}

function addValueIssues(values: ExpenseFormData, copy: ExpenseValidationCopy, ctx: z.RefinementCtx) {
  const raw = values.expenseValue.trim();
  if (raw === "") {
    ctx.addIssue({ code: "custom", message: copy.valueRequired, path: ["expenseValue"] });
    return;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    ctx.addIssue({ code: "custom", message: copy.valueInvalid, path: ["expenseValue"] });
    return;
  }
  if (parsed < 0) {
    ctx.addIssue({ code: "custom", message: copy.valueNegative, path: ["expenseValue"] });
    return;
  }
  if (!AMOUNT_PATTERN.test(raw)) {
    ctx.addIssue({ code: "custom", message: copy.valueInvalid, path: ["expenseValue"] });
  }
}

/** A picker can hand over an invalid Date (unparseable keystrokes); those read as "missing". */
function asValidDate(value: Date | null): Date | null {
  if (value === null) return null;
  return Number.isNaN(value.getTime()) ? null : value;
}

function addDateIssues(values: ExpenseFormData, copy: ExpenseValidationCopy, ctx: z.RefinementCtx) {
  if (asValidDate(values.paymentDate) === null) {
    ctx.addIssue({ code: "custom", message: copy.paymentDateInvalid, path: ["paymentDate"] });
  }
  if (asValidDate(values.expenseMonth) === null) {
    ctx.addIssue({ code: "custom", message: copy.expenseDateInvalid, path: ["expenseMonth"] });
  }
}

export function createExpenseFormSchema(copy: ExpenseValidationCopy) {
  return z
    .object({
      title: z.string().max(EXPENSE_TITLE_MAX_LENGTH, copy.titleTooLong),
      type: z.custom<ExpenseType | null>(value => value === null || typeof value === "string"),
      teacher: z.custom<PersonOption | null>(value => value === null || typeof value === "object"),
      expenseValue: z.string(),
      expenseCurrency: z.custom<CurrencyCode | null>(value => value === null || typeof value === "string"),
      paymentDate: z.custom<Date | null>(value => value === null || value instanceof Date),
      /** Calendar Date chosen through the month picker; serialized to `YYYY-MM` on submit. */
      expenseMonth: z.custom<Date | null>(value => value === null || value instanceof Date),
      note: z.string().max(EXPENSE_NOTE_MAX_LENGTH, copy.noteTooLong),
    })
    .superRefine((values, ctx) => {
      addTextIssues(values, copy, ctx);
      addValueIssues(values, copy, ctx);
      addDateIssues(values, copy, ctx);
    });
}

export type ExpenseFormInput = z.input<ReturnType<typeof createExpenseFormSchema>>;
export type ExpenseFormData = z.output<ReturnType<typeof createExpenseFormSchema>>;

/** Post-validation view of the form where the required select fields are non-null. */
export type ValidExpenseData = Omit<ExpenseFormData, "type" | "expenseCurrency" | "paymentDate" | "expenseMonth"> & {
  readonly type: ExpenseType;
  readonly expenseCurrency: CurrencyCode;
  readonly paymentDate: Date;
  readonly expenseMonth: Date;
};

export function isValidExpenseData(data: ExpenseFormData): data is ValidExpenseData {
  return (
    data.type !== null &&
    data.expenseCurrency !== null &&
    asValidDate(data.paymentDate) !== null &&
    asValidDate(data.expenseMonth) !== null
  );
}

/** Collects the localizable validation messages the schema resolver renders. */
export function buildValidationCopy(labels: ExpensesLabels): ExpenseValidationCopy {
  return {
    titleRequired: labels.validation.titleRequired,
    titleTooLong: labels.validation.titleTooLong,
    typeRequired: labels.validation.typeRequired,
    valueRequired: labels.validation.valueRequired,
    valueNegative: labels.validation.valueNegative,
    valueInvalid: labels.validation.valueInvalid,
    currencyRequired: labels.validation.currencyRequired,
    expenseDateInvalid: labels.validation.expenseDateInvalid,
    paymentDateInvalid: labels.validation.paymentDateInvalid,
    noteTooLong: labels.validation.noteTooLong,
  };
}
