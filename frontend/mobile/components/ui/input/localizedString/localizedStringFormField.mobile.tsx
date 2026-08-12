"use client";

import type { FieldValues } from "react-hook-form";
import {
  type LocalizedStringFormFieldProps,
  LocalizedStringFormFieldShared,
} from "@/frontend/common/components/ui/input/localizedString/localizedStringFormFieldShared";
import { LocalizedStringInputMobile } from "@/frontend/mobile/components/ui/input/localizedString/localizedStringInput.mobile";

export function LocalizedStringFormFieldMobile<T extends FieldValues>({
  name,
  control,
  ...inputProps
}: LocalizedStringFormFieldProps<T>) {
  return (
    <LocalizedStringFormFieldShared
      name={name}
      control={control}
      {...inputProps}
      LocalizedStringInput={LocalizedStringInputMobile}
    />
  );
}
