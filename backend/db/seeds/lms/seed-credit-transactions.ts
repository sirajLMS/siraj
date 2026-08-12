import type { SeedConfig } from "@/backend/db/seeds/lib";
import { findAdminUserOrFallback } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { CreditService } from "@/backend/services";
import type { CreditTransactionReturnType, StudentSelectType, UserSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

type CreditPurchaseSpec = {
  studentIndex: number;
  hours: number;
  notes: string;
};

const CREDIT_PURCHASE_SPECS: readonly CreditPurchaseSpec[] = [
  {
    studentIndex: 0,
    hours: 10,
    notes: "Demo student credit purchase (10 hours)",
  },
  {
    studentIndex: 0,
    hours: 20,
    notes: "Demo student credit top-up (20 hours)",
  },
  {
    studentIndex: 1,
    hours: 15,
    notes: "Demo student London credit purchase (15 hours)",
  },
];

const IDEMPOTENCY_PREFIX = "seed-credit-purchase";

function buildIdempotencyKey(spec: CreditPurchaseSpec): string {
  return `${IDEMPOTENCY_PREFIX}:${spec.studentIndex}:${spec.hours}`;
}

export async function seedOrGet(
  students: StudentSelectType[],
  users: UserSelectType[],
  _config?: SeedConfig
): Promise<CreditTransactionReturnType[]> {
  logger.info("Seeding LMS credit transactions...");

  if (!students?.length) {
    logger.warn("No students available — skipping credit transactions seed.");
    return [];
  }

  const actorUser = findAdminUserOrFallback(users);
  if (!actorUser) {
    logger.warn("No admin user available — skipping credit transactions seed.");
    return [];
  }

  const tErrors = getServerTranslations("ar").errorsTranslations;

  const results = await Promise.all(
    CREDIT_PURCHASE_SPECS.map(async spec => {
      const student = students[spec.studentIndex];
      if (!student) {
        logger.warn(`Student at index ${spec.studentIndex} not found — skipping credit purchase.`);
        return null;
      }

      const idempotencyKey = buildIdempotencyKey(spec);
      return CreditService.recordPurchaseIfMissing(
        actorUser.id,
        {
          studentId: student.id,
          hours: spec.hours,
          notes: `${spec.notes} [${idempotencyKey}]`,
        },
        idempotencyKey,
        tErrors
      );
    })
  );

  const seeded = results.filter((row): row is CreditTransactionReturnType => row != null);
  logger.info(`LMS credit transactions seeded (${seeded.length} rows).`);
  return seeded;
}
