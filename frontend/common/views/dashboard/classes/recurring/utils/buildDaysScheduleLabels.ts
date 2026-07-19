// NEW FOR PLAN v5: extract the DaysScheduleSection label slice used by both tier
// DaysScheduleSection twins. The previous tier files inlined a `Pick<
//   CreateRecurringClassLabels,
//   "daysSelection"|"classSchedule"|"timeOverride"|"days"
// >` label type twice — type and slice are now unified.
import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";

export type DaysScheduleLabels = Pick<
  RecurringClassFormLabels,
  "daysSelection" | "classSchedule" | "timeOverride" | "days"
>;

export function buildDaysScheduleLabels(labels: RecurringClassFormLabels): DaysScheduleLabels {
  return {
    daysSelection: labels.daysSelection,
    classSchedule: labels.classSchedule,
    timeOverride: labels.timeOverride,
    days: labels.days,
  };
}
