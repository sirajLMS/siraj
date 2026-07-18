// NEW FOR PLAN v5: DAY_LABEL_KEY_MAP lifted out of tier DaysScheduleSection twins
// (was duplicated byte-identically in daysScheduleSection.{mobile,desktop}.tsx).
import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CreateRecurringClassLabels } from "@/shared/locale";

export type DayLabelKey = keyof CreateRecurringClassLabels["days"];

const DAY_LABEL_KEY_MAP: Record<DayOfWeek, DayLabelKey> = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
};

export function resolveDayLabelKey(day: DayOfWeek): DayLabelKey | null {
  return DAY_LABEL_KEY_MAP[day] ?? null;
}
