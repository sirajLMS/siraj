import type { StudentProgressFeedItem, TeacherProgressFeedEventKind } from "@/frontend/common/types/shared.types";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface RawProgressFeedItem {
  readonly id?: string | null;
  readonly studentId?: string | null;
  readonly studentName?: string | null;
  readonly scheduledTimeFormatted?: string | null;
  readonly durationMinutes?: number | null;
  readonly eventKind?: string | null;
  readonly occurredAt?: string | Date | null;
}

function toStudentInitials(studentName: string): string {
  const parts = studentName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "ST";
  }
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatFeedSummary(
  item: RawProgressFeedItem,
  labels: TeacherDashboardLabels["progressFeed"],
  durationTemplate: string
): string {
  const eventKind = (item.eventKind ?? "other") as TeacherProgressFeedEventKind;
  const eventLabel = labels.events[eventKind] ?? labels.events.other;
  const parts = [eventLabel];

  if (item.scheduledTimeFormatted) {
    parts.push(item.scheduledTimeFormatted);
  }
  if (item.durationMinutes) {
    parts.push(durationTemplate.replace("{minutes}", String(item.durationMinutes)));
  }

  return parts.join(" · ");
}

export function buildStudentProgressFeedItems(
  feed: readonly RawProgressFeedItem[] | null | undefined,
  labels: TeacherDashboardLabels["progressFeed"],
  durationTemplate: string,
  formatRelativeTime: (value: Date) => string
): StudentProgressFeedItem[] {
  return (feed ?? []).map(item => {
    const studentName = item.studentName?.trim() || "Student";
    const eventKind = (item.eventKind ?? "other") as TeacherProgressFeedEventKind;
    const occurredAt = item.occurredAt ? new Date(item.occurredAt) : new Date();

    return {
      id: item.id || "",
      studentId: item.studentId || "",
      studentName,
      studentInitials: toStudentInitials(studentName),
      summary: formatFeedSummary(item, labels, durationTemplate),
      scheduledTime: item.scheduledTimeFormatted ?? null,
      durationMinutes: item.durationMinutes ?? null,
      eventKind,
      occurredAt,
      timeAgo: formatRelativeTime(occurredAt),
      infoTooltip: eventKind === "auto_missed" ? labels.autoMissedTooltip : null,
    };
  });
}
