import { DayOfWeek, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import type { DayScheduleConfig as BaseDayScheduleConfig } from "@/frontend/stores/recurring-schedule-types";

export type DayScheduleConfig = BaseDayScheduleConfig<DayOfWeek>;

export const DEFAULT_DAY_SCHEDULE: readonly DayScheduleConfig[] = [
  { day: DayOfWeek.Monday, enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Tuesday, enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Wednesday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Thursday, enabled: true, timeOverride: "13:30", showOverride: true, isWeekend: false },
  { day: DayOfWeek.Friday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: DayOfWeek.Saturday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
  { day: DayOfWeek.Sunday, enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
];

export interface SimpleEntity {
  readonly id: string;
  readonly name: string;
}

export const CLASS_TYPE_OPTIONS = ["REGULAR", "TRIAL", "ADVANCE"] as const;
export type ClassType = (typeof CLASS_TYPE_OPTIONS)[number];

export const TIMEZONE_OPTIONS = [
  { value: "Africa/Cairo", label: "Africa/Cairo (Cairo)" },
  { value: IanaTimezone.AsiaRiyadh, label: "Asia/Riyadh (Riyadh)" },
  { value: "UTC", label: "UTC" },
] as const;
