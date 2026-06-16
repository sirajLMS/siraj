"use client";

import { Grid, Input } from "@mui/material";
import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { SectionPanel } from "@/frontend/components/ui/SectionPanel";
import { OnboardingIdentityFields } from "@/frontend/views/dashboard/components/onboarding/OnboardingIdentityFields";
import type { ManagerOnboardingFormData } from "./schemas/managerOnboardingSchema";

interface Props {
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
}

export function StaffInfoSection({ register, errors }: Readonly<Props>) {
  const t = useTranslations("dashboard.managerOnboarding");

  return (
    <SectionPanel title={t("sections.staffInfo")}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <OnboardingIdentityFields register={register} errors={errors} translate={t} />
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper label={t("fields.skypeId")}>
            <Input {...register("skypeId")} placeholder={t("placeholders.skypeId")} fullWidth sx={standardInputSx} />
          </FieldWrapper>
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
