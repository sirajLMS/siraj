"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { PhoneFormFieldShared } from "@/frontend/common/components/ui/input/phoneInput/PhoneFormFieldShared";
import { PhoneInput, type PhoneInputProps } from "@/frontend/mobile/components/ui/input/phoneInput/PhoneInput";

type PhoneFormFieldMobileProps<T extends FieldValues> = Omit<
  PhoneInputProps,
  "value" | "onChangeAction" | "onBlurAction"
> & {
  readonly name: FieldPath<T>;
  readonly control: import("react-hook-form").Control<T>;
};

export function PhoneFormFieldMobile<T extends FieldValues>({
  name,
  control,
  ...phoneInputProps
}: PhoneFormFieldMobileProps<T>) {
  return <PhoneFormFieldShared name={name} control={control} PhoneInputComponent={PhoneInput} {...phoneInputProps} />;
}
