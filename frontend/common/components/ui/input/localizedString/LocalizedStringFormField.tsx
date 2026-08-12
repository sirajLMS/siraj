"use client";

import type { FieldValues } from "react-hook-form";
import { LocalizedStringInput } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringInput";
import {
  type LocalizedStringFormFieldProps,
  LocalizedStringFormFieldShared,
} from "@/frontend/common/components/ui/input/localizedString/localizedStringFormFieldShared";

export function LocalizedStringFormField<T extends FieldValues>({
  name,
  control,
  ...inputProps
}: LocalizedStringFormFieldProps<T>) {
  return (
    <LocalizedStringFormFieldShared
      name={name}
      control={control}
      {...inputProps}
      LocalizedStringInput={LocalizedStringInput}
    />
  );
}
