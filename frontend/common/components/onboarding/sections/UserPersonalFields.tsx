"use client";

import { FormControl, FormHelperText, Grid, TextField } from "@mui/material";
import type { FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import type {
  OnboardingSectionTranslations,
  UserPersonalFieldsProps,
  UserPersonalFieldsShape,
} from "@/frontend/common/components/onboarding/sections/types";
import { AppDatePicker, outlinedInputSx } from "@/frontend/common/components/ui/form";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { getCountryByCode } from "@/frontend/common/lib/locale";

function validationMessage(translate: OnboardingSectionTranslations, message: string | undefined): string | undefined {
  if (!message) return undefined;
  return translate.validation[message];
}

export function UserPersonalFields<T extends UserPersonalFieldsShape & FieldValues>({
  register,
  control,
  errors,
  translate,
  hideQualifications = false,
}: Readonly<UserPersonalFieldsProps<T>>) {
  const nationalityField = "nationality" as Path<T>;
  const addressField = "address" as Path<T>;
  const dateOfBirthField = "dateOfBirth" as Path<T>;
  const genderField = "gender" as Path<T>;
  const qualificationsField = "qualifications" as Path<T>;

  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name={nationalityField}
          control={control}
          render={({ field }) => {
            const selectedCountry = field.value ? getCountryByCode(field.value as string) : undefined;

            return (
              <CountrySelect
                country={selectedCountry}
                setCountryAction={country => field.onChange(country?.code ?? "")}
                label={translate.fields.nationality}
                error={!!errors.nationality}
                helperText={validationMessage(translate, errors.nationality?.message as string | undefined)}
                onBlurAction={field.onBlur}
                fullWidth
              />
            );
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register(addressField)}
          label={translate.fields.address}
          placeholder={translate.placeholders.address}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          control={control}
          name={dateOfBirthField}
          render={({ field }) => {
            const dateValue = field.value ? new Date(field.value as string) : null;
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
                    helperText: validationMessage(translate, errors.dateOfBirth?.message as string | undefined),
                    sx: outlinedInputSx,
                    slotProps: { htmlInput: { autoComplete: "off" } },
                  },
                }}
              />
            );
          }}
        />
      </Grid>
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
              {validationMessage(translate, errors.gender?.message as string | undefined)}
            </FormHelperText>
          ) : null}
        </FormControl>
      </Grid>
      {hideQualifications ? null : (
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register(qualificationsField)}
            label={translate.fields.qualifications}
            placeholder={translate.placeholders.qualifications}
            fullWidth
            sx={outlinedInputSx}
          />
        </Grid>
      )}
    </>
  );
}
