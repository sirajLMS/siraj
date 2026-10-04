import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  type ClassInstanceUpsertManyOptions,
  runClassInstanceUpsertMany,
  upsertSeedClassInstance,
} from "@/backend/db/repo/scheduling/class-instance-upsert";
import {
  acquireLocks,
  checkOverlaps,
  type DBTransaction,
  getClassInstanceByIdOrThrow,
  validateTeacherAssignment,
} from "@/backend/db/repo/scheduling/shared";
import { updateInstanceState } from "@/backend/db/repo/scheduling/state-changes";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { classInstances } from "@/backend/db/schema";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import type * as Types from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

export const createClassInstance = async (
  input: Types.ClassInstanceCreateInput,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const studentId = input.studentId ?? "";
    const teacherId = input.teacherId ?? "";
    await acquireLocks(t, teacherId, studentId);
    await validateTeacherAssignment(t, studentId, teacherId, input.scheduledStartAt, tFuncErrors);
    await AvailabilityService.validateBookingAvailability(
      teacherId,
      input.scheduledStartAt,
      input.scheduledEndAt,
      t,
      "ar"
    );

    await checkOverlaps(
      t,
      {
        studentId,
        teacherId,
        startTime: input.scheduledStartAt,
        endTime: input.scheduledEndAt,
        meetingJoinUrl: input.meetingJoinUrl,
      },
      tFuncErrors
    );

    // Quota operations handled by QuotaService + quota_ledger at service layer

    const [created] = await t
      .insert(classInstances)
      .values({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const updateClassInstance = async (
  id: string,
  input: Types.ClassInstanceUpdateInput,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const existing = await getClassInstanceByIdOrThrow(t, id, tFuncErrors);

    const studentId = input.studentId ?? existing.studentId;
    const teacherId = input.teacherId ?? existing.teacherId;
    const startTime = input.scheduledStartAt ?? existing.scheduledStartAt;
    const endTime = input.scheduledEndAt ?? existing.scheduledEndAt;
    const isBeingSoftDeleted = Boolean(input.deletedAt);

    await acquireLocks(t, teacherId, studentId);

    if (!isBeingSoftDeleted) {
      await validateTeacherAssignment(t, studentId, teacherId, startTime, tFuncErrors);
      await AvailabilityService.validateBookingAvailability(teacherId, startTime, endTime, t, "ar");
      await checkOverlaps(
        t,
        {
          studentId,
          teacherId,
          startTime,
          endTime,
          excludeId: id,
          meetingJoinUrl: input.meetingJoinUrl ?? existing.meetingJoinUrl,
        },
        tFuncErrors
      );
    }

    // Quota adjustments are handled by QuotaService + quota_ledger

    const [updated] = await t
      .update(classInstances)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(classInstances.id, id))
      .returning();

    return updated;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

/**
 * Sets the quota-deduction flag on one class instance. Dedicated narrow write
 * for the billing flows (quota/credit redemption, reschedule re-deduction,
 * fixture setup) that own the `quotaDeducted` column — the general
 * create/update paths deliberately cannot set quota or rate-snapshot columns.
 */
export const setQuotaDeducted = async (id: string, quotaDeducted: boolean, tx?: DBTransaction): Promise<void> => {
  const client = tx ?? db;
  await client.update(classInstances).set({ quotaDeducted, updatedAt: new Date() }).where(eq(classInstances.id, id));
};

export const deleteClassInstance = async (
  id: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    await getClassInstanceByIdOrThrow(t, id, tFuncErrors);

    const { entity: deleted } = await SoftDeleteRepository.softDeleteClassInstance(id, null, t);

    // Quota restoration handled by QuotaService + quota_ledger at service layer

    return deleted;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const softDeleteClassInstance = async (id: string, actorUserId: string, tx?: DBTransaction) => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;
    const tFuncSession = getServerTranslations("en").sessionTranslations;

    const updated = await updateInstanceState(
      t,
      id,
      actorUserId,
      { deletedAt: new Date() },
      {
        fromState: { executionState: existing.executionState, outcome: existing.outcome, deleted: false },
        toState: { executionState: existing.executionState, outcome: existing.outcome, deleted: true },
        description: tFuncSession.softDeleteDescription,
      }
    );

    // Quota adjustment handled by QuotaService + quota_ledger at service layer
    return updated;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export async function upsertManyForSeed(
  instances: Types.ClassInstanceInsertType[],
  options?: ClassInstanceUpsertManyOptions
): Promise<Types.ClassInstanceSelectType[]> {
  return runClassInstanceUpsertMany(instances, upsertSeedClassInstance, options);
}

export type { PayrollCalculationPatch } from "@/backend/db/repo/scheduling/class-instances.payroll";

export {
  findByCarryoverId,
  getById,
  getByIdsForUpdate,
  linkToCarryover,
  unlinkFromCarryover,
  updatePayrollCalculation,
} from "@/backend/db/repo/scheduling/class-instances.payroll";
export {
  findOverlappingInstancesForRange,
  findUpcomingInstancesByScheduleId,
  getClassInstanceById,
  getClassInstancesByIds,
  getOndemandPendingInstances,
  hasOverlappingInstance,
  updateOndemandStatusBatch,
} from "@/backend/db/repo/scheduling/class-instances.reads";

export { findPayrollReportRows, findProfitLossPayments } from "@/backend/db/repo/scheduling/class-instances.reports";
