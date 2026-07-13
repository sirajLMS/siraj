import { createHash } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository, ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations, logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type {
  CreditBalanceReturnType,
  CreditTransactionReturnType,
  CreditTransactionSelectType,
  CreditTransactionSubmitInput,
  PaginationArgs,
} from "@/backend/types";

function deriveBookingIdempotencyKey(input: {
  studentId: string;
  classInstanceId: string;
  operation: "deduct" | "refund";
}): string {
  const parts = [input.studentId, input.classInstanceId, input.operation];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

async function requirePermission(actorUserId: string, permission: AppPermission, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
  if (!hasPermission) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }
}

async function assertStudentExists(studentId: string, locale?: string): Promise<void> {
  const existing = await StudentRepository.findById(studentId);
  if (!existing) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("studentNotFound", { id: studentId }));
  }
}

async function resolveAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) return false;

  const parent = await ParentRepository.findByUserId(actorUserId);
  if (parent && parent.id === profile.parentId) return true;

  const teacher = await TeacherRepository.findByUserId(actorUserId);
  if (teacher && profile.primaryTeacherId === teacher.id) return true;

  return false;
}

function mapToReturnType(row: CreditTransactionSelectType): CreditTransactionReturnType {
  return { ...row, reason: row.reason as CreditTransactionReturnType["reason"] };
}

export namespace CreditService {
  /**
   * Seed-only bootstrap: idempotent credit purchase that uses a *deterministic*
   * idempotency key (supplied by the caller, e.g. `seed-credit-purchase:0:10`)
   * so repeated seed runs are no-ops instead of creating duplicate rows.
   *
   * Bypasses the `CREDITS_MANAGE` permission check (the seed caller is an
   * admin user) and the `randomUUID`-based idempotency key generator used by
   * the public `recordPurchase` method.
   */
  export async function recordPurchaseIfMissing(
    actorUserId: string,
    input: CreditTransactionSubmitInput,
    idempotencyKey: string,
    locale?: string
  ): Promise<CreditTransactionReturnType | null> {
    if (!input.studentId || input.studentId.trim().length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidInput"));
    }

    if (!Number.isFinite(input.hours) || input.hours <= 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidInput"));
    }

    const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
    if (existing.length > 0) {
      const existingRow = existing[0];
      if (existingRow) return mapToReturnType(existingRow);
    }

    const created = await db.transaction(async tx => {
      await assertStudentExists(input.studentId, locale);
      const ledgerRow = await CreditRepository.createPurchase(tx, {
        studentId: input.studentId,
        changeAmount: input.hours,
        sourcePaymentId: input.sourcePaymentId ?? null,
        notes: input.notes ?? null,
        creditedByUserId: actorUserId,
        idempotencyKey,
      });

      await StudentRepository.addClasses(input.studentId, input.hours, undefined, tx, locale);
      return ledgerRow;
    });

    logger.info("Credit purchase seeded", {
      actorUserId,
      studentId: input.studentId,
      hours: input.hours,
      idempotencyKey,
    });

    return mapToReturnType(created);
  }

  export async function recordPurchase(
    actorUserId: string,
    input: CreditTransactionSubmitInput,
    locale?: string
  ): Promise<CreditTransactionReturnType> {
    await requirePermission(actorUserId, AppPermission.CREDITS_MANAGE, locale);

    if (!input.studentId || input.studentId.trim().length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidInput"));
    }

    if (!Number.isFinite(input.hours) || input.hours <= 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidInput"));
    }

    const idempotencyKey = CreditRepository.generateIdempotencyKey({
      studentId: input.studentId,
      hours: input.hours,
      notes: input.notes,
    });

    try {
      const created = await db.transaction(async tx => {
        await assertStudentExists(input.studentId, locale);

        const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
        if (existing.length > 0) {
          const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(tFunc("credit.duplicatePurchase"));
        }

        const ledgerRow = await CreditRepository.createPurchase(tx, {
          studentId: input.studentId,
          changeAmount: input.hours,
          sourcePaymentId: input.sourcePaymentId ?? null,
          notes: input.notes ?? null,
          creditedByUserId: actorUserId,
          idempotencyKey,
        });

        await StudentRepository.addClasses(input.studentId, input.hours, undefined, tx, locale);

        return ledgerRow;
      });

      logger.info("Credit purchase recorded", {
        actorUserId,
        studentId: input.studentId,
        hours: input.hours,
      });

      return mapToReturnType(created);
    } catch (error) {
      logger.error("Failed to record credit purchase", {
        actorUserId,
        studentId: input.studentId,
        error,
      });
      throw error;
    }
  }

  export async function getStudentBalance(
    actorUserId: string,
    studentId: string,
    locale?: string
  ): Promise<CreditBalanceReturnType> {
    await assertStudentExists(studentId, locale);

    const isAssociated = await resolveAssociatedViewer(actorUserId, studentId);
    const hasCreditsPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.CREDITS_MANAGE);
    if (!isAssociated && !hasCreditsPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const balance = await CreditRepository.getBalance(db, studentId);
    return {
      studentId,
      classesTotal: balance.classesTotal,
      classesRemaining: balance.classesRemaining,
    };
  }

  export async function getStudentTransactions(
    actorUserId: string,
    studentId: string,
    paginationArgs: PaginationArgs | null,
    locale?: string
  ): Promise<{ rows: CreditTransactionReturnType[]; totalCount: number }> {
    await assertStudentExists(studentId, locale);

    const isAssociated = await resolveAssociatedViewer(actorUserId, studentId);
    const hasCreditsPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.CREDITS_MANAGE);
    if (!isAssociated && !hasCreditsPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const [rows, totalCount] = await Promise.all([
      CreditRepository.getTransactions(db, studentId, paginationArgs),
      CreditRepository.countTransactions(db, studentId),
    ]);

    return {
      rows: rows.map(mapToReturnType),
      totalCount,
    };
  }

  export async function deductForBooking(
    studentId: string,
    classInstanceId: string,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    locale?: string
  ): Promise<void> {
    const balance = await CreditRepository.getBalance(tx, studentId);
    if (balance.classesRemaining <= 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("credit.insufficientBalance", {
          studentId,
          remaining: balance.classesRemaining,
        })
      );
    }

    const ledgerKey = deriveBookingIdempotencyKey({
      studentId,
      classInstanceId,
      operation: "deduct",
    });

    try {
      const existing = await CreditRepository.findByIdempotencyKeys([ledgerKey, idempotencyKey], tx);
      if (existing.length === 0) {
        await CreditRepository.deductForBooking(tx, {
          studentId,
          classInstanceId,
          creditedByUserId,
          idempotencyKey: ledgerKey,
        });
        await StudentRepository.deductClasses(studentId, 1, undefined, tx, locale);
      }

      logger.info("Credit deducted for booking", {
        studentId,
        classInstanceId,
        creditedByUserId,
      });
    } catch (error) {
      logger.error("Failed to deduct credit for booking", {
        studentId,
        classInstanceId,
        error,
      });
      throw error;
    }
  }

  export async function refundOnCancel(
    studentId: string,
    classInstanceId: string,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    locale?: string
  ): Promise<void> {
    const ledgerKey = deriveBookingIdempotencyKey({
      studentId,
      classInstanceId,
      operation: "refund",
    });

    try {
      const existing = await CreditRepository.findByIdempotencyKeys([ledgerKey, idempotencyKey], tx);
      if (existing.length === 0) {
        await CreditRepository.refundOnCancel(tx, {
          studentId,
          classInstanceId,
          creditedByUserId,
          idempotencyKey: ledgerKey,
        });
        await StudentRepository.addClasses(studentId, 1, undefined, tx, locale);
      }

      logger.info("Credit refunded on cancel", {
        studentId,
        classInstanceId,
        creditedByUserId,
      });
    } catch (error) {
      logger.error("Failed to refund credit on cancel", {
        studentId,
        classInstanceId,
        error,
      });
      throw error;
    }
  }
}
