"use client";

import { Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { UserEntityOnboardingFieldsShape } from "@/frontend/common/components/onboarding/sections/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

function validationMessage(labels: UserEntityOnboardingLabels, message: string | undefined): string | undefined {
  if (!message) return undefined;
  const key = message as keyof UserEntityOnboardingLabels["validation"];
  return labels.validation[key] ?? message;
}

export interface UserEntityFieldsSectionProps<T extends UserEntityOnboardingFieldsShape & FieldValues> {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly phoneRequired?: boolean;
}

export function UserEntityFieldsSection<T extends UserEntityOnboardingFieldsShape & FieldValues>({
  register,
  control,
  errors,
  labels,
  onUploadAvatar,
  phoneRequired = false,
}: Readonly<UserEntityFieldsSectionProps<T>>) {
  const nameField = "name" as Path<T>;
  const emailField = "email" as Path<T>;
  const passwordField = "password" as Path<T>;
  const phoneField = "phone" as Path<T>;
  const avatarField = "avatarUrl" as Path<T>;
  const timezoneField = "timezone" as Path<T>;
  const displayCurrencyField = "displayCurrency" as Path<T>;

  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <Grid size={{ xs: 12 }}>
        <AvatarImageField
          control={control}
          name={avatarField}
          label={labels.fields.avatar}
          onUploadAvatar={onUploadAvatar}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register(nameField)}
          label={labels.fields.fullName}
          placeholder={labels.placeholders.fullName}
          required
          error={!!errors.name}
          helperText={validationMessage(labels, errors.name?.message as string | undefined)}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register(emailField)}
          label={labels.fields.email}
          placeholder={labels.placeholders.email}
          required
          error={!!errors.email}
          helperText={validationMessage(labels, errors.email?.message as string | undefined)}
          fullWidth
          type="email"
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register(passwordField)}
          label={labels.fields.password}
          placeholder={labels.placeholders.password}
          required
          type="text"
          error={!!errors.password}
          helperText={validationMessage(labels, errors.password?.message as string | undefined)}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PhoneFormField
          name={phoneField}
          control={control}
          label={labels.fields.phone}
          required={phoneRequired}
          placeholder={labels.placeholders.phone}
          error={!!errors.phone}
          helperText={validationMessage(labels, errors.phone?.message as string | undefined)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name={timezoneField}
          control={control}
          render={({ field }) => (
            <TimezoneSelect
              value={field.value ? toGraphqlIanaTimezone(field.value as string) : null}
              onChangeAction={value => {
                field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
              }}
              onBlurAction={field.onBlur}
              label={labels.fields.timezone}
              required
              error={!!errors.timezone}
              helperText={validationMessage(labels, errors.timezone?.message as string | undefined)}
              fullWidth
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name={displayCurrencyField}
          control={control}
          render={({ field, fieldState }) => {
            const option: CurrencyOption | null = field.value
              ? (getCurrencyByCode(field.value as CurrencyCode) ?? null)
              : null;
            return (
              <CurrencySelect
                currency={option}
                setCurrencyAction={selected => {
                  field.onChange(selected.code);
                }}
                onBlurAction={field.onBlur}
                label={labels.fields.displayCurrency}
                error={Boolean(fieldState.error)}
                helperText={validationMessage(labels, fieldState.error?.message as string | undefined)}
                fullWidth
              />
            );
          }}
        />
      </Grid>
    </Grid>
  );
}
