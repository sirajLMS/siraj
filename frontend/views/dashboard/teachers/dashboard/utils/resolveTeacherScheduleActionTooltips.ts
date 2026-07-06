import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";

export interface TeacherScheduleActionTooltips {
  readonly activate: string;
  readonly joinVideo: string;
  readonly start: string;
  readonly markAbsent: string;
  readonly requestLeave: string;
}

export function resolveTeacherScheduleActionTooltips(
  row: TeacherScheduleRow,
  labels: TeacherDashboardLabels
): TeacherScheduleActionTooltips {
  const disabled = labels.actions.disabledTooltips;
  const actions = labels.actions;
  const controls = labels.activeControls;

  let activate = actions.activate;
  if (row.status === "connecting") {
    activate = disabled.activateConnecting;
  } else if (!row.activateEnabled && row.activateDisabledReason === "before_window") {
    activate = disabled.activateBeforeWindow;
  } else if (!row.activateEnabled && row.activateDisabledReason === "after_window") {
    activate = disabled.activateAfterWindow;
  }

  const joinVideo = row.videoEnabled ? actions.joinVideo : disabled.joinVideoUnavailable;

  const markAbsent =
    row.markAbsentEnabled === false ? disabled.markAbsentWaitingPeriod : controls.markAbsent;

  return {
    activate,
    joinVideo,
    start: controls.startSession,
    markAbsent,
    requestLeave: controls.requestLeave,
  };
}
