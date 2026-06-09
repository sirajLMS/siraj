import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, r => ({
  users: {
    sessions: r.many.sessions({
      from: r.users.id,
      to: r.sessions.userId,
    }),
    userPermissionGroups: r.many.userPermissionGroups({
      from: r.users.id,
      to: r.userPermissionGroups.userId,
    }),
    permissionGroups: r.many.permissionGroups({
      from: r.users.id.through(r.userPermissionGroups.userId),
      to: r.permissionGroups.id.through(r.userPermissionGroups.groupId),
    }),
    teacher: r.one.teachers({
      from: r.users.id,
      to: r.teachers.userId,
    }),
    parent: r.one.parents({
      from: r.users.id,
      to: r.parents.userId,
    }),
    staffProfile: r.one.staffProfiles({
      from: r.users.id,
      to: r.staffProfiles.userId,
    }),
    createdPermissionGroups: r.many.permissionGroups({
      from: r.users.id,
      to: r.permissionGroups.createdByUserId,
    }),
    uploadedResources: r.many.learningResources({
      from: r.users.id,
      to: r.learningResources.uploadedByUserId,
    }),
  },
  permissions: {
    groupPermissions: r.many.groupPermissions({
      from: r.permissions.id,
      to: r.groupPermissions.permissionId,
    }),
    permissionGroups: r.many.permissionGroups({
      from: r.permissions.id.through(r.groupPermissions.permissionId),
      to: r.permissionGroups.id.through(r.groupPermissions.groupId),
    }),
  },
  permissionGroups: {
    groupPermissions: r.many.groupPermissions({
      from: r.permissionGroups.id,
      to: r.groupPermissions.groupId,
    }),
    permissions: r.many.permissions({
      from: r.permissionGroups.id.through(r.groupPermissions.groupId),
      to: r.permissions.id.through(r.groupPermissions.permissionId),
    }),
    userPermissionGroups: r.many.userPermissionGroups({
      from: r.permissionGroups.id,
      to: r.userPermissionGroups.groupId,
    }),
    users: r.many.users({
      from: r.permissionGroups.id.through(r.userPermissionGroups.groupId),
      to: r.users.id.through(r.userPermissionGroups.userId),
    }),
    createdBy: r.one.users({
      from: r.permissionGroups.createdByUserId,
      to: r.users.id,
    }),
  },
  groupPermissions: {
    permissionGroup: r.one.permissionGroups({
      from: r.groupPermissions.groupId,
      to: r.permissionGroups.id,
    }),
    permission: r.one.permissions({
      from: r.groupPermissions.permissionId,
      to: r.permissions.id,
    }),
  },
  userPermissionGroups: {
    user: r.one.users({
      from: r.userPermissionGroups.userId,
      to: r.users.id,
    }),
    permissionGroup: r.one.permissionGroups({
      from: r.userPermissionGroups.groupId,
      to: r.permissionGroups.id,
    }),
    assignedBy: r.one.users({
      from: r.userPermissionGroups.assignedByUserId,
      to: r.users.id,
    }),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  teachers: {
    user: r.one.users({
      from: r.teachers.userId,
      to: r.users.id,
    }),
    students: r.many.students({
      from: r.teachers.id,
      to: r.students.primaryTeacherId,
    }),
    recurringSchedules: r.many.recurringSchedules({
      from: r.teachers.id,
      to: r.recurringSchedules.teacherId,
    }),
    classInstances: r.many.classInstances({
      from: r.teachers.id,
      to: r.classInstances.teacherId,
    }),
    leaveQuotaUsage: r.many.leaveQuotaUsage({
      from: r.teachers.id,
      to: r.leaveQuotaUsage.teacherId,
    }),
    bankingDetails: r.many.teacherBankingDetailsHistory({
      from: r.teachers.id,
      to: r.teacherBankingDetailsHistory.teacherId,
    }),
  },
  parents: {
    user: r.one.users({
      from: r.parents.userId,
      to: r.users.id,
    }),
    students: r.many.students({
      from: r.parents.id,
      to: r.students.parentId,
    }),
    invoices: r.many.invoices({
      from: r.parents.id,
      to: r.invoices.parentId,
    }),
    complaints: r.many.complaints({
      from: r.parents.id,
      to: r.complaints.parentId,
    }),
    suggestions: r.many.suggestions({
      from: r.parents.id,
      to: r.suggestions.parentId,
    }),
  },
  staffProfiles: {
    user: r.one.users({
      from: r.staffProfiles.userId,
      to: r.users.id,
    }),
  },
  students: {
    parent: r.one.parents({
      from: r.students.parentId,
      to: r.parents.id,
    }),
    primaryTeacher: r.one.teachers({
      from: r.students.primaryTeacherId,
      to: r.teachers.id,
    }),
    recurringSchedules: r.many.recurringSchedules({
      from: r.students.id,
      to: r.recurringSchedules.studentId,
    }),
    classInstances: r.many.classInstances({
      from: r.students.id,
      to: r.classInstances.studentId,
    }),
    leaveQuotaUsage: r.many.leaveQuotaUsage({
      from: r.students.id,
      to: r.leaveQuotaUsage.studentId,
    }),
    complaints: r.many.complaints({
      from: r.students.id,
      to: r.complaints.studentId,
    }),
    teacherAssignments: r.many.teacherAssignments({
      from: r.students.id,
      to: r.teacherAssignments.studentId,
    }),
  },
  teacherAssignments: {
    student: r.one.students({
      from: r.teacherAssignments.studentId,
      to: r.students.id,
    }),
    teacher: r.one.teachers({
      from: r.teacherAssignments.teacherId,
      to: r.teachers.id,
    }),
    assignedBy: r.one.users({
      from: r.teacherAssignments.assignedByUserId,
      to: r.users.id,
    }),
  },
  recurringSchedules: {
    student: r.one.students({
      from: r.recurringSchedules.studentId,
      to: r.students.id,
    }),
    teacher: r.one.teachers({
      from: r.recurringSchedules.teacherId,
      to: r.teachers.id,
    }),
    days: r.many.recurringScheduleDays({
      from: r.recurringSchedules.id,
      to: r.recurringScheduleDays.recurringScheduleId,
    }),
    classInstances: r.many.classInstances({
      from: r.recurringSchedules.id,
      to: r.classInstances.recurringScheduleId,
    }),
  },
  recurringScheduleDays: {
    recurringSchedule: r.one.recurringSchedules({
      from: r.recurringScheduleDays.recurringScheduleId,
      to: r.recurringSchedules.id,
    }),
  },
  classInstances: {
    student: r.one.students({
      from: r.classInstances.studentId,
      to: r.students.id,
    }),
    teacher: r.one.teachers({
      from: r.classInstances.teacherId,
      to: r.teachers.id,
    }),
    recurringSchedule: r.one.recurringSchedules({
      from: r.classInstances.recurringScheduleId,
      to: r.recurringSchedules.id,
    }),
    originalClass: r.one.classInstances({
      from: r.classInstances.originalClassId,
      to: r.classInstances.id,
    }),
    rescheduledTo: r.many.classInstances({
      from: r.classInstances.id,
      to: r.classInstances.originalClassId,
    }),
    statusEvents: r.many.classStatusEvents({
      from: r.classInstances.id,
      to: r.classStatusEvents.classInstanceId,
    }),
    leaveRequests: r.many.leaveRequests({
      from: r.classInstances.id,
      to: r.leaveRequests.classInstanceId,
    }),
    dstMigrationEntries: r.many.dstMigrationEntries({
      from: r.classInstances.id,
      to: r.dstMigrationEntries.classInstanceId,
    }),
  },
  classStatusEvents: {
    classInstance: r.one.classInstances({
      from: r.classStatusEvents.classInstanceId,
      to: r.classInstances.id,
    }),
    actor: r.one.users({
      from: r.classStatusEvents.actorUserId,
      to: r.users.id,
    }),
  },
  leaveRequests: {
    classInstance: r.one.classInstances({
      from: r.leaveRequests.classInstanceId,
      to: r.classInstances.id,
    }),
    requestedBy: r.one.users({
      from: r.leaveRequests.requestedByUserId,
      to: r.users.id,
    }),
    processedBy: r.one.users({
      from: r.leaveRequests.processedByUserId,
      to: r.users.id,
    }),
  },
  leaveQuotaUsage: {
    teacher: r.one.teachers({
      from: r.leaveQuotaUsage.teacherId,
      to: r.teachers.id,
    }),
    student: r.one.students({
      from: r.leaveQuotaUsage.studentId,
      to: r.students.id,
    }),
  },
  dstMigrationRuns: {
    runBy: r.one.users({
      from: r.dstMigrationRuns.runByUserId,
      to: r.users.id,
    }),
    entries: r.many.dstMigrationEntries({
      from: r.dstMigrationRuns.id,
      to: r.dstMigrationEntries.runId,
    }),
  },
  dstMigrationEntries: {
    run: r.one.dstMigrationRuns({
      from: r.dstMigrationEntries.runId,
      to: r.dstMigrationRuns.id,
    }),
    classInstance: r.one.classInstances({
      from: r.dstMigrationEntries.classInstanceId,
      to: r.classInstances.id,
    }),
  },
  invoices: {
    parent: r.one.parents({
      from: r.invoices.parentId,
      to: r.parents.id,
    }),
    student: r.one.students({
      from: r.invoices.studentId,
      to: r.students.id,
    }),
    createdBy: r.one.users({
      from: r.invoices.createdByUserId,
      to: r.users.id,
    }),
    coverageMonths: r.many.invoiceCoverageMonths({
      from: r.invoices.id,
      to: r.invoiceCoverageMonths.invoiceId,
    }),
  },
  invoiceCoverageMonths: {
    invoice: r.one.invoices({
      from: r.invoiceCoverageMonths.invoiceId,
      to: r.invoices.id,
    }),
  },
  complaints: {
    parent: r.one.parents({
      from: r.complaints.parentId,
      to: r.parents.id,
    }),
    student: r.one.students({
      from: r.complaints.studentId,
      to: r.students.id,
    }),
    responses: r.many.complaintResponses({
      from: r.complaints.id,
      to: r.complaintResponses.complaintId,
    }),
  },
  complaintResponses: {
    complaint: r.one.complaints({
      from: r.complaintResponses.complaintId,
      to: r.complaints.id,
    }),
    responder: r.one.users({
      from: r.complaintResponses.responderUserId,
      to: r.users.id,
    }),
  },
  suggestions: {
    parent: r.one.parents({
      from: r.suggestions.parentId,
      to: r.parents.id,
    }),
  },
  learningResources: {
    uploadedBy: r.one.users({
      from: r.learningResources.uploadedByUserId,
      to: r.users.id,
    }),
  },
  systemSettings: {
    updatedBy: r.one.users({
      from: r.systemSettings.updatedByUserId,
      to: r.users.id,
    }),
  },
  siteContent: {
    updatedBy: r.one.users({
      from: r.siteContent.updatedByUserId,
      to: r.users.id,
    }),
  },
  teacherBankingDetailsHistory: {
    teacher: r.one.teachers({
      from: r.teacherBankingDetailsHistory.teacherId,
      to: r.teachers.id,
    }),
  },
  adminAuditLogs: {
    actor: r.one.users({
      from: r.adminAuditLogs.actorUserId,
      to: r.users.id,
    }),
    target: r.one.users({
      from: r.adminAuditLogs.targetUserId,
      to: r.users.id,
    }),
  },
}));
