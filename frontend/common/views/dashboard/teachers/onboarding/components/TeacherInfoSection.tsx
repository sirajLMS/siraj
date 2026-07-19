"use client";

import { FormControl, FormHelperText, Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

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
        <TextField
          {...register("name")}
          label={labels.fields.fullName}
          placeholder={labels.placeholders.fullName}
          required
          error={!!errors.name}
          helperText={errors.name?.message}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          {...register("email")}
          label={labels.fields.email}
          placeholder={labels.placeholders.email}
          required
          error={!!errors.email}
          helperText={errors.email?.message}
          fullWidth
          sx={outlinedInputSx}
        />
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
                setCountryAction={country => field.onChange(country?.code ?? "")}
                label={labels.fields.nationality}
                error={!!errors.nationality}
                helperText={errors.nationality?.message}
                onBlurAction={field.onBlur}
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
        <TextField
          {...register("nationalId")}
          label={labels.fields.nationalId}
          placeholder={labels.placeholders.nationalId}
          required
          error={!!errors.nationalId}
          helperText={errors.nationalId?.message}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <PhoneFormField
          name="phone"
          control={control}
          label={labels.fields.phone}
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
            <TextField
              {...register("dateOfBirth")}
              label={labels.fields.age}
              placeholder={labels.placeholders.age}
              type="number"
              fullWidth
              sx={outlinedInputSx}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <FormControl fullWidth error={!!errors.gender}>
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
              {errors.gender ? <FormHelperText>{errors.gender.message}</FormHelperText> : null}
            </FormControl>
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
        <TextField
          {...register("address")}
          label={labels.fields.address}
          placeholder={labels.placeholders.address}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          {...register("qualifications")}
          label={labels.fields.qualifications}
          placeholder={labels.placeholders.qualifications}
          fullWidth
          sx={outlinedInputSx}
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
