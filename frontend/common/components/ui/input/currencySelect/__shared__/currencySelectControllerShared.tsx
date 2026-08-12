"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";

export interface CurrencySelectControllerProps<T extends FieldValues> {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
  readonly label: string;
  readonly required?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly fullWidth?: boolean;
}

export function CurrencySelectController<T extends FieldValues>({
  name,
  control,
  label,
  required,
  error,
  helperText,
  fullWidth,
}: Readonly<CurrencySelectControllerProps<T>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
        return (
          <CurrencySelect
            currency={option}
            setCurrencyAction={selected => {
              field.onChange(selected.code);
            }}
            onBlurAction={field.onBlur}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            fullWidth={fullWidth}
          />
        );
      }}
    />
  );
}
