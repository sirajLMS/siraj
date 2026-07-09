import { and, eq, isNull, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { notificationDeliveries, teacherBankingDetailsHistory, teacherPayments, teachers } from "@/backend/db/schema";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";

const BANKING_DETAIL_FIELDS = [
  "beneficiaryName",
  "bankName",
  "accountNumber",
  "routingNumber",
  "swiftBic",
  "iban",
] as const;

export namespace TeacherBankingRepository {
  async function acquireBankingLock(tx: DBTransaction, teacherId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('teacher_banking_' || ${teacherId}::text))`);
  }

  async function assertNoBankingFieldChanges(
    current: Types.TeacherBankingDetailsHistorySelectType,
    updates: Partial<Types.TeacherBankingDetailsHistoryInsertInput>,
    locale?: string
  ): Promise<void> {
    for (const field of BANKING_DETAIL_FIELDS) {
      if (updates[field] !== undefined && updates[field] !== current[field]) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("cannotModifyBankingFields"));
      }
    }
  }

  async function assertRecordIsMutable(
    record: Types.TeacherBankingDetailsHistorySelectType,
    locale?: string
  ): Promise<void> {
    if (record.validUntil !== null) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("cannotModifyHistoricalBanking"));
    }
    if (record.verifiedAt !== null) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("cannotModifyVerifiedBanking"));
    }
  }

  export const getActiveBankingDetails = async (
    teacherId: string,
    tx?: DBTransaction
  ): Promise<Types.TeacherBankingDetailsHistorySelectType | null> => {
    const t = tx ?? db;
    const results = await t
      .select()
      .from(teacherBankingDetailsHistory)
      .where(
        and(eq(teacherBankingDetailsHistory.teacherId, teacherId), isNull(teacherBankingDetailsHistory.validUntil))
      )
      .limit(1);

    return results[0] ?? null;
  };

  export const getVerifiedActiveBankingDetails = async (
    teacherId: string,
    tx?: DBTransaction
  ): Promise<Types.TeacherBankingDetailsHistorySelectType | null> => {
    const active = await getActiveBankingDetails(teacherId, tx);
    if (active?.verifiedAt === null) {
      return null;
    }
    return active;
  };

  export const submitBankingDetails = async (
    input: Types.SubmitBankingDetailsInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherBankingDetailsHistorySelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireBankingLock(t, input.teacherId);
      const now = new Date();

      const active = await getActiveBankingDetails(input.teacherId, t);
      if (active) {
        await t
          .update(teacherBankingDetailsHistory)
          .set({ validUntil: now, updatedAt: now })
          .where(eq(teacherBankingDetailsHistory.id, active.id));
      }

      const [created] = await t
        .insert(teacherBankingDetailsHistory)
        .values({
          teacherId: input.teacherId,
          beneficiaryName: input.beneficiaryName,
          bankName: input.bankName,
          accountNumber: input.accountNumber,
          routingNumber: input.routingNumber ?? null,
          swiftBic: input.swiftBic,
          iban: input.iban,
          validFrom: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const teacherResults = await t
        .select({ userId: teachers.userId })
        .from(teachers)
        .where(eq(teachers.id, input.teacherId))
        .limit(1);

      if (teacherResults.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("teacherNotFound", { id: input.teacherId }));
      }

      await NotificationRepository.createDelivery(
        {
          userId: teacherResults[0].userId,
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.BANKING_DETAILS_CHANGED,
          title: "Banking details updated",
          body: "Your banking details have been updated and are pending admin verification before they can be used for payments.",
        },
        t
      );

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const verifyBankingDetails = async (
    input: Types.VerifyBankingDetailsInput,
    tx?: DBTransaction,
    locale?: string,
    verifiedByUserId?: string
  ): Promise<Types.TeacherBankingDetailsHistorySelectType> => {
    const runner = async (t: DBTransaction) => {
      const results = await t
        .select()
        .from(teacherBankingDetailsHistory)
        .where(eq(teacherBankingDetailsHistory.id, input.bankingDetailsId))
        .limit(1);

      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("bankingDetailsNotFound", { id: input.bankingDetailsId }));
      }

      const record = results[0];
      await acquireBankingLock(t, record.teacherId);

      if (record.validUntil !== null) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("cannotVerifyHistoricalBanking"));
      }

      if (record.verifiedAt !== null) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("bankingDetailsAlreadyVerified"));
      }

      const now = new Date();
      const [verified] = await t
        .update(teacherBankingDetailsHistory)
        .set({
          verifiedAt: now,
          verifiedByUserId: verifiedByUserId ?? null,
          updatedAt: now,
        })
        .where(eq(teacherBankingDetailsHistory.id, input.bankingDetailsId))
        .returning();

      return verified;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  async function updateRecord(
    bankingDetailsId: string,
    updates: Partial<Types.TeacherBankingDetailsHistoryInsertInput>,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherBankingDetailsHistorySelectType> {
    const runner = async (t: DBTransaction) => {
      const results = await t
        .select()
        .from(teacherBankingDetailsHistory)
        .where(eq(teacherBankingDetailsHistory.id, bankingDetailsId))
        .limit(1);

      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("bankingDetailsNotFound", { id: bankingDetailsId }));
      }

      const record = results[0];
      await acquireBankingLock(t, record.teacherId);
      await assertRecordIsMutable(record, locale);
      await assertNoBankingFieldChanges(record, updates, locale);

      const [updated] = await t
        .update(teacherBankingDetailsHistory)
        .set({
          ...updates,
          updatedAt: updates.updatedAt ?? new Date(),
        })
        .where(eq(teacherBankingDetailsHistory.id, bankingDetailsId))
        .returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

  export const updateNonBankingFields = async (
    bankingDetailsId: string,
    updates: Partial<Pick<Types.TeacherBankingDetailsHistoryInsertInput, "updatedAt">>,
    tx?: DBTransaction
  ): Promise<Types.TeacherBankingDetailsHistorySelectType> => {
    return updateRecord(bankingDetailsId, updates, tx);
  };

  export const updateBankingDetails = async (
    bankingDetailsId: string,
    updates: Partial<Types.TeacherBankingDetailsHistoryInsertInput>,
    tx?: DBTransaction
  ): Promise<Types.TeacherBankingDetailsHistorySelectType> => {
    return updateRecord(bankingDetailsId, updates, tx);
  };

  export const partiallyUpdateBankingDetails = async (
    bankingDetailsId: string,
    updates: Partial<Types.TeacherBankingDetailsHistoryInsertInput>,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherBankingDetailsHistorySelectType> => {
    return updateRecord(bankingDetailsId, updates, tx, locale);
  };

  export const createTeacherPayment = async (
    input: Types.CreateTeacherPaymentInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherPaymentSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireBankingLock(t, input.teacherId);
      const now = new Date();
      const isTestPayment = input.isTestPayment ?? false;

      const bankingDetails = isTestPayment
        ? await getActiveBankingDetails(input.teacherId, t)
        : await getVerifiedActiveBankingDetails(input.teacherId, t);

      if (!bankingDetails) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        const message = isTestPayment
          ? tFunc("noActiveBankingDetails", { id: input.teacherId })
          : tFunc("noVerifiedActiveBankingDetails", { id: input.teacherId });
        throw new Error(message);
      }

      const [payment] = await t
        .insert(teacherPayments)
        .values({
          teacherId: input.teacherId,
          bankingDetailsHistoryId: bankingDetails.id,
          amount: input.amount,
          currency: input.currency,
          paymentDate: input.paymentDate,
          isTestPayment,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return payment;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getPaymentWithBankingDetails = async (
    paymentId: string,
    tx?: DBTransaction
  ): Promise<{
    payment: Types.TeacherPaymentSelectType;
    bankingDetails: Types.TeacherBankingDetailsHistorySelectType;
  } | null> => {
    const t = tx ?? db;

    const paymentResults = await t.select().from(teacherPayments).where(eq(teacherPayments.id, paymentId)).limit(1);
    if (paymentResults.length === 0) {
      return null;
    }

    const payment = paymentResults[0];
    const bankingResults = await t
      .select()
      .from(teacherBankingDetailsHistory)
      .where(eq(teacherBankingDetailsHistory.id, payment.bankingDetailsHistoryId))
      .limit(1);

    if (bankingResults.length === 0) {
      return null;
    }

    return { payment, bankingDetails: bankingResults[0] };
  };

  export const getBankingChangeNotifications = async (
    userId: string,
    tx?: DBTransaction
  ): Promise<Types.NotificationDeliverySelectType[]> => {
    const t = tx ?? db;
    return t
      .select()
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          eq(notificationDeliveries.eventType, NotificationEventType.BANKING_DETAILS_CHANGED)
        )
      );
  };
}
