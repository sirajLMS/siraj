import {
  ProfileAudience as GqlProfileAudience,
  ProfileScope as GqlProfileScope,
  type MeQuery_me,
  type ProfileByUserIdQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { ownProfileHref, profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileLabels, ProfileRoleLabels } from "@/shared/locale/types/profile";

export type ProfileData = NonNullable<ProfileByUserIdQuery["profileByUserId"]>;

const GQL_PROFILE_AUDIENCES = new Set(Object.values(GqlProfileAudience) as readonly string[]);
const GQL_PROFILE_SCOPES = new Set(Object.values(GqlProfileScope) as readonly string[]);

function isGqlProfileAudience(value: string): value is GqlProfileAudience {
  return GQL_PROFILE_AUDIENCES.has(value);
}

function isGqlProfileScope(value: string): value is GqlProfileScope {
  return GQL_PROFILE_SCOPES.has(value);
}

function isProfileRoleKey(value: string): value is keyof ProfileRoleLabels {
  return value === "teacher" || value === "parent" || value === "staff" || value === "student";
}

export function buildStudentProfile(
  audience: ProfileAudience,
  scope: ProfileScope,
  targetUserId: string,
  user: MeQuery_me | null,
  userName: string,
  userAvatarUrl: string,
  userEmail: string | null | undefined
): ProfileData {
  return {
    assignedStudents: null,
    associatedStudents: null,
    // Shared profile enums match GraphQL wire values; narrow at the query-type boundary.
    audience: isGqlProfileAudience(audience) ? audience : null,
    avatarUrl: (userAvatarUrl || user?.avatarUrl) ?? null,
    displayCurrency: null,
    email: userEmail ?? user?.email ?? "",
    id: targetUserId,
    meetingConfigs: null,
    name: (userName || user?.name) ?? "",
    parentAdminProfile: null,
    parentId: null,
    parentOwnProfile: null,
    paymentMethodDefaults: null,
    paymentMethods: null,
    phone: null,
    scope: isGqlProfileScope(scope) ? scope : null,
    staffPermissionGroups: null,
    staffPermissionOverrides: null,
    staffProfile: null,
    staffProfileId: null,
    teacherAdminProfile: null,
    teacherId: null,
    teacherOwnProfile: null,
    timezone: null,
    userId: targetUserId,
  };
}

export function computeHrefs(scope: ProfileScope, targetUserId: string): { editHref: string; cancelHref: string } {
  const editHref = scope === ProfileScope.OWN ? `${ownProfileHref()}/edit` : `${profileHrefForUser(targetUserId)}/edit`;
  const cancelHref = scope === ProfileScope.OWN ? ownProfileHref() : profileHrefForUser(targetUserId);
  return { editHref, cancelHref };
}

export function computeRoleLabel(
  audience: ProfileAudience,
  profile: ProfileData | null | undefined,
  base: ProfileLabels
): string | undefined {
  if (audience === ProfileAudience.STAFF) {
    return profile?.staffProfile?.roleName ?? profile?.staffProfile?.roleSlug ?? undefined;
  }
  const roleKey = audience.toLowerCase();
  return isProfileRoleKey(roleKey) ? base.role[roleKey] : undefined;
}

export function computeShowParentAccountActions(
  audience: ProfileAudience,
  scope: ProfileScope,
  mode: ProfileMode
): boolean {
  return audience === ProfileAudience.PARENT && scope === ProfileScope.OTHER && mode === ProfileMode.VIEW;
}
