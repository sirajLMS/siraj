"use client";

import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";
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
}: Readonly<TeacherScheduleCardListProps>) {
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
