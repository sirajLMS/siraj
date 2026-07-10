import * as ClassInstances from "@/backend/db/repo/scheduling/class-instances";
import { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling/class-status-events.repository";
import * as Queries from "@/backend/db/repo/scheduling/queries";
import * as Recurring from "@/backend/db/repo/scheduling/recurring";
import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import * as StateChanges from "@/backend/db/repo/scheduling/state-changes";

export { ClassStatusEventsRepository, RecurringScheduleRepository };

export const SchedulingRepository = {
  ...ClassInstances,
  ...StateChanges,
  ...Recurring,
  ...Queries,
};
