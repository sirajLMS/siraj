"use client";

import { Box } from "@mui/material";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import type { TeacherScheduleSessionActionsCellProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import { SessionActivateButtonDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/sessionActivateButton.desktop";
import { TeacherActiveSessionControlsDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherActiveSessionControls.desktop";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

/**
 * Desktop variant of the schedule-row actions cell, rendered inside the
 * `AppDataGrid` actions column. Imports the desktop-tier sub-controls.
 *
 * Plan v5: per specs.md §3 N3 + §6.4, the `<RequirePermission>` wrappers were
 * lifted to the `TeacherDashboardContainer`; the resulting `has*` booleans are
 * now passed in as props and used to gate the sub-components directly instead
 * of wrapping them in permission components.
 */
export function TeacherScheduleSessionActionsCellDesktop({
  row,
  labels,
  canActivate,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  hasSessionActivateClass,
  hasSessionUpdateStatusStart,
  hasSessionUpdateStatusAbsent,
  hasSessionUpdateStatusLeave,
}: Readonly<TeacherScheduleSessionActionsCellProps>) {
  const actions = resolveTeacherScheduleSessionActions({
    executionState: row.executionState,
    outcome: row.outcome,
    activateEnabled: row.activateEnabled,
    canActivate,
    videoEnabled: row.videoEnabled,
    isConnecting: row.status === "connecting",
    isFrozen: row.isFrozen,
  });

  const tooltips = resolveTeacherScheduleActionTooltips(row, labels, labels.meetingLabels);
  const hasSessionControls = actions.start || actions.markAbsent || actions.requestLeave;
  const activateDisabled = !row.activateEnabled || row.status === "connecting";
  const markAbsentDisabled = row.markAbsentEnabled === false;

  const showActivate = actions.activate && (hasSessionActivateClass ?? true);
  const showSessionControls =
    hasSessionControls &&
    ((hasSessionUpdateStatusStart ?? true) ||
      (hasSessionUpdateStatusAbsent ?? true) ||
      (hasSessionUpdateStatusLeave ?? true));
  if (!showActivate && !showSessionControls && !actions.joinVideo) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      {showActivate ? (
        <SessionActivateButtonDesktop
          disabled={activateDisabled}
          isConnecting={row.status === "connecting"}
          activateLabel={labels.actions.activate}
          connectingLabel={labels.actions.connecting}
          tooltip={tooltips.activate}
          fullWidth={false}
          onActivate={() => onActivate?.(row.id)}
        />
      ) : null}

      {showSessionControls ? (
        <TeacherActiveSessionControlsDesktop
          labels={labels.activeControls}
          showStart={actions.start && (hasSessionUpdateStatusStart ?? true)}
          showMarkAbsent={actions.markAbsent && (hasSessionUpdateStatusAbsent ?? true)}
          showRequestLeave={actions.requestLeave && (hasSessionUpdateStatusLeave ?? true)}
          startTooltip={tooltips.start}
          markAbsentTooltip={tooltips.markAbsent}
          requestLeaveTooltip={tooltips.requestLeave}
          markAbsentDisabled={markAbsentDisabled}
          onStart={() => onStartSession?.(row.id)}
          onMarkAbsent={() => onMarkAbsent?.(row.id)}
          onRequestLeave={() => onRequestLeave?.(row.id)}
        />
      ) : null}

      {actions.joinVideo ? (
        <MeetingJoinAction
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          disabled={!row.videoEnabled}
          label={labels.actions.joinVideo}
          emptyRole="teacher"
          setupHref="/profile?tab=meeting"
        />
      ) : null}
    </Box>
  );
}
