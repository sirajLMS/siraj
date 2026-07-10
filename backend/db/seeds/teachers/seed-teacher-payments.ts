import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { userPaymentMethods } from "@/backend/db/schema/billing/user-payment-methods";
import { teacherPayments } from "@/backend/db/schema/teachers/teacher-payments";
import {
  addMonths,
  DEFAULT_INVOICE_CURRENCY,
  loadSeedConfig,
  type SeedConfig,
  startOfDay,
} from "@/backend/db/seeds/lib";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import logger from "@/backend/lib/logger";
import type { PaymentMethodTransactionSnapshot, TeacherEntity, UserSelectType } from "@/backend/types";

function buildBankTransferSnapshot(
  userPaymentMethodId: string | null,
  snapshottedAt: string
): PaymentMethodTransactionSnapshot {
  return {
    userPaymentMethodId,
    type: PaymentMethodType.BANK_TRANSFER,
    direction: PaymentDirection.PAYOUT,
    label: "Primary bank account",
    details: {
      beneficiaryName: "Default Teacher",
      bankName: "National Bank of Egypt",
      iban: "EG38001800000000001234567890",
    },
    catalog: null,
    snapshottedAt,
  };
}

async function findDefaultPayoutMethod(userId: string) {
  const [method] = await db
    .select()
    .from(userPaymentMethods)
    .where(
      and(
        eq(userPaymentMethods.userId, userId),
        eq(userPaymentMethods.isDefault, true),
        inArray(userPaymentMethods.direction, [PaymentDirection.PAYOUT, PaymentDirection.BOTH])
      )
    )
    .limit(1);

  return method;
}

function buildSnapshotFromPayoutMethod(
  payoutMethod: NonNullable<Awaited<ReturnType<typeof findDefaultPayoutMethod>>>,
  snapshottedAt: string
): PaymentMethodTransactionSnapshot {
  return {
    userPaymentMethodId: payoutMethod.id,
    type: payoutMethod.type as PaymentMethodType,
    direction: payoutMethod.direction as PaymentDirection,
    label: payoutMethod.label,
    details: payoutMethod.details,
    catalog: null,
    snapshottedAt,
  };
}

export async function seedOrGet(teachersList: TeacherEntity[], _usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding teacher payments...");
  const now = new Date();
  const snapshottedAt = now.toISOString();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !teachersList?.length) {
    return [];
  }

  const anchor = startOfDay(seedConfig.anchorDate);
  const results = [];
  const monthsBack = seedConfig.profile === "standard" ? 3 : 1;

  for (const teacher of teachersList) {
    const payoutMethod = await findDefaultPayoutMethod(teacher.userId);
    const snapshot = payoutMethod
      ? buildSnapshotFromPayoutMethod(payoutMethod, snapshottedAt)
      : buildBankTransferSnapshot(null, snapshottedAt);
    const paymentMethodType = (payoutMethod?.type as PaymentMethodType | undefined) ?? PaymentMethodType.BANK_TRANSFER;

    for (let m = 1; m <= monthsBack; m++) {
      const paymentDate = addMonths(anchor, -m);

      const [existing] = await db
        .select()
        .from(teacherPayments)
        .where(and(eq(teacherPayments.teacherId, teacher.id), eq(teacherPayments.paymentDate, paymentDate)))
        .limit(1);

      if (existing) {
        results.push(existing);
        continue;
      }

      const [inserted] = await db
        .insert(teacherPayments)
        .values({
          teacherId: teacher.id,
          userPaymentMethodId: payoutMethod?.id ?? null,
          paymentMethodType,
          paymentMethodSnapshot: snapshot,
          amount: (150 + m * 25).toFixed(2),
          currency: DEFAULT_INVOICE_CURRENCY,
          paymentDate,
          isTestPayment: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      results.push(inserted);
    }
  }

  logger.info(`Teacher payments seeded (${results.length} rows).`);
  return results;
}
