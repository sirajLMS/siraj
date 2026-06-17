import type { StatusBadgeCategory } from "@/frontend/components/ui/StatusBadge";
import type { TeacherSessionStatus } from "@/frontend/stores/mockTeacherDashboardTypes";

export function resolveTeacherStatusBadge(status: TeacherSessionStatus): {
  category: StatusBadgeCategory;
  status: string;
  labelKey: keyof TeacherStatusLabelKeys;
} {
  if (status === "missed") {
    return { category: "classSession", status: "missed", labelKey: "missed" };
  }
  if (status === "active" || status === "activated") {
    const labelKey = status === "activated" ? "activated" : "active";
    return { category: "classSession", status: "active", labelKey };
  }
  if (status === "upcoming") {
    return { category: "classSession", status: "upcoming", labelKey: "upcoming" };
  }
  if (status === "pending") {
    return { category: "classStatus", status: "pending", labelKey: "pending" };
  }
  if (status === "connecting") {
    return { category: "classStatus", status: "in_progress", labelKey: "connecting" };
  }
  return { category: "classStatus", status: "completed", labelKey: "completed" };
}

export interface TeacherStatusLabelKeys {
  readonly missed: string;
  readonly pending: string;
  readonly upcoming: string;
  readonly completed: string;
  readonly active: string;
  readonly connecting: string;
  readonly activated: string;
}

export function getStatusLabel(status: TeacherSessionStatus, labels: TeacherStatusLabelKeys): string {
  const resolved = resolveTeacherStatusBadge(status);
  return labels[resolved.labelKey];
}
