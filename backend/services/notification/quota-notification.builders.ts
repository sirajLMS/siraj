import { NotificationEventType } from "@/backend/enum";
import { fanOutToUsers } from "@/backend/services/notification/notification-payloads.builders";
import type { CommunicationPayload } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export function buildQuotaExpiringSoonPayloads(input: {
  affectedUserIds: string[];
  quotaName: string;
  validUntil: string;
  remaining: number;
  locale?: string;
}): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labels = getServerTranslations(input.locale ?? "en").notificationsTranslations.quotaExpiringSoon;
  const title = labels.title;
  const body = labels.body({
    quotaName: input.quotaName,
    validUntil: input.validUntil,
    remaining: input.remaining,
  });

  return fanOutToUsers(input.affectedUserIds, NotificationEventType.QUOTA_EXPIRING_SOON, title, body, {
    category: "reminder",
    quotaName: input.quotaName,
    validUntil: input.validUntil,
    remaining: input.remaining,
  });
}

export function buildQuotaExpiredPayloads(input: {
  affectedUserIds: string[];
  quotaName: string;
  locale?: string;
}): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labels = getServerTranslations(input.locale ?? "en").notificationsTranslations.quotaExpired;
  const title = labels.title;
  const body = labels.body({ quotaName: input.quotaName });

  return fanOutToUsers(input.affectedUserIds, NotificationEventType.QUOTA_EXPIRED, title, body, {
    category: "info",
    quotaName: input.quotaName,
  });
}

export function buildQuotaLowBalancePayloads(input: {
  affectedUserIds: string[];
  studentName: string;
  remaining: number;
  totalClasses: number;
  locale?: string;
}): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labels = getServerTranslations(input.locale ?? "en").notificationsTranslations.quotaLowBalance;
  const title = labels.title;
  const body = labels.body({
    studentName: input.studentName,
    remaining: input.remaining,
    totalClasses: input.totalClasses,
  });

  return fanOutToUsers(input.affectedUserIds, NotificationEventType.QUOTA_LOW_BALANCE, title, body, {
    category: "reminder",
    studentName: input.studentName,
    remaining: input.remaining,
    totalClasses: input.totalClasses,
  });
}

export function buildOndemandInstancePendingCreditPayloads(input: {
  affectedUserIds: string[];
  studentName: string;
  scheduledStartAt: string;
  locale?: string;
}): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labels = getServerTranslations(input.locale ?? "en").notificationsTranslations.onDemandInstancePendingCredit;
  const title = labels.title;
  const body = labels.body({
    studentName: input.studentName,
    scheduledStartAt: input.scheduledStartAt,
  });

  return fanOutToUsers(input.affectedUserIds, NotificationEventType.ON_DEMAND_INSTANCE_PENDING_CREDIT, title, body, {
    category: "urgent",
    studentName: input.studentName,
    scheduledStartAt: input.scheduledStartAt,
  });
}

export function buildOndemandInstanceReminderT3Payloads(input: {
  affectedUserIds: string[];
  studentName: string;
  scheduledStartAt: string;
  locale?: string;
}): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labels = getServerTranslations(input.locale ?? "en").notificationsTranslations.onDemandInstanceReminderT3;
  const title = labels.title;
  const body = labels.body({
    studentName: input.studentName,
    scheduledStartAt: input.scheduledStartAt,
  });

  return fanOutToUsers(input.affectedUserIds, NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T3, title, body, {
    category: "reminder",
    studentName: input.studentName,
    scheduledStartAt: input.scheduledStartAt,
  });
}

export function buildOndemandInstanceReminderT1Payloads(input: {
  affectedUserIds: string[];
  studentName: string;
  scheduledStartAt: string;
  locale?: string;
}): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labels = getServerTranslations(input.locale ?? "en").notificationsTranslations.onDemandInstanceReminderT1;
  const title = labels.title;
  const body = labels.body({
    studentName: input.studentName,
    scheduledStartAt: input.scheduledStartAt,
  });

  return fanOutToUsers(input.affectedUserIds, NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T1, title, body, {
    category: "urgent",
    studentName: input.studentName,
    scheduledStartAt: input.scheduledStartAt,
  });
}

export function buildOndemandTeacherDailyDigestPayloads(input: {
  affectedUserIds: string[];
  teacherName: string;
  pendingCount: number;
  locale?: string;
}): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labels = getServerTranslations(input.locale ?? "en").notificationsTranslations.onDemandTeacherDailyDigest;
  const title = labels.title;
  const body = labels.body({
    teacherName: input.teacherName,
    pendingCount: input.pendingCount,
  });

  return fanOutToUsers(input.affectedUserIds, NotificationEventType.ON_DEMAND_TEACHER_DAILY_DIGEST, title, body, {
    category: "digest",
    teacherName: input.teacherName,
    pendingCount: input.pendingCount,
  });
}
