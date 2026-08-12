import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export function formatDateTime(locale: string, dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getLatnLocaleTag(locale), { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function formatTime(locale: string, dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(getLatnLocaleTag(locale), { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}
