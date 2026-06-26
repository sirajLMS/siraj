import type { DayScheduleConfig as BaseDayScheduleConfig } from "@/frontend/stores/recurring-schedule-types";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type DayScheduleConfig = BaseDayScheduleConfig<DayOfWeek>;

export const DEFAULT_DAY_SCHEDULE: readonly DayScheduleConfig[] = [
  { day: "monday", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "tuesday", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "wednesday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "thursday", enabled: true, timeOverride: "13:30", showOverride: true, isWeekend: false },
  { day: "friday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "saturday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
  { day: "sunday", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
];

export interface StudentGroup {
  readonly id: string;
  readonly name: string;
}
