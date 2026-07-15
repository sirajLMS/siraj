"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { OnboardingIdentityFields } from "@/frontend/common/views/dashboard/components/onboarding/OnboardingIdentityFields";
import type { ManagerOnboardingFormData } from "@/frontend/common/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";
import { useAppTranslation } from "@/shared/locale/client";

interface Props {
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
}

export function StaffInfoSection({ register, control, errors }: Readonly<Props>) {
  const t = useAppTranslation("dashboard.managerOnboarding");

  const translate = {
    fields: {
      fullName: t.fields.fullName,
      email: t.fields.email,
      phone: t.fields.phone,
    },
    placeholders: {
      fullName: t.placeholders.fullName,
      email: t.placeholders.email,
      phone: t.placeholders.phone,
    },
    validation: t.validation,
  };

  return (
    <SectionPanel title={t.sections.staffInfo}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <OnboardingIdentityFields register={register} control={control} errors={errors} translate={translate} />
      </Grid>
    </SectionPanel>
  );
}
