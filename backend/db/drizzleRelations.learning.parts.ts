import type { RelationsBuilderForSchema } from "@/backend/db/drizzleRelations.helpers";

const recurringScheduleRelations = (r: RelationsBuilderForSchema) => ({
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
    quota: r.one.quotas({
      from: r.recurringSchedules.quotaId,
      to: r.quotas.id,
    }),
  },
  recurringScheduleDays: {
    recurringSchedule: r.one.recurringSchedules({
      from: r.recurringScheduleDays.recurringScheduleId,
      to: r.recurringSchedules.id,
    }),
  },
});

const classInstanceRelations = (r: RelationsBuilderForSchema) => ({
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
    payrollCalculatedByUser: r.one.users({
      from: r.classInstances.payrollCalculatedBy,
      to: r.users.id,
    }),
    carryoverBalance: r.one.carryoverBalances({
      from: r.classInstances.carryoverBalanceId,
      to: r.carryoverBalances.id,
    }),
  },
});

const lessonRelations = (r: RelationsBuilderForSchema) => ({
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
});

const leaveRelations = (r: RelationsBuilderForSchema) => ({
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
});

const dstMigrationRelations = (r: RelationsBuilderForSchema) => ({
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
});

export const learningRelations = (r: RelationsBuilderForSchema) => ({
  ...recurringScheduleRelations(r),
  ...classInstanceRelations(r),
  ...lessonRelations(r),
  ...leaveRelations(r),
  ...dstMigrationRelations(r),
});
