import {
  addMonths,
  DEFAULT_INVOICE_CURRENCY,
  loadSeedConfig,
  type SeedConfig,
  startOfDay,
} from "@/backend/db/seeds/lib";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import logger from "@/backend/lib/logger";
import { TeacherPaymentService } from "@/backend/services/teacher/teacher-payment.service";
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

function buildSnapshotFromPayoutMethod(
  payoutMethod: NonNullable<Awaited<ReturnType<typeof TeacherPaymentService.findDefaultPayoutMethod>>>,
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
  const monthsBack = seedConfig.profile === "standard" ? 3 : 1;
  const inputs = [];

  for (const teacher of teachersList) {
    const payoutMethod = await TeacherPaymentService.findDefaultPayoutMethod(teacher.userId);
    const snapshot = payoutMethod
      ? buildSnapshotFromPayoutMethod(payoutMethod, snapshottedAt)
      : buildBankTransferSnapshot(null, snapshottedAt);
    const paymentMethodType = (payoutMethod?.type as PaymentMethodType | undefined) ?? PaymentMethodType.BANK_TRANSFER;

    for (let m = 1; m <= monthsBack; m++) {
      const paymentDate = addMonths(anchor, -m);
      inputs.push({
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
      });
    }
  }

  const results = await TeacherPaymentService.createManyIfMissing(inputs);
  logger.info(`Teacher payments seeded (${results.length} rows).`);
  return results;
}
