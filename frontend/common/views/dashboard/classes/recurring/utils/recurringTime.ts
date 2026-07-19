// NEW FOR PLAN v5: recurring HH:mm time helpers, lifted out of tier files
// (was duplicated in dayScheduleRow + timeInput mobile/desktop). date-fns imports banned in tier.
import { format, isValid, parse } from "date-fns";

export const RECURRING_TIME_FORMAT = "HH:mm";

export function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, RECURRING_TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function formatTimeValue(date: Date | null): string {
  return date && isValid(date) ? format(date, RECURRING_TIME_FORMAT) : "";
}
