import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import logger from "@/backend/lib/logger";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
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

export async function seedOrGet() {
  logger.info("Seeding payment method permissions...");

  await PermissionManagementService.upsertSystemPermissions(PAYMENT_METHOD_PERMISSION_SEEDS);
  await PermissionManagementService.ensureGroupPermissionsForGroups(
    GROUP_SLUGS,
    PAYMENT_METHOD_PERMISSION_SEEDS.map(spec => spec.key)
  );

  logger.info(`Payment method permissions seeded (${PAYMENT_METHOD_PERMISSION_SEEDS.length} keys).`);
  return PAYMENT_METHOD_PERMISSION_SEEDS.map(spec => spec.key);
}
