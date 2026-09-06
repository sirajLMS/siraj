import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  GroupClassAttendanceStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  GroupClassAdminNoteReturnType,
  GroupClassAuditReturnType,
  GroupClassCommunicationLogEntryReturnType,
  GroupClassOnlineMeetingInfoReturnType,
  GroupClassStudentReturnType,
} from "@/backend/types";

export const GroupClassStudentRef = gqlSchemaBuilder.objectRef<GroupClassStudentReturnType>("GroupClassStudent");

export const GroupClassStudentPothosObject = GroupClassStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    studentId: t.exposeString("studentId"),
    initials: t.exposeString("initials"),
    attendanceStatus: t.expose("attendanceStatus", { type: GroupClassAttendanceStatusPothosObject }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

export const OnlineMeetingInfoRef =
  gqlSchemaBuilder.objectRef<GroupClassOnlineMeetingInfoReturnType>("OnlineMeetingInfo");

export const OnlineMeetingInfoPothosObject = OnlineMeetingInfoRef.implement({
  fields: t => ({
    platform: t.exposeString("platform"),
    meetingId: t.exposeString("meetingId", { nullable: true }),
    joinUrl: t.exposeString("joinUrl", { nullable: true }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    providerName: t.expose("providerName", { type: "LocalizedString", nullable: true }),
    source: t.exposeString("source", { nullable: true }),
  }),
});

export const CommunicationLogEntryRef =
  gqlSchemaBuilder.objectRef<GroupClassCommunicationLogEntryReturnType>("CommunicationLogEntry");

export const CommunicationLogEntryPothosObject = CommunicationLogEntryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    type: t.exposeString("type"),
    title: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    isDelivered: t.exposeBoolean("isDelivered", { nullable: true }),
    timestamp: t.exposeString("timestamp", { nullable: true }),
  }),
});

export const AdminNoteRef = gqlSchemaBuilder.objectRef<GroupClassAdminNoteReturnType>("AdminNoteInfo");

export const AdminNotePothosObject = AdminNoteRef.implement({
  fields: t => ({
    content: t.exposeString("content"),
    lastUpdated: t.exposeString("lastUpdated"),
  }),
});

export const GroupClassAuditRef = gqlSchemaBuilder.objectRef<GroupClassAuditReturnType>("GroupClassAudit");

export const GroupClassAuditPothosObject = GroupClassAuditRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    className: t.exposeString("className"),
    courseCode: t.exposeString("courseCode"),
    teacherName: t.exposeString("teacherName"),
    originalDate: t.exposeString("originalDate", { nullable: true }),
    rescheduledDate: t.exposeString("rescheduledDate", { nullable: true }),
    timeSlot: t.exposeString("timeSlot"),
    venue: t.exposeString("venue"),
    status: t.expose("status", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    isFrozen: t.exposeBoolean("isFrozen"),
    auditRemark: t.exposeString("auditRemark", { nullable: true }),
    auditLoggedAt: t.exposeString("auditLoggedAt"),
    registeredStudentCount: t.exposeInt("registeredStudentCount"),
    totalStudentCount: t.exposeInt("totalStudentCount"),
    students: t.field({
      type: [GroupClassStudentRef],
      resolve: parent => parent.students,
    }),
    meetingInfo: t.field({
      type: OnlineMeetingInfoRef,
      resolve: parent => parent.meetingInfo,
    }),
    communications: t.field({
      type: [CommunicationLogEntryRef],
      resolve: parent => parent.communications,
    }),
    adminNote: t.field({
      type: AdminNoteRef,
      resolve: parent => parent.adminNote,
    }),
    isOneOnOne: t.exposeBoolean("isOneOnOne"),
  }),
});
