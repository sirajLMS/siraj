"use client";

import CakeOutlined from "@mui/icons-material/CakeOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import WcOutlined from "@mui/icons-material/WcOutlined";
import { FormControl, FormHelperText, Stack, TextField } from "@mui/material";
import type { Control, FieldPath, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CountryDisplay } from "@/frontend/common/components/ui/display";
import { AppDatePicker } from "@/frontend/common/components/ui/form";
import { CountrySelect } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { Gender, type ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCountryByCode } from "@/frontend/common/lib/locale";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import type {
  ProfilePersonalFieldLabels,
  ProfilePersonalFieldVisibility,
  ProfileSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { useProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/useProfileSharedBaseLabels";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

type ProfilePersonalFormFields = {
  nationality?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender | null;
  qualifications?: string;
};

type ProfilePersonalFieldGroupKeys = {
  readonly nationality?: ProfileFieldGroupKey;
  readonly address?: ProfileFieldGroupKey;
  readonly dateOfBirth?: ProfileFieldGroupKey;
  readonly gender?: ProfileFieldGroupKey;
  readonly qualifications?: ProfileFieldGroupKey;
};

type ProfilePersonalSectionBaseProps = {
  readonly scope?: ProfileScope;
  readonly fieldGroupKey: ProfileFieldGroupKey;
  readonly qualificationsFieldGroupKey?: ProfileFieldGroupKey;
  readonly fieldGroupKeys?: ProfilePersonalFieldGroupKeys;
  readonly sectionTitle: string;
  readonly fieldLabels: ProfilePersonalFieldLabels;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly fields: ProfilePersonalFieldVisibility;
};

type ProfilePersonalViewProps = ProfilePersonalSectionBaseProps & {
  readonly mode: "view";
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: string | null;
  readonly qualifications?: string | null;
};

type ProfilePersonalEditProps<T extends ProfilePersonalFormFields = ProfilePersonalFormFields> =
  ProfilePersonalSectionBaseProps & {
    readonly mode: "edit";
    readonly register: UseFormRegister<T>;
    readonly control: Control<T>;
  };

type ProfilePersonalSectionProps<T extends ProfilePersonalFormFields = ProfilePersonalFormFields> =
  | ProfilePersonalViewProps
  | ProfilePersonalEditProps<T>;

type PersonalFieldKey = keyof ProfilePersonalFieldVisibility;

const PERSONAL_FIELD_KEYS: readonly PersonalFieldKey[] = [
  "nationality",
  "address",
  "dateOfBirth",
  "gender",
  "qualifications",
];

function formatGender(
  gender: string | null | undefined,
  labels: Pick<ProfilePersonalFieldLabels, "male" | "female">
): string {
  if (gender === Gender.Male) {
    return labels.male;
  }
  if (gender === Gender.Female) {
    return labels.female;
  }
  return "";
}

function resolveFieldGroupKey(field: PersonalFieldKey, props: ProfilePersonalSectionBaseProps): ProfileFieldGroupKey {
  const override = props.fieldGroupKeys?.[field as keyof ProfilePersonalFieldGroupKeys];
  if (override) {
    return override;
  }
  if (field === "qualifications") {
    return props.qualificationsFieldGroupKey ?? props.fieldGroupKey;
  }
  return props.fieldGroupKey;
}

function usePersonalFieldAccess(props: ProfilePersonalSectionBaseProps) {
  const { canView, canEdit } = useProfileFieldAccess({ scope: props.scope });

  const isFieldEnabled = (field: PersonalFieldKey): boolean => props.fields[field] === true;

  const canViewField = (field: PersonalFieldKey): boolean => {
    if (!isFieldEnabled(field)) {
      return false;
    }
    return canView(resolveFieldGroupKey(field, props));
  };

  const canEditField = (field: PersonalFieldKey): boolean => {
    if (!isFieldEnabled(field)) {
      return false;
    }
    return canEdit(resolveFieldGroupKey(field, props));
  };

  const hasAccessibleField = (): boolean => PERSONAL_FIELD_KEYS.some(field => canViewField(field));

  return { canViewField, canEditField, hasAccessibleField };
}

function ProfilePersonalSectionEdit<T extends ProfilePersonalFormFields>({
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
            name={"nationality" as FieldPath<T>}
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
            {...register("address" as FieldPath<T>)}
          />
        ) : null}
        {canViewField("dateOfBirth") ? (
          <Controller
            name={"dateOfBirth" as FieldPath<T>}
            control={control}
            render={({ field, fieldState }) => {
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
                  disabled={!canEditField("dateOfBirth")}
                  slotProps={{
                    textField: {
                      label: labels.dateOfBirth,
                      variant: "outlined",
                      fullWidth: true,
                      error: Boolean(fieldState.error),
                      helperText: fieldState.error?.message,
                      slotProps: { htmlInput: { autoComplete: "off" } },
                    },
                  }}
                />
              );
            }}
          />
        ) : null}
        {canViewField("gender") ? (
          <Controller
            control={control}
            name={"gender" as FieldPath<T>}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={Boolean(fieldState.error)} disabled={!canEditField("gender")}>
                <GenderSelector
                  gender={(field.value as Gender | null) ?? null}
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
            {...register("qualifications" as FieldPath<T>)}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

function ProfilePersonalSectionView({
  props,
  access,
  baseLabels,
}: {
  readonly props: ProfilePersonalViewProps;
  readonly access: ReturnType<typeof usePersonalFieldAccess>;
  readonly baseLabels: ProfileSharedBaseLabels;
}) {
  const { canViewField } = access;
  const labels = props.fieldLabels;

  const genderDisplay = formatGender(props.gender, labels);

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={1}>
        {canViewField("nationality") ? (
          <ProfileFieldRow
            icon={PersonOutlined}
            label={labels.nationality}
            value={
              props.nationality ? (
                <CountryDisplay code={props.nationality} fallback={baseLabels.notSet} />
              ) : (
                baseLabels.notSet
              )
            }
          />
        ) : null}
        {canViewField("address") ? (
          <ProfileFieldRow icon={HomeOutlined} label={labels.address} value={props.address ?? baseLabels.notSet} />
        ) : null}
        {canViewField("dateOfBirth") ? (
          <ProfileFieldRow
            icon={CakeOutlined}
            label={labels.dateOfBirth}
            value={props.dateOfBirth ?? baseLabels.notSet}
          />
        ) : null}
        {canViewField("gender") ? (
          <ProfileFieldRow icon={WcOutlined} label={labels.gender} value={genderDisplay || baseLabels.notSet} />
        ) : null}
        {canViewField("qualifications") ? (
          <ProfileFieldRow
            icon={SchoolOutlined}
            label={labels.qualifications}
            value={props.qualifications ?? baseLabels.notSet}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

export function ProfilePersonalSection<T extends ProfilePersonalFormFields = ProfilePersonalFormFields>(
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
