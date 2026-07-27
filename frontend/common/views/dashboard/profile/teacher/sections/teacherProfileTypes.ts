import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

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
