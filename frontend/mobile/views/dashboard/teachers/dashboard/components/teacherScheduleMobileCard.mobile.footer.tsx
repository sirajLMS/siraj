"use client";

import { Box } from "@mui/material";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { renderFooterAction } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.actions";
import type { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

function VideoButton({
  row,
  labels,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
}) {
  return (
    <MobileMeetingJoinAction
      variant="icon"
      joinUrl={row.meetingJoinUrl}
      meeting={row.effectiveMeeting}
      disabled={!row.videoEnabled}
      label={labels.actions.joinVideo}
      emptyRole="teacher"
      setupHref="/profile?tab=meeting"
    />
  );
}

export function CardFooter({
  row,
  labels,
  canActivate,
  sessionActions,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly sessionActions: ReturnType<typeof resolveTeacherScheduleSessionActions>;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {renderFooterAction(row, labels, canActivate, onActivate, onStartSession, onMarkAbsent, onRequestLeave)}
      </Box>
      {sessionActions.joinVideo ? <VideoButton row={row} labels={labels} /> : null}
    </Box>
  );
}
