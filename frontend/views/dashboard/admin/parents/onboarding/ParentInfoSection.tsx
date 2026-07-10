"use client";

import { Grid, Input } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { CountrySelect } from "@/frontend/components/ui/input/countrySelect/CountrySelect";
import { getCountryByCode } from "@/frontend/lib/locale";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { OnboardingIdentityFields } from "@/frontend/views/dashboard/components/onboarding/OnboardingIdentityFields";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

export function ParentInfoSection({ register, control, errors }: Props) {
  const t = useTranslations("dashboard.parentOnboarding");

  return (
    <SectionPanel title={t("sections.parentInfo")}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <OnboardingIdentityFields register={register} control={control} errors={errors} translate={t} phoneRequired />
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="nationality"
            control={control}
            render={({ field }) => {
              const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

              return (
                <CountrySelect
                  country={selectedCountry}
                  setCountryAction={country => field.onChange(country.code)}
                  label={t("fields.nationality")}
                  fullWidth
                />
              );
            }}
          />
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
