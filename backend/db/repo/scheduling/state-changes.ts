import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  runStateChange,
  type StateChangeHooks,
  transitionToCompleted,
  updateInstanceState,
} from "@/backend/db/repo/scheduling/state-changes.core";
import { executeProcessClassLeave } from "@/backend/db/repo/scheduling/state-changes.leave";
import {
  buildAbsentStatePayload,
  buildActivatedStatePayload,
  buildAutoMissedStatePayload,
  buildResetStatePayload,
  buildStartedStatePayload,
} from "@/backend/db/repo/scheduling/state-changes.payloads";
import { classInstances } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

export {
  buildRescheduledClassInput,
  markOriginalAsRescheduled,
  overrideClassInstanceRate,
  type RescheduleHooks,
  rescheduleClassInstance,
} from "@/backend/db/repo/scheduling/state-changes.reschedule";
export { type StateChangeHooks, updateInstanceState };

export const activateClassInstance = async (
  id: string,
  actorUserId: string,
  options: { force: boolean },
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks
) => {
  return runStateChange(
    id,
    actorUserId,
    async () => buildActivatedStatePayload(actorUserId, options.force),
    tx,
    tErrors,
    hooks
  );
};

export const stopClassInstance = async (
  id: string,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks
) => {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  return transitionToCompleted(id, actorUserId, "TAKEN", tFuncSession.stopDescription, tx, tErrors, hooks);
};

export const startClassInstance = async (
  id: string,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks
) => {
  return runStateChange(id, actorUserId, async (_, existing) => buildStartedStatePayload(existing), tx, tErrors, hooks);
};

export const markClassAbsent = async (
  id: string,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks
) => {
  return runStateChange(id, actorUserId, async (_, existing) => buildAbsentStatePayload(existing), tx, tErrors, hooks);
};

export const markClassMissedBySystem = async (
  id: string,
  tx?: DBTransaction,
  _tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType | null> => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) {
      return null;
    }

    const { state, event } = buildAutoMissedStatePayload(existing);
    return updateInstanceState(t, id, null, state, event);
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const processClassLeave = async (
  id: string,
  reason: string | null,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks,
  meetingJoinUrl?: string | null
) => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    return executeProcessClassLeave(t, id, reason, actorUserId, tErrors ?? tFuncErrors, hooks, meetingJoinUrl);
  };
  return tx ? await runner(tx) : await db.transaction(runner);
};

export const resetClassInstance = async (
  id: string,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks
) => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;

    // Quota handling for cancellations is managed by QuotaService + quota_ledger
    // (no repository-level quota adjustment needed here)

    return runStateChange(id, actorUserId, async () => buildResetStatePayload(), t, tErrors, hooks);
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};
