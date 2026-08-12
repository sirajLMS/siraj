"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import type { LocalizedString } from "@/shared/types";

// ---------------------------------------------------------------------------
// Slot Types
// ---------------------------------------------------------------------------

export type LocalizedStringFormFieldSlotProps = {
  /** The tier-bound `LocalizedStringInput` component to render inside the Controller. */
  readonly LocalizedStringInput: React.ComponentType<LocalizedStringInputProps>;
};

// ---------------------------------------------------------------------------
// Shared Props Type
// ---------------------------------------------------------------------------

export type LocalizedStringFormFieldProps<T extends FieldValues> = Omit<
  LocalizedStringInputProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

// ---------------------------------------------------------------------------
// Scaffold Component
// ---------------------------------------------------------------------------

/**
 * react-hook-form wrapper around `LocalizedStringInput`.
 *
 * Field value type at `name` must be `LocalizedString` (or `string` for
 * legacy string-backed columns — coerced to `{ en: value }` if needed).
 * Mirrors `PhoneFormField` shape: `field.value ?? {}`, and routes
 * `fieldState.error` into `error` / `errorMessage`.
 *
 * The `LocalizedStringInput` slot prop is the tier-bound input component
 * (common viewport-aware switcher, desktop, or mobile).
 */
export function LocalizedStringFormFieldShared<T extends FieldValues>({
  name,
  control,
  LocalizedStringInput,
  ...inputProps
}: LocalizedStringFormFieldProps<T> & LocalizedStringFormFieldSlotProps) {
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
