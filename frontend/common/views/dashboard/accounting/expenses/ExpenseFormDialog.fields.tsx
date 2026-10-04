"use client";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  EXPENSE_FORM_TYPES,
  type ExpenseFormControl,
  isExpenseType,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.helpers";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface TypeFieldProps {
  readonly control: ExpenseFormControl;
  readonly labels: ExpensesLabels;
  readonly labelsByType: Record<ExpenseType, string>;
  readonly typeHint: string;
  readonly submitting: boolean;
  readonly salariesLocked: boolean;
}

export function TypeField({
  control,
  labels,
  labelsByType,
  typeHint,
  submitting,
  salariesLocked,
}: Readonly<TypeFieldProps>) {
  return (
    <Controller
      name="type"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl required fullWidth disabled={submitting || salariesLocked} error={fieldState.error !== undefined}>
          <InputLabel id="expense-type-label">{labels.modal.form.type}</InputLabel>
          <Select
            labelId="expense-type-label"
            label={labels.modal.form.type}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChange={(event: SelectChangeEvent) => {
              const next: unknown = event.target.value;
              if (next === "" || isExpenseType(next)) field.onChange(next === "" ? null : next);
            }}
            slotProps={{ input: { "aria-invalid": fieldState.error !== undefined } }}
          >
            {EXPENSE_FORM_TYPES.map(type => (
              <MenuItem key={type} value={type} disabled={type === ExpenseType.Salaries}>
                {labelsByType[type]}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fieldState.error?.message ?? typeHint}</FormHelperText>
        </FormControl>
      )}
    />
  );
}

interface ValueFieldProps {
  readonly control: ExpenseFormControl;
  readonly labels: ExpensesLabels;
  readonly valueHint: string | undefined;
  readonly valueEndAdornment: React.ReactNode;
  readonly submitting: boolean;
  readonly salariesLocked: boolean;
}

export function ValueField({
  control,
  labels,
  valueHint,
  valueEndAdornment,
  submitting,
  salariesLocked,
}: Readonly<ValueFieldProps>) {
  return (
    <Controller
      name="expenseValue"
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          type="number"
          label={labels.modal.form.value}
          required
          fullWidth
          disabled={submitting || salariesLocked}
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? valueHint}
          aria-invalid={fieldState.error !== undefined}
          slotProps={{ htmlInput: { min: 0, step: "any" }, input: { endAdornment: valueEndAdornment } }}
        />
      )}
    />
  );
}
