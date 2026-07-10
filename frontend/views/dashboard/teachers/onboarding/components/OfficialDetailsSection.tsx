"use client";

import { Box, Grid, Input, Typography } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { labelSx, standardInputSx } from "@/frontend/components/ui/form";
import { CountrySelect } from "@/frontend/components/ui/input/countrySelect/CountrySelect";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { getCountryByCode } from "@/frontend/lib/locale";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

import type { CountryCode } from "@/frontend/views/dashboard/teachers/onboarding/types";

interface OfficialDetailsSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: {
    readonly fields: {
      readonly zoomLink: string;
      readonly country: string;
      readonly zoomUsername: string;
      readonly zoomPassword: string;
      readonly timezone: string;
    };
    readonly placeholders: {
      readonly zoomLink: string;
      readonly zoomUsername: string;
      readonly zoomPassword: string;
    };
  };
}

export function OfficialDetailsSection({ register, control, errors, labels }: Readonly<OfficialDetailsSectionProps>) {
  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.zoomLink}
        </Box>
        <Input
          {...register("zoomLink")}
          placeholder={labels.placeholders.zoomLink}
          error={!!errors.zoomLink}
          fullWidth
          sx={standardInputSx}
        />
        {errors.zoomLink ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.zoomLink.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <Controller
          name="countryCode"
          control={control}
          render={({ field }) => {
            const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

            return (
              <CountrySelect
                country={selectedCountry}
                setCountryAction={country => field.onChange(country.code as CountryCode)}
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
      <Grid size={{ xs: 12, md: 3 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.zoomUsername}
        </Box>
        <Input
          {...register("zoomUsername")}
          placeholder={labels.placeholders.zoomUsername}
          fullWidth
          sx={standardInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.zoomPassword}
        </Box>
        <Input
          {...register("zoomPassword")}
          placeholder={labels.placeholders.zoomPassword}
          type="password"
          fullWidth
          sx={standardInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <TimezoneSelect
              value={field.value ? toGraphqlIanaTimezone(field.value) : null}
              onChangeAction={value => {
                field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
              }}
              onBlurAction={field.onBlur}
              label={labels.fields.timezone}
              required
              error={!!errors.timezone}
              helperText={errors.timezone?.message}
              fullWidth
            />
          )}
        />
      </Grid>
    </Grid>
  );
}
