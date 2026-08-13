"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { OnboardingSectionTranslations } from "@/frontend/common/components/onboarding/sections/types";
import {
  UserPersonalAddressField,
  UserPersonalNationalityField,
} from "@/frontend/common/components/onboarding/sections/userPersonalFieldComponents";
import type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";

interface ParentExtensionSectionProps {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly labels: ParentOnboardingLabels;
}

function toSectionTranslations(labels: ParentOnboardingLabels): OnboardingSectionTranslations {
  return {
    fields: labels.fields,
    placeholders: labels.placeholders,
    validation: labels.validation,
  };
}

export function ParentExtensionSection({ register, control, errors, labels }: Readonly<ParentExtensionSectionProps>) {
  const translate = toSectionTranslations(labels);

  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <UserPersonalNationalityField register={register} control={control} errors={errors} translate={translate} />
      <UserPersonalAddressField register={register} translate={translate} />
    </Grid>
  );
}
