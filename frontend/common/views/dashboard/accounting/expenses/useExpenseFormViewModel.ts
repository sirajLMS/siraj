"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { format, isValid, parse } from "date-fns";
import { useCallback, useEffect, useRef } from "react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { formatDateInput, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import {
  type CreateExpenseInput,
  type CurrencyCode,
  type ExpensesQuery_expenses_rows,
  ExpenseType,
  type UpdateExpenseInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createExpenseMutationDocument,
  updateExpenseMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Terminal domain rejections mapped onto inline field errors instead of toasts. */
const SALARIES_CREATE_ERROR_CODE = "EXPENSE_SALARIES_VIA_CARRYOVER_ONLY";
const TYPE_IMMUTABLE_ERROR_CODE = "EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES";
const VALUE_IMMUTABLE_ERROR_CODE = "EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES";

/** Root field holding the expense ledger page; dropped from the cache after writes. */
const EXPENSES_LIST_FIELD = "expenses";

/** Column ceilings enforced server-side on `expenses.title` / `expenses.note`, mirrored so typing stops early. */
export const EXPENSE_TITLE_MAX_LENGTH = 200;
export const EXPENSE_NOTE_MAX_LENGTH = 2_000;

/** Decimal shape the amount field accepts: up to 12 integer digits plus 2 decimals. */
const AMOUNT_PATTERN = /^\d{1,12}(?:\.\d{1,2})?$/;

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

function createExpenseFormSchema(copy: ExpenseValidationCopy) {
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

type ExpenseFormInput = z.input<ReturnType<typeof createExpenseFormSchema>>;
type ExpenseFormData = z.output<ReturnType<typeof createExpenseFormSchema>>;

/** Post-validation view of the form where the required select fields are non-null. */
type ValidExpenseData = Omit<ExpenseFormData, "type" | "expenseCurrency" | "paymentDate" | "expenseMonth"> & {
  readonly type: ExpenseType;
  readonly expenseCurrency: CurrencyCode;
  readonly paymentDate: Date;
  readonly expenseMonth: Date;
};

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
function buildFormDefaults(row: ExpenseFormRow | null): ExpenseFormInput {
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

function buildCreateExpenseInput(data: ValidExpenseData, clientRequestId: string): CreateExpenseInput {
  return {
    ...buildEditableExpenseFields(data),
    type: data.type,
    teacherId: data.teacher === null ? null : data.teacher.id,
    clientRequestId,
  };
}

/** Type and value stay off the patch for Salaries rows; the server rejects changing them. */
function buildUpdateExpenseInput(data: ValidExpenseData, row: ExpenseFormRow, id: string): UpdateExpenseInput {
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

function getGraphQLErrorCode(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Service-level domain errors reach the client with an already-localized
 * message; surface it directly when present.
 */
function getGraphQLErrorMessage(error: unknown): string | null {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0]?.message ?? null;
  if (error instanceof Error && error.message !== "") return error.message;
  return null;
}

function isValidExpenseData(data: ExpenseFormData): data is ValidExpenseData {
  return (
    data.type !== null &&
    data.expenseCurrency !== null &&
    asValidDate(data.paymentDate) !== null &&
    asValidDate(data.expenseMonth) !== null
  );
}

export interface UseExpenseFormViewModelProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Expense snapshot for edit mode; `null` opens the dialog in add mode. */
  readonly row: ExpenseFormRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful write. */
  readonly onClose: () => void;
  /** Runs after a successful create/update so the host page can refresh its queries. */
  readonly onSaved?: () => void;
}

export interface ExpenseFormViewModel {
  readonly form: UseFormReturn<ExpenseFormInput, undefined, ExpenseFormData>;
  readonly labels: ExpensesLabels;
  readonly commonLabels: CommonLabels;
  readonly isEdit: boolean;
  /**
   * Salaries rows are system-settled: on edit the type and value are read-only,
   * and on add the Salaries option is disabled (creation goes through the
   * carryover settlement flow).
   */
  readonly salariesLocked: boolean;
  readonly title: string;
  readonly submitting: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

export function useExpenseFormViewModel({
  open,
  row,
  onClose,
  onSaved,
}: Readonly<UseExpenseFormViewModelProps>): ExpenseFormViewModel {
  const labels = useAppTranslation(DashboardAccountingExpenses);
  const commonLabels = useAppTranslation(Translation.Common);
  const notifications = useNotifications();
  const client = useApolloClient();

  const isEdit = row !== null;
  const salariesLocked = row?.type === ExpenseType.Salaries;
  const validationCopy: ExpenseValidationCopy = {
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

  const form = useForm<ExpenseFormInput, undefined, ExpenseFormData>({
    resolver: zodResolver(createExpenseFormSchema(validationCopy)),
    defaultValues: buildFormDefaults(null),
  });

  // One idempotency token per dialog session: re-opening the dialog starts a
  // fresh write, while retries inside the same session reuse the token so the
  // server-side idempotency window absorbs double submissions. The token also
  // doubles as the update-mode submit guard (update carries no clientRequestId).
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);
  // The effect below seeds the form from the row snapshot at open time; the ref
  // keeps the effect stable against mid-session row identity changes.
  const rowRef = useRef<ExpenseFormRow | null>(row);
  // Declared before the open-reset effect so the ref stays current whenever
  // that effect reads the latest snapshot.
  useEffect(() => {
    rowRef.current = row;
  });

  const [createExpense, { loading: creating }] = useMutation(createExpenseMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const [updateExpense, { loading: updating }] = useMutation(updateExpenseMutationDocument, {
    errorPolicy: "none",
  });

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
    form.reset(buildFormDefaults(rowRef.current));
  }, [open, form]);

  const applySubmitError = useCallback(
    (error: unknown) => {
      const code = getGraphQLErrorCode(error);
      // A Salaries submission means a stale/doctored payload — the UI already
      // disables the option, so these rejections surface inline on the affected
      // field; the create guard carries a server-localized message of its own.
      if (code === SALARIES_CREATE_ERROR_CODE) {
        form.setError("type", {
          message: getGraphQLErrorMessage(error) ?? labels.error.typeImmutableForSalaries,
        });
        return;
      }
      if (code === TYPE_IMMUTABLE_ERROR_CODE) {
        form.setError("type", { message: labels.error.typeImmutableForSalaries });
        return;
      }
      if (code === VALUE_IMMUTABLE_ERROR_CODE) {
        form.setError("expenseValue", { message: labels.error.valueImmutableForSalaries });
        return;
      }
      notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
    },
    [form, labels, notifications, commonLabels]
  );

  const applySubmitSuccess = useCallback(() => {
    // The list query carries aggregates (totals depend on every row), so the
    // whole root field is dropped rather than patching rows in place.
    client.cache.evict({ fieldName: EXPENSES_LIST_FIELD });
    client.cache.gc();
    notifications.show(isEdit ? labels.success.updated : labels.success.created, { severity: "success" });
    onSaved?.();
    onClose();
  }, [client, labels, notifications, isEdit, onSaved, onClose]);

  const handleFormSubmit = useCallback(
    async (data: ExpenseFormData): Promise<void> => {
      const idempotencyToken = clientRequestIdRef.current;
      if (idempotencyToken === null || submittedTokenRef.current === idempotencyToken) return;
      // handleSubmit only runs the resolver-validated payload; this narrowing
      // guards the fallback path and keeps the builders on non-null types.
      if (!isValidExpenseData(data)) return;
      // An edit target without an id is a broken snapshot; refuse silently
      // rather than sending a malformed patch.
      const currentRow = rowRef.current;
      if (currentRow !== null && currentRow.id === null) return;
      submittedTokenRef.current = idempotencyToken;
      try {
        if (currentRow !== null) {
          await updateExpense({
            variables: { input: buildUpdateExpenseInput(data, currentRow, currentRow.id ?? "") },
          });
        } else {
          await createExpense({ variables: { input: buildCreateExpenseInput(data, idempotencyToken) } });
        }
      } catch (error) {
        // Re-arm the guard so the operator can retry in this dialog session; the
        // reused token keeps the retry idempotent server-side.
        submittedTokenRef.current = null;
        applySubmitError(error);
        return;
      }
      applySubmitSuccess();
    },
    [createExpense, updateExpense, applySubmitError, applySubmitSuccess]
  );

  // handleSubmit runs validation on demand; wrapping it keeps the render path
  // free of any ref access until the submit event actually fires.
  const handleSubmitClick = useCallback(() => {
    void form.handleSubmit(handleFormSubmit)();
  }, [form, handleFormSubmit]);

  const typeSelection = useWatch({ control: form.control, name: "type" });

  return {
    form,
    labels,
    commonLabels,
    isEdit,
    salariesLocked,
    title: isEdit ? labels.modal.form.titleEdit : labels.modal.form.titleAdd,
    submitting: creating || updating,
    canSubmit: isEdit || typeSelection !== null,
    onSubmit: handleSubmitClick,
    onCancel: onClose,
  };
}
