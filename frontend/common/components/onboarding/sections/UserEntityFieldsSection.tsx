"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import {
  AvatarField,
  CurrencyField,
  EmailField,
  NameField,
  OnboardingPasswordField,
  PhoneField,
  TimezoneField,
} from "@/frontend/common/components/onboarding/sections/UserEntityFieldsSection.fields";
import type { OnboardingFields } from "@/frontend/common/components/onboarding/sections/UserEntityFieldsSection.helpers";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

export interface UserEntityFieldsSectionProps<T extends OnboardingFields> {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly phoneRequired?: boolean;
}

export function UserEntityFieldsSection<T extends OnboardingFields>({
  control,
  errors,
  labels,
  onUploadAvatar,
  phoneRequired = false,
}: Readonly<Omit<UserEntityFieldsSectionProps<T>, "register">>) {
  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <AvatarField control={control} labels={labels} onUploadAvatar={onUploadAvatar} />
      <NameField control={control} errors={errors} labels={labels} />
      <EmailField control={control} errors={errors} labels={labels} />
      <OnboardingPasswordField control={control} errors={errors} labels={labels} />
      <PhoneField control={control} errors={errors} labels={labels} phoneRequired={phoneRequired} />
      <TimezoneField control={control} errors={errors} labels={labels} />
      <CurrencyField control={control} labels={labels} />
    </Grid>
  );
}
