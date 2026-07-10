"use client";

import { Box } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import { SessionActivateButton } from "@/frontend/views/dashboard/teachers/dashboard/components/SessionActivateButton";
import { TeacherActiveSessionControls } from "@/frontend/views/dashboard/teachers/dashboard/components/TeacherActiveSessionControls";
import type { TeacherDashboardViewLabels } from "@/frontend/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

interface TeacherScheduleSessionActionsCellProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}

export function TeacherScheduleSessionActionsCell({
  row,
  labels,
  canActivate,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherScheduleSessionActionsCellProps>) {
  const actions = resolveTeacherScheduleSessionActions({
    executionState: row.executionState,
    outcome: row.outcome,
    activateEnabled: row.activateEnabled,
    canActivate,
    videoEnabled: row.videoEnabled,
    isConnecting: row.status === "connecting",
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
          <SessionActivateButton
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
        <TeacherActiveSessionControls
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
