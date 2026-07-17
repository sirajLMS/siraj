"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import type { PhoneInputProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";

import { PhoneInputMobile } from "@/frontend/mobile/components/ui/input/phoneInput/phoneInput.mobile";

type PhoneFormFieldMobileProps<T extends FieldValues> = Omit<
  PhoneInputProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

export function PhoneFormFieldMobile<T extends FieldValues>({
  name,
  control,
  ...phoneInputProps
}: PhoneFormFieldMobileProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <PhoneInputMobile
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
