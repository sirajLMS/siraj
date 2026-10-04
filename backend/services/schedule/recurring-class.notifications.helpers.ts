import { classLifecycleAffectedUserIds, SchedulingRepository } from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";

/**
 * Resolve the student display name for the `metadata.studentName` channel
 * of `buildClassLifecyclePayloads`. The pure builder never reads the DB
 * (specs.md §5.1), so the parent of all instances in this recurring
 * schedule is fetched once here and threaded into every dispatch.
 */
async function resolveStudentName(studentId: string): Promise<string> {
  const student = await StudentRepository.findById(studentId);
  return student?.name ?? "—";
}

/**
 * Fire `CLASS_SCHEDULED` notifications for each newly-created instance.
 * Errors are caught per-instance so one dispatch failure does NOT surface
 * as a 500 to callers that just successfully created the recurring class
 * (specs.md "Dispatch failures must NOT throw out of the action").
 *
 * The affected-user set is the same parent + teacher + student for every
 * instance in this recurring schedule, so it is resolved once from the
 * first instance and reused — saving `N` extra join queries.
 */
export async function dispatchClassScheduledNotifications(
  classInstanceIds: readonly string[],
  studentId: string,
  locale?: string
): Promise<void> {
  const firstInstanceId = classInstanceIds[0];
  if (!firstInstanceId) return;

  let affected: Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceAffectedUsers>>;
  let studentName: string;
  try {
    affected = await SchedulingRepository.getClassInstanceAffectedUsers(firstInstanceId);
    studentName = await resolveStudentName(studentId);
  } catch (error) {
    logger.error("Class scheduled notification setup failed", {
      firstInstanceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (!affected) return;

  const affectedUserIds = classLifecycleAffectedUserIds(affected);

  // Batch-fetch all instances in a single query to eliminate N+1 DB reads
  // (RB-15). Without this, each iteration called `getClassInstanceById`
  // separately, producing one query per instance inside the loop.
  const instanceMap = await SchedulingRepository.getClassInstancesByIds([...classInstanceIds]);

  // Dispatch notifications for all instances in parallel. Each dispatch is
  // independent (own payload, own affected set), so per-instance try/catch
  // keeps one failure from surfacing as a 500 to the caller (specs.md
  // "Dispatch failures must NOT throw out of the action") while still
  // letting the rest fire concurrently.
  await Promise.allSettled(
    classInstanceIds.map(async instanceId => {
      try {
        const instance = instanceMap.get(instanceId);
        if (!instance) return;

        const payloads = buildClassLifecyclePayloads(
          instance,
          NotificationEventType.CLASS_SCHEDULED,
          affectedUserIds,
          locale,
          { studentName }
        );
        await dispatchWithPreferences(payloads, affectedUserIds, locale);
      } catch (error) {
        logger.error("Class scheduled notification dispatch failed", {
          classInstanceId: instanceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })
  );
}
