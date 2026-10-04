"use client";

import { Controller } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import type { ExpenseFormControl } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.helpers";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface ExpenseDateFieldsProps {
  readonly control: ExpenseFormControl;
  readonly labels: ExpensesLabels;
  readonly submitting: boolean;
}

export function ExpenseDateFields({ control, labels, submitting }: Readonly<ExpenseDateFieldsProps>) {
  return (
    <>
      <Controller
        name="paymentDate"
        control={control}
        render={({ field, fieldState }) => (
          <AppDatePicker
            label={labels.modal.form.paymentDate}
            value={field.value}
            onChange={field.onChange}
            disabled={submitting}
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
                error: fieldState.error !== undefined,
                helperText: fieldState.error?.message,
              },
            }}
          />
        )}
      />
      <Controller
        name="expenseMonth"
        control={control}
        render={({ field, fieldState }) => (
          <AppDatePicker
            label={labels.modal.form.expenseDate}
            value={field.value}
            onChange={field.onChange}
            views={["year", "month"]}
            openTo="month"
            format="yyyy-MM"
            disabled={submitting}
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
                error: fieldState.error !== undefined,
                helperText: fieldState.error?.message,
              },
            }}
          />
        )}
      />
    </>
  );
}
