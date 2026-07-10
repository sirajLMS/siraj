import * as ClassInstances from "@/backend/db/repo/scheduling/class-instances";
import * as Queries from "@/backend/db/repo/scheduling/queries";
import * as Recurring from "@/backend/db/repo/scheduling/recurring";
import * as StateChanges from "@/backend/db/repo/scheduling/state-changes";

export const SchedulingRepository = {
  ...ClassInstances,
  ...StateChanges,
  ...Recurring,
  ...Queries,
};
