import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo";
import { AuditRepository } from "@/backend/db/repo/audit/audit.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { AppPermission } from "@/backend/enum";
import { parseClassExecutionState, parseClassOutcome, parseIanaTimezone } from "@/backend/lib/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import type { ClassInstanceInsertInput, CreateAuditLogInput, PaginationArgs } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace TeacherDashboardService {
  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      throw new Error(tErrors.unauthorized);
    }
  }

  export async function getDashboard(userId: string, date: string, pagination?: PaginationArgs | null) {
    const tErrors = { unauthorized: "You must be logged in first." } as ErrorsLabels;
    await assertPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD, tErrors);
    await assertPermission(userId, AppPermission.SCHEDULE_VIEW_ASSIGNED, tErrors);

    const teacher = await TeacherRepository.findByUserId(userId);
    if (!teacher) {
      throw new Error("Teacher profile not found");
    }

    const user = await UserRepository.findById(userId);
    const viewerTimezone = parseIanaTimezone(user?.timezone);

    const targetDate = new Date(date);
    const result = await SchedulingRepository.getAdminDashboardSchedule({
      date: targetDate,
      teacherId: teacher.id,
      viewerTimezone,
      pagination: pagination ?? null,
    });

    const metrics = await SchedulingRepository.getDailyMetrics(targetDate, teacher.id);

    const progressFeed = await SchedulingRepository.getTeacherProgressFeed(teacher.id, targetDate, viewerTimezone);

    const mappedScheduleRows = result.rows.map(r => ({
      ...r,
      executionState: parseClassExecutionState(r.executionState),
      outcome: parseClassOutcome(r.outcome),
    }));

    const mappedProgressFeed = progressFeed; // progressFeed items don't need enum casts

    return {
      id: `teacher-dashboard-${teacher.id}-${date}`,
      metrics,
      scheduleRows: mappedScheduleRows,
      progressFeed: mappedProgressFeed,
      totalCount: result.totalCount,
      pageInfo: result.pageInfo,
    };
  }

  export interface ManualEntryInput {
    studentId: string;
    teacherId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    durationMinutes: number;
    classType?: "REGULAR" | "TRIAL" | "PROMOTION";
  }

  export async function createManualEntry(userId: string, input: ManualEntryInput, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD, tErrors);

    const balance = await CreditRepository.getBalance(db, input.studentId);
    if (balance.classesRemaining <= 0) {
      throw new Error(
        tErrors.credit.insufficientBalance?.({
          studentId: input.studentId,
          remaining: balance.classesRemaining,
        })
      );
    }

    const idempotencyKey = `manual-${userId}-${Date.now()}`;
    const entry: Omit<ClassInstanceInsertInput, "createdAt" | "updatedAt"> = {
      studentId: input.studentId,
      teacherId: input.teacherId,
      scheduledStartAt: new Date(input.scheduledStartAt),
      scheduledEndAt: new Date(input.scheduledEndAt),
      durationMinutes: input.durationMinutes,
      classType: input.classType ?? "REGULAR",
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      quotaDeducted: true,
      idempotencyKey,
    };

    return db.transaction(async tx => {
      const created = await SchedulingRepository.createClassInstance(entry, tx);

      const creditIdempotencyKey = `credit-deduction:${created.id}`;
      await CreditService.deductForBooking(input.studentId, created.id, userId, creditIdempotencyKey, tx, tErrors);

      return created;
    });
  }

  export interface SupportRequestInput {
    reason: string;
    [key: string]: unknown;
  }

  export async function logSupportRequest(userId: string, input: SupportRequestInput, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD, tErrors);

    const auditLog: CreateAuditLogInput = {
      actorUserId: userId,
      actorType: "TEACHER",
      entityType: "SYSTEM",
      entityId: "SUPPORT",
      action: "TEACHER_SUPPORT_REQUEST",
      description: input.reason || "Support requested from dashboard",
      metadata: input,
    };

    // Inserts into audit logs with action TEACHER_SUPPORT
    return AuditRepository.createAuditLog(auditLog);
  }

  /**
   * Retrieves the secure, signed download URL for the teacher handbook.
   *
   * This function acts as a wrapper/pass-through that exposes the handbook URL retrieval
   * via the teacher dashboard service. It delegates authorization checks and file URL
   * resolution to the `SystemSettingsService.getHandbookDownloadUrl`.
   *
   * @param userId The ID of the teacher requesting the handbook URL.
   * @returns A promise resolving to the signed download URL.
   */
  export async function getHandbookDownloadUrl(userId: string, tErrors: ErrorsLabels) {
    return SystemSettingsService.getHandbookDownloadUrl(userId, tErrors);
  }
}
