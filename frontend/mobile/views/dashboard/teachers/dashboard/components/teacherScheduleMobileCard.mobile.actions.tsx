"use client";

import { AcUnitOutlined } from "@mui/icons-material";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import type { MobileCardListItemProps } from "@/frontend/mobile/components/ui";
import { SessionActivateButtonMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/sessionActivateButton.mobile";
import { TeacherActiveSessionControlsMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherActiveSessionControls.mobile";
import { TeacherScheduleStatusContentMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleStatusContent.mobile";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

export type ScheduleCardAccentBorder = MobileCardListItemProps["accentBorder"];

/**
 * Accent precedence mirrors the historical shell: a frozen row always shows the
 * info accent; otherwise a live row shows the primary accent.
 */
export function resolveScheduleCardAccentBorder(isFrozen: boolean, isLive: boolean): ScheduleCardAccentBorder {
  if (isFrozen) {
    return { color: "info", side: "inline-start" };
  }
  if (isLive) {
    return { color: "primary", side: "inline-start" };
  }
  return undefined;
}

export function renderFooterAction(
  row: TeacherScheduleRow,
  labels: TeacherDashboardViewLabels,
  canActivate: boolean,
  onActivate?: (id: string) => void,
  onStartSession?: (id: string) => void,
  onMarkAbsent?: (id: string) => void,
  onRequestLeave?: (id: string) => void
) {
  const actions = resolveTeacherScheduleSessionActions({
    executionState: row.executionState,
    outcome: row.outcome,
    activateEnabled: row.activateEnabled,
    canActivate,
    videoEnabled: row.videoEnabled,
    isConnecting: row.status === "connecting",
    isFrozen: row.isFrozen,
  });

  const isSessionEnded = row.executionState === ClassExecutionState.Completed || row.outcome === ClassOutcome.Taken;
  const isFrozen = row.isFrozen === true;

  if (isFrozen) {
    return (
      <Tooltip title={labels.schedule.contactAdmin}>
        <Button
          fullWidth
          disabled
          variant="outlined"
          startIcon={<AcUnitOutlined />}
          sx={{ typography: "labelUppercase" }}
        >
          {labels.schedule.frozen}
        </Button>
      </Tooltip>
    );
  }

  if (isSessionEnded || (!actions.activate && !actions.start && !actions.markAbsent && !actions.requestLeave)) {
    if (isSessionEnded) {
      return (
        <Button fullWidth disabled variant="outlined" sx={{ typography: "labelUppercase" }}>
          {labels.schedule.sessionEnded}
        </Button>
      );
    }
    return (
      <TeacherScheduleStatusContentMobile row={row} labels={labels} canActivate={canActivate} onActivate={onActivate} />
    );
  }

  if (actions.activate) {
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels, labels.meetingLabels);
    return (
      <SessionActivateButtonMobile
        disabled={!row.activateEnabled || row.status === "connecting"}
        isConnecting={row.status === "connecting"}
        activateLabel={labels.actions.activateSession}
        connectingLabel={labels.actions.connecting}
        tooltip={tooltips.activate}
        onActivate={() => onActivate?.(row.id)}
      />
    );
  }

  if (actions.start || actions.markAbsent || actions.requestLeave) {
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels, labels.meetingLabels);
    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
          {labels.activeControls.sessionControls}
        </Typography>
        <TeacherActiveSessionControlsMobile
          labels={labels.activeControls}
          showStart={actions.start}
          showMarkAbsent={actions.markAbsent}
          showRequestLeave={actions.requestLeave}
          startTooltip={tooltips.start}
          markAbsentTooltip={tooltips.markAbsent}
          requestLeaveTooltip={tooltips.requestLeave}
          markAbsentDisabled={row.markAbsentEnabled === false}
          onStart={() => onStartSession?.(row.id)}
          onMarkAbsent={() => onMarkAbsent?.(row.id)}
          onRequestLeave={() => onRequestLeave?.(row.id)}
        />
      </Box>
    );
  }

  return null;
}
