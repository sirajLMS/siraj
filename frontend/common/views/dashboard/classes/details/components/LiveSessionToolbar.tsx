"use client";

import { Alert, Box } from "@mui/material";
import { useLiveSessionToolbarDialogs } from "@/frontend/common/views/dashboard/classes/details/components/liveSessionToolbar.hooks";
import { ActionButtonsGroup } from "@/frontend/common/views/dashboard/classes/details/components/liveSessionToolbar.parts";
import { ToolbarDialogs } from "@/frontend/common/views/dashboard/classes/details/components/liveSessionToolbarDialogGroup.parts";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface LiveSessionToolbarProps {
  readonly classInstanceId: string;
  readonly executionState: string;

  // Mutation handlers from parent container
  readonly onStart: () => void;
  readonly onAbsent: () => void;
  readonly onLeave: (reason: string) => void;
  readonly onReset: () => void;

  // Loading states
  readonly isStarting?: boolean;
  readonly isMarkingAbsent?: boolean;
  readonly isProcessingLeave?: boolean;
  readonly isResetting?: boolean;

  // Error state
  readonly error?: string | null;
}

export function LiveSessionToolbar({
  classInstanceId,
  executionState,
  onStart,
  onAbsent,
  onLeave,
  onReset,
  isStarting = false,
  isMarkingAbsent = false,
  isProcessingLeave = false,
  isResetting = false,
  error = null,
}: LiveSessionToolbarProps) {
  const t = useAppTranslation(Translation.Dashboard.ClassDetails).liveSession;
  const dialogs = useLiveSessionToolbarDialogs({ onAbsent, onLeave, onReset });

  // Only show toolbar when session is ACTIVATED or RUNNING
  if (executionState !== "ACTIVATED" && executionState !== "RUNNING") {
    return null;
  }

  const isAnyLoading = isStarting || isMarkingAbsent || isProcessingLeave || isResetting;

  return (
    <Box sx={{ width: "100%", mb: { xs: 0, lg: 3 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ActionButtonsGroup
        classInstanceId={classInstanceId}
        executionState={executionState}
        isAnyLoading={isAnyLoading}
        isStarting={isStarting}
        isMarkingAbsent={isMarkingAbsent}
        isProcessingLeave={isProcessingLeave}
        isResetting={isResetting}
        onStart={onStart}
        onAbsentClick={dialogs.handleAbsentClick}
        onLeaveClick={dialogs.handleLeaveClick}
        onResetClick={dialogs.handleResetClick}
        labels={{
          startButton: t.startButton,
          absentButton: t.absentButton,
          leaveButton: t.leaveButton,
          resetButton: t.resetButton,
        }}
      />

      <ToolbarDialogs
        dialogs={dialogs}
        isMarkingAbsent={isMarkingAbsent}
        isProcessingLeave={isProcessingLeave}
        isResetting={isResetting}
        labels={{
          absentDialogTitle: t.absentDialogTitle,
          absentConfirmation: t.absentConfirmation,
          absentConfirm: t.absentConfirm,
          leaveDialogTitle: t.leaveDialogTitle,
          leaveReasonLabel: t.leaveReasonLabel,
          leaveSubmit: t.leaveSubmit,
          resetDialogTitle: t.resetDialogTitle,
          resetConfirmation: t.resetConfirmation,
          resetConfirm: t.resetConfirm,
          cancel: t.cancel,
        }}
      />
    </Box>
  );
}
