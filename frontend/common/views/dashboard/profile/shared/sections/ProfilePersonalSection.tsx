"use client";

import { FormControl, FormHelperText, Stack, TextField } from "@mui/material";
import { Controller, type FieldValues } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { DateOfBirthControllerField } from "@/frontend/common/components/ui/form/field";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import { personalFieldPath } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.helpers";
import { usePersonalFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.hooks";
import { ProfilePersonalSectionView } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.parts";
import type {
  ProfilePersonalEditProps,
  ProfilePersonalFormFields,
  ProfilePersonalSectionProps,
} from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.types";
import { useProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/useProfileSharedBaseLabels";

function ProfilePersonalSectionEdit<T extends ProfilePersonalFormFields & FieldValues>({
  props,
  access,
}: {
  readonly props: ProfilePersonalEditProps<T>;
  readonly access: ReturnType<typeof usePersonalFieldAccess>;
}) {
  const { register, control, fieldLabels: labels } = props;
  const { canViewField, canEditField } = access;

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={2}>
        {canViewField("nationality") ? (
          <Controller
            name={personalFieldPath<T>("nationality")}
            control={control}
            render={({ field, fieldState }) => {
              const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;

              return (
                <CountrySelect
                  country={selectedCountry}
                  setCountryAction={country => field.onChange(country?.code ?? "")}
                  label={labels.nationality}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  onBlurAction={field.onBlur}
                  fullWidth
                  disabled={!canEditField("nationality")}
                />
              );
            }}
          />
        ) : null}
        {canViewField("address") ? (
          <TextField
            label={labels.address}
            fullWidth
            size="small"
            multiline
            rows={2}
            disabled={!canEditField("address")}
            {...register(personalFieldPath<T>("address"))}
          />
        ) : null}
        {canViewField("dateOfBirth") ? (
          <DateOfBirthControllerField
            control={control}
            name={personalFieldPath<T>("dateOfBirth")}
            label={labels.dateOfBirth}
            disabled={!canEditField("dateOfBirth")}
          />
        ) : null}
        {canViewField("gender") ? (
          <Controller
            control={control}
            name={personalFieldPath<T>("gender")}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={Boolean(fieldState.error)} disabled={!canEditField("gender")}>
                <GenderSelector
                  gender={field.value ?? null}
                  setGenderAction={field.onChange}
                  fullWidth
                  labels={{
                    title: labels.gender,
                    male: labels.male,
                    female: labels.female,
                  }}
                />
                {fieldState.error ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
        ) : null}
        {canViewField("qualifications") ? (
          <TextField
            label={labels.qualifications}
            fullWidth
            size="small"
            multiline
            rows={3}
            disabled={!canEditField("qualifications")}
            {...register(personalFieldPath<T>("qualifications"))}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

export function ProfilePersonalSection<T extends ProfilePersonalFormFields & FieldValues = ProfilePersonalFormFields>(
  props: ProfilePersonalSectionProps<T>
) {
  const fallbackBaseLabels = useProfileSharedBaseLabels();
  const baseLabels = props.baseLabels ?? fallbackBaseLabels;
  const access = usePersonalFieldAccess(props);

  if (!access.hasAccessibleField()) {
    return null;
  }

  if (props.mode === "edit") {
    return <ProfilePersonalSectionEdit props={props} access={access} />;
  }

  return <ProfilePersonalSectionView props={props} access={access} baseLabels={baseLabels} />;
}
