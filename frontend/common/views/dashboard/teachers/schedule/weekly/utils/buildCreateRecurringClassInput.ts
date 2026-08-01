// NEW FOR PLAN v5 (newly created for the migration wave): Pure-data input
// builder lifted out of the byte-identical inline declarations in BOTH tier
// files `createRecurringClassDialog.{mobile,desktop}.tsx` per specs.md §3 N9
// (lowercase pure-data helpers belong in `utils/`, not inlined in tier
// files). The previously inline `function buildCreateRecurringClassInput`
// was byte-identical across the two tier files; both now import this single
// shared implementation.

import type {
  ClassType,
  CreateRecurringClassInput,
  OnDemandNoCreditsOutcome,
  SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface BuildCreateRecurringClassInputParams {
  studentId: string;
  teacherId: string;
  subjectId: string;
  duration: number;
  defaultStartTime: string;
  timezone: string;
  classType: ClassType;
  days: readonly DayScheduleConfig[];
  schedulingMode: SchedulingMode | null;
  quotaId: string | null;
  earmarkedClasses: number | null;
  generationHorizonWeeks: number | null;
  ondemandNoCreditsOutcome: OnDemandNoCreditsOutcome | null;
}

// NEW FOR PLAN v5: buildCreateRecurringClassInput — lifts the previously
// inline pure-data builder out of the tier files. The tier now calls this
// helper instead of re-declaring it.
export function buildCreateRecurringClassInput(
  params: BuildCreateRecurringClassInputParams
): CreateRecurringClassInput {
  const {
    studentId,
    teacherId,
    subjectId,
    duration,
    defaultStartTime,
    timezone,
    classType,
    days,
    schedulingMode,
    quotaId,
    earmarkedClasses,
    generationHorizonWeeks,
    ondemandNoCreditsOutcome,
  } = params;
  const activeDays = days.filter(d => d.enabled);
  return {
    studentId,
    teacherId,
    subjectId,
    durationMinutes: Number(duration),
    defaultStartTime,
    timezone: toGraphqlIanaTimezone(timezone),
    classType,
    days: activeDays.map(d => ({
      dayOfWeek: d.day,
      startTime: d.showOverride ? d.timeOverride : defaultStartTime,
      isActive: true,
    })),
    generateInstancesForWeeks: 4,
    effectiveFrom: null,
    effectiveUntil: null,
    hourlyRate: null,
    rateCurrency: null,
    quotaId,
    earmarkedClasses,
    schedulingMode,
    generationHorizonWeeks,
    ondemandNoCreditsOutcome,
  };
}
