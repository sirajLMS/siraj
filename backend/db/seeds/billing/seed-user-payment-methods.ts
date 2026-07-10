import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import type { UserPaymentMethodReturnType, UserSelectType } from "@/backend/types";

export async function seedOrGet(
  usersList: UserSelectType[],
  config?: SeedConfig
): Promise<UserPaymentMethodReturnType[]> {
  logger.info("Seeding demo user payment methods...");
  const seedConfig = config ?? loadSeedConfig();

  if (!usersList?.length) {
    return [];
  }

  const parentUser = usersList.find(u => u.email === "parent@siraj.local");
  const teacherUser = usersList.find(u => u.email === "teacher@siraj.local");

  if (!parentUser && !teacherUser) {
    logger.warn("No demo parent/teacher users found; skipping user payment method seeds.");
    return [];
  }

  const results = await PaymentMethodService.seedDemoUserPaymentMethods(usersList);
  logger.info(`Demo user payment methods seeded (${results.length} rows, profile=${seedConfig.profile}).`);
  return results;
}
