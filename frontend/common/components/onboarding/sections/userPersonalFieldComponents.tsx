"use client";

import { FormControl, FormHelperText, Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import type {
  OnboardingSectionTranslations,
  UserPersonalFieldsShape,
} from "@/frontend/common/components/onboarding/sections/types";
import { AppDatePicker, outlinedInputSx } from "@/frontend/common/components/ui/form";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { getCountryByCode } from "@/frontend/common/lib/locale";

function isPersonalFieldPath<T extends UserPersonalFieldsShape & FieldValues>(value: string): value is Path<T> {
  return typeof value === "string";
}

function personalFieldPath<T extends UserPersonalFieldsShape & FieldValues>(value: string): Path<T> {
  if (!isPersonalFieldPath<T>(value)) {
    throw new Error(`Invalid personal field path: ${value}`);
  }
  return value;
}

function validationMessage(translate: OnboardingSectionTranslations, fieldErrorOrMessage: unknown): string | undefined {
  if (!fieldErrorOrMessage) return undefined;

  let message: unknown;
  if (typeof fieldErrorOrMessage === "string") {
    message = fieldErrorOrMessage;
  } else if (typeof fieldErrorOrMessage === "object" && "message" in fieldErrorOrMessage) {
    message = (fieldErrorOrMessage as { message?: unknown }).message;
  } else {
    return undefined;
  }

  return typeof message === "string" ? translate.validation[message] : undefined;
}

type PersonalFieldProps<T extends UserPersonalFieldsShape & FieldValues> = {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly translate: OnboardingSectionTranslations;
};

export function UserPersonalNationalityField<T extends UserPersonalFieldsShape & FieldValues>({
  control,
  errors,
  translate,
}: Readonly<PersonalFieldProps<T>>) {
  const nationalityField = personalFieldPath<T>("nationality");

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name={nationalityField}
        control={control}
        render={({ field }) => {
          const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

          return (
            <CountrySelect
              country={selectedCountry}
              setCountryAction={country => field.onChange(country?.code ?? "")}
              label={translate.fields.nationality}
              error={!!errors.nationality}
              helperText={validationMessage(translate, errors.nationality?.message)}
              onBlurAction={field.onBlur}
              fullWidth
            />
          );
        }}
      />
    </Grid>
  );
}

export function UserPersonalAddressField<T extends UserPersonalFieldsShape & FieldValues>({
  register,
  translate,
}: Readonly<Pick<PersonalFieldProps<T>, "register" | "translate">>) {
  const addressField = personalFieldPath<T>("address");

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        {...register(addressField)}
        label={translate.fields.address}
        placeholder={translate.placeholders.address}
        fullWidth
        sx={outlinedInputSx}
      />
    </Grid>
  );
}

export function UserPersonalDateOfBirthField<T extends UserPersonalFieldsShape & FieldValues>({
  control,
  errors,
  translate,
}: Readonly<Pick<PersonalFieldProps<T>, "control" | "errors" | "translate">>) {
  const dateOfBirthField = personalFieldPath<T>("dateOfBirth");

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        control={control}
        name={dateOfBirthField}
        render={({ field }) => {
          const dateValue = field.value ? new Date(field.value) : null;
          const validDate = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue : null;

          return (
            <AppDatePicker
              value={validDate}
              onChange={(date: Date | null) => {
                if (date && !Number.isNaN(date.getTime())) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  field.onChange(`${year}-${month}-${day}`);
                } else {
                  field.onChange("");
                }
              }}
              slotProps={{
                textField: {
                  label: translate.fields.dateOfBirth,
                  variant: "outlined",
                  fullWidth: true,
                  error: Boolean(errors.dateOfBirth),
                  helperText: validationMessage(translate, errors.dateOfBirth?.message),
                  sx: outlinedInputSx,
                  slotProps: { htmlInput: { autoComplete: "off" } },
                },
              }}
            />
          );
        }}
      />
    </Grid>
  );
}

export function UserPersonalGenderField<T extends UserPersonalFieldsShape & FieldValues>({
  control,
  errors,
  translate,
}: Readonly<Pick<PersonalFieldProps<T>, "control" | "errors" | "translate">>) {
  const genderField = personalFieldPath<T>("gender");

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <FormControl fullWidth error={!!errors.gender} sx={outlinedInputSx}>
        <Controller
          control={control}
          name={genderField}
          render={({ field }) => (
            <GenderSelector
              gender={field.value ?? null}
              setGenderAction={field.onChange}
              required
              error={!!errors.gender}
              fullWidth
              labels={{
                title: translate.fields.gender,
                male: translate.fields.male,
                female: translate.fields.female,
              }}
            />
          )}
        />
        {errors.gender ? (
          <FormHelperText>
            {validationMessage(translate, errors.gender?.message)}
          </FormHelperText>
        ) : null}
      </FormControl>
    </Grid>
  );
}

export function UserPersonalQualificationsField<T extends UserPersonalFieldsShape & FieldValues>({
  register,
  translate,
}: Readonly<Pick<PersonalFieldProps<T>, "register" | "translate">>) {
  const qualificationsField = personalFieldPath<T>("qualifications");

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        {...register(qualificationsField)}
        label={translate.fields.qualifications}
        placeholder={translate.placeholders.qualifications}
        fullWidth
        sx={outlinedInputSx}
      />
    </Grid>
  );
}
