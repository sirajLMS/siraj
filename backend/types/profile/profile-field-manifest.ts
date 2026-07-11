import { type AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";

export type FieldGroupScope = ProfileScope;

export type ProfileFieldGroupKey =
  | "core_identity"
  | "core_contact"
  | "teacher_professional"
  | "teacher_identity"
  | "parent_social"
  | "parent_identity"
  | "parent_billing"
  | "parent_account"
  | "parent_students"
  | "teacher_students"
  | "staff_role"
  | "staff_permissions"
  | "payment_methods"
  | "meeting_configs";

export type ProfileFieldGroupDefinition = {
  readonly groupKey: ProfileFieldGroupKey;
  readonly paths: readonly string[];
  readonly audiences: readonly ProfileAudience[];
  readonly scopes: readonly FieldGroupScope[];
  readonly viewOwn: AppPermission;
  readonly viewOther: AppPermission;
  readonly editOwn: AppPermission;
  readonly editOther: AppPermission;
};

function profilePerm(
  group: ProfileFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): AppPermission {
  return `profile.${group}.${action}` as AppPermission;
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
      "teacherOwnProfile.phone",
      "teacherAdminProfile.phone",
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
      "teacherAdminProfile.nationalId",
      "teacherAdminProfile.dateOfBirth",
      "teacherAdminProfile.gender",
      "teacherAdminProfile.address",
      "teacherAdminProfile.timezone",
      "teacherAdminProfile.status",
    ],
    audiences: [ProfileAudience.TEACHER],
    scopes: [ProfileScope.OTHER],
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
    paths: ["parentAdminProfile.nationality", "parentAdminProfile.address", "parentAdminProfile.timezone"],
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
    paths: ["staffProfile.roleName", "staffProfile.roleSlug", "staffProfile.status", "staffProfile.hourlyRate", "staffProfile.rateCurrency"],
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

export const PROFILE_FIELD_GROUP_BY_KEY: Readonly<Record<ProfileFieldGroupKey, ProfileFieldGroupDefinition>> =
  Object.fromEntries(PROFILE_FIELD_GROUPS.map(group => [group.groupKey, group])) as Readonly<
    Record<ProfileFieldGroupKey, ProfileFieldGroupDefinition>
  >;

export function getProfileViewPermission(group: ProfileFieldGroupDefinition, scope: ProfileScope): AppPermission {
  return scope === ProfileScope.OWN ? group.viewOwn : group.viewOther;
}

export function getProfileEditPermission(group: ProfileFieldGroupDefinition, scope: ProfileScope): AppPermission {
  return scope === ProfileScope.OWN ? group.editOwn : group.editOther;
}
