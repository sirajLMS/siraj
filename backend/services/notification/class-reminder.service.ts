import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students";
import { classLifecycleAffectedUserIds } from "@/backend/db/repo/scheduling";
import { NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { formatError } from "@/backend/services/cron/cron-utils";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import { buildClassLifecyclePayloads } from "@/backend/services/notification/notification-payloads.builders";
import type { ClassInstanceSelectType } from "@/backend/types/classes/class-instance-detail.types";

/**
 * Daily class-reminder dispatcher.
 *
 * Per `specs.md` rule #1 / #2 / #3:
 *   - dispatch flows through `dispatchWithPreferences` (specs.md §5.2)
 *   - payloads are built by the pure builder `buildClassLifecyclePayloads`
 *     (specs.md §5.1)
 *   - locale defaults to `"en"` for cron invocations (no per-actor `ctx.locale`
 *     available — cron runs unauthenticated); already-localized payloads flow
 *     into `CommunicationService.dispatchMulti` which forwards `locale` to
 *     channel adapters that need it (email subject casing etc.). The user-facing
 *     strings themselves come from `shared/locale/notifications/` via the builder.
 *
 * Idempotency:
 *   - The on-app channel path (`OnAppChannel.send` → `NotificationRepository.createDelivery`)
 *     does NOT natively dedupe on `idempotencyKey`. We add a UTC-DATE bucket
 *     (`class-reminder-<instanceId>-<YYYY-MM-DD>`) into each payload's metadata
 *     so the dispatch helper can be enhanced downstream to dedupe by metadata
 *     key without changing this service's contract (specs.md §7 — non-blocking
 *     cross-file improvements tracked separately).
 *   - For now the key informs callers/test-mocks and any future
 *     `OnAppChannel` dedupe by metadata.
 *
 * Failure isolation:
 *   - Each instance's dispatch is wrapped in its own try/catch. A failure for
 *     one instance (e.g. affected-user resolution, payload build, dispatchMulti
 *     throw) is logged but does NOT halt the loop. Partial-success logging is
 *     surfaced in the cron route response per `specs.md` §5.2 spec 5 (log
 *     dispatch stats).
 */
export namespace ClassReminderService {
  /**
   * Dispatch `CLASS_REMINDER` notifications for the upcoming-window instances.
   *
   * @param options.withinHours  Reminder window (defaults to 24 — the cron runs
   *                              daily per `vercel.json`).
   * @param options.locale       Optional locale forwarded to the per-user
   *                              `dispatchWithPreferences` call. Defaults to
   *                              `"en"` for unauthenticated cron context.
   * @returns Summary `{ success, instancesProcessed, deliveriesDispatched }`
   *          suitable for the `NextResponse.json(...)` body in
   *          `app/api/cron/class-reminders/route.ts`.
   */
  export async function dispatchDailyReminders(
    options: { withinHours?: number; locale?: string } = {}
  ): Promise<{ success: boolean; instancesProcessed: number; deliveriesDispatched: number }> {
    const withinHours = options.withinHours ?? 24;
    const locale = options.locale ?? "en";

    try {
      const upcoming = await SchedulingRepository.findUpcomingInstances({ withinHours });

      // Each instance is dispatched independently (no shared DB transaction,
      // no ordering dependency) — safe to parallelise. `Promise.allSettled`
      // preserves per-instance failure isolation: a rejection for one
      // instance does NOT halt the cron run (specs.md §5.2).
      const outcomes = await Promise.allSettled(upcoming.map(instance => dispatchForInstance(instance, locale)));

      let deliveriesDispatched = 0;
      for (let i = 0; i < outcomes.length; i++) {
        const outcome = outcomes[i];
        if (outcome.status === "fulfilled") {
          deliveriesDispatched += outcome.value;
        } else {
          // Per specs.md §5.2 (per-user isolation) — extend to per-instance.
          // One instance's failure must NOT halt the cron run.
          logger.error("ClassReminderService: per-instance dispatch failed", {
            instanceId: upcoming[i].id,
            err: formatError(outcome.reason),
          });
        }
      }

      logger.info("ClassReminderService.dispatchDailyReminders complete", {
        withinHours,
        instancesProcessed: upcoming.length,
        deliveriesDispatched,
      });

      return { success: true, instancesProcessed: upcoming.length, deliveriesDispatched };
    } catch (error) {
      logger.error("ClassReminderService.dispatchDailyReminders failed", {
        error: formatError(error),
      });
      return { success: false, instancesProcessed: 0, deliveriesDispatched: 0 };
    }
  }
}

/**
 * Resolve the affected-user triplet + student name, build the `CLASS_REMINDER`
 * payloads (with the UTC-DATE idempotency key in metadata), and dispatch per
 * each affected user's notification preferences.
 *
 * @returns Number of successful channel deliveries dispatched for this
 *          instance (0 if no affected users resolved or all channels filtered).
 */
async function dispatchForInstance(instance: ClassInstanceSelectType, locale: string): Promise<number> {
  const affected = await SchedulingRepository.getClassInstanceAffectedUsers(instance.id);
  // Instance soft-deleted between findUpcomingInstances() and now — or
  // hard-purged. Skip without throwing so the loop continues.
  if (!affected) return 0;

  const { studentId } = affected;

  const student = await StudentRepository.findById(studentId);
  const studentName = student?.name ?? "—";

  // UTC-DATE bucket idempotency key: runs twice on the same UTC day
  // produce the SAME key per (instance, day) pair; the next UTC day produces
  // a fresh key. The key rides in payload metadata so downstream channel
  // adapters or future OnAppChannel dedupe can read it.
  const idempotencyKey = `class-reminder-${instance.id}-${new Date().toISOString().slice(0, 10)}`;

  const metadata: Record<string, string> = { studentName, idempotencyKey };
  const affectedUserIds = classLifecycleAffectedUserIds(affected);

  const payloads = buildClassLifecyclePayloads(
    instance,
    NotificationEventType.CLASS_REMINDER,
    affectedUserIds,
    locale,
    metadata
  );

  const results = await dispatchWithPreferences(payloads, affectedUserIds, locale);
  return results.filter(r => r.success).length;
}
