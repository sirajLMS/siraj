"use client";

import {
  AbsentConfirmDialog,
  MarkAbsentControlButton,
  RequestLeaveControlButton,
  StartSessionControlButton,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/teacherActiveSessionControlsShared.parts";
import type { TeacherActiveSessionControlsProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

export interface TeacherActiveSessionControlsSharedOptions {
  readonly buttonSize: number;
  readonly iconFontSize: "small" | "medium" | "large" | undefined;
}

export interface TeacherActiveSessionControlsSharedProps extends TeacherActiveSessionControlsProps {
  readonly markAbsentLoading?: boolean;
  readonly options: TeacherActiveSessionControlsSharedOptions;
}

export function TeacherActiveSessionControlsShared({
  labels,
  showStart = true,
  showMarkAbsent = true,
  showRequestLeave = true,
  startTooltip,
  markAbsentTooltip,
  requestLeaveTooltip,
  markAbsentDisabled = false,
  onStart,
  onMarkAbsent,
  onRequestLeave,
  hasSessionUpdateStatusStart,
  hasSessionUpdateStatusAbsent,
  hasSessionUpdateStatusLeave,
  absentDialogOpen,
  onAbsentDialogOpen,
  onAbsentDialogClose,
  markAbsentLoading = false,
  options,
}: Readonly<TeacherActiveSessionControlsSharedProps>) {
  const { buttonSize, iconFontSize } = options;

  const handleAbsentConfirm = () => {
    onMarkAbsent();
    onAbsentDialogClose?.();
  };

  const resolvedStartTooltip = startTooltip ?? labels.startSession;
  const resolvedMarkAbsentTooltip = markAbsentTooltip ?? labels.markAbsent;
  const resolvedRequestLeaveTooltip = requestLeaveTooltip ?? labels.requestLeave;

  const showStartButton = showStart && (hasSessionUpdateStatusStart ?? true);
  const showMarkAbsentButton = showMarkAbsent && (hasSessionUpdateStatusAbsent ?? true);
  const showRequestLeaveButton = showRequestLeave && (hasSessionUpdateStatusLeave ?? true);

  return (
    <>
      {showStartButton ? (
        <StartSessionControlButton
          tooltip={resolvedStartTooltip}
          ariaLabel={labels.startSession}
          onStart={onStart}
          buttonSize={buttonSize}
          iconFontSize={iconFontSize}
        />
      ) : null}

      {showMarkAbsentButton ? (
        <MarkAbsentControlButton
          tooltip={resolvedMarkAbsentTooltip}
          ariaLabel={labels.markAbsent}
          disabled={markAbsentDisabled}
          onOpenDialog={onAbsentDialogOpen}
          buttonSize={buttonSize}
          iconFontSize={iconFontSize}
        />
      ) : null}

      {showRequestLeaveButton ? (
        <RequestLeaveControlButton
          tooltip={resolvedRequestLeaveTooltip}
          ariaLabel={labels.requestLeave}
          onRequestLeave={onRequestLeave}
          buttonSize={buttonSize}
          iconFontSize={iconFontSize}
        />
      ) : null}

      {showMarkAbsentButton ? (
        <AbsentConfirmDialog
          open={absentDialogOpen ?? false}
          onClose={onAbsentDialogClose}
          onConfirm={handleAbsentConfirm}
          isLoading={markAbsentLoading}
          labels={labels}
        />
      ) : null}
    </>
  );
}
