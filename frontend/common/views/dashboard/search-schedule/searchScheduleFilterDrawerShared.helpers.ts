import { DayOfWeek, Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

type DayLabelKey = keyof SearchScheduleLabels["day"];

const DAY_OF_WEEK_LABEL_KEY: Record<DayOfWeek, DayLabelKey> = {
  [DayOfWeek.Friday]: "friday",
  [DayOfWeek.Monday]: "monday",
  [DayOfWeek.Saturday]: "saturday",
  [DayOfWeek.Sunday]: "sunday",
  [DayOfWeek.Thursday]: "thursday",
  [DayOfWeek.Tuesday]: "tuesday",
  [DayOfWeek.Wednesday]: "wednesday",
};

const DAY_OF_WEEK_VALUES: readonly string[] = Object.values(DayOfWeek);
const GENDER_VALUES: readonly string[] = Object.values(Gender);

export function isDayOfWeek(value: string): value is DayOfWeek {
  return DAY_OF_WEEK_VALUES.includes(value);
}

export function isGender(value: string): value is Gender {
  return GENDER_VALUES.includes(value);
}

export function getDayLabel(day: DayOfWeek, labels: SearchScheduleLabels): string {
  return labels.day[DAY_OF_WEEK_LABEL_KEY[day]];
}
