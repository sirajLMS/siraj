"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";

type CurrencyControllerFieldProps<TFormValues extends FieldValues> = {
  readonly control: Control<TFormValues>;
  readonly name: FieldPath<TFormValues>;
  readonly label: string;
};

/**
 * Shared Controller + CurrencySelect rendering block used by BillingSection
 * and CompensationSection components. Avoids inline duplication of the
 * currency option lookup and CurrencySelect wiring.
 */
export function CurrencyControllerField<TFormValues extends FieldValues>({
  control,
  name,
  label,
}: CurrencyControllerFieldProps<TFormValues>): React.ReactNode {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
        return (
          <CurrencySelect
            currency={option}
            setCurrencyAction={selected => {
              field.onChange(selected.code);
            }}
            onBlurAction={field.onBlur}
            label={label}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            fullWidth
          />
        );
      }}
    />
  );
}
