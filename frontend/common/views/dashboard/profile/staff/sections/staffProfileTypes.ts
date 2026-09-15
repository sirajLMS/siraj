import type { ProfileByUserIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";
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
    actions: {
      ...base.actions,
      manageLifecycle: base.actions.manageLifecycle,
    },
  };
}

export type StaffPermissionsSectionLabels = ProfileStaffLabels["permissions"];

type ProfileData = NonNullable<ProfileByUserIdQuery["profileByUserId"]>;

export type StaffProfileViewLabels = {
  readonly base: ProfileLabels;
  readonly staff: ProfileStaffLabels;
};

export type StaffProfileData = NonNullable<ProfileData["staffProfile"]>;
export type StaffPermissionGroups = ProfileData["staffPermissionGroups"];
export type StaffPermissionOverrides = ProfileData["staffPermissionOverrides"];
