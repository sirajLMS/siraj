import { and, eq } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { classInstances, leaveRequests } from "@/backend/db/schema";
import { AppPermission, LeaveRequesterType, LeaveRequestStatus, LeaveRequestType } from "@/backend/enum";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { resolveEnvConfig } from "@/backend/services";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { DBTransaction, LeaveRequestSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const DEFAULT_LOCK_HOURS = 12;

/** Resolve the time-lock window (hours before session start) for self-service actions. */
async function resolveLockHours(): Promise<number> {
  const raw = await resolveEnvConfig("SELF_SERVICE_RESCHEDULE_LOCK_HOURS");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LOCK_HOURS;
}

/** Fetch a class instance by ID (shared by assertCallerOwnsSession + assertNotLocked). */
async function getClassInstance(
  classInstanceId: string,
  tx?: DBTransaction
): Promise<{ id: string; studentId: string; scheduledStartAt: Date } | null> {
  const q = queryDb(tx);
  const [instance] = await q
    .select({
      id: classInstances.id,
      studentId: classInstances.studentId,
      scheduledStartAt: classInstances.scheduledStartAt,
    })
    .from(classInstances)
    .where(eq(classInstances.id, classInstanceId))
    .limit(1);
  return instance ?? null;
}

/** Check that the class instance exists. */
async function assertCallerOwnsSession(
  classInstanceId: string,
  tErrors: ReturnType<typeof getServerTranslations>["errorsTranslations"],
  tx?: DBTransaction
): Promise<void> {
  const instance = await getClassInstance(classInstanceId, tx);
  if (!instance) {
    throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
  }
}

/** Check that the session is not within the time-lock window or in the past. */
async function assertNotLocked(
  classInstanceId: string,
  tErrors: ReturnType<typeof getServerTranslations>["errorsTranslations"],
  tx?: DBTransaction
): Promise<void> {
  const instance = await getClassInstance(classInstanceId, tx);
  if (!instance) {
    throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
  }

  const now = new Date();
  const lockHours = await resolveLockHours();
  const lockThreshold = new Date(now.getTime() + lockHours * 60 * 60 * 1000);

  if (instance.scheduledStartAt <= lockThreshold) {
    throw new ValidationError("SESSION_LOCKED", `Cannot modify session within ${lockHours} hours of start time.`);
  }
}

/** Check that no duplicate PENDING request exists for the same class instance. */
async function assertNoDuplicatePending(
  classInstanceId: string,
  tErrors: ReturnType<typeof getServerTranslations>["errorsTranslations"],
  tx?: DBTransaction
): Promise<void> {
  const q = queryDb(tx);
  const existing = await q
    .select()
    .from(leaveRequests)
    .where(
      and(eq(leaveRequests.classInstanceId, classInstanceId), eq(leaveRequests.status, LeaveRequestStatus.PENDING))
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError(tErrors.forbidden);
  }
}

/** Insert a leave request row. */
async function insertLeaveRequest(
  input: {
    classInstanceId: string;
    requestedByUserId: string;
    requesterType: LeaveRequesterType;
    requestType: LeaveRequestType;
    proposedStartAt: Date | null;
    reason: string | null;
  },
  tx?: DBTransaction
): Promise<LeaveRequestSelectType> {
  const executor = tx ?? db;
  const [row] = await executor
    .insert(leaveRequests)
    .values({
      classInstanceId: input.classInstanceId,
      requestedByUserId: input.requestedByUserId,
      requesterType: input.requesterType,
      requestType: input.requestType,
      proposedStartAt: input.proposedStartAt,
      reason: input.reason,
      status: LeaveRequestStatus.PENDING,
      createdAt: new Date(),
    })
    .returning();

  if (!row) {
    throw new Error("Failed to insert leave request");
  }
  return row;
}

export namespace LeaveRequestService {
  /** Shared create flow for student delay/cancel requests (deduped). */
  async function createStudentRequest(
    callerUserId: string,
    permission: AppPermission,
    classInstanceId: string,
    requestType: LeaveRequestType,
    proposedStartAt: Date | null,
    reason: string | null,
    locale?: string
  ): Promise<LeaveRequestSelectType> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(callerUserId, permission);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    await assertCallerOwnsSession(classInstanceId, tErrors);
    await assertNotLocked(classInstanceId, tErrors);
    await assertNoDuplicatePending(classInstanceId, tErrors);

    const row = await db.transaction(async tx =>
      insertLeaveRequest(
        {
          classInstanceId,
          requestedByUserId: callerUserId,
          requesterType: LeaveRequesterType.STUDENT,
          requestType,
          proposedStartAt,
          reason,
        },
        tx
      )
    );

    logger.info("Student request created", { callerUserId, classInstanceId, requestType, requestId: row.id });
    return row;
  }

  /**
   * Student/parent requests a delay (reschedule) for an upcoming session.
   * The proposed new start time is stored for supervisor review; approval triggers
   * the existing `ClassSessionService.reschedule()` flow (meeting URL regenerated).
   */
  export function createStudentDelayRequest(
    callerUserId: string,
    classInstanceId: string,
    proposedStartAt: Date,
    reason: string | null,
    locale?: string
  ): Promise<LeaveRequestSelectType> {
    return createStudentRequest(
      callerUserId,
      AppPermission.SESSION_SELF_DELAY,
      classInstanceId,
      LeaveRequestType.DELAY,
      proposedStartAt,
      reason,
      locale
    );
  }

  /**
   * Student/parent requests a cancellation for an upcoming session.
   * No proposed time is needed; approval triggers the cancel+refund flow
   * (quota-exempt per R3 design decision — no `leave_quota_usage` write).
   */
  export function createStudentCancelRequest(
    callerUserId: string,
    classInstanceId: string,
    reason: string | null,
    locale?: string
  ): Promise<LeaveRequestSelectType> {
    const perm = AppPermission.SESSION_SELF_CANCEL;
    const type = LeaveRequestType.CANCEL;
    return createStudentRequest(callerUserId, perm, classInstanceId, type, null, reason, locale);
  }

  /** Supervisor/admin rejects a pending request. */
  export async function rejectRequest(
    callerUserId: string,
    requestId: string,
    locale?: string
  ): Promise<LeaveRequestSelectType> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(callerUserId, AppPermission.SESSION_RESCHEDULE);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    const q = queryDb();
    const [existing] = await q.select().from(leaveRequests).where(eq(leaveRequests.id, requestId)).limit(1);
    if (!existing) {
      throw new NotFoundError("LEAVE_REQUEST", tErrors.notFound);
    }
    if (existing.status !== "PENDING") {
      throw new ConflictError("Request is no longer pending");
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: LeaveRequestStatus.REJECTED,
        processedAt: new Date(),
        processedByUserId: callerUserId,
      })
      .where(eq(leaveRequests.id, requestId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update leave request");
    }

    logger.info("Leave request rejected", { callerUserId, requestId });
    return updated;
  }

  /** Get the caller's own leave requests (student/parent view). */
  export async function getMyRequests(callerUserId: string, locale?: string): Promise<LeaveRequestSelectType[]> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const hasPermission = await PermissionsService.hasPermission(callerUserId, AppPermission.SESSION_SELF_DELAY);
    if (!hasPermission) {
      throw new UnauthorizedError(tErrors.insufficientPermissions);
    }

    const q = queryDb();
    return q.select().from(leaveRequests).where(eq(leaveRequests.requestedByUserId, callerUserId));
  }
}
