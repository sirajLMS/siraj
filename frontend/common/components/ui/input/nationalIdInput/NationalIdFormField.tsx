"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import {
  NationalIdInput,
  type NationalIdInputProps,
} from "@/frontend/common/components/ui/input/nationalIdInput/NationalIdInput";

type NationalIdFormFieldProps<T extends FieldValues> = Omit<
  NationalIdInputProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

/**
 * react-hook-form `control`-driven wrapper for `NationalIdInput` — mirrors
 * the `PhoneFormField` pattern.
 */
export function NationalIdFormField<T extends FieldValues>({
  name,
  control,
  ...nationalIdInputProps
}: Readonly<NationalIdFormFieldProps<T>>): React.ReactNode {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <NationalIdInput
          {...nationalIdInputProps}
          value={field.value || null}
          onChangeAction={value => {
            field.onChange(value);
          }}
          onBlurAction={field.onBlur}
          error={nationalIdInputProps.error ?? Boolean(fieldState.error)}
          helperText={nationalIdInputProps.helperText ?? fieldState.error?.message}
        />
      )}
    />
  );
}
