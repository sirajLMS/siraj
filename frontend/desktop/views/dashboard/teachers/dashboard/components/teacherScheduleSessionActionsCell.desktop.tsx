"use client";

import { Box } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import { SessionActivateButtonDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/sessionActivateButton.desktop";
import { TeacherActiveSessionControlsDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherActiveSessionControls.desktop";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

interface TeacherScheduleSessionActionsCellDesktopProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}

/**
 * Desktop variant of the schedule-row actions cell, rendered inside the
 * `AppDataGrid` actions column. Imports the desktop-tier sub-controls.
 */
export function TeacherScheduleSessionActionsCellDesktop({
  row,
  labels,
  canActivate,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherScheduleSessionActionsCellDesktopProps>) {
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

  if (!actions.activate && !hasSessionControls && !actions.joinVideo) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      {actions.activate ? (
        <RequirePermission permissions={[AppPermission.SessionActivateClass]}>
          <SessionActivateButtonDesktop
            disabled={activateDisabled}
            isConnecting={row.status === "connecting"}
            activateLabel={labels.actions.activate}
            connectingLabel={labels.actions.connecting}
            tooltip={tooltips.activate}
            fullWidth={false}
            onActivate={() => onActivate?.(row.id)}
          />
        </RequirePermission>
      ) : null}

      {hasSessionControls ? (
        <TeacherActiveSessionControlsDesktop
          labels={labels.activeControls}
          showStart={actions.start}
          showMarkAbsent={actions.markAbsent}
          showRequestLeave={actions.requestLeave}
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
