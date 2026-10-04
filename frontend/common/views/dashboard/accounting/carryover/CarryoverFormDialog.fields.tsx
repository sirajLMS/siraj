"use client";

import { Controller } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete";
import { FormCurrencyFieldShared } from "@/frontend/common/views/dashboard/accounting/__shared__";
import type { CarryoverFormViewModel } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface IdentityFieldsProps {
  readonly form: CarryoverFormViewModel["form"];
  readonly labels: CarryoverLabels;
  readonly submitting: boolean;
  readonly isEdit: boolean;
  readonly teacherLockedHint: string | undefined;
}

export function CarryoverFormIdentityFields({
  form,
  labels,
  submitting,
  isEdit,
  teacherLockedHint,
}: Readonly<IdentityFieldsProps>) {
  return (
    <>
      <Controller
        name="teacher"
        control={form.control}
        render={({ field, fieldState }) => (
          <TeacherAutocomplete
            value={field.value}
            onChange={field.onChange}
            label={labels.modal.form.teacher}
            placeholder={labels.modal.form.teacherPlaceholder}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message ?? teacherLockedHint}
            disabled={isEdit || submitting}
            required
            fullWidth
          />
        )}
      />
      <FormCurrencyFieldShared
        control={form.control}
        name="teacherCurrency"
        label={labels.modal.form.currency}
        submitting={submitting}
      />
      <Controller
        name="fromDate"
        control={form.control}
        render={({ field, fieldState }) => (
          <AppDatePicker
            label={labels.modal.form.fromDate}
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
        name="toDate"
        control={form.control}
        render={({ field, fieldState }) => (
          <AppDatePicker
            label={labels.modal.form.toDate}
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
    </>
  );
}
