"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { LocalizedStringInputDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localizedStringInput.desktop";
import type { LocalizedString } from "@/shared/types";

type LocalizedStringFormFieldProps<T extends FieldValues> = Omit<
  LocalizedStringInputProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

export function LocalizedStringFormFieldDesktop<T extends FieldValues>({
  name,
  control,
  ...inputProps
}: LocalizedStringFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const rawValue = field.value;
        let normalized: LocalizedString;

        if (typeof rawValue === "string") {
          normalized = rawValue === "" ? {} : { en: rawValue };
        } else if (rawValue !== null && typeof rawValue === "object") {
          normalized = rawValue;
        } else {
          normalized = {};
        }
        return (
          <LocalizedStringInputDesktop
            {...inputProps}
            value={normalized}
            onChangeAction={next => field.onChange(next)}
            onBlurAction={field.onBlur}
            error={inputProps.error ?? Boolean(fieldState.error)}
            errorMessage={inputProps.errorMessage ?? fieldState.error?.message}
          />
        );
      }}
    />
  );
}
