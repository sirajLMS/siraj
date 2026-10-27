import { type AppPermission, isAppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import type { ProfileFieldGroupDefinition, ProfileFieldGroupKey } from "@/backend/types";

function profilePerm(
  group: ProfileFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): AppPermission {
  const perm = `profile.${group}.${action}`;
  if (isAppPermission(perm)) {
    return perm;
  }
  throw new Error(`Invalid AppPermission: ${perm}`);
}

const ALL_AUDIENCES = [ProfileAudience.TEACHER, ProfileAudience.PARENT, ProfileAudience.STAFF] as const;

export const PROFILE_FIELD_GROUPS: readonly ProfileFieldGroupDefinition[] = [
  {
    groupKey: "core_identity",
    paths: ["name", "email", "avatarUrl", "displayCurrency"],
    audiences: ALL_AUDIENCES,
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("core_identity", "view_own"),
    viewOther: profilePerm("core_identity", "view_other"),
    editOwn: profilePerm("core_identity", "edit_own"),
    editOther: profilePerm("core_identity", "edit_other"),
  },
  {
    groupKey: "core_contact",
    paths: [
      "phone",
      "timezone",
      "teacherOwnProfile.phone",
      "teacherAdminProfile.phone",
      "teacherOwnProfile.timezone",
      "teacherAdminProfile.timezone",
      "parentOwnProfile.phone",
      "parentAdminProfile.phone",
      "staffProfile.phone",
    ],
    audiences: ALL_AUDIENCES,
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("core_contact", "view_own"),
    viewOther: profilePerm("core_contact", "view_other"),
    editOwn: profilePerm("core_contact", "edit_own"),
    editOther: profilePerm("core_contact", "edit_other"),
  },
  {
    groupKey: "teacher_professional",
    paths: [
      "teacherOwnProfile.qualifications",
      "teacherOwnProfile.hourlyRate",
      "teacherOwnProfile.rateCurrency",
      "teacherOwnProfile.totalClasses",
      "teacherAdminProfile.qualifications",
      "teacherAdminProfile.hourlyRate",
      "teacherAdminProfile.rateCurrency",
      "teacherAdminProfile.totalClasses",
      "teacherAdminProfile.avgEngagementScore",
    ],
    audiences: [ProfileAudience.TEACHER],
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("teacher_professional", "view_own"),
    viewOther: profilePerm("teacher_professional", "view_other"),
    editOwn: profilePerm("teacher_professional", "edit_own"),
    editOther: profilePerm("teacher_professional", "edit_other"),
  },
  {
    groupKey: "teacher_identity",
    paths: [
      "teacherOwnProfile.nationalId",
      "teacherOwnProfile.nationality",
      "teacherOwnProfile.dateOfBirth",
      "teacherOwnProfile.gender",
      "teacherOwnProfile.address",
      "teacherAdminProfile.nationalId",
      "teacherAdminProfile.nationality",
      "teacherAdminProfile.dateOfBirth",
      "teacherAdminProfile.gender",
      "teacherAdminProfile.address",
      "teacherAdminProfile.status",
    ],
    audiences: [ProfileAudience.TEACHER],
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("teacher_identity", "view_own"),
    viewOther: profilePerm("teacher_identity", "view_other"),
    editOwn: profilePerm("teacher_identity", "edit_own"),
    editOther: profilePerm("teacher_identity", "edit_other"),
  },
  {
    groupKey: "parent_social",
    paths: [
      "parentOwnProfile.facebook",
      "parentOwnProfile.whatsapp",
      "parentOwnProfile.twitter",
      "parentAdminProfile.facebook",
      "parentAdminProfile.whatsapp",
      "parentAdminProfile.twitter",
    ],
    audiences: [ProfileAudience.PARENT],
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("parent_social", "view_own"),
    viewOther: profilePerm("parent_social", "view_other"),
    editOwn: profilePerm("parent_social", "edit_own"),
    editOther: profilePerm("parent_social", "edit_other"),
  },
  {
    groupKey: "parent_identity",
    paths: ["parentAdminProfile.nationality", "parentAdminProfile.address"],
    audiences: [ProfileAudience.PARENT],
    scopes: [ProfileScope.OTHER],
    viewOwn: profilePerm("parent_identity", "view_own"),
    viewOther: profilePerm("parent_identity", "view_other"),
    editOwn: profilePerm("parent_identity", "edit_own"),
    editOther: profilePerm("parent_identity", "edit_other"),
  },
  {
    groupKey: "parent_billing",
    paths: [
      "parentAdminProfile.invoiceType",
      "parentAdminProfile.feeAmount",
      "parentAdminProfile.currency",
      "parentAdminProfile.displayCurrency",
      "parentAdminProfile.lifecycleStatus",
    ],
    audiences: [ProfileAudience.PARENT],
    scopes: [ProfileScope.OTHER],
    viewOwn: profilePerm("parent_billing", "view_own"),
    viewOther: profilePerm("parent_billing", "view_other"),
    editOwn: profilePerm("parent_billing", "edit_own"),
    editOther: profilePerm("parent_billing", "edit_other"),
  },
  {
    groupKey: "parent_account",
    paths: ["parentAdminProfile.accountStatus", "parentAdminProfile.lifecycleStatus"],
    audiences: [ProfileAudience.PARENT],
    scopes: [ProfileScope.OTHER],
    viewOwn: profilePerm("parent_account", "view_own"),
    viewOther: profilePerm("parent_account", "view_other"),
    editOwn: profilePerm("parent_account", "edit_own"),
    editOther: profilePerm("parent_account", "edit_other"),
  },
  {
    groupKey: "parent_students",
    paths: ["associatedStudents"],
    audiences: [ProfileAudience.PARENT],
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("parent_students", "view_own"),
    viewOther: profilePerm("parent_students", "view_other"),
    editOwn: profilePerm("parent_students", "edit_own"),
    editOther: profilePerm("parent_students", "edit_other"),
  },
  {
    groupKey: "teacher_students",
    paths: ["assignedStudents"],
    audiences: [ProfileAudience.TEACHER],
    scopes: [ProfileScope.OTHER],
    viewOwn: profilePerm("teacher_students", "view_own"),
    viewOther: profilePerm("teacher_students", "view_other"),
    editOwn: profilePerm("teacher_students", "edit_own"),
    editOther: profilePerm("teacher_students", "edit_other"),
  },
  {
    groupKey: "staff_role",
    paths: [
      "staffProfile.roleName",
      "staffProfile.roleSlug",
      "staffProfile.status",
      "staffProfile.hourlyRate",
      "staffProfile.rateCurrency",
    ],
    audiences: [ProfileAudience.STAFF],
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("staff_role", "view_own"),
    viewOther: profilePerm("staff_role", "view_other"),
    editOwn: profilePerm("staff_role", "edit_own"),
    editOther: profilePerm("staff_role", "edit_other"),
  },
  {
    groupKey: "staff_permissions",
    paths: ["staffPermissionGroups", "staffPermissionOverrides"],
    audiences: [ProfileAudience.STAFF],
    scopes: [ProfileScope.OTHER],
    viewOwn: profilePerm("staff_permissions", "view_own"),
    viewOther: profilePerm("staff_permissions", "view_other"),
    editOwn: profilePerm("staff_permissions", "edit_own"),
    editOther: profilePerm("staff_permissions", "edit_other"),
  },
  {
    groupKey: "payment_methods",
    paths: ["paymentMethods", "paymentMethodDefaults"],
    audiences: [ProfileAudience.TEACHER, ProfileAudience.PARENT],
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("payment_methods", "view_own"),
    viewOther: profilePerm("payment_methods", "view_other"),
    editOwn: profilePerm("payment_methods", "edit_own"),
    editOther: profilePerm("payment_methods", "edit_other"),
  },
  {
    groupKey: "meeting_configs",
    paths: ["meetingConfigs"],
    audiences: [ProfileAudience.TEACHER, ProfileAudience.PARENT],
    scopes: [ProfileScope.OWN, ProfileScope.OTHER],
    viewOwn: profilePerm("meeting_configs", "view_own"),
    viewOther: profilePerm("meeting_configs", "view_other"),
    editOwn: profilePerm("meeting_configs", "edit_own"),
    editOther: profilePerm("meeting_configs", "edit_other"),
  },
] as const;

/**
 * Group keys the manifest must define, mirroring the `ProfileFieldGroupKey`
 * union. The `CompleteGroupKeyMap` guard below turns a missing entry into a
 * compile error, so this list and the union cannot drift apart.
 */
const EXPECTED_GROUP_KEYS = [
  "core_identity",
  "core_contact",
  "teacher_professional",
  "teacher_identity",
  "parent_social",
  "parent_identity",
  "parent_billing",
  "parent_account",
  "parent_students",
  "teacher_students",
  "staff_role",
  "staff_permissions",
  "payment_methods",
  "meeting_configs",
] as const satisfies readonly ProfileFieldGroupKey[];

// Compile-time guard: resolves to the full map type only when EXPECTED_GROUP_KEYS
// covers every ProfileFieldGroupKey; otherwise it resolves to a placeholder that
// makes `return map` in buildGroupByKeyMap fail to compile, so the list and the
// union cannot drift apart silently.
type CompleteGroupKeyMap =
  Exclude<ProfileFieldGroupKey, (typeof EXPECTED_GROUP_KEYS)[number]> extends never
    ? Record<ProfileFieldGroupKey, ProfileFieldGroupDefinition>
    : { readonly missingGroupKey: Exclude<ProfileFieldGroupKey, (typeof EXPECTED_GROUP_KEYS)[number]> };

function assertAllGroupsPresent(
  map: Partial<Record<ProfileFieldGroupKey, ProfileFieldGroupDefinition>>
): asserts map is CompleteGroupKeyMap {
  for (const key of EXPECTED_GROUP_KEYS) {
    if (map[key] === undefined) {
      throw new Error(`Missing profile field group: ${key}`);
    }
  }
}

/**
 * Single-pass O(N) map construction to eliminate quadratic O(N^2) array scans
 * (`PROFILE_FIELD_GROUPS.find(...)` repeated for every key) during module import,
 * while keeping the import-time fail-fast when a key has no manifest entry.
 */
function buildGroupByKeyMap(): Readonly<Record<ProfileFieldGroupKey, ProfileFieldGroupDefinition>> {
  const map: Partial<Record<ProfileFieldGroupKey, ProfileFieldGroupDefinition>> = {};
  for (let i = 0; i < PROFILE_FIELD_GROUPS.length; i++) {
    const group = PROFILE_FIELD_GROUPS[i];
    map[group.groupKey] = group;
  }
  assertAllGroupsPresent(map);
  return map;
}

export const PROFILE_FIELD_GROUP_BY_KEY: Readonly<Record<ProfileFieldGroupKey, ProfileFieldGroupDefinition>> =
  buildGroupByKeyMap();

/**
 * Pre-computed arrays of view permission keys to avoid repeated `.map()` allocations on every profile authorization check.
 */
export const PROFILE_VIEW_OWN_KEYS: readonly AppPermission[] = PROFILE_FIELD_GROUPS.map(group => group.viewOwn);
export const PROFILE_VIEW_OTHER_KEYS: readonly AppPermission[] = PROFILE_FIELD_GROUPS.map(group => group.viewOther);

export function getProfileViewPermission(group: ProfileFieldGroupDefinition, scope: ProfileScope): AppPermission {
  return scope === ProfileScope.OWN ? group.viewOwn : group.viewOther;
}

export function getProfileEditPermission(group: ProfileFieldGroupDefinition, scope: ProfileScope): AppPermission {
  return scope === ProfileScope.OWN ? group.editOwn : group.editOther;
}
