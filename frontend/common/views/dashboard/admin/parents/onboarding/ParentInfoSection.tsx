"use client";

import { Grid, Input } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { FieldWrapper, standardInputSx } from "@/frontend/common/components/ui/form";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { OnboardingIdentityFields } from "@/frontend/common/views/dashboard/components/onboarding/OnboardingIdentityFields";
import { useAppTranslation } from "@/shared/locale/client";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

export function ParentInfoSection({ register, control, errors }: Props) {
  const t = useAppTranslation("dashboard.parentOnboarding");

  return (
    <SectionPanel title={t.sections.parentInfo}>
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
                  label={t.fields.nationality}
                  error={!!errors.nationality}
                  helperText={errors.nationality?.message}
                  onBlurAction={field.onBlur}
                  fullWidth
                />
              );
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FieldWrapper
            label={t.fields.address}
            required
            error={t.validation[errors.address?.message as keyof typeof t.validation]}
          >
            <Input
              {...register("address")}
              placeholder={t.placeholders.address}
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
