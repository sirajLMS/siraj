import { findAdminUserOrFallback, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { CreditService } from "@/backend/services";
import type { CreditTransactionReturnType, StudentSelectType, UserSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

type CreditPurchaseSpec = {
  studentIndex: number;
  amount: number;
  notes: string;
};

const CLASS_PURCHASE_SPECS: readonly CreditPurchaseSpec[] = [
  {
    studentIndex: 0,
    amount: 10,
    notes: "Demo student class credit purchase (10 classes)",
  },
  {
    studentIndex: 0,
    amount: 20,
    notes: "Demo student class credit top-up (20 classes)",
  },
  {
    studentIndex: 1,
    amount: 15,
    notes: "Demo student London class credit purchase (15 classes)",
  },
];

const HOUR_PURCHASE_SPECS: readonly CreditPurchaseSpec[] = [
  {
    studentIndex: 0,
    amount: 10,
    notes: "Demo student hour credit purchase (10 hours)",
  },
  {
    studentIndex: 0,
    amount: 20,
    notes: "Demo student hour credit top-up (20 hours)",
  },
  {
    studentIndex: 1,
    amount: 15,
    notes: "Demo student London hour credit purchase (15 hours)",
  },
];

const CLASS_IDEMPOTENCY_PREFIX = "seed-credit-purchase";
const HOUR_IDEMPOTENCY_PREFIX = "seed-hour-credit-purchase";

function buildIdempotencyKey(prefix: string, spec: CreditPurchaseSpec): string {
  return `${prefix}:${spec.studentIndex}:${spec.amount}`;
}

type RecordPurchase = (
  studentId: string,
  amount: number,
  notes: string,
  idempotencyKey: string
) => Promise<CreditTransactionReturnType | null>;

async function recordMissingPurchases(
  specs: readonly CreditPurchaseSpec[],
  idempotencyPrefix: string,
  students: StudentSelectType[],
  record: RecordPurchase
): Promise<CreditTransactionReturnType[]> {
  const results = await specs.reduce<Promise<(CreditTransactionReturnType | null)[]>>(async (prev, spec) => {
    const acc = await prev;
    const student = students[spec.studentIndex];
    if (!student) {
      logger.warn(`Student at index ${spec.studentIndex} not found — skipping credit purchase.`);
      return [...acc, null];
    }

    const idempotencyKey = buildIdempotencyKey(idempotencyPrefix, spec);
    const res = await record(student.id, spec.amount, `${spec.notes} [${idempotencyKey}]`, idempotencyKey);
    return [...acc, res];
  }, Promise.resolve([]));

  return results.filter((row): row is CreditTransactionReturnType => row != null);
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
  const actorUserId = actorUser.id;

  // Class-ledger purchases bump class facets; hour-ledger purchases bump the
  // creditHours* facets. Both must be seeded so the demo hour balance matches
  // the hour purchase history.
  const classRows = await recordMissingPurchases(
    CLASS_PURCHASE_SPECS,
    CLASS_IDEMPOTENCY_PREFIX,
    students,
    (studentId, amount, notes, idempotencyKey) =>
      CreditService.recordPurchaseIfMissing(actorUserId, { studentId, hours: amount, notes }, idempotencyKey, tErrors)
  );
  const hourRows = await recordMissingPurchases(
    HOUR_PURCHASE_SPECS,
    HOUR_IDEMPOTENCY_PREFIX,
    students,
    (studentId, amount, notes, idempotencyKey) =>
      CreditService.recordHourPurchaseIfMissing(
        actorUserId,
        { studentId, hours: amount, notes },
        idempotencyKey,
        tErrors
      )
  );

  const seeded = [...classRows, ...hourRows];
  logger.info(`LMS credit transactions seeded (${seeded.length} rows).`);
  return seeded;
}
