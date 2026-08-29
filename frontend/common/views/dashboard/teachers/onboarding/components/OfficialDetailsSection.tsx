"use client";

import { Grid } from "@mui/material";
import type { ComponentType } from "react";
import { type Control, Controller, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import type { CountrySelectProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

interface OfficialDetailsSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: {
    readonly fields: {
      readonly country: string;
    };
  };
  /** Tier-specific country picker; falls back to the viewport-agnostic variant. */
  readonly CountrySelectComponent?: ComponentType<CountrySelectProps>;
}

export function OfficialDetailsSection({
  control,
  errors,
  labels,
  CountrySelectComponent = CountrySelect,
}: Readonly<OfficialDetailsSectionProps>) {
  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="countryCode"
          control={control}
          render={({ field }) => {
            const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

            return (
              <CountrySelectComponent
                country={selectedCountry}
                setCountryAction={country => field.onChange(country?.code ?? "")}
                label={`${labels.fields.country} *`}
                required
                error={!!errors.countryCode}
                helperText={errors.countryCode?.message}
                onBlurAction={field.onBlur}
                fullWidth
              />
            );
          }}
        />
      </Grid>
    </Grid>
  );
}
