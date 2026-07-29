"use client";

import { Grid, TextField } from "@mui/material";
import type { FieldValues, Path } from "react-hook-form";
import type {
  OnboardingSectionTranslations,
  UserIdentityFieldsProps,
  UserIdentityFieldsShape,
} from "@/frontend/common/components/onboarding/sections/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";

function validationMessage(translate: OnboardingSectionTranslations, message: string | undefined): string | undefined {
  if (!message) return undefined;
  return translate.validation[message];
}

export function UserIdentityFields<T extends UserIdentityFieldsShape & FieldValues>({
  register,
  control,
  errors,
  translate,
  phoneRequired = false,
  hidePhone = false,
  onUploadAvatar,
}: Readonly<UserIdentityFieldsProps<T>>) {
  const nameField = ("name" in errors || !("fullName" in errors) ? "name" : "fullName") as Path<T>;
  const emailField = "email" as Path<T>;
  const passwordField = "password" as Path<T>;
  const phoneField = "phone" as Path<T>;
  const avatarField = "avatarUrl" as Path<T>;

  const nameError = nameField === "name" ? errors.name : errors.fullName;

  return (
    <>
      <Grid size={{ xs: 12 }}>
        <AvatarImageField
          control={control}
          name={avatarField}
          label={translate.fields.avatar}
          onUploadAvatar={onUploadAvatar}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register(nameField)}
          label={translate.fields.fullName}
          placeholder={translate.placeholders.fullName}
          required
          error={!!nameError}
          helperText={validationMessage(translate, nameError?.message as string | undefined)}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register(emailField)}
          label={translate.fields.email}
          placeholder={translate.placeholders.email}
          required
          error={!!errors.email}
          helperText={validationMessage(translate, errors.email?.message as string | undefined)}
          fullWidth
          type="email"
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register(passwordField)}
          label={translate.fields.password ?? "Password"}
          placeholder={translate.placeholders.password ?? "Enter password"}
          required
          type="text"
          error={!!errors.password}
          helperText={validationMessage(translate, errors.password?.message as string | undefined)}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      {hidePhone ? null : (
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
      )}
    </>
  );
}
