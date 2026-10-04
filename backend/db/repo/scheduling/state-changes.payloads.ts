import type { StateChangeLogicResult } from "@/backend/db/repo/scheduling/state-changes.core";
import type * as Types from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export function buildActivatedStatePayload(actorUserId: string, force: boolean): StateChangeLogicResult {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  return {
    state: {
      executionState: "ACTIVATED",
      activatedAt: new Date(),
      activatedByUserId: actorUserId,
      forceActivated: force,
      forceActivatedByUserId: force ? actorUserId : null,
    },
    event: {
      fromState: { executionState: "NOT_ACTIVATED" },
      toState: { executionState: "ACTIVATED" },
      description: force ? tFuncSession.forceActivateDescription : tFuncSession.activateDescription,
    },
  };
}

export function buildStartedStatePayload(existing: Types.ClassInstanceSelectType): StateChangeLogicResult {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  return {
    state: { executionState: "RUNNING", outcome: "PENDING", actualStartAt: new Date() },
    event: {
      fromState: { executionState: existing.executionState, outcome: existing.outcome },
      toState: { executionState: "RUNNING", outcome: "PENDING" },
      description: tFuncSession.startDescription,
    },
  };
}

export function buildAbsentStatePayload(existing: Types.ClassInstanceSelectType): StateChangeLogicResult {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  const now = new Date();
  return {
    state: {
      executionState: "COMPLETED",
      outcome: "ABSENT",
      actualStartAt: existing.actualStartAt ?? now,
      actualEndAt: now,
      payrollCredited: true,
      remarks: existing.remarks ?? tFuncSession.absentEventDescription,
    },
    event: {
      fromState: { executionState: existing.executionState, outcome: existing.outcome },
      toState: { executionState: "COMPLETED", outcome: "ABSENT" },
      description: tFuncSession.absentEventDescription,
    },
  };
}

export function buildAutoMissedStatePayload(existing: Types.ClassInstanceSelectType): StateChangeLogicResult {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  const now = new Date();
  return {
    state: {
      executionState: "COMPLETED",
      outcome: "ABSENT",
      actualStartAt: existing.actualStartAt ?? now,
      actualEndAt: now,
      payrollCredited: true,
      remarks: existing.remarks ?? tFuncSession.autoMissedEventDescription,
    },
    event: {
      fromState: { executionState: existing.executionState, outcome: existing.outcome },
      toState: { executionState: "COMPLETED", outcome: "ABSENT" },
      description: tFuncSession.autoMissedEventDescription,
    },
  };
}

export function buildResetStatePayload(): StateChangeLogicResult {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  return {
    state: {
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      classType: "REGULAR",
      actualStartAt: null,
      actualEndAt: null,
      activatedAt: null,
      activatedByUserId: null,
      forceActivated: false,
      forceActivatedByUserId: null,
      payrollCredited: false,
      quotaDeducted: false,
      isRescheduled: false,
      remarks: null,
      adminNotes: null,
    },
    event: {
      fromState: { executionState: undefined, outcome: undefined },
      toState: { executionState: "NOT_ACTIVATED", outcome: "PENDING" },
      description: tFuncSession.resetDescription,
    },
  };
}
