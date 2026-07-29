import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { ProfileLabels, ProfileStaffLabels } from "@/shared/locale/types/profile";

export type StaffSectionLabels = ProfileStaffLabels;

export type StaffSectionLabelsBundle = {
  readonly staff: ProfileStaffLabels;
  readonly baseLabels: ProfileSharedBaseLabels;
};

export function toStaffSharedBaseLabels(base: ProfileLabels): ProfileSharedBaseLabels {
  return {
    notSet: base.notSet,
    fieldAccess: base.fieldAccess,
  };
}

export type StaffRoleSectionLabels = {
  readonly staff: ProfileStaffLabels;
  readonly base: Pick<ProfileLabels, "notSet">;
};

export type StaffPermissionsSectionLabels = ProfileStaffLabels["permissions"];

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

export type StaffProfileViewLabels = {
  readonly base: ProfileLabels;
  readonly staff: ProfileStaffLabels;
};

export type StaffProfileData = NonNullable<ProfileData["staffProfile"]>;
export type StaffPermissionGroups = ProfileData["staffPermissionGroups"];
export type StaffPermissionOverrides = ProfileData["staffPermissionOverrides"];

export function toDisplayValue(value: string | null | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value;
}
