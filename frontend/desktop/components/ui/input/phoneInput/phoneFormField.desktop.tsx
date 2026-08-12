"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { PhoneFormFieldShared } from "@/frontend/common/components/ui/input/phoneInput/PhoneFormFieldShared";
import type { PhoneInputSharedProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { PhoneInputDesktop } from "@/frontend/desktop/components/ui/input/phoneInput/phoneInput.desktop";

type PhoneFormFieldDesktopProps<T extends FieldValues> = Omit<
  PhoneInputSharedProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
};

export function PhoneFormFieldDesktop<T extends FieldValues>({
  name,
  control,
  ...phoneInputProps
}: Readonly<PhoneFormFieldDesktopProps<T>>) {
  return (
    <PhoneFormFieldShared name={name} control={control} PhoneInputComponent={PhoneInputDesktop} {...phoneInputProps} />
  );
}
