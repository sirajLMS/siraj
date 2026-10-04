"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  buildFormDefaults,
  type ExpenseFormRow,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.helpers";
import {
  useExpenseFormSession,
  useExpenseFormSubmit,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.hooks";
import {
  buildValidationCopy,
  createExpenseFormSchema,
  type ExpenseFormData,
  type ExpenseFormInput,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.schema";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export {
  EXPENSE_NOTE_MAX_LENGTH,
  EXPENSE_TITLE_MAX_LENGTH,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.schema";
export type { ExpenseFormRow };

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

  const isEdit = row !== null;
  const salariesLocked = row?.type === ExpenseType.Salaries;

  const form = useForm<ExpenseFormInput, undefined, ExpenseFormData>({
    resolver: zodResolver(createExpenseFormSchema(buildValidationCopy(labels))),
    defaultValues: buildFormDefaults(null),
  });

  const session = useExpenseFormSession({ open, row, form });
  const { submitting, onSubmit } = useExpenseFormSubmit({
    form,
    session,
    labels,
    commonLabels,
    isEdit,
    onSaved,
    onClose,
  });

  const typeSelection = useWatch({ control: form.control, name: "type" });

  return {
    form,
    labels,
    commonLabels,
    isEdit,
    salariesLocked,
    title: isEdit ? labels.modal.form.titleEdit : labels.modal.form.titleAdd,
    submitting,
    canSubmit: isEdit || typeSelection !== null,
    onSubmit,
    onCancel: onClose,
  };
}
