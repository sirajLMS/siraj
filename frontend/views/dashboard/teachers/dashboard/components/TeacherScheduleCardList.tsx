"use client";

import { Box, CircularProgress } from "@mui/material";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { TeacherScheduleMobileCardList } from "@/frontend/views/dashboard/teachers/dashboard/components/TeacherScheduleMobileCard";
import type { TeacherDashboardViewLabels } from "@/frontend/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface TeacherScheduleCardListProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly emptyMessage: string;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly loading?: boolean;
}

export function TeacherScheduleCardList({
  rows,
  labels,
  canActivate,
  emptyMessage,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  loading = false,
}: Readonly<TeacherScheduleCardListProps>) {
  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <TeacherScheduleMobileCardList
      rows={rows}
      labels={labels}
      canActivate={canActivate}
      emptyMessage={emptyMessage}
      onActivate={onActivate}
      onStartSession={onStartSession}
      onMarkAbsent={onMarkAbsent}
      onRequestLeave={onRequestLeave}
    />
  );
}
