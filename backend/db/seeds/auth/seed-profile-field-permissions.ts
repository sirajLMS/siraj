import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import logger from "@/backend/lib/logger";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
import { PROFILE_FIELD_GROUPS, type ProfileFieldGroupDefinition } from "@/backend/types/profile/profile-field-manifest";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";
import {
  STUDENT_FIELD_GROUPS,
  type StudentFieldGroupDefinition,
} from "@/backend/types/students/student-field-manifest";

type FieldPermissionSeed = {
  key: AppPermission;
  resource: string;
  action: string;
  description: LocalizedString;
  category: LocalizedString;
};

function profileGroupSeeds(group: ProfileFieldGroupDefinition): readonly FieldPermissionSeed[] {
  const label = group.groupKey.replaceAll("_", " ");
  const category: LocalizedString = { en: "Profile Fields", ar: "حقول الملف الشخصي" };
  return [
    {
      key: group.viewOwn,
      resource: "profile",
      action: `${group.groupKey}.view_own`,
      description: { en: `View own ${label}`, ar: `عرض ${label} الخاص` },
      category,
    },
    {
      key: group.viewOther,
      resource: "profile",
      action: `${group.groupKey}.view_other`,
      description: { en: `View other users' ${label}`, ar: `عرض ${label} للآخرين` },
      category,
    },
    {
      key: group.editOwn,
      resource: "profile",
      action: `${group.groupKey}.edit_own`,
      description: { en: `Edit own ${label}`, ar: `تعديل ${label} الخاص` },
      category,
    },
    {
      key: group.editOther,
      resource: "profile",
      action: `${group.groupKey}.edit_other`,
      description: { en: `Edit other users' ${label}`, ar: `تعديل ${label} للآخرين` },
      category,
    },
  ];
}

function studentGroupSeeds(group: StudentFieldGroupDefinition): readonly FieldPermissionSeed[] {
  const label = group.groupKey.replaceAll("_", " ");
  const category: LocalizedString = { en: "Student Profile Fields", ar: "حقول ملف الطالب" };
  return [
    {
      key: group.viewOwn,
      resource: "student",
      action: `${group.groupKey}.view_own`,
      description: { en: `View own student ${label}`, ar: `عرض ${label} للطالب المرتبط` },
      category,
    },
    {
      key: group.viewOther,
      resource: "student",
      action: `${group.groupKey}.view_other`,
      description: { en: `View any student ${label}`, ar: `عرض ${label} لأي طالب` },
      category,
    },
    {
      key: group.editOwn,
      resource: "student",
      action: `${group.groupKey}.edit_own`,
      description: { en: `Edit own student ${label}`, ar: `تعديل ${label} للطالب المرتبط` },
      category,
    },
    {
      key: group.editOther,
      resource: "student",
      action: `${group.groupKey}.edit_other`,
      description: { en: `Edit any student ${label}`, ar: `تعديل ${label} لأي طالب` },
      category,
    },
  ];
}

const PROFILE_FIELD_PERMISSION_SEEDS: readonly FieldPermissionSeed[] = PROFILE_FIELD_GROUPS.flatMap(profileGroupSeeds);

const STUDENT_FIELD_PERMISSION_SEEDS: readonly FieldPermissionSeed[] = STUDENT_FIELD_GROUPS.flatMap(studentGroupSeeds);

const TEACHER_VIEW_PROFILE_SEED: FieldPermissionSeed = {
  key: AppPermission.TEACHER_VIEW_PROFILE,
  resource: "teacher",
  action: "view_profile",
  description: {
    en: "View teacher profiles (other users)",
    ar: "عرض ملفات المعلمين (مستخدمون آخرون)",
  },
  category: { en: "Profile", ar: "الملف الشخصي" },
};

const ALL_SEEDS: readonly FieldPermissionSeed[] = [
  TEACHER_VIEW_PROFILE_SEED,
  ...PROFILE_FIELD_PERMISSION_SEEDS,
  ...STUDENT_FIELD_PERMISSION_SEEDS,
];

const ALL_KEYS = ALL_SEEDS.map(spec => spec.key);

const ALL_VIEW_OTHER_PROFILE = PROFILE_FIELD_GROUPS.map(group => group.viewOther);
const ALL_EDIT_OTHER_PROFILE = PROFILE_FIELD_GROUPS.map(group => group.editOther);

const PARENT_GROUP_KEYS = [
  "parent_social",
  "parent_identity",
  "parent_billing",
  "parent_account",
  "parent_students",
] as const;

const TEACHER_GROUP_KEYS = ["teacher_professional", "teacher_identity", "teacher_students"] as const;

function keysForProfileGroups(
  groupKeys: readonly string[],
  pick: (group: ProfileFieldGroupDefinition) => AppPermission
): AppPermission[] {
  return PROFILE_FIELD_GROUPS.filter(group => groupKeys.includes(group.groupKey)).map(pick);
}

const PARENT_VIEW_OTHER = [
  ...keysForProfileGroups(["core_identity", "core_contact"], group => group.viewOther),
  ...keysForProfileGroups(PARENT_GROUP_KEYS, group => group.viewOther),
  AppPermission.PROFILE_PAYMENT_METHODS_VIEW_OTHER,
  AppPermission.PROFILE_MEETING_CONFIGS_VIEW_OTHER,
];

const PARENT_VIEW_OWN = [
  ...keysForProfileGroups(
    ["core_identity", "core_contact", "parent_social", "parent_students"],
    group => group.viewOwn
  ),
  AppPermission.PROFILE_PAYMENT_METHODS_VIEW_OWN,
  AppPermission.PROFILE_MEETING_CONFIGS_VIEW_OWN,
];

const PARENT_EDIT_OWN = [
  ...keysForProfileGroups(["core_identity", "core_contact", "parent_social"], group => group.editOwn),
  AppPermission.PROFILE_PAYMENT_METHODS_EDIT_OWN,
  AppPermission.PROFILE_MEETING_CONFIGS_EDIT_OWN,
];

const TEACHER_VIEW_OTHER = [
  ...keysForProfileGroups(["core_identity", "core_contact"], group => group.viewOther),
  ...keysForProfileGroups(TEACHER_GROUP_KEYS, group => group.viewOther),
  AppPermission.TEACHER_VIEW_PROFILE,
];

const TEACHER_VIEW_OWN = [
  ...keysForProfileGroups(
    ["core_identity", "core_contact", "teacher_professional", "teacher_students"],
    group => group.viewOwn
  ),
  AppPermission.PROFILE_PAYMENT_METHODS_VIEW_OWN,
  AppPermission.PROFILE_MEETING_CONFIGS_VIEW_OWN,
];

const TEACHER_EDIT_OWN = [
  ...keysForProfileGroups(["core_identity", "core_contact", "teacher_professional"], group => group.editOwn),
  AppPermission.PROFILE_PAYMENT_METHODS_EDIT_OWN,
  AppPermission.PROFILE_MEETING_CONFIGS_EDIT_OWN,
];

const STAFF_VIEW_OWN = keysForProfileGroups(["core_identity", "core_contact", "staff_role"], group => group.viewOwn);
const STAFF_VIEW_OTHER = [
  ...keysForProfileGroups(
    ["core_identity", "core_contact", "staff_role", "staff_permissions"],
    group => group.viewOther
  ),
];
const STAFF_EDIT_OTHER = keysForProfileGroups(["staff_role", "staff_permissions"], group => group.editOther);

const STUDENT_ASSOCIATED_VIEW_OWN = [
  AppPermission.STUDENT_IDENTITY_VIEW_OWN,
  AppPermission.STUDENT_ACADEMIC_VIEW_OWN,
  AppPermission.STUDENT_TEACHER_VIEW_OWN,
  AppPermission.STUDENT_SCHEDULE_VIEW_OWN,
];

const STUDENT_PARENT_VIEW_OWN = STUDENT_ASSOCIATED_VIEW_OWN;
const STUDENT_TEACHER_VIEW_OWN = STUDENT_ASSOCIATED_VIEW_OWN;

const ALL_STUDENT_VIEW_OTHER = STUDENT_FIELD_GROUPS.map(group => group.viewOther);
const ALL_STUDENT_EDIT_OTHER = STUDENT_FIELD_GROUPS.map(group => group.editOther);

export async function seedOrGet() {
  logger.info("Seeding profile field-group permissions...");

  await PermissionManagementService.upsertSystemPermissions(ALL_SEEDS);

  await PermissionManagementService.ensureGroupPermissionsForGroups(["super_admin"], ALL_KEYS);

  await PermissionManagementService.ensureGroupPermissionsForGroups(
    ["academy_admin"],
    [
      ...ALL_VIEW_OTHER_PROFILE,
      ...ALL_EDIT_OTHER_PROFILE,
      AppPermission.TEACHER_VIEW_PROFILE,
      ...ALL_STUDENT_VIEW_OTHER,
      ...ALL_STUDENT_EDIT_OTHER,
      AppPermission.PROFILE_PAYMENT_METHODS_VIEW_OTHER,
      AppPermission.PROFILE_MEETING_CONFIGS_VIEW_OTHER,
      AppPermission.PROFILE_PAYMENT_METHODS_EDIT_OTHER,
      AppPermission.PROFILE_MEETING_CONFIGS_EDIT_OTHER,
    ]
  );

  await PermissionManagementService.ensureGroupPermissionsForGroups(
    ["teacher_default"],
    [
      ...TEACHER_VIEW_OWN,
      ...TEACHER_EDIT_OWN,
      ...TEACHER_VIEW_OTHER,
      ...STUDENT_TEACHER_VIEW_OWN,
      AppPermission.STUDENT_HISTORY_VIEW_OWN,
    ]
  );

  await PermissionManagementService.ensureGroupPermissionsForGroups(
    ["parent_default"],
    [
      ...PARENT_VIEW_OWN,
      ...PARENT_EDIT_OWN,
      ...PARENT_VIEW_OTHER,
      ...STUDENT_PARENT_VIEW_OWN,
      AppPermission.STUDENT_HISTORY_VIEW_OWN,
      AppPermission.STUDENT_QUOTA_EDIT_EDIT_OWN,
    ]
  );

  await PermissionManagementService.ensureGroupPermissionsForGroups(
    ["staff_default"],
    [...STAFF_VIEW_OWN, ...STAFF_VIEW_OTHER, ...STAFF_EDIT_OTHER]
  );

  logger.info(`Profile field permissions seeded (${ALL_SEEDS.length} keys).`);
  return ALL_KEYS;
}
