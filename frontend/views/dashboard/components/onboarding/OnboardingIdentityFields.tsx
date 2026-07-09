"use client";

import { Grid, Input } from "@mui/material";
import type { Control, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { PhoneFormField } from "@/frontend/components/ui/input";

interface IdentityFieldShape {
  readonly fullName?: string;
  readonly name?: string;
  readonly email: string;
  readonly phone?: string;
}

interface Props<T extends IdentityFieldShape & FieldValues> {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly translate: (key: string) => string;
  readonly phoneRequired?: boolean;
}

function validationMessage(translate: (key: string) => string, message: string | undefined): string | undefined {
  if (!message) return undefined;
  return translate(`validation.${message}`);
}

export function OnboardingIdentityFields<T extends IdentityFieldShape & FieldValues>({
  register,
  control,
  errors,
  translate,
  phoneRequired = false,
}: Props<T>) {
  const nameField = ("name" in errors || !("fullName" in errors) ? "name" : "fullName") as Path<T>;
  const emailField = "email" as Path<T>;
  const phoneField = "phone" as Path<T>;

  const nameError = nameField === "name" ? errors.name : errors.fullName;

  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper
          label={translate("fields.fullName")}
          required
          error={validationMessage(translate, nameError?.message as string | undefined)}
        >
          <Input
            {...register(nameField)}
            placeholder={translate("placeholders.fullName")}
            error={!!nameError}
            fullWidth
            sx={standardInputSx}
          />
        </FieldWrapper>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper
          label={translate("fields.email")}
          required
          error={validationMessage(translate, errors.email?.message as string | undefined)}
        >
          <Input
            {...register(emailField)}
            placeholder={translate("placeholders.email")}
            error={!!errors.email}
            fullWidth
            type="email"
            sx={standardInputSx}
          />
        </FieldWrapper>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper label={translate("fields.phone")} required={phoneRequired}>
          <PhoneFormField
            name={phoneField}
            control={control}
            hideLabel
            required={phoneRequired}
            placeholder={translate("placeholders.phone")}
            error={!!errors.phone}
            helperText={validationMessage(translate, errors.phone?.message as string | undefined)}
          />
        </FieldWrapper>
      </Grid>
    </>
  );
}
