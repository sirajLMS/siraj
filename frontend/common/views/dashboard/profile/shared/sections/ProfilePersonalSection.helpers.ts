import type { FieldPath, FieldValues } from "react-hook-form";
import { CountryCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  PersonalFieldKey,
  ProfilePersonalFormFields,
  ProfilePersonalSectionBaseProps,
} from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.types";
import type { ProfilePersonalFieldLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

const VALID_COUNTRY_CODES = new Set(Object.values(CountryCode) as readonly string[]);

export function isCountryCode(value: string): value is CountryCode {
  return VALID_COUNTRY_CODES.has(value);
}

export const PERSONAL_FIELD_KEYS: readonly PersonalFieldKey[] = [
  "nationality",
  "address",
  "dateOfBirth",
  "gender",
  "qualifications",
];

export function formatGender(
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

export function resolveFieldGroupKey(
  field: PersonalFieldKey,
  props: ProfilePersonalSectionBaseProps
): ProfileFieldGroupKey {
  const override = props.fieldGroupKeys?.[field];
  if (override) {
    return override;
  }
  if (field === "qualifications") {
    return props.qualificationsFieldGroupKey ?? props.fieldGroupKey;
  }
  return props.fieldGroupKey;
}

function isPersonalFieldPath<T extends ProfilePersonalFormFields & FieldValues>(value: string): value is FieldPath<T> {
  return typeof value === "string";
}

export function personalFieldPath<T extends ProfilePersonalFormFields & FieldValues>(value: string): FieldPath<T> {
  if (!isPersonalFieldPath<T>(value)) {
    throw new Error(`Invalid personal field path: ${value}`);
  }
  return value;
}
