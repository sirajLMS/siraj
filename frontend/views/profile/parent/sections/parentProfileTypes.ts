import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;
export type ParentOwnData = NonNullable<ProfileData["parentOwnProfile"]>;
export type ParentAdminData = NonNullable<ProfileData["parentAdminProfile"]>;
export type ParentViewData = ParentOwnData | ParentAdminData;
export type AssociatedStudents = ProfileData["associatedStudents"];
export type AssociatedStudentRow = NonNullable<NonNullable<AssociatedStudents>["rows"]>[number];

export function toDisplayValue(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}
