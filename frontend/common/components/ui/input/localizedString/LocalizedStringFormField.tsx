"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { LocalizedStringInput } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringInput";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";

type LocalizedStringFormFieldProps<T extends FieldValues> = Omit<
  LocalizedStringInputProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

/**
 * react-hook-form wrapper around `LocalizedStringInput`.
 *
 * Field value type at `name` must be `LocalizedString` (or `string` for
 * legacy string-backed columns — coerced to `{ en: value }` if needed).
 * Mirrors `PhoneFormField` shape: `field.value ?? {}`, and routes
 * `fieldState.error` into `error` / `errorMessage`.
 */
export function LocalizedStringFormField<T extends FieldValues>({
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
          normalized = rawValue as LocalizedString;
        } else {
          normalized = {};
        }
        return (
          <LocalizedStringInput
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
