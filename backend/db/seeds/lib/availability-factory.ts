import { DayOfWeek } from "@/backend/enum";
import { formatDateKey, getDateWindow } from "./date-window";
import type { SeedConfig } from "./seed-config";

export interface AvailabilityWindowSpec {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

const WEEKDAY_POOL = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export function buildTeacherAvailabilityWindows(_teacherIndex: number): AvailabilityWindowSpec[] {
  return WEEKDAY_POOL.map((day, i) => ({
    dayOfWeek: day,
    startTime: i % 2 === 0 ? "08:00:00" : "09:00:00",
    endTime: "20:00:00",
  }));
}

export function shouldSeedLunchBlock(teacherIndex: number): boolean {
  return teacherIndex % 3 === 0;
}

export function buildLunchUnavailability(): AvailabilityWindowSpec {
  return {
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "12:00:00",
    endTime: "13:00:00",
  };
}

export function getAvailabilityEffectiveRange(config: SeedConfig): { from: string; until: string } {
  const { start, end } = getDateWindow(config.anchorDate, config.monthsBefore, config.monthsAfter);
  return { from: formatDateKey(start), until: formatDateKey(end) };
}
