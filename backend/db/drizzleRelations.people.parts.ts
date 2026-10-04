import type { RelationsBuilderForSchema } from "@/backend/db/drizzleRelations.helpers";

const teacherRelations = (r: RelationsBuilderForSchema) => ({
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
});

const parentRelations = (r: RelationsBuilderForSchema) => ({
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
});

const studentRelations = (r: RelationsBuilderForSchema) => ({
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
});

const studentAccountRelations = (r: RelationsBuilderForSchema) => ({
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
    carryoverTeacher: r.one.teachers({
      from: r.creditTransactions.carryoverTeacherId,
      to: r.teachers.id,
    }),
  },
  quotas: {
    student: r.one.students({
      from: r.quotas.studentId,
      to: r.students.id,
    }),
    ledgerEntries: r.many.quotaLedger({
      from: r.quotas.id,
      to: r.quotaLedger.quotaId,
    }),
    recurringSchedules: r.many.recurringSchedules({
      from: r.quotas.id,
      to: r.recurringSchedules.quotaId,
    }),
  },
  quotaLedger: {
    quota: r.one.quotas({
      from: r.quotaLedger.quotaId,
      to: r.quotas.id,
    }),
    student: r.one.students({
      from: r.quotaLedger.studentId,
      to: r.students.id,
    }),
    recurringSchedule: r.one.recurringSchedules({
      from: r.quotaLedger.recurringScheduleId,
      to: r.recurringSchedules.id,
    }),
    classInstance: r.one.classInstances({
      from: r.quotaLedger.classInstanceId,
      to: r.classInstances.id,
    }),
    actorUser: r.one.users({
      from: r.quotaLedger.actorUserId,
      to: r.users.id,
    }),
  },
});

const studentAssignmentRelations = (r: RelationsBuilderForSchema) => ({
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
});

export const peopleRelations = (r: RelationsBuilderForSchema) => ({
  ...teacherRelations(r),
  ...parentRelations(r),
  ...studentRelations(r),
  ...studentAccountRelations(r),
  ...studentAssignmentRelations(r),
});
