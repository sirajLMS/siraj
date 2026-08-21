import type { ProfileByUserIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { TeacherProfileLabels } from "@/shared/locale/types/dashboard/teachers/profile";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { ProfileLabels, ProfileTeacherLabels } from "@/shared/locale/types/profile";

export type TeacherProfileViewLabels = {
  readonly base: ProfileLabels;
  readonly teacher: ProfileTeacherLabels;
  readonly dashboard: TeacherProfileLabels;
  readonly errors: ErrorsLabels;
};

type ProfileData = NonNullable<ProfileByUserIdQuery["profileByUserId"]>;

export type TeacherOwnData = NonNullable<ProfileData["teacherOwnProfile"]>;
export type TeacherAdminData = NonNullable<ProfileData["teacherAdminProfile"]>;
export type TeacherViewData = TeacherOwnData | TeacherAdminData;

export function isTeacherAdminData(data: TeacherViewData): data is TeacherAdminData {
  // `status` is only present on the admin profile (TeacherAdminData); the own
  // profile (TeacherOwnData) does not expose it. `nationalId` is now present
  // on both, so it cannot be used to distinguish them.
  return "status" in data;
}

export function toDisplayValue(value: string | null | undefined, fallback: string): string {
  if (value == null || value.trim() === "") {
    return fallback;
  }
  return value;
}

export function toTeacherBaseLabels(base: ProfileLabels): ProfileSharedBaseLabels {
  return {
    notSet: base.notSet,
    fieldAccess: base.fieldAccess,
    actions: {
      ...base.actions,
      manageLifecycle: base.actions.manageLifecycle,
    },
  };
}
