"use client";

import { Grid, Input } from "@mui/material";
import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { OnboardingIdentityFields } from "@/frontend/views/dashboard/components/onboarding/OnboardingIdentityFields";
import type { ParentOnboardingFormData } from "./schemas/parentOnboardingSchema";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

export function ParentInfoSection({ register, errors }: Props) {
  const t = useTranslations("dashboard.parentOnboarding");

  return (
    <SectionPanel title={t("sections.parentInfo")}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <OnboardingIdentityFields register={register} errors={errors} translate={t} phoneRequired />
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper label={t("fields.nationality")}>
            <Input
              {...register("nationality")}
              placeholder={t("placeholders.nationality")}
              fullWidth
              sx={standardInputSx}
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FieldWrapper
            label={t("fields.address")}
            required
            error={errors.address ? t(`validation.${errors.address.message}`) : undefined}
          >
            <Input
              {...register("address")}
              placeholder={t("placeholders.address")}
              error={!!errors.address}
              fullWidth
              multiline
              rows={2}
              sx={standardInputSx}
            />
          </FieldWrapper>
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
