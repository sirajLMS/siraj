"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";

interface FormCurrencyFieldSharedProps<T extends FieldValues, TTransformedValues = T> {
  readonly control: Control<T, undefined, TTransformedValues>;
  readonly name: FieldPath<T>;
  readonly label: string;
  readonly submitting: boolean;
  readonly required?: boolean;
}

/**
 * Shared Controller + CurrencySelect wiring for the accounting form dialogs
 * (carryover and expense): resolves the selected `CurrencyOption` from the
 * form's currency value and maps the RHF field state onto the select.
 *
 * `required` is forwarded for forms whose contract wants it; RHF consumers
 * that rely on submit-gated validation omit it — CurrencySelect eagerly
 * renders an error state whenever `required` is set with no selection,
 * bypassing the form's validation. The resolver surfaces the required error
 * on submit via error/helperText.
 */
export function FormCurrencyFieldShared<T extends FieldValues, TTransformedValues = T>({
  control,
  name,
  label,
  submitting,
  required,
}: Readonly<FormCurrencyFieldSharedProps<T, TTransformedValues>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
        return (
          <CurrencySelect
            currency={option}
            setCurrencyAction={selected => field.onChange(selected.code)}
            onBlurAction={field.onBlur}
            label={label}
            required={required}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message}
            disabled={submitting}
            fullWidth
          />
        );
      }}
    />
  );
}
