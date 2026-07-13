import { format, isValid, parse } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

export function parseFormDate(date: string): Date | null {
  if (date.length === 0) {
    return null;
  }

  const parsedDate = parse(date, DATE_FORMAT, new Date());
  return isValid(parsedDate) ? parsedDate : null;
}

export function formatFormDate(date: Date | null): string {
  if (!date || !isValid(date)) {
    return "";
  }

  return format(date, DATE_FORMAT);
}

export function formatDraftTotal(amount: string, monthCount: number): string {
  const parsedAmount = Number(amount);
  const safeAmount = Number.isNaN(parsedAmount) ? 0 : parsedAmount;
  const multiplier = Math.max(monthCount, 1);
  const total = safeAmount * multiplier;

  return total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
