import * as ClassInstances from "@/backend/db/repo/scheduling/class-instances";
import * as Queries from "@/backend/db/repo/scheduling/queries";
import * as Recurring from "@/backend/db/repo/scheduling/recurring";
import { findUpcomingInstances } from "@/backend/db/repo/scheduling/scheduling-queries.repository.findUpcoming";
import {
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository.helpers";
import * as StateChanges from "@/backend/db/repo/scheduling/state-changes";

export { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling/class-status-events.repository";
export { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
export type {
  ClassInstanceAffectedUsers,
  ClassInstanceWithAffectedUsers,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository.helpers";
export {
  classLifecycleAffectedUserIds,
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository.helpers";
export { findUpcomingInstances };

export const SchedulingRepository = {
  ...ClassInstances,
  ...StateChanges,
  ...Recurring,
  ...Queries,
  findUpcomingInstances,
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
  findUpcomingInstancesByScheduleId: ClassInstances.findUpcomingInstancesByScheduleId,
  hasOverlappingInstance: ClassInstances.hasOverlappingInstance,
  findOverlappingInstancesForRange: ClassInstances.findOverlappingInstancesForRange,
  updateOndemandStatusBatch: ClassInstances.updateOndemandStatusBatch,
};
