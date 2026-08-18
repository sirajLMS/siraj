/**
 * Seed-only teacher payment demo data.
 *
 * Creates sample teacher payout records during `bun db seed`.
 * Production teacher payments are handled by billing/payroll domain services.
 *
 * Writes blocked on real production via {@link assertSeedWriteAllowed}.
 *
 * @see backend/db/seeds/teachers/seed-teacher-payments.ts
 */

import { UserPaymentMethodRepository } from "@/backend/db/repo/billing/user-payment-method.repository";
import { TeacherPaymentRepository } from "@/backend/db/repo/teachers/teacher-payment.repository";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  DBTransaction,
  TeacherPaymentInsertType,
  TeacherPaymentSelectType,
  UserPaymentMethodReturnType,
} from "@/backend/types";

export namespace TeacherPaymentSeedService {
  /** Read helper for seed scripts — resolve default payout method for a demo teacher. */
  export async function findDefaultPayoutMethod(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType | null> {
    return UserPaymentMethodRepository.findDefaultForSlot(userId, "PAYOUT", tx);
  }

  /** Idempotently create teacher payment rows for demo payroll history. */
  export async function seedTeacherPaymentsIfMissing(
    inputs: readonly TeacherPaymentInsertType[],
    tx?: DBTransaction
  ): Promise<TeacherPaymentSelectType[]> {
    assertSeedWriteAllowed("Teacher payment seed writes");
    try {
      return await TeacherPaymentRepository.createManyIfMissing(inputs, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const results: TeacherPaymentSelectType[] = [];
      const byTeacher = new Map<string, Date[]>();
      for (const input of inputs) {
        const dates = byTeacher.get(input.teacherId) ?? [];
        dates.push(input.paymentDate);
        byTeacher.set(input.teacherId, dates);
      }
      const entries = [...byTeacher];
      await entries.reduce(async (prev, [teacherId, dates]) => {
        await prev;
        const rows = await TeacherPaymentRepository.findByTeacherAndPaymentDates(teacherId, dates, tx);
        results.push(...rows);
      }, Promise.resolve());
      return results;
    }
  }
}
