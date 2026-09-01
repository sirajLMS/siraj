import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type {
  StudentPortalHistoryLabels,
  StudentPortalHistoryStatusLabels,
} from "@/shared/locale/types/dashboard/studentPortal/studentHistory";

export function mapStudentHistoryStatusToBadge(
  status: string,
  outcome?: string | null
): "completed" | "cancelled" | "pending" | "late" {
  const normalizedStatus = status.toUpperCase();
  const normalizedOutcome = outcome?.toUpperCase() ?? "";

  if (normalizedStatus === "CANCELLED" || normalizedOutcome === "ABSENT") {
    return "cancelled";
  }
  if (normalizedStatus === "LATE" || normalizedOutcome === "LATE") {
    return "late";
  }
  if (normalizedStatus === "PENDING" || normalizedStatus === "SCHEDULED" || normalizedOutcome === "PENDING") {
    return "pending";
  }
  return "completed";
}

export function resolveStudentHistoryStatusLabel(
  row: Pick<StudentHistorySessionRow, "status" | "outcome">,
  labels: StudentPortalHistoryStatusLabels
): string {
  const normalizedStatus = row.status.toUpperCase();
  const normalizedOutcome = row.outcome?.toUpperCase() ?? "";

  if (normalizedStatus === "CANCELLED" || normalizedOutcome === "CANCELLED") {
    return labels.cancelled;
  }
  if (normalizedOutcome === "ABSENT" || normalizedStatus === "ABSENT") {
    return labels.absent;
  }
  if (normalizedOutcome === "LATE" || normalizedStatus === "LATE") {
    return labels.late;
  }
  if (normalizedOutcome === "PRESENT" || normalizedStatus === "PRESENT") {
    return labels.present;
  }
  if (normalizedStatus === "SCHEDULED") {
    return labels.scheduled;
  }
  if (normalizedStatus === "PENDING" || normalizedOutcome === "PENDING") {
    return labels.pending;
  }
  if (normalizedStatus === "COMPLETED" || normalizedOutcome === "TAKEN" || normalizedOutcome === "COMPLETED") {
    return labels.ended;
  }
  return labels.pending;
}

export function formatStudentHistoryDuration(
  minutes: number | null | undefined,
  labels: Pick<StudentPortalHistoryLabels, "minutesShort">
): string {
  if (minutes == null || Number.isNaN(minutes)) {
    return "—";
  }
  return labels.minutesShort(minutes);
}
