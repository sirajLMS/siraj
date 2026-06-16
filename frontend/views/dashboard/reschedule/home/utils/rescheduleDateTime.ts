import { addDays, addHours, addWeeks, format, isValid, parse } from "date-fns";

export const RESCHEDULE_DATE_FORMAT = "yyyy-MM-dd";
export const RESCHEDULE_TIME_FORMAT = "HH:mm";

export function parseDateValue(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = parse(dateStr, RESCHEDULE_DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, RESCHEDULE_TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function combineDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const parsed = parse(`${dateStr} ${timeStr}`, `${RESCHEDULE_DATE_FORMAT} ${RESCHEDULE_TIME_FORMAT}`, new Date());
  return isValid(parsed) ? parsed : null;
}

export function toDateString(date: Date): string {
  return format(date, RESCHEDULE_DATE_FORMAT);
}

export function toTimeString(date: Date): string {
  return format(date, RESCHEDULE_TIME_FORMAT);
}

export function addOneHour(date: Date): Date {
  return addHours(date, 1);
}

export function addOneDay(date: Date): Date {
  return addDays(date, 1);
}

export function addOneWeek(date: Date): Date {
  return addWeeks(date, 1);
}
