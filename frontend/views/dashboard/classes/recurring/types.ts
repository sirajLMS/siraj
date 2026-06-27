import type { DayScheduleConfig as BaseDayScheduleConfig } from "@/frontend/stores/recurring-schedule-types";

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export type DayScheduleConfig = BaseDayScheduleConfig<DayOfWeek>;

export const DEFAULT_DAY_SCHEDULE: readonly DayScheduleConfig[] = [
  { day: "MONDAY", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "TUESDAY", enabled: true, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "WEDNESDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "THURSDAY", enabled: true, timeOverride: "13:30", showOverride: true, isWeekend: false },
  { day: "FRIDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: false },
  { day: "SATURDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
  { day: "SUNDAY", enabled: false, timeOverride: "09:00", showOverride: false, isWeekend: true },
];

export interface SimpleEntity {
  readonly id: string;
  readonly name: string;
}

export const CLASS_TYPE_OPTIONS = ["REGULAR", "TRIAL", "ADVANCE"] as const;
export type ClassType = (typeof CLASS_TYPE_OPTIONS)[number];

export const TIMEZONE_OPTIONS = [
  { value: "Africa/Cairo", label: "Africa/Cairo (Cairo)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (Riyadh)" },
  { value: "UTC", label: "UTC" },
] as const;
