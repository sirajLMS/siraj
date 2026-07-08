import { GroupClassRepository } from "@/backend/db/repo/group-class.repository";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import {
  AppPermission,
  ClassExecutionState,
  type GroupClassAttendanceStatus,
  NotificationChannel,
  NotificationEventType,
} from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  GroupClassAdminNoteReturnType,
  GroupClassAuditReturnType,
  GroupClassCommunicationLogEntryReturnType,
  GroupClassOnlineMeetingInfoReturnType,
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

  export async function getGroupClassAudit(
    userId: string,
    classInstanceId: string,
    locale?: string
  ): Promise<GroupClassAuditReturnType> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, locale);

    const groupClass = await getGroupClassOrThrow(classInstanceId, locale);

    const classInstance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!classInstance) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const enrollmentRows = await GroupClassRepository.getEnrollmentsWithStudentDetails(groupClass.id);
    const communications = await GroupClassRepository.getCommunications(groupClass.id);

    const students: GroupClassStudentReturnType[] = enrollmentRows.map(e => ({
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

    const communicationLogs: GroupClassCommunicationLogEntryReturnType[] = communications.map(c => ({
      id: c.id,
      type: c.type,
      title: c.title,
      description: c.description,
      isActive: c.isActive,
      isDelivered: c.isDelivered,
      timestamp: c.timestamp ? c.timestamp.toISOString() : null,
    }));

    const meetingInfo: GroupClassOnlineMeetingInfoReturnType = {
      platform: "zoom",
      meetingId: classInstance.zoomMeetingUrl ? extractZoomMeetingId(classInstance.zoomMeetingUrl) : null,
      joinUrl: classInstance.zoomMeetingUrl ?? null,
    };

    const adminNote: GroupClassAdminNoteReturnType = {
      content: classInstance.adminNotes ?? "",
      lastUpdated: classInstance.updatedAt.toISOString(),
    };

    const originalDate = groupClass.originalDate ? groupClass.originalDate.toISOString() : null;
    const rescheduledDate = groupClass.rescheduledDate ? groupClass.rescheduledDate.toISOString() : null;

    return {
      id: groupClass.id,
      className: groupClass.courseName,
      courseCode: classInstance.classType,
      teacherName: groupClass.teacherName,
      originalDate,
      rescheduledDate,
      timeSlot: groupClass.timeSlot,
      venue: "Online",
      status: resolveGroupClassStatus(classInstance.executionState),
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
}

function resolveGroupClassStatus(executionState: string | null | undefined): ClassExecutionState {
  const state = (executionState ?? ClassExecutionState.NOT_ACTIVATED) as ClassExecutionState;
  if (state === ClassExecutionState.COMPLETED) return ClassExecutionState.COMPLETED;
  if (state === ClassExecutionState.ACTIVATED) return ClassExecutionState.ACTIVATED;
  if (state === ClassExecutionState.RUNNING) return ClassExecutionState.RUNNING;
  return ClassExecutionState.NOT_ACTIVATED;
}

function extractZoomMeetingId(url: string): string | null {
  const match = /\/j\/(\d+)/.exec(url);
  return match ? match[1] : null;
}
