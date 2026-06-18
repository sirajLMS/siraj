"use client";

import { StatusBadge } from "@/frontend/components/ui";
import type { TeacherScheduleRow } from "@/frontend/stores/mockTeacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";
import { getStatusLabel, resolveTeacherStatusBadge } from "../utils/sessionStatusUtils";
import { SessionActivateButton } from "./SessionActivateButton";

export function TeacherScheduleStatusContent({
  row,
  labels,
  canActivate,
  onActivate,
}: Readonly<{
  row: TeacherScheduleRow;
  labels: TeacherDashboardLabels;
  canActivate: boolean;
  onActivate?: (id: string) => void;
}>) {
  if (canActivate && (row.status === "pending" || row.status === "connecting")) {
    return (
      <SessionActivateButton
        disabled={!row.activateEnabled}
        isConnecting={row.status === "connecting"}
        activateLabel={labels.actions.activate}
        connectingLabel={labels.actions.connecting}
        onActivate={() => onActivate?.(row.id)}
      />
    );
  }

  const badge = resolveTeacherStatusBadge(row.status);
  return (
    <StatusBadge
      category={badge.category}
      status={badge.status}
      label={getStatusLabel(row.status, labels.status)}
      size="small"
    />
  );
}
