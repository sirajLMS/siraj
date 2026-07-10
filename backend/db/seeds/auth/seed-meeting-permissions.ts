import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import logger from "@/backend/lib/logger";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

type MeetingPermissionSeed = {
  key: AppPermission;
  resource: string;
  action: string;
  description: LocalizedString;
  category: LocalizedString;
};

const MEETING_PERMISSION_SEEDS: readonly MeetingPermissionSeed[] = [
  {
    key: AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG,
    resource: "meeting_providers",
    action: "manage_catalog",
    description: {
      en: "Manage meeting provider catalog entries",
      ar: "إدارة كتالوج مزودي الاجتماعات",
    },
    category: { en: "Meeting", ar: "الاجتماعات" },
  },
  {
    key: AppPermission.MEETING_CONFIGS_MANAGE_OWN,
    resource: "meeting_configs",
    action: "manage_own",
    description: {
      en: "Manage own online meeting configurations",
      ar: "إدارة إعدادات الاجتماعات الخاصة",
    },
    category: { en: "Meeting", ar: "الاجتماعات" },
  },
  {
    key: AppPermission.MEETING_CONFIGS_MANAGE_OTHER,
    resource: "meeting_configs",
    action: "manage_other",
    description: {
      en: "Manage other users' online meeting configurations",
      ar: "إدارة إعدادات اجتماعات المستخدمين الآخرين",
    },
    category: { en: "Meeting", ar: "الاجتماعات" },
  },
  {
    key: AppPermission.MEETING_CONFIGS_MANAGE_CLASS,
    resource: "meeting_configs",
    action: "manage_class",
    description: {
      en: "Manage class-scoped online meeting configurations",
      ar: "إدارة إعدادات الاجتماعات على مستوى الحصة",
    },
    category: { en: "Meeting", ar: "الاجتماعات" },
  },
] as const;

const ADMIN_GROUP_SLUGS = ["super_admin", "academy_admin"] as const;
const SELF_SERVICE_GROUP_SLUGS = ["teachers", "parent_default"] as const;

export async function seedOrGet() {
  logger.info("Seeding meeting permissions...");

  await PermissionManagementService.upsertSystemPermissions(MEETING_PERMISSION_SEEDS);

  const allKeys = MEETING_PERMISSION_SEEDS.map(spec => spec.key);
  await PermissionManagementService.ensureGroupPermissionsForGroups(ADMIN_GROUP_SLUGS, allKeys);
  await PermissionManagementService.ensureGroupPermissionsForGroups(SELF_SERVICE_GROUP_SLUGS, [
    AppPermission.MEETING_CONFIGS_MANAGE_OWN,
  ]);

  logger.info(`Meeting permissions seeded (${MEETING_PERMISSION_SEEDS.length} keys).`);
  return MEETING_PERMISSION_SEEDS.map(spec => spec.key);
}
