"use client";

import type { FieldValues } from "react-hook-form";
import {
  UserPersonalAddressField,
  UserPersonalDateOfBirthField,
  UserPersonalGenderField,
  UserPersonalNationalityField,
  UserPersonalQualificationsField,
} from "@/frontend/common/components/onboarding/sections/userPersonalFieldComponents";
import type { UserPersonalFieldsProps, UserPersonalFieldsShape } from "@/frontend/common/components/onboarding/sections/types";

export function UserPersonalFields<T extends UserPersonalFieldsShape & FieldValues>({
  register,
  control,
  errors,
  translate,
  hideQualifications = false,
}: Readonly<UserPersonalFieldsProps<T>>) {
  return (
    <>
      <UserPersonalNationalityField register={register} control={control} errors={errors} translate={translate} />
      <UserPersonalAddressField register={register} translate={translate} />
      <UserPersonalDateOfBirthField control={control} errors={errors} translate={translate} />
      <UserPersonalGenderField control={control} errors={errors} translate={translate} />
      {hideQualifications ? null : <UserPersonalQualificationsField register={register} translate={translate} />}
    </>
  );
}
