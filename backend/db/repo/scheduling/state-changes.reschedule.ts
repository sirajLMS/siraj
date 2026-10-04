import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { performRescheduleValidations } from "@/backend/db/repo/scheduling/shared";
import { classInstances } from "@/backend/db/schema";
import { RateSource } from "@/backend/enum";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

export function buildRescheduledClassInput(
  original: Types.ClassInstanceSelectType,
  input: Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt">,
  originalClassId: string
): Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt"> {
  return {
    ...input,
    subjectId: input.subjectId ?? original.subjectId,
    originalClassId,
    isRescheduled: false,
    quotaDeducted: false,
    rateAmount: input.rateAmount ?? original.rateAmount,
    rateCurrency: input.rateCurrency ?? original.rateCurrency,
    isRateOverridden: input.isRateOverridden ?? original.isRateOverridden,
    rateSource: input.rateSource ?? original.rateSource,
  };
}

export async function markOriginalAsRescheduled(t: DBTransaction, originalClassId: string): Promise<void> {
  await t
    .update(classInstances)
    .set({
      isRescheduled: true,
      quotaDeducted: false,
      updatedAt: new Date(),
    })
    .where(eq(classInstances.id, originalClassId));
}

/**
 * Admin manual override of a single class instance's hourly rate. Sets
 * `is_rate_overridden = true`, stores the override amount + currency, and
 * marks `rate_source = OVERRIDE`. Send `rateAmount = null` to clear the
 * override (revert to the recurring/subject/teacher cascade) — in that case
 * `is_rate_overridden` is set back to `false` and the snapshot columns are
 * cleared so the resolver recomputes from the cascade at approval time.
 *
 * Returns the updated row, or null if the instance was not found.
 */
export async function overrideClassInstanceRate(
  classInstanceId: string,
  rateAmount: string | null,
  rateCurrency: CurrencyCode | null,
  tx?: DBTransaction
): Promise<Types.ClassInstanceSelectType | null> {
  const executor = tx ?? db;
  const isOverridden = rateAmount != null && rateAmount !== "";
  const [updated] = await executor
    .update(classInstances)
    .set({
      rateAmount: isOverridden ? rateAmount : null,
      rateCurrency: isOverridden ? rateCurrency : null,
      isRateOverridden: isOverridden,
      rateSource: isOverridden ? RateSource.OVERRIDE : null,
      updatedAt: new Date(),
    })
    .where(eq(classInstances.id, classInstanceId))
    .returning();
  return updated ?? null;
}

/** Optional hook for reschedule state validation, provided by the service caller. */
export interface RescheduleHooks {
  validateRescheduleState?: (
    original: Types.ClassInstanceSelectType,
    input: Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt">,
    tErrors: ErrorsLabels
  ) => Promise<void>;
}

export const rescheduleClassInstance = async (
  originalClassId: string,
  input: Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt">,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: RescheduleHooks
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const results = await t.select().from(classInstances).where(eq(classInstances.id, originalClassId)).limit(1);
    if (results.length === 0) {
      throw new Error(tFuncErrors.originalClassNotFound);
    }
    const original = results[0];

    // Hard data-integrity checks (completed/rescheduled) remain in repo
    if (original.executionState === "COMPLETED") {
      throw new Error(tFuncErrors.cannotRescheduleCompleted);
    }
    if (original.isRescheduled) {
      throw new Error(tFuncErrors.cannotRescheduleAlreadyRescheduled);
    }

    // Service-layer hooks for additional validation (auth, state machine)
    if (hooks?.validateRescheduleState) {
      await hooks.validateRescheduleState(original, input, tFuncErrors);
    }

    const newInstanceInput = buildRescheduledClassInput(original, input, originalClassId);

    await performRescheduleValidations(t, newInstanceInput, tFuncErrors);

    const [created] = await t
      .insert(classInstances)
      .values({
        ...newInstanceInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await markOriginalAsRescheduled(t, originalClassId);

    return created;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};
