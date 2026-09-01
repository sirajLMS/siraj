import * as ClassInstances from "./class-instances";
import * as Queries from "./queries";
import * as Recurring from "./recurring";
import { findUpcomingInstances } from "./scheduling-queries.repository.findUpcoming";
import {
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
} from "./scheduling-queries.repository.helpers";
import { resolveStudentTimezone } from "./shared";
import * as StateChanges from "./state-changes";

export * from "./class-instance-upsert";
export * from "./class-status-events.repository";
export * from "./leave-quota-usage.repository";
export * from "./leave-request.repository";
export * from "./queries";
export * from "./recurring-schedule.repository";
export * from "./scheduling-queries.repository.findUpcoming";
export type { ClassInstanceAffectedUsers } from "./scheduling-queries.repository.helpers";
export { classLifecycleAffectedUserIds } from "./scheduling-queries.repository.helpers";
export * from "./shared";

export const SchedulingRepository = {
  ...ClassInstances,
  ...StateChanges,
  ...Recurring,
  ...Queries,
  findUpcomingInstances,
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
  resolveStudentTimezone,
  findUpcomingInstancesByScheduleId: ClassInstances.findUpcomingInstancesByScheduleId,
  hasOverlappingInstance: ClassInstances.hasOverlappingInstance,
  findOverlappingInstancesForRange: ClassInstances.findOverlappingInstancesForRange,
  updateOndemandStatusBatch: ClassInstances.updateOndemandStatusBatch,
};
