import { DayOfWeek } from "@/shared/lib/enum";
import type { SeedConfig } from "./seed-config";

export interface ScheduleDaySpec {
  dayOfWeek: DayOfWeek;
  startTime: string;
}

const SCHEDULE_PATTERNS: ScheduleDaySpec[][] = [
  [
    { dayOfWeek: DayOfWeek.MONDAY, startTime: "10:00:00" },
    { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "10:00:00" },
  ],
  [
    { dayOfWeek: DayOfWeek.TUESDAY, startTime: "14:00:00" },
    { dayOfWeek: DayOfWeek.THURSDAY, startTime: "14:00:00" },
  ],
  [
    { dayOfWeek: DayOfWeek.MONDAY, startTime: "16:00:00" },
    { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "16:00:00" },
    { dayOfWeek: DayOfWeek.FRIDAY, startTime: "10:00:00" },
  ],
];

export function buildScheduleDaysForStudent(config: SeedConfig, studentIndex: number): ScheduleDaySpec[] {
  const pattern = SCHEDULE_PATTERNS[studentIndex % SCHEDULE_PATTERNS.length];
  if (config.daysPerWeek <= 2) {
    return pattern.slice(0, 2);
  }
  return pattern;
}

export function parseTimeToHoursMinutes(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}
