import { DayOfWeek } from "@/backend/enum";
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
  [
    { dayOfWeek: DayOfWeek.SATURDAY, startTime: "09:00:00" },
    { dayOfWeek: DayOfWeek.SUNDAY, startTime: "11:00:00" },
  ],
];

const SCHEDULE_DURATIONS = [30, 45, 60] as const;
const SCHEDULE_START_TIMES = ["08:00:00", "10:00:00", "14:00:00", "16:00:00"] as const;

export function buildScheduleDaysForStudent(config: SeedConfig, studentIndex: number): ScheduleDaySpec[] {
  const pattern = SCHEDULE_PATTERNS[studentIndex % SCHEDULE_PATTERNS.length];
  if (config.daysPerWeek <= 2) {
    return pattern.slice(0, 2);
  }
  return pattern;
}

export function pickScheduleDurationMinutes(studentIndex: number): number {
  return SCHEDULE_DURATIONS[studentIndex % SCHEDULE_DURATIONS.length];
}

export function pickScheduleDefaultStartTime(studentIndex: number): string {
  return SCHEDULE_START_TIMES[studentIndex % SCHEDULE_START_TIMES.length];
}

/** One inactive day per schedule (when it has 2+ days) for UI coverage of isActive toggles. */
export function isScheduleDayActive(studentIndex: number, dayIndex: number): boolean {
  return (studentIndex + dayIndex) % 5 !== 0;
}

export function parseTimeToHoursMinutes(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}
