import { DayOfWeek } from "@/shared/lib/enum";

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function getDateWindow(anchorDate: Date, monthsBefore: number, monthsAfter: number): { start: Date; end: Date } {
  const anchor = startOfDay(anchorDate);
  return {
    start: startOfDay(addMonths(anchor, -monthsBefore)),
    end: startOfDay(addMonths(anchor, monthsAfter)),
  };
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayOfWeekEnum(date: Date): DayOfWeek {
  return JS_DAY_TO_ENUM[date.getDay()];
}

export function* iterateDatesInWindow(start: Date, end: Date): Generator<Date> {
  const current = startOfDay(start);
  const last = startOfDay(end);
  while (current <= last) {
    yield new Date(current);
    current.setDate(current.getDate() + 1);
  }
}

export function createTimestampOnDate(date: Date, hours: number, minutes = 0): Date {
  const d = startOfDay(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function daysBetween(earlier: Date, later: Date): number {
  const a = startOfDay(earlier).getTime();
  const b = startOfDay(later).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
