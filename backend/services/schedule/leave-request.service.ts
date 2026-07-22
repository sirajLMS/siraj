import type { DBTransaction } from "@/backend/db/db.types";
import {
  LeaveQuotaUsageRepository,
  type LeaveQuotaUsageRow,
  type UpsertStudentLeaveQuotaInput,
} from "@/backend/db/repo/scheduling/leave-quota-usage.repository";
import {
  type CreateLeaveRequestInput,
  LeaveRequestRepository,
  type LeaveRequestRow,
} from "@/backend/db/repo/scheduling/leave-request.repository";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";

function assertNonProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Leave request bootstrap operations are not allowed in production.");
  }
}

export namespace LeaveRequestService {
  export async function findByClassInstanceIds(
    classInstanceIds: string[],
    tx?: DBTransaction
  ): Promise<LeaveRequestRow[]> {
    return LeaveRequestRepository.findByClassInstanceIds(classInstanceIds, tx);
  }

  export async function createManyIfMissing(
    inputs: readonly CreateLeaveRequestInput[],
    tx?: DBTransaction
  ): Promise<LeaveRequestRow[]> {
    assertNonProduction();
    try {
      return await LeaveRequestRepository.createManyIfMissing(inputs, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const classInstanceIds = inputs.map(i => i.classInstanceId);
      return LeaveRequestRepository.findByClassInstanceIds(classInstanceIds, tx);
    }
  }

  export async function upsertStudentLeaveQuota(
    input: UpsertStudentLeaveQuotaInput,
    tx?: DBTransaction
  ): Promise<LeaveQuotaUsageRow> {
    assertNonProduction();
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
