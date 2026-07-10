"use client";

import { Box, Grid, Input, Typography } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { labelSx, standardInputSx } from "@/frontend/components/ui/form";
import { PhoneFormField } from "@/frontend/components/ui/input";
import { CountrySelect } from "@/frontend/components/ui/input/countrySelect/CountrySelect";
import { GenderSelector } from "@/frontend/components/ui/input/genderSelector/GenderSelector";
import { getCountryByCode } from "@/frontend/lib/locale";
import type { TeacherOnboardingFormData } from "../schemas/teacherOnboardingSchema";

interface BaseSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: {
    readonly fields: {
      readonly fullName: string;
      readonly email: string;
      readonly nationality: string;
      readonly nationalId: string;
      readonly phone: string;
      readonly age: string;
      readonly gender: string;
      readonly male: string;
      readonly female: string;
      readonly address: string;
      readonly qualifications: string;
    };
    readonly placeholders: {
      readonly fullName: string;
      readonly email: string;
      readonly nationality: string;
      readonly nationalId: string;
      readonly phone: string;
      readonly age: string;
      readonly address: string;
      readonly qualifications: string;
    };
  };
}

interface SectionProps extends BaseSectionProps {
  readonly control: Control<TeacherOnboardingFormData>;
}

export function BasicInfoFields({ register, control, errors, labels }: Readonly<SectionProps>) {
  return (
    <>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.fullName}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("name")}
          placeholder={labels.placeholders.fullName}
          error={!!errors.name}
          fullWidth
          sx={standardInputSx}
        />
        {errors.name ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.name.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.email}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("email")}
          placeholder={labels.placeholders.email}
          error={!!errors.email}
          fullWidth
          sx={standardInputSx}
        />
        {errors.email ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.email.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          name="nationality"
          control={control}
          render={({ field }) => {
            const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

            return (
              <CountrySelect
                country={selectedCountry}
                setCountryAction={country => field.onChange(country.code)}
                label={labels.fields.nationality}
                fullWidth
              />
            );
          }}
        />
      </Grid>
    </>
  );
}

export function IdentityFields({ register, control, errors, labels }: Readonly<SectionProps>) {
  return (
    <>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.nationalId}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <Input
          {...register("nationalId")}
          placeholder={labels.placeholders.nationalId}
          error={!!errors.nationalId}
          fullWidth
          sx={standardInputSx}
        />
        {errors.nationalId ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
            {errors.nationalId.message}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.phone}{" "}
          <Box component="span" sx={theme => ({ color: theme.palette.error.main })}>
            *
          </Box>
        </Box>
        <PhoneFormField
          name="phone"
          control={control}
          hideLabel
          required
          placeholder={labels.placeholders.phone}
          error={!!errors.phone}
          helperText={errors.phone?.message}
          fullWidth
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Box component="label" sx={labelSx}>
              {labels.fields.age}
            </Box>
            <Input
              {...register("dateOfBirth")}
              placeholder={labels.placeholders.age}
              type="number"
              fullWidth
              sx={standardInputSx}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <GenderSelector
                  gender={field.value ?? null}
                  setGenderAction={field.onChange}
                  required
                  error={!!errors.gender}
                  fullWidth
                  labels={{
                    title: labels.fields.gender,
                    male: labels.fields.male,
                    female: labels.fields.female,
                  }}
                />
              )}
            />
            {errors.gender ? (
              <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
                {errors.gender.message}
              </Typography>
            ) : null}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}

export function AddressFields({ register, labels }: Readonly<BaseSectionProps>) {
  return (
    <>
      <Grid size={{ xs: 12, md: 8 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.address}
        </Box>
        <Input {...register("address")} placeholder={labels.placeholders.address} fullWidth sx={standardInputSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box component="label" sx={labelSx}>
          {labels.fields.qualifications}
        </Box>
        <Input
          {...register("qualifications")}
          placeholder={labels.placeholders.qualifications}
          fullWidth
          sx={standardInputSx}
        />
      </Grid>
    </>
  );
}

export function TeacherInfoSection({ register, control, errors, labels }: Readonly<SectionProps>) {
  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <BasicInfoFields register={register} control={control} errors={errors} labels={labels} />
      <IdentityFields register={register} control={control} errors={errors} labels={labels} />
      <AddressFields register={register} errors={errors} labels={labels} />
    </Grid>
  );
}
