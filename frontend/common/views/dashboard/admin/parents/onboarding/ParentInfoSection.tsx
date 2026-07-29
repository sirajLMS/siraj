"use client";

import { Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { OnboardingIdentityFields } from "@/frontend/common/views/dashboard/components/onboarding/OnboardingIdentityFields";
import { Translation, useAppTranslation } from "@/shared/locale";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export function ParentInfoSection({ register, control, errors, onUploadAvatar }: Props) {
  const t = useAppTranslation(Translation.Dashboard.ParentOnboarding);

  return (
    <SectionPanel title={t.sections.parentInfo}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <OnboardingIdentityFields
          register={register}
          control={control}
          errors={errors}
          translate={t}
          phoneRequired={false}
          onUploadAvatar={onUploadAvatar}
        />
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="nationality"
            control={control}
            render={({ field }) => {
              const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

              return (
                <CountrySelect
                  country={selectedCountry}
                  setCountryAction={country => field.onChange(country?.code ?? "")}
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
          <TextField
            {...register("address")}
            label={t.fields.address}
            placeholder={t.placeholders.address}
            error={!!errors.address}
            helperText={t.validation[errors.address?.message as keyof typeof t.validation]}
            fullWidth
            multiline
            rows={2}
            sx={outlinedInputSx}
          />
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
