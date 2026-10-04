import type { Control, FieldValues, UseFormRegister } from "react-hook-form";
import type { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  ProfilePersonalFieldLabels,
  ProfilePersonalFieldVisibility,
  ProfileSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

export type ProfilePersonalFormFields = {
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

export type ProfilePersonalSectionBaseProps = {
  readonly scope?: ProfileScope;
  readonly fieldGroupKey: ProfileFieldGroupKey;
  readonly qualificationsFieldGroupKey?: ProfileFieldGroupKey;
  readonly fieldGroupKeys?: ProfilePersonalFieldGroupKeys;
  readonly sectionTitle: string;
  readonly fieldLabels: ProfilePersonalFieldLabels;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly fields: ProfilePersonalFieldVisibility;
};

export type ProfilePersonalViewProps = ProfilePersonalSectionBaseProps & {
  readonly mode: "view";
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: string | null;
  readonly qualifications?: string | null;
};

export type ProfilePersonalEditProps<T extends ProfilePersonalFormFields & FieldValues = ProfilePersonalFormFields> =
  ProfilePersonalSectionBaseProps & {
    readonly mode: "edit";
    readonly register: UseFormRegister<T>;
    readonly control: Control<T>;
  };

export type ProfilePersonalSectionProps<T extends ProfilePersonalFormFields & FieldValues = ProfilePersonalFormFields> =
  | ProfilePersonalViewProps
  | ProfilePersonalEditProps<T>;

export type PersonalFieldKey = keyof ProfilePersonalFieldVisibility;
