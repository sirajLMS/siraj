import { AuditRepository } from "@/backend/db/repo/audit.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import type { ClassInstanceInsertInput, CreateAuditLogInput } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace TeacherDashboardService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  export async function getDashboard(userId: string, date: string, _mode: string, locale?: string) {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD, locale);
    await assertPermission(userId, AppPermission.SCHEDULE_VIEW_ASSIGNED, locale);

    const teacher = await TeacherRepository.findByUserId(userId);
    if (!teacher) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound")); // Needs specific teacher not found error
    }

    const targetDate = new Date(date);
    const scheduleRows = await SchedulingRepository.getDailySchedule(targetDate, {
      teacherId: teacher.id,
      viewerTimezone: teacher.timezone,
    });

    const metrics = await SchedulingRepository.getDailyMetrics(targetDate, teacher.id);

    // Fetch real progress feed from class status events
    const progressFeed = await SchedulingRepository.getTeacherProgressFeed(teacher.id, targetDate);

    return {
      id: `teacher-dashboard-${teacher.id}-${date}`,
      metrics,
      scheduleRows,
      progressFeed,
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

  export async function createManualEntry(userId: string, input: ManualEntryInput, locale?: string) {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD, locale);

    const entry: Omit<ClassInstanceInsertInput, "createdAt" | "updatedAt"> = {
      studentId: input.studentId,
      teacherId: input.teacherId,
      scheduledStartAt: new Date(input.scheduledStartAt),
      scheduledEndAt: new Date(input.scheduledEndAt),
      durationMinutes: input.durationMinutes,
      classType: input.classType ?? "REGULAR",
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      idempotencyKey: `manual-${userId}-${Date.now()}`,
    };

    // Logic to create ad-hoc class_instances row for teacher's assigned student.
    return SchedulingRepository.createClassInstance(entry, undefined, locale);
  }

  export interface SupportRequestInput {
    reason: string;
    [key: string]: unknown;
  }

  export async function logSupportRequest(userId: string, input: SupportRequestInput, locale?: string) {
    await assertPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD, locale);

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
   * @param locale Optional language code for localized error translations.
   * @returns A promise resolving to the signed download URL.
   */
  export async function getHandbookDownloadUrl(userId: string, locale?: string) {
    return SystemSettingsService.getHandbookDownloadUrl(userId, locale);
  }
}
