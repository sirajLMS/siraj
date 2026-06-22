import * as ClassInstances from "./class-instances";
import * as Queries from "./queries";
import * as Recurring from "./recurring";
import * as StateChanges from "./state-changes";

export const SchedulingRepository = {
  ...ClassInstances,
  ...StateChanges,
  ...Recurring,
  ...Queries,
};
