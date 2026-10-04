import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { classInstances, classStatusEvents } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

/** State transition recorded alongside a class-instance status change. */
type StateChangeEvent = {
  fromState: Record<string, unknown>;
  toState: Record<string, unknown>;
  description: string;
};

/** Result a state-change logic callback returns to drive the shared runner. */
export type StateChangeLogicResult = {
  state: Partial<Types.ClassInstanceInsertType>;
  event: StateChangeEvent;
};

// Whitelist allowed state keys to prevent mass-assignment of financial fields.
const ALLOWED_STATE_KEYS = new Set([
  "executionState",
  "outcome",
  "actualStartAt",
  "actualEndAt",
  "activatedAt",
  "activatedByUserId",
  "forceActivated",
  "forceActivatedByUserId",
  "payrollCredited",
  "quotaDeducted",
  "isRescheduled",
  "remarks",
  "adminNotes",
  // Soft-delete path (`SchedulingRepository.softDeleteClassInstance`) sets deletedAt
  // through this helper. Omitting it made deletes appear to succeed while leaving
  // deletedAt NULL — checkOverlaps then kept rejecting new bookings ("already booked").
  "deletedAt",
]);

export async function updateInstanceState(
  t: DBTransaction,
  id: string,
  actorUserId: string | null,
  state: Partial<Types.ClassInstanceInsertType>,
  event: StateChangeEvent
): Promise<Types.ClassInstanceSelectType | null> {
  const now = new Date();
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (ALLOWED_STATE_KEYS.has(key)) {
      safe[key] = value;
    }
  }
  safe.updatedAt = now;
  const [updated] = await t.update(classInstances).set(safe).where(eq(classInstances.id, id)).returning();

  if (updated) {
    await t.insert(classStatusEvents).values({
      classInstanceId: updated.id,
      eventType: "STATE_CHANGE",
      fromState: event.fromState,
      toState: event.toState,
      description: event.description,
      actorUserId,
      createdAt: now,
    });
  }
  return updated;
}

/** Optional hooks the service caller provides so auth/validation execute inside the transaction. */
export interface StateChangeHooks {
  onAuth?: (
    t: DBTransaction,
    existing: Types.ClassInstanceSelectType,
    actorUserId: string,
    tErrors: ErrorsLabels
  ) => Promise<void>;
  onValidate?: (
    existing: Types.ClassInstanceSelectType,
    state: Partial<Types.ClassInstanceInsertType>,
    tErrors: ErrorsLabels
  ) => Promise<void>;
}

export async function runStateChange(
  id: string,
  actorUserId: string,
  logic: (t: DBTransaction, existing: Types.ClassInstanceSelectType) => Promise<StateChangeLogicResult>,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks
): Promise<Types.ClassInstanceSelectType | null> {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;

    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;

    if (hooks?.onAuth) {
      await hooks.onAuth(t, existing, actorUserId, tFuncErrors);
    }

    const { state, event } = await logic(t, existing);

    if (hooks?.onValidate) {
      await hooks.onValidate(existing, state, tFuncErrors);
    }

    return updateInstanceState(t, id, actorUserId, state, event);
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
}

export async function transitionToCompleted(
  id: string,
  actorUserId: string,
  outcome: "ABSENT" | "LEAVE" | "TAKEN",
  description: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels,
  hooks?: StateChangeHooks
): Promise<Types.ClassInstanceSelectType | null> {
  return runStateChange(
    id,
    actorUserId,
    async (_, existing) => {
      const now = new Date();
      return {
        state: {
          executionState: "COMPLETED",
          outcome,
          actualStartAt: existing.actualStartAt ?? now,
          actualEndAt: now,
        },
        event: {
          fromState: { executionState: existing.executionState, outcome: existing.outcome },
          toState: { executionState: "COMPLETED", outcome },
          description,
        },
      };
    },
    tx,
    tErrors,
    hooks
  );
}
