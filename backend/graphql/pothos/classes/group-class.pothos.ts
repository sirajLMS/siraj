import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SupportRequestResultPothosObject } from "@/backend/graphql/pothos/classes/class-session.pothos";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  GroupClassAttendanceStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuthWithRateLimit } from "@/backend/graphql/shared";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { GroupClassService } from "@/backend/services";
import type {
  GroupClassAdminNoteReturnType,
  GroupClassAuditReturnType,
  GroupClassCommunicationLogEntryReturnType,
  GroupClassOnlineMeetingInfoReturnType,
  GroupClassStudentReturnType,
} from "@/backend/types";

const GroupClassStudentRef = gqlSchemaBuilder.objectRef<GroupClassStudentReturnType>("GroupClassStudent");

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

const OnlineMeetingInfoRef = gqlSchemaBuilder.objectRef<GroupClassOnlineMeetingInfoReturnType>("OnlineMeetingInfo");

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

const CommunicationLogEntryRef =
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

const AdminNoteRef = gqlSchemaBuilder.objectRef<GroupClassAdminNoteReturnType>("AdminNoteInfo");

export const AdminNotePothosObject = AdminNoteRef.implement({
  fields: t => ({
    content: t.exposeString("content"),
    lastUpdated: t.exposeString("lastUpdated"),
  }),
});

const GroupClassAuditRef = gqlSchemaBuilder.objectRef<GroupClassAuditReturnType>("GroupClassAudit");

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
  }),
});

gqlSchemaBuilder.queryField("groupClassAudit", t =>
  t.field({
    type: GroupClassAuditRef,
    authScopes: { superAdmin: true },
    args: {
      classInstanceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return GroupClassService.getGroupClassAudit(userId, args.classInstanceId, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("updateClassAdminNote", t =>
  t.field({
    type: GroupClassAuditRef,
    authScopes: { superAdmin: true },
    args: {
      classInstanceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      content: t.arg.string({ required: true, directives: { constraint: { maxLength: 10000 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return GroupClassService.updateAdminNote(userId, args.classInstanceId, args.content, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("resendClassNotifications", t =>
  t.field({
    type: SupportRequestResultPothosObject,
    authScopes: { superAdmin: true },
    args: {
      classInstanceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { userId, tErrors } = await requireAuthWithRateLimit(ctx);
      return GroupClassService.resendNotifications(userId, args.classInstanceId, tErrors);
    },
  })
);
