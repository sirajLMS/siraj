import { sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import logger from "@/backend/lib/logger";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

type PaymentMethodPermissionSeed = {
  key: AppPermission;
  resource: string;
  action: string;
  description: LocalizedString;
  category: LocalizedString;
};

const PAYMENT_METHOD_PERMISSION_SEEDS: readonly PaymentMethodPermissionSeed[] = [
  {
    key: AppPermission.PAYMENT_METHODS_MANAGE_CATALOGS,
    resource: "payment_methods",
    action: "manage_catalogs",
    description: {
      en: "Manage payment method catalog entries (wallets, links, online accounts)",
      ar: "إدارة كتالوج طرق الدفع (المحافظ، الروابط، الحسابات الإلكترونية)",
    },
    category: { en: "Payment Methods", ar: "طرق الدفع" },
  },
  {
    key: AppPermission.PAYMENT_METHODS_VERIFY_BANK_TRANSFER,
    resource: "payment_methods",
    action: "verify_bank_transfer",
    description: {
      en: "Verify bank transfer payment methods after manual review",
      ar: "التحقق من طرق التحويل البنكي بعد المراجعة اليدوية",
    },
    category: { en: "Payment Methods", ar: "طرق الدفع" },
  },
] as const;

const GROUP_SLUGS = ["super_admin", "academy_admin"] as const;

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

export async function seedOrGet() {
  logger.info("Seeding payment method permissions...");

  for (const spec of PAYMENT_METHOD_PERMISSION_SEEDS) {
    await db.execute(sql.raw(`ALTER TYPE app_permission ADD VALUE IF NOT EXISTS '${spec.key}';`));
  }

  await disableSystemPermissionTrigger();

  try {
    for (const spec of PAYMENT_METHOD_PERMISSION_SEEDS) {
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

    for (const groupSlug of GROUP_SLUGS) {
      for (const spec of PAYMENT_METHOD_PERMISSION_SEEDS) {
        await db.execute(sql`
          INSERT INTO group_permissions (group_id, permission_id)
          SELECT g.id, p.id
          FROM permission_groups g, permissions p
          WHERE g.slug = ${groupSlug}
            AND p.key = ${spec.key}::app_permission
          ON CONFLICT DO NOTHING
        `);
      }
    }
  } finally {
    await enableSystemPermissionTrigger();
  }

  logger.info(`Payment method permissions seeded (${PAYMENT_METHOD_PERMISSION_SEEDS.length} keys).`);
  return PAYMENT_METHOD_PERMISSION_SEEDS.map(spec => spec.key);
}
