import type { DBTransaction } from "@/backend/db/db.types";
import { GroupClassRepository } from "@/backend/db/repo/classes/group-class.repository";
import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import {
  AppPermission,
  ClassExecutionState,
  ClassOutcome,
  type GroupClassAttendanceStatus,
  NotificationChannel,
  NotificationEventType,
} from "@/backend/enum";
import { parseClassExecutionState, parseClassOutcome } from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { extractMeetingId } from "@/backend/services/meeting/meeting-url-parser";
import type {
  ClassCommunicationInsertType,
  ClassCommunicationSelectType,
  GroupClassAdminNoteReturnType,
  GroupClassAuditReturnType,
  GroupClassCommunicationLogEntryReturnType,
  GroupClassEnrollmentInsertType,
  GroupClassEnrollmentSelectType,
  GroupClassInsertType,
  GroupClassOnlineMeetingInfoReturnType,
  GroupClassSelectType,
  GroupClassStudentReturnType,
} from "@/backend/types";

export namespace GroupClassService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  async function getGroupClassOrThrow(classInstanceId: string, locale?: string) {
    const groupClass = await GroupClassRepository.getByClassInstanceId(classInstanceId);
    if (!groupClass) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return groupClass;
  }

  async function getClassInstanceOrThrow(classInstanceId: string, locale?: string) {
    const classInstance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!classInstance) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return classInstance;
  }

  async function fetchStudents(groupClassId: string): Promise<GroupClassStudentReturnType[]> {
    const enrollmentRows = await GroupClassRepository.getEnrollmentsWithStudentDetails(groupClassId);
    return enrollmentRows.map(e => ({
      id: e.studentId,
      name: e.studentName,
      studentId: e.studentIdNumber ?? e.studentId,
      initials: e.studentName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      attendanceStatus: e.attendanceStatus as GroupClassAttendanceStatus,
      avatarUrl: e.studentAvatarUrl,
    }));
  }

  async function fetchCommunicationLogs(groupClassId: string): Promise<GroupClassCommunicationLogEntryReturnType[]> {
    const communications = await GroupClassRepository.getCommunications(groupClassId);
    return communications.map(c => ({
      id: c.id,
      type: c.type,
      title: c.title,
      description: c.description,
      isActive: c.isActive,
      isDelivered: c.isDelivered,
      timestamp: c.timestamp ? c.timestamp.toISOString() : null,
    }));
  }

  async function buildMeetingInfo(classInstanceId: string): Promise<GroupClassOnlineMeetingInfoReturnType> {
    const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(classInstanceId);
    const joinUrl = effectiveMeeting.joinUrl;
    const providerSlug = effectiveMeeting.providerSlug;
    return {
      platform: providerSlug ?? "unknown",
      meetingId:
        effectiveMeeting.meetingId ?? (joinUrl && providerSlug ? extractMeetingId(providerSlug, joinUrl) : null),
      joinUrl,
      logoUrl: effectiveMeeting.logoUrl,
      providerName: effectiveMeeting.providerName,
      source: effectiveMeeting.source,
    };
  }

  export async function getGroupClassAudit(
    userId: string,
    classInstanceId: string,
    locale?: string
  ): Promise<GroupClassAuditReturnType> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, locale);

    const groupClass = await getGroupClassOrThrow(classInstanceId, locale);
    const classInstance = await getClassInstanceOrThrow(classInstanceId, locale);

    const [students, communicationLogs, meetingInfo] = await Promise.all([
      fetchStudents(groupClass.id),
      fetchCommunicationLogs(groupClass.id),
      buildMeetingInfo(classInstanceId),
    ]);

    const adminNote: GroupClassAdminNoteReturnType = {
      content: classInstance.adminNotes ?? "",
      lastUpdated: classInstance.updatedAt.toISOString(),
    };

    return {
      id: groupClass.id,
      className: groupClass.courseName,
      courseCode: classInstance.classType,
      teacherName: groupClass.teacherName,
      originalDate: groupClass.originalDate?.toISOString() ?? null,
      rescheduledDate: groupClass.rescheduledDate?.toISOString() ?? null,
      timeSlot: groupClass.timeSlot,
      venue: "Online",
      status: resolveGroupClassStatus(classInstance.executionState),
      outcome: parseClassOutcome(classInstance.outcome) ?? ClassOutcome.PENDING,
      isFrozen: classInstance.isFrozen,
      auditRemark: groupClass.auditRemark ?? null,
      auditLoggedAt: groupClass.auditLoggedAt.toISOString(),
      registeredStudentCount: students.length,
      totalStudentCount: students.length,
      students,
      meetingInfo,
      communications: communicationLogs,
      adminNote,
    };
  }

  export async function updateAdminNote(
    userId: string,
    classInstanceId: string,
    content: string,
    locale?: string
  ): Promise<GroupClassAuditReturnType> {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, locale);

    const result = await GroupClassRepository.updateAdminNote(classInstanceId, content);
    if (!result) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    return getGroupClassAudit(userId, classInstanceId, locale);
  }

  export async function resendNotifications(
    userId: string,
    classInstanceId: string,
    locale?: string
  ): Promise<{ id: string; success: boolean }> {
    await assertPermission(userId, AppPermission.SYSTEM_DISPATCH_EMAIL, locale);

    const groupClass = await getGroupClassOrThrow(classInstanceId, locale);

    const parentUserIds = await GroupClassRepository.getParentUserIdsForGroupClass(groupClass.id);
    const uniqueUserIds = [...new Set(parentUserIds)];

    const title = `Class Reminder: ${groupClass.courseName}`;
    const body = `Your class ${groupClass.courseName} scheduled for ${groupClass.timeSlot} has been updated. Please check your schedule for details.`;

    const inputs = uniqueUserIds.map(uid => ({
      userId: uid,
      channel: NotificationChannel.EMAIL,
      eventType: NotificationEventType.CLASS_REMINDER,
      title,
      body,
    }));

    try {
      await NotificationRepository.createDeliveriesBatch(inputs);

      await GroupClassRepository.createCommunication({
        groupClassId: groupClass.id,
        type: "email",
        title,
        description: body,
        isActive: true,
        isDelivered: true,
        timestamp: new Date(),
        notificationDeliveryId: null,
        classStatusEventId: null,
      });

      logger.info("Resent class notifications", { classInstanceId, recipientCount: uniqueUserIds.length });
    } catch (error) {
      logger.error("Failed to resend class notifications", { classInstanceId, error });
      return { id: classInstanceId, success: false };
    }

    return { id: classInstanceId, success: true };
  }
  export async function listGroupClassesByClassInstanceIds(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<GroupClassSelectType[]> {
    return GroupClassRepository.listByClassInstanceIds(classInstanceIds, tx);
  }

  export async function createManyGroupClasses(
    inputs: Omit<GroupClassInsertType, "id" | "createdAt" | "updatedAt">[],
    tx?: DBTransaction
  ): Promise<GroupClassSelectType[]> {
    return GroupClassRepository.createMany(inputs, tx);
  }

  export async function findEnrollmentKeys(
    keys: readonly { groupClassId: string; studentId: string }[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    return GroupClassRepository.findEnrollmentKeys(keys, tx);
  }

  export async function createManyEnrollments(
    inputs: Omit<GroupClassEnrollmentInsertType, "id" | "createdAt" | "updatedAt">[],
    tx?: DBTransaction
  ): Promise<GroupClassEnrollmentSelectType[]> {
    return GroupClassRepository.createManyEnrollments(inputs, tx);
  }

  export async function listGroupClassIdsWithCommunications(
    groupClassIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    return GroupClassRepository.listGroupClassIdsWithCommunications(groupClassIds, tx);
  }

  export async function createManyCommunications(
    inputs: Omit<ClassCommunicationInsertType, "id" | "createdAt">[],
    tx?: DBTransaction
  ): Promise<ClassCommunicationSelectType[]> {
    return GroupClassRepository.createManyCommunications(inputs, tx);
  }

  export async function findEnrollmentsByKeys(
    keys: readonly { groupClassId: string; studentId: string }[],
    tx?: DBTransaction
  ): Promise<Map<string, GroupClassEnrollmentSelectType>> {
    return GroupClassRepository.findEnrollmentsByKeys(keys, tx);
  }
}

function resolveGroupClassStatus(executionState: string | null | undefined): ClassExecutionState {
  const state = parseClassExecutionState(executionState);
  if (state === ClassExecutionState.COMPLETED) return ClassExecutionState.COMPLETED;
  if (state === ClassExecutionState.ACTIVATED) return ClassExecutionState.ACTIVATED;
  if (state === ClassExecutionState.RUNNING) return ClassExecutionState.RUNNING;
  return ClassExecutionState.NOT_ACTIVATED;
}
