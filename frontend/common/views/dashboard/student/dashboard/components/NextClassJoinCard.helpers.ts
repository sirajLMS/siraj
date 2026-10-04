import type { StudentPortalDashboardLabels as StudentDashboardLabels } from "@/shared/locale";

export function formatCountdown(dateString: string | null, labels: StudentDashboardLabels): string | null {
  if (!dateString) return null;
  const start = new Date(dateString).getTime();
  if (Number.isNaN(start)) return null;
  const now = Date.now();
  const diff = start - now;
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes <= 0) return null;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${labels.hoursShort(hours)} ${labels.minutesShort(minutes)}`;
  return labels.minutesShort(minutes);
}
