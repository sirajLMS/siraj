"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";

type CurrencyControllerFieldProps<TFormValues extends FieldValues> = {
  readonly control: Control<TFormValues>;
  readonly name: FieldPath<TFormValues>;
  readonly label: string;
  readonly formatError?: (message: string | undefined) => string | undefined;
};

/**
 * Shared Controller + CurrencySelect rendering block used by BillingSection
 * and CompensationSection components. Avoids inline duplication of the
 * currency option lookup and CurrencySelect wiring.
 *
 * `formatError` lets callers apply their own error translator (e.g. onboarding's
 * `validationMessage` wrapper) to `fieldState.error?.message` at render time.
 */
export function CurrencyControllerField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  formatError,
}: CurrencyControllerFieldProps<TFormValues>): React.ReactNode {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
        const helperText = formatError ? formatError(fieldState.error?.message) : fieldState.error?.message;
        return (
          <CurrencySelect
            currency={option}
            setCurrencyAction={selected => {
              field.onChange(selected.code);
            }}
            onBlurAction={field.onBlur}
            label={label}
            error={Boolean(fieldState.error)}
            helperText={helperText}
            fullWidth
          />
        );
      }}
    />
  );
}
