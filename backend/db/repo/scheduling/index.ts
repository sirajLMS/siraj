import * as ClassInstances from "@/backend/db/repo/scheduling/class-instances";
import { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling/class-status-events.repository";
import * as Queries from "@/backend/db/repo/scheduling/queries";
import * as Recurring from "@/backend/db/repo/scheduling/recurring";
import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { findUpcomingInstances } from "@/backend/db/repo/scheduling/scheduling-queries.repository.findUpcoming";
import {
  classLifecycleAffectedUserIds,
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository.helpers";
import * as StateChanges from "@/backend/db/repo/scheduling/state-changes";

export type {
  ClassInstanceAffectedUsers,
  ClassInstanceWithAffectedUsers,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository.helpers";
export {
  ClassStatusEventsRepository,
  classLifecycleAffectedUserIds,
  findUpcomingInstances,
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
  RecurringScheduleRepository,
};

export const SchedulingRepository = {
  ...ClassInstances,
  ...StateChanges,
  ...Recurring,
  ...Queries,
  findUpcomingInstances,
  getClassInstanceAffectedUsers,
  getClassInstanceAffectedUsersForTeacher,
};
