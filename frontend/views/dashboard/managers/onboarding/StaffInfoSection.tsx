"use client";

import { Grid } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import { OnboardingIdentityFields } from "@/frontend/views/dashboard/components/onboarding/OnboardingIdentityFields";
import type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";

interface Props {
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
}

export function StaffInfoSection({ register, control, errors }: Readonly<Props>) {
  const t = useTranslations("dashboard.managerOnboarding");

  return (
    <SectionPanel title={t("sections.staffInfo")}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <OnboardingIdentityFields register={register} control={control} errors={errors} translate={t} />
      </Grid>
    </SectionPanel>
  );
}
