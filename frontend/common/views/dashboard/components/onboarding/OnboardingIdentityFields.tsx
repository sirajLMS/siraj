"use client";

import { Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";

interface IdentityFieldShape {
  readonly fullName?: string;
  readonly name?: string;
  readonly email: string;
  readonly phone?: string;
  readonly avatarUrl?: string | null;
}

interface TranslationObject {
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly avatar: string;
    [key: string]: string;
  };
  readonly placeholders: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    [key: string]: string;
  };
  readonly validation: Record<string, string>;
}

interface Props<T extends IdentityFieldShape & FieldValues> {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly translate: TranslationObject;
  readonly phoneRequired?: boolean;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

function validationMessage(translate: TranslationObject, message: string | undefined): string | undefined {
  if (!message) return undefined;
  return translate.validation[message];
}

export function OnboardingIdentityFields<T extends IdentityFieldShape & FieldValues>({
  register,
  control,
  errors,
  translate,
  phoneRequired = false,
  onUploadAvatar,
}: Props<T>) {
  const nameField = ("name" in errors || !("fullName" in errors) ? "name" : "fullName") as Path<T>;
  const emailField = "email" as Path<T>;
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
    </>
  );
}
