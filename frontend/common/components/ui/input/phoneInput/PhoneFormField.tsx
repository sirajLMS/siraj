"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { PhoneFormFieldShared } from "@/frontend/common/components/ui/input/phoneInput/PhoneFormFieldShared";
import { PhoneInput, type PhoneInputProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";

type PhoneFormFieldProps<T extends FieldValues> = Omit<PhoneInputProps, "value" | "onChangeAction" | "onBlurAction"> & {
  readonly name: FieldPath<T>;
  readonly control: import("react-hook-form").Control<T>;
};

export function PhoneFormField<T extends FieldValues>({ name, control, ...phoneInputProps }: PhoneFormFieldProps<T>) {
  return <PhoneFormFieldShared name={name} control={control} PhoneInputComponent={PhoneInput} {...phoneInputProps} />;
}
