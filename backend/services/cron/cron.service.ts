/**
 * CronService — Single orchestration layer for cron schedules + dispatch + history.
 *
 * All DB access via `CronRepository` — service never touches Drizzle directly.
 * All user-facing errors use typed translation functions (never hardcoded strings).
 * Logging is structured via `@/backend/lib/logger`.
 *
 * Implementations live in `cron-schedule.parts.ts`, `cron-dispatch.parts.ts`,
 * and `cron-run-lifecycle.parts.ts`; this module re-exposes the public surface
 * under the original `CronService` names.
 */
import { dispatchDueSchedulesImpl, dispatchScheduleByIdImpl } from "@/backend/services/cron/cron-dispatch.parts";
import {
  completeRunImpl,
  enqueueRetryImpl,
  failRunImpl,
  getQueueStatsImpl,
  getRunByIdImpl,
  getRunsImpl,
  reconcileStuckRunsImpl,
  recordHeartbeatImpl,
  retryRunImpl,
  setRunRunningImpl,
} from "@/backend/services/cron/cron-run-lifecycle.parts";
import {
  createScheduleImpl,
  deleteScheduleImpl,
  getScheduleImpl,
  getSchedulesImpl,
  pauseScheduleImpl,
  resumeScheduleImpl,
  updateScheduleImpl,
} from "@/backend/services/cron/cron-schedule.parts";

export namespace CronService {
  // ── Schedule CRUD ──

  export const createSchedule = createScheduleImpl;
  export const updateSchedule = updateScheduleImpl;
  export const pauseSchedule = pauseScheduleImpl;
  export const resumeSchedule = resumeScheduleImpl;
  export const deleteSchedule = deleteScheduleImpl;
  export const getSchedule = getScheduleImpl;
  export const getSchedules = getSchedulesImpl;

  // ── Run queries ──

  export const getRunById = getRunByIdImpl;
  export const getRuns = getRunsImpl;

  // ── Dispatch ──

  export const dispatchDueSchedules = dispatchDueSchedulesImpl;
  export const dispatchScheduleById = dispatchScheduleByIdImpl;

  // ── Run lifecycle (called by worker runtime) ──

  export const setRunRunning = setRunRunningImpl;
  export const completeRun = completeRunImpl;
  export const failRun = failRunImpl;
  export const retryRun = retryRunImpl;
  export const enqueueRetry = enqueueRetryImpl;
  export const recordHeartbeat = recordHeartbeatImpl;

  // ── Reconciliation ──

  export const reconcileStuckRuns = reconcileStuckRunsImpl;

  // ── Queue stats ──

  export const getQueueStats = getQueueStatsImpl;
}
