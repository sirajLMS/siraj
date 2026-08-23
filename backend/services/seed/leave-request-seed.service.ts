/**
 * Seed-only leave request and quota demo data.
 *
 * Creates sample leave requests and student leave quotas for scheduling seeds.
 * Production leave workflows use scheduling domain services — **not this module**.
 *
 * Writes blocked on real production via {@link assertSeedWriteAllowed}.
 *
 * @see backend/db/seeds/teachers/seed-leave-requests.ts
 * @see backend/db/seeds/teachers/seed-leave-quota-usage.ts
 */

import { LeaveQuotaUsageRepository } from "@/backend/db/repo/scheduling/leave-quota-usage.repository";
import { LeaveRequestRepository } from "@/backend/db/repo/scheduling/leave-request.repository";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  CreateLeaveRequestInput,
  DBTransaction,
  LeaveQuotaUsageSelectType,
  LeaveRequestSelectType,
  UpsertStudentLeaveQuotaInput,
} from "@/backend/types";

export namespace LeaveRequestSeedService {
  /** Idempotently create leave request rows for demo class instances. */
  export async function seedLeaveRequestsIfMissing(
    inputs: readonly CreateLeaveRequestInput[],
    tx?: DBTransaction
  ): Promise<LeaveRequestSelectType[]> {
    assertSeedWriteAllowed("Leave request seed writes");
    try {
      return await LeaveRequestRepository.createManyIfMissing(inputs, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const classInstanceIds = inputs.map(i => i.classInstanceId).filter((id): id is string => Boolean(id));
      return LeaveRequestRepository.findByClassInstanceIds(classInstanceIds, tx);
    }
  }

  /** Idempotently upsert a student's leave quota for a billing period. */
  export async function seedStudentLeaveQuota(
    input: UpsertStudentLeaveQuotaInput,
    tx?: DBTransaction
  ): Promise<LeaveQuotaUsageSelectType> {
    assertSeedWriteAllowed("Leave request seed writes");
    try {
      return await LeaveQuotaUsageRepository.upsertStudentPeriodQuota(input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const existing = await LeaveQuotaUsageRepository.findStudentPeriodQuota(
        input.studentId,
        input.periodYear,
        input.periodMonth,
        tx
      );
      if (!existing) throw error;
      return existing;
    }
  }
}
