import type * as Operations from "@/frontend/graphql/generated/gql/operations";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

export type TeacherOwnData = NonNullable<ProfileData["teacherOwnProfile"]>;
export type TeacherAdminData = NonNullable<ProfileData["teacherAdminProfile"]>;
export type TeacherViewData = TeacherOwnData | TeacherAdminData;

export function isTeacherAdminData(data: TeacherViewData): data is TeacherAdminData {
  return "nationalId" in data || "status" in data;
}

export function toDisplayValue(value: string | null | undefined, fallback: string): string {
  if (value == null || value.trim() === "") {
    return fallback;
  }
  return value;
}
