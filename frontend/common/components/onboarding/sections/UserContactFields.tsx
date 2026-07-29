"use client";

import { Grid } from "@mui/material";
import type { FieldValues, Path } from "react-hook-form";
import type {
  OnboardingSectionTranslations,
  UserContactFieldsProps,
  UserContactFieldsShape,
} from "@/frontend/common/components/onboarding/sections/types";
import { PhoneFormField } from "@/frontend/common/components/ui/input";

function validationMessage(translate: OnboardingSectionTranslations, message: string | undefined): string | undefined {
  if (!message) return undefined;
  return translate.validation[message];
}

export function UserContactFields<T extends UserContactFieldsShape & FieldValues>({
  control,
  errors,
  translate,
  phoneRequired = false,
}: Readonly<UserContactFieldsProps<T>>) {
  const phoneField = "phone" as Path<T>;

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <PhoneFormField
        name={phoneField}
        control={control}
        label={translate.fields.phone}
        required={phoneRequired}
        placeholder={translate.placeholders.phone}
        error={!!errors.phone}
        helperText={validationMessage(translate, errors.phone?.message as string | undefined)}
      />
    </Grid>
  );
}
