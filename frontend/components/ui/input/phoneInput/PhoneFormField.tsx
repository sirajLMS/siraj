"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { PhoneInput, type PhoneInputProps } from "@/frontend/components/ui/input/phoneInput/PhoneInput";

type PhoneFormFieldProps<T extends FieldValues> = Omit<PhoneInputProps, "value" | "onChangeAction" | "onBlurAction"> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

export function PhoneFormField<T extends FieldValues>({ name, control, ...phoneInputProps }: PhoneFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <PhoneInput
          {...phoneInputProps}
          value={field.value || null}
          onChangeAction={value => {
            field.onChange(value ?? "");
          }}
          onBlurAction={field.onBlur}
          error={phoneInputProps.error ?? Boolean(fieldState.error)}
          helperText={phoneInputProps.helperText ?? fieldState.error?.message}
        />
      )}
    />
  );
}
