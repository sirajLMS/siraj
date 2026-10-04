import type { RelationsBuilderForSchema } from "@/backend/db/drizzleRelations.helpers";

const teacherAvailabilityRelations = (r: RelationsBuilderForSchema) => ({
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
});

const carryoverRelations = (r: RelationsBuilderForSchema) => ({
  carryoverBalances: {
    teacher: r.one.teachers({
      from: r.carryoverBalances.teacherId,
      to: r.teachers.id,
    }),
    createdByUser: r.one.users({
      from: r.carryoverBalances.createdByUserId,
      to: r.users.id,
    }),
    paidByUser: r.one.users({
      from: r.carryoverBalances.paidByUserId,
      to: r.users.id,
    }),
    items: r.many.carryoverBalanceItems({
      from: r.carryoverBalances.id,
      to: r.carryoverBalanceItems.carryoverId,
    }),
    classInstances: r.many.classInstances({
      from: r.carryoverBalances.id,
      to: r.classInstances.carryoverBalanceId,
    }),
  },
  carryoverBalanceItems: {
    carryover: r.one.carryoverBalances({
      from: r.carryoverBalanceItems.carryoverId,
      to: r.carryoverBalances.id,
    }),
    classInstance: r.one.classInstances({
      from: r.carryoverBalanceItems.classInstanceId,
      to: r.classInstances.id,
    }),
  },
});

const cronRelations = (r: RelationsBuilderForSchema) => ({
  cronSchedules: {
    createdBy: r.one.users({
      from: r.cronSchedules.createdByUserId,
      to: r.users.id,
    }),
    updatedBy: r.one.users({
      from: r.cronSchedules.updatedByUserId,
      to: r.users.id,
    }),
    runs: r.many.cronRuns({
      from: r.cronSchedules.id,
      to: r.cronRuns.scheduleId,
    }),
  },
  cronRuns: {
    schedule: r.one.cronSchedules({
      from: r.cronRuns.scheduleId,
      to: r.cronSchedules.id,
    }),
    heartbeats: r.many.cronHeartbeats({
      from: r.cronRuns.id,
      to: r.cronHeartbeats.runId,
    }),
  },
  cronHeartbeats: {
    run: r.one.cronRuns({
      from: r.cronHeartbeats.runId,
      to: r.cronRuns.id,
    }),
  },
});

export const operationsRelations = (r: RelationsBuilderForSchema) => ({
  ...teacherAvailabilityRelations(r),
  ...carryoverRelations(r),
  ...cronRelations(r),
});
