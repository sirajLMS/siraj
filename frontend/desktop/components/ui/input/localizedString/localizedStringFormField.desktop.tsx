"use client";

import type { FieldValues } from "react-hook-form";
import {
  type LocalizedStringFormFieldProps,
  LocalizedStringFormFieldShared,
} from "@/frontend/common/components/ui/input/localizedString/localizedStringFormFieldShared";
import { LocalizedStringInputDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localizedStringInput.desktop";

export function LocalizedStringFormFieldDesktop<T extends FieldValues>({
  name,
  control,
  ...inputProps
}: LocalizedStringFormFieldProps<T>) {
  return (
    <LocalizedStringFormFieldShared
      name={name}
      control={control}
      {...inputProps}
      LocalizedStringInput={LocalizedStringInputDesktop}
    />
  );
}
