"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { PhoneInputDesktop } from "@/frontend/desktop/components/ui/input/phoneInput/phoneInput.desktop";

type PhoneInputProps = {
  readonly value: string | null;
  readonly onChangeAction: (e164: string | null) => void;
  readonly onBlurAction?: () => void;
  readonly defaultRegion?: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly hideLabel?: boolean;
};

type PhoneFormFieldDesktopProps<T extends FieldValues> = Omit<
  PhoneInputProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

export function PhoneFormFieldDesktop<T extends FieldValues>({
  name,
  control,
  ...phoneInputProps
}: PhoneFormFieldDesktopProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <PhoneInputDesktop
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
