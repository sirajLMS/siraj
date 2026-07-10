import type { DBTransaction } from "@/backend/db/db.types";
import { UserPaymentMethodRepository } from "@/backend/db/repo/billing/user-payment-method.repository";
import { TeacherPaymentRepository } from "@/backend/db/repo/teachers/teacher-payment.repository";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type { TeacherPaymentInsertInput, TeacherPaymentSelectType, UserPaymentMethodSelectType } from "@/backend/types";

function assertNonProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Teacher payment bootstrap operations are not allowed in production.");
  }
}

export namespace TeacherPaymentService {
  export async function findDefaultPayoutMethod(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodSelectType | null> {
    return UserPaymentMethodRepository.findDefaultForSlot(userId, "PAYOUT", tx);
  }

  export async function createManyIfMissing(
    inputs: readonly TeacherPaymentInsertInput[],
    tx?: DBTransaction
  ): Promise<TeacherPaymentSelectType[]> {
    assertNonProduction();
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
      for (const [teacherId, dates] of byTeacher) {
        const rows = await TeacherPaymentRepository.findByTeacherAndPaymentDates(teacherId, dates, tx);
        results.push(...rows);
      }
      return results;
    }
  }
}
