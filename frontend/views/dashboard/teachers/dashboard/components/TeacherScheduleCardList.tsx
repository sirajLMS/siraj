"use client";

import { Box, CircularProgress } from "@mui/material";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "@/frontend/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { TeacherScheduleMobileCardList } from "./TeacherScheduleMobileCard";

interface TeacherScheduleCardListProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly canActivate: boolean;
  readonly emptyMessage: string;
  readonly onJoinVideo: (id: string) => void;
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
  onJoinVideo,
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
      onJoinVideo={onJoinVideo}
      onActivate={onActivate}
      onStartSession={onStartSession}
      onMarkAbsent={onMarkAbsent}
      onRequestLeave={onRequestLeave}
    />
  );
}
