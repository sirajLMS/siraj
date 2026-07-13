import { defineRelations } from "drizzle-orm";
import * as schema from "@/backend/db/schema";

export const relations = defineRelations(schema, r => ({
  users: {
    sessions: r.many.sessions({
      from: r.users.id,
      to: r.sessions.userId,
    }),
    userPaymentMethods: r.many.userPaymentMethods({
      from: r.users.id,
      to: r.userPaymentMethods.userId,
    }),
    verifiedPaymentMethods: r.many.userPaymentMethods({
      from: r.users.id,
      to: r.userPaymentMethods.verifiedByUserId,
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
    reviewedSuggestions: r.many.suggestions({
      from: r.users.id,
      to: r.suggestions.reviewedByUserId,
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
    payments: r.many.teacherPayments({
      from: r.teachers.id,
      to: r.teacherPayments.teacherId,
    }),
    dues: r.many.teacherDues({
      from: r.teachers.id,
      to: r.teacherDues.teacherId,
    }),
    availabilityWindows: r.many.teacherAvailabilityWindows({
      from: r.teachers.id,
      to: r.teacherAvailabilityWindows.teacherId,
    }),
    recurringUnavailability: r.many.teacherRecurringUnavailability({
      from: r.teachers.id,
      to: r.teacherRecurringUnavailability.teacherId,
    }),
    vacationRequests: r.many.teacherVacationRequests({
      from: r.teachers.id,
      to: r.teacherVacationRequests.teacherId,
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
    progressLogs: r.many.studentProgress({
      from: r.students.id,
      to: r.studentProgress.studentId,
    }),
    creditTransactions: r.many.creditTransactions({
      from: r.students.id,
      to: r.creditTransactions.studentId,
    }),
  },
  creditTransactions: {
    student: r.one.students({
      from: r.creditTransactions.studentId,
      to: r.students.id,
    }),
    classInstance: r.one.classInstances({
      from: r.creditTransactions.classInstanceId,
      to: r.classInstances.id,
    }),
    creditedBy: r.one.users({
      from: r.creditTransactions.creditedByUserId,
      to: r.users.id,
    }),
    sourcePayment: r.one.payments({
      from: r.creditTransactions.sourcePaymentId,
      to: r.payments.id,
    }),
  },
  studentProgress: {
    student: r.one.students({
      from: r.studentProgress.studentId,
      to: r.students.id,
    }),
    classInstance: r.one.classInstances({
      from: r.studentProgress.classInstanceId,
      to: r.classInstances.id,
    }),
    teacher: r.one.teachers({
      from: r.studentProgress.teacherId,
      to: r.teachers.id,
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
    dstMigrationEntries: r.many.dstMigrationEntries({
      from: r.recurringSchedules.id,
      to: r.dstMigrationEntries.recurringScheduleId,
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
    performance: r.one.classInstancePerformance({
      from: r.classInstances.id,
      to: r.classInstancePerformance.classInstanceId,
    }),
    teacherDue: r.one.teacherDues({
      from: r.classInstances.id,
      to: r.teacherDues.classInstanceId,
    }),
    lessonReport: r.one.lessonReports({
      from: r.classInstances.id,
      to: r.lessonReports.classInstanceId,
    }),
    creditTransactions: r.many.creditTransactions({
      from: r.classInstances.id,
      to: r.creditTransactions.classInstanceId,
    }),
  },
  lessonReports: {
    classInstance: r.one.classInstances({
      from: r.lessonReports.classInstanceId,
      to: r.classInstances.id,
    }),
    student: r.one.students({
      from: r.lessonReports.studentId,
      to: r.students.id,
    }),
    teacher: r.one.teachers({
      from: r.lessonReports.teacherId,
      to: r.teachers.id,
    }),
    submittedBy: r.one.users({
      from: r.lessonReports.submittedByUserId,
      to: r.users.id,
    }),
    reviewedBy: r.one.users({
      from: r.lessonReports.reviewedByUserId,
      to: r.users.id,
    }),
  },
  classInstancePerformance: {
    classInstance: r.one.classInstances({
      from: r.classInstancePerformance.classInstanceId,
      to: r.classInstances.id,
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
    recurringSchedule: r.one.recurringSchedules({
      from: r.dstMigrationEntries.recurringScheduleId,
      to: r.recurringSchedules.id,
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
    payments: r.many.payments({
      from: r.invoices.id,
      to: r.payments.invoiceId,
    }),
  },
  invoiceCoverageMonths: {
    invoice: r.one.invoices({
      from: r.invoiceCoverageMonths.invoiceId,
      to: r.invoices.id,
    }),
  },
  payments: {
    invoice: r.one.invoices({
      from: r.payments.invoiceId,
      to: r.invoices.id,
    }),
    userPaymentMethod: r.one.userPaymentMethods({
      from: r.payments.userPaymentMethodId,
      to: r.userPaymentMethods.id,
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
    duplicateOf: r.one.suggestions({
      from: r.suggestions.duplicateOfId,
      to: r.suggestions.id,
    }),
    duplicates: r.many.suggestions({
      from: r.suggestions.id,
      to: r.suggestions.duplicateOfId,
    }),
    reviewedBy: r.one.users({
      from: r.suggestions.reviewedByUserId,
      to: r.users.id,
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
  teacherPayments: {
    teacher: r.one.teachers({
      from: r.teacherPayments.teacherId,
      to: r.teachers.id,
    }),
    userPaymentMethod: r.one.userPaymentMethods({
      from: r.teacherPayments.userPaymentMethodId,
      to: r.userPaymentMethods.id,
    }),
  },
  teacherDues: {
    teacher: r.one.teachers({
      from: r.teacherDues.teacherId,
      to: r.teachers.id,
    }),
    classInstance: r.one.classInstances({
      from: r.teacherDues.classInstanceId,
      to: r.classInstances.id,
    }),
    student: r.one.students({
      from: r.teacherDues.studentId,
      to: r.students.id,
    }),
    approvedBy: r.one.users({
      from: r.teacherDues.approvedByUserId,
      to: r.users.id,
    }),
    teacherPayment: r.one.teacherPayments({
      from: r.teacherDues.teacherPaymentId,
      to: r.teacherPayments.id,
    }),
  },
  teacherAvailabilityWindows: {
    teacher: r.one.teachers({
      from: r.teacherAvailabilityWindows.teacherId,
      to: r.teachers.id,
    }),
  },
  teacherRecurringUnavailability: {
    teacher: r.one.teachers({
      from: r.teacherRecurringUnavailability.teacherId,
      to: r.teachers.id,
    }),
  },
  teacherVacationRequests: {
    teacher: r.one.teachers({
      from: r.teacherVacationRequests.teacherId,
      to: r.teachers.id,
    }),
    requestedBy: r.one.users({
      from: r.teacherVacationRequests.requestedByUserId,
      to: r.users.id,
    }),
    processedBy: r.one.users({
      from: r.teacherVacationRequests.processedByUserId,
      to: r.users.id,
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
  currencyExchangeAuditLogs: {
    changedBy: r.one.users({
      from: r.currencyExchangeAuditLogs.changedByUserId,
      to: r.users.id,
    }),
  },
  userPaymentMethods: {
    user: r.one.users({
      from: r.userPaymentMethods.userId,
      to: r.users.id,
    }),
    verifiedBy: r.one.users({
      from: r.userPaymentMethods.verifiedByUserId,
      to: r.users.id,
    }),
    payments: r.many.payments({
      from: r.userPaymentMethods.id,
      to: r.payments.userPaymentMethodId,
    }),
    teacherPayments: r.many.teacherPayments({
      from: r.userPaymentMethods.id,
      to: r.teacherPayments.userPaymentMethodId,
    }),
  },
}));
