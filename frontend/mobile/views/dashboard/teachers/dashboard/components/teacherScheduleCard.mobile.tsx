"use client";

import type { ReactNode } from "react";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { TeacherScheduleMobileCard } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile";

export interface TeacherScheduleMobileCardItemProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}

/**
 * Teacher-schedule card rendered for each row via the `renderItem` callback
 * of `MobileCardList`. Delegates to the existing domain-styled
 * `TeacherScheduleMobileCard`, which already manages its own Paper shell,
 * live/frozen accent border, and completed-row dimming, so the shared list
 * primitive is only used as the surrounding row container.
 */
export function TeacherScheduleCardMobile({
  row,
  labels,
  canActivate,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherScheduleMobileCardItemProps>): ReactNode {
  return (
    <TeacherScheduleMobileCard
      row={row}
      labels={labels}
      canActivate={canActivate}
      onActivate={onActivate}
      onStartSession={onStartSession}
      onMarkAbsent={onMarkAbsent}
      onRequestLeave={onRequestLeave}
    />
  );
}
