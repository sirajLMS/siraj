import {
  type TeacherDashboardQuery_teacherDashboard_progressFeed,
  TeacherProgressFeedEventKind,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentProgressFeedItem } from "@/frontend/common/types/shared.types";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

type ProgressFeedEventLabelKey = keyof TeacherDashboardLabels["progressFeed"]["events"];

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

function resolveProgressFeedEventKind(
  eventKind: TeacherProgressFeedEventKind | null | undefined
): TeacherProgressFeedEventKind {
  return eventKind ?? TeacherProgressFeedEventKind.Other;
}

function progressFeedEventLabelKey(eventKind: TeacherProgressFeedEventKind): ProgressFeedEventLabelKey {
  switch (eventKind) {
    case TeacherProgressFeedEventKind.AutoMissed:
      return "auto_missed";
    case TeacherProgressFeedEventKind.MarkedAbsent:
      return "marked_absent";
    case TeacherProgressFeedEventKind.Activated:
      return "activated";
    case TeacherProgressFeedEventKind.Started:
      return "started";
    case TeacherProgressFeedEventKind.Completed:
      return "completed";
    case TeacherProgressFeedEventKind.Leave:
      return "leave";
    case TeacherProgressFeedEventKind.Other:
      return "other";
    default: {
      const exhaustiveCheck: never = eventKind;
      return exhaustiveCheck;
    }
  }
}

function formatFeedSummary(
  item: TeacherDashboardQuery_teacherDashboard_progressFeed,
  labels: TeacherDashboardLabels["progressFeed"],
  durationTemplate: (minutes: number) => string
): string {
  const eventKind = resolveProgressFeedEventKind(item.eventKind);
  const eventLabel = labels.events[progressFeedEventLabelKey(eventKind)];
  const parts = [eventLabel];

  if (item.scheduledTimeFormatted) {
    parts.push(item.scheduledTimeFormatted);
  }
  if (item.durationMinutes) {
    parts.push(durationTemplate(item.durationMinutes));
  }

  return parts.join(" · ");
}

export function buildStudentProgressFeedItems(
  feed: readonly TeacherDashboardQuery_teacherDashboard_progressFeed[] | null | undefined,
  labels: TeacherDashboardLabels["progressFeed"],
  durationTemplate: (minutes: number) => string,
  formatRelativeTime: (value: Date) => string
): StudentProgressFeedItem[] {
  return (feed ?? []).map(item => {
    const studentName = item.studentName?.trim() ?? "Student";
    const eventKind = resolveProgressFeedEventKind(item.eventKind);
    const occurredAt = item.occurredAt ? new Date(item.occurredAt) : new Date();

    return {
      id: item.id ?? "",
      studentId: item.studentId ?? "",
      studentName,
      studentInitials: toStudentInitials(studentName),
      summary: formatFeedSummary(item, labels, durationTemplate),
      scheduledTime: item.scheduledTimeFormatted ?? null,
      durationMinutes: item.durationMinutes ?? null,
      eventKind,
      occurredAt,
      timeAgo: formatRelativeTime(occurredAt),
      infoTooltip: eventKind === TeacherProgressFeedEventKind.AutoMissed ? labels.autoMissedTooltip : null,
    };
  });
}
