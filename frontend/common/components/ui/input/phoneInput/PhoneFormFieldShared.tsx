"use client";

import type * as React from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import type { PhoneInputSharedProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";

type PhoneFormFieldSharedProps<T extends FieldValues> = Omit<
  PhoneInputSharedProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
  readonly PhoneInputComponent: React.ComponentType<PhoneInputSharedProps>;
};

/**
 * Shared controller-render scaffold for phone form fields.
 * Both common and mobile `PhoneFormField` variants delegate here, passing
 * their tier-specific `PhoneInput` component as `PhoneInputComponent`.
 */
export function PhoneFormFieldShared<T extends FieldValues>({
  name,
  control,
  PhoneInputComponent,
  ...phoneInputProps
}: Readonly<PhoneFormFieldSharedProps<T>>): React.ReactNode {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <PhoneInputComponent
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
