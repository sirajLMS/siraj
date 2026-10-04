"use client";

import { TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete";
import { FormCurrencyFieldShared } from "@/frontend/common/views/dashboard/accounting/__shared__";
import {
  EXPENSE_FULL_WIDTH_CELL_SX,
  type ExpenseFormControl,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.helpers";
import { EXPENSE_TITLE_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface TitleFieldProps {
  readonly control: ExpenseFormControl;
  readonly labels: ExpensesLabels;
  readonly submitting: boolean;
}

export function TitleField({ control, labels, submitting }: Readonly<TitleFieldProps>) {
  return (
    <Controller
      name="title"
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={labels.modal.form.title}
          required
          fullWidth
          disabled={submitting}
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message}
          aria-invalid={fieldState.error !== undefined}
          slotProps={{ htmlInput: { maxLength: EXPENSE_TITLE_MAX_LENGTH } }}
          sx={EXPENSE_FULL_WIDTH_CELL_SX}
        />
      )}
    />
  );
}

interface TeacherFieldProps {
  readonly control: ExpenseFormControl;
  readonly labels: ExpensesLabels;
  readonly submitting: boolean;
}

export function TeacherField({ control, labels, submitting }: Readonly<TeacherFieldProps>) {
  return (
    <Controller
      name="teacher"
      control={control}
      render={({ field, fieldState }) => (
        <TeacherAutocomplete
          value={field.value}
          onChange={field.onChange}
          label={labels.modal.form.teacher}
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message}
          disabled={submitting}
          fullWidth
        />
      )}
    />
  );
}

interface CurrencyFieldProps {
  readonly control: ExpenseFormControl;
  readonly labels: ExpensesLabels;
  readonly submitting: boolean;
}

export function CurrencyField({ control, labels, submitting }: Readonly<CurrencyFieldProps>) {
  return (
    <FormCurrencyFieldShared
      control={control}
      name="expenseCurrency"
      label={labels.modal.form.currency}
      submitting={submitting}
      required
    />
  );
}
