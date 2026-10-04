"use client";

import type { LiveSessionToolbarDialogs } from "@/frontend/common/views/dashboard/classes/details/components/liveSessionToolbar.hooks";
import {
  ConfirmationDialog,
  LeaveDialog,
} from "@/frontend/common/views/dashboard/classes/details/components/liveSessionToolbarDialogs.parts";

interface ToolbarDialogsLabels {
  readonly absentDialogTitle: string;
  readonly absentConfirmation: string;
  readonly absentConfirm: string;
  readonly leaveDialogTitle: string;
  readonly leaveReasonLabel: string;
  readonly leaveSubmit: string;
  readonly resetDialogTitle: string;
  readonly resetConfirmation: string;
  readonly resetConfirm: string;
  readonly cancel: string;
}

interface ToolbarDialogsProps {
  readonly dialogs: LiveSessionToolbarDialogs;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly labels: ToolbarDialogsLabels;
}

/**
 * Renders the mark-absent / reset confirmation dialogs and the leave-reason dialog.
 * Confirmation configs are data-driven so both confirmation flows share one render path.
 */
export function ToolbarDialogs({
  dialogs,
  isMarkingAbsent,
  isProcessingLeave,
  isResetting,
  labels,
}: ToolbarDialogsProps) {
  const confirmations = [
    {
      title: labels.absentDialogTitle,
      open: dialogs.absentDialogOpen,
      isProcessing: isMarkingAbsent,
      onClose: dialogs.handleAbsentClose,
      onSubmit: dialogs.handleAbsentSubmit,
      submitColor: "warning" as const,
      body: labels.absentConfirmation,
      confirm: labels.absentConfirm,
    },
    {
      title: labels.resetDialogTitle,
      open: dialogs.resetDialogOpen,
      isProcessing: isResetting,
      onClose: dialogs.handleResetClose,
      onSubmit: dialogs.handleResetSubmit,
      submitColor: "error" as const,
      body: labels.resetConfirmation,
      confirm: labels.resetConfirm,
    },
  ];

  return (
    <>
      {confirmations.map(confirmation => (
        <ConfirmationDialog
          key={confirmation.title}
          open={confirmation.open}
          isProcessing={confirmation.isProcessing}
          onClose={confirmation.onClose}
          onSubmit={confirmation.onSubmit}
          submitColor={confirmation.submitColor}
          labels={{
            title: confirmation.title,
            confirmation: confirmation.body,
            cancel: labels.cancel,
            submit: confirmation.confirm,
          }}
        />
      ))}

      <LeaveDialog
        open={dialogs.leaveDialogOpen}
        reason={dialogs.leaveReason}
        isProcessing={isProcessingLeave}
        onReasonChange={dialogs.setLeaveReason}
        onClose={dialogs.handleLeaveClose}
        onSubmit={dialogs.handleLeaveSubmit}
        labels={{
          title: labels.leaveDialogTitle,
          reasonLabel: labels.leaveReasonLabel,
          cancel: labels.cancel,
          submit: labels.leaveSubmit,
        }}
      />
    </>
  );
}
