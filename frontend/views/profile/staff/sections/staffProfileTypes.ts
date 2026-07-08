import type * as Operations from "@/frontend/graphql/generated/gql/operations";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

export type StaffProfileData = NonNullable<ProfileData["staffProfile"]>;
export type StaffPermissionGroups = ProfileData["staffPermissionGroups"];
export type StaffPermissionOverrides = ProfileData["staffPermissionOverrides"];

export function toDisplayValue(value: string | null | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value;
}
