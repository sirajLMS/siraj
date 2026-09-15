"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";

export interface CurrencySelectControllerProps<T extends FieldValues, TTransformedValues = T> {
  readonly name: FieldPath<T>;
  readonly control: Control<T, undefined, TTransformedValues>;
  readonly label: string;
  readonly required?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly allowedCodes?: readonly CurrencyCode[];
  readonly fullWidth?: boolean;
}

export function CurrencySelectController<T extends FieldValues, TTransformedValues = T>({
  name,
  control,
  label,
  required,
  error,
  helperText,
  allowedCodes,
  fullWidth,
}: Readonly<CurrencySelectControllerProps<T, TTransformedValues>>) {
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
            allowedCodes={allowedCodes}
            fullWidth={fullWidth}
          />
        );
      }}
    />
  );
}
