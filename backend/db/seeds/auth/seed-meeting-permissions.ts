import { sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import logger from "@/backend/lib/logger";
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
] as const;

const ADMIN_GROUP_SLUGS = ["super_admin", "academy_admin"] as const;
const SELF_SERVICE_GROUP_SLUGS = ["teachers", "parent_default"] as const;

async function disableSystemPermissionTrigger(): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
    END $$;
  `);
}

async function enableSystemPermissionTrigger(): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
    END $$;
  `);
}

async function assignPermissionsToGroups(groupSlugs: readonly string[], keys: readonly AppPermission[]) {
  for (const groupSlug of groupSlugs) {
    for (const key of keys) {
      await db.execute(sql`
        INSERT INTO group_permissions (group_id, permission_id)
        SELECT g.id, p.id
        FROM permission_groups g, permissions p
        WHERE g.slug = ${groupSlug}
          AND p.key = ${key}::app_permission
        ON CONFLICT DO NOTHING
      `);
    }
  }
}

export async function seedOrGet() {
  logger.info("Seeding meeting permissions...");

  for (const spec of MEETING_PERMISSION_SEEDS) {
    await db.execute(sql.raw(`ALTER TYPE app_permission ADD VALUE IF NOT EXISTS '${spec.key}';`));
  }

  await disableSystemPermissionTrigger();

  try {
    for (const spec of MEETING_PERMISSION_SEEDS) {
      await db.execute(sql`
        INSERT INTO permissions (id, key, resource, action, description, category, is_system)
        VALUES (
          gen_random_uuid(),
          ${spec.key}::app_permission,
          ${spec.resource},
          ${spec.action},
          ${JSON.stringify(spec.description)}::jsonb,
          ${JSON.stringify(spec.category)}::jsonb,
          true
        )
        ON CONFLICT (key) DO UPDATE SET
          resource = EXCLUDED.resource,
          action = EXCLUDED.action,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          is_system = EXCLUDED.is_system
      `);
    }

    const allKeys = MEETING_PERMISSION_SEEDS.map(spec => spec.key);
    await assignPermissionsToGroups(ADMIN_GROUP_SLUGS, allKeys);
    await assignPermissionsToGroups(SELF_SERVICE_GROUP_SLUGS, [AppPermission.MEETING_CONFIGS_MANAGE_OWN]);
  } finally {
    await enableSystemPermissionTrigger();
  }

  logger.info(`Meeting permissions seeded (${MEETING_PERMISSION_SEEDS.length} keys).`);
  return MEETING_PERMISSION_SEEDS.map(spec => spec.key);
}
