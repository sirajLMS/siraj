"use client";

import type { ReactNode } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date/AppDatePicker";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field/formFieldStyles";

type DateOfBirthControllerFieldProps<TFormValues extends FieldValues> = {
  readonly control: Control<TFormValues>;
  readonly name: FieldPath<TFormValues>;
  readonly label: string | undefined;
  readonly disabled?: boolean;
  readonly formatError?: (message: string | undefined) => string | undefined;
  readonly useOutlinedInputSx?: boolean;
};

/**
 * Shared Controller + AppDatePicker rendering block used by onboarding
 * and profile personal sections. Avoids inline duplication of the
 * date-of-birth parsing, formatting, and DatePicker wiring.
 *
 * `formatError` lets callers apply their own error translator (e.g. onboarding's
 * `validationMessage` wrapper) to `fieldState.error?.message` at render time.
 * `useOutlinedInputSx` applies the `outlinedInputSx` theme to the text field
 * (used by onboarding); profile omits it for a cleaner look.
 */
export function DateOfBirthControllerField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  disabled,
  formatError,
  useOutlinedInputSx,
}: DateOfBirthControllerFieldProps<TFormValues>): ReactNode {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const dateValue = field.value ? new Date(field.value) : null;
        const validDate = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue : null;
        const error = Boolean(fieldState.error);
        const helperText = formatError ? formatError(fieldState.error?.message) : fieldState.error?.message;

        return (
          <AppDatePicker
            value={validDate}
            onChange={(date: Date | null) => {
              if (date && !Number.isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                field.onChange(`${year}-${month}-${day}`);
              } else {
                field.onChange("");
              }
            }}
            disabled={disabled}
            slotProps={{
              textField: {
                label,
                variant: "outlined",
                fullWidth: true,
                error,
                helperText,
                ...(useOutlinedInputSx ? { sx: outlinedInputSx } : {}),
                slotProps: { htmlInput: { autoComplete: "off" } },
              },
            }}
          />
        );
      }}
    />
  );
}
