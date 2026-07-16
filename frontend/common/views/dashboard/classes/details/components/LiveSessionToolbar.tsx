"use client";

import { ExitToAppOutlined, HighlightOffOutlined, PlayArrowOutlined, RestartAltOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppTranslation } from "@/shared/locale/client";

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

import type { SxProps, Theme } from "@mui/material";

// Success-tinted contained button used for the start action
const StyledStartActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.onSuccess,
  borderRadius: theme.layout.radius.button,
  "&:hover": { backgroundColor: theme.palette.success.dark },
}));

// Warning-tinted contained button used for the mark-absent action
const StyledAbsentActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.onWarning,
  borderRadius: theme.layout.radius.button,
  "&:hover": { backgroundColor: theme.palette.warning.dark },
}));

// Secondary-colored outlined button used for the leave action
const StyledLeaveActionButton = styled(Button)(({ theme }) => ({
  color: theme.palette.secondary.main,
  borderColor: theme.palette.secondary.main,
  borderRadius: theme.layout.radius.button,
  "&:hover": {
    borderColor: theme.palette.secondary.dark,
    backgroundColor: theme.palette.action.hover,
  },
}));

// Error-tinted contained button used for the reset action
const StyledResetActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
  borderRadius: theme.layout.radius.button,
  "&:hover": { backgroundColor: theme.palette.error.dark },
}));

interface ActionButtonProps {
  readonly id: string;
  readonly disabled: boolean;
  readonly isLoading: boolean;
  readonly onClick: () => void;
  readonly label: string;
  readonly permission: AppPermission;
  readonly icon: React.ReactNode;
  readonly variant?: "contained" | "outlined";
  readonly component?: React.ElementType;
  readonly sx?: SxProps<Theme>;
}

function ActionButton({
  id,
  disabled,
  isLoading,
  onClick,
  label,
  permission,
  icon,
  variant = "contained",
  component: Component = Button,
  sx,
}: ActionButtonProps) {
  return (
    <RequirePermission permissions={[permission]}>
      <Component
        id={id}
        variant={variant}
        disabled={disabled}
        onClick={onClick}
        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : icon}
        sx={sx}
      >
        {label}
      </Component>
    </RequirePermission>
  );
}

interface LeaveDialogProps {
  readonly open: boolean;
  readonly reason: string;
  readonly isProcessing: boolean;
  readonly onReasonChange: (reason: string) => void;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly labels: {
    readonly title: string;
    readonly reasonLabel: string;
    readonly cancel: string;
    readonly submit: string;
  };
}

function LeaveDialog({ open, reason, isProcessing, onReasonChange, onClose, onSubmit, labels }: LeaveDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={labels.reasonLabel}
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.cancel}</Button>
        <Button onClick={onSubmit} variant="contained" disabled={!reason.trim() || isProcessing}>
          {labels.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ConfirmationDialogProps {
  readonly open: boolean;
  readonly isProcessing: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly submitColor: "warning" | "error";
  readonly labels: {
    readonly title: string;
    readonly confirmation: string;
    readonly cancel: string;
    readonly submit: string;
  };
}

function ConfirmationDialog({ open, isProcessing, onClose, onSubmit, submitColor, labels }: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.confirmation}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.cancel}</Button>
        <Button onClick={onSubmit} variant="contained" color={submitColor} disabled={isProcessing}>
          {labels.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ActionButtonsGroupProps {
  readonly classInstanceId: string;
  readonly executionState: string;
  readonly isAnyLoading: boolean;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly onStart: () => void;
  readonly onAbsentClick: () => void;
  readonly onLeaveClick: () => void;
  readonly onResetClick: () => void;
  readonly labels: {
    readonly startButton: string;
    readonly absentButton: string;
    readonly leaveButton: string;
    readonly resetButton: string;
  };
}

function ActionButtonsGroup({
  classInstanceId,
  executionState,
  isAnyLoading,
  isStarting,
  isMarkingAbsent,
  isProcessingLeave,
  isResetting,
  onStart,
  onAbsentClick,
  onLeaveClick,
  onResetClick,
  labels,
}: ActionButtonsGroupProps) {
  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
      {executionState === "ACTIVATED" && (
        <>
          <ActionButton
            id={`live-start-${classInstanceId}`}
            disabled={isAnyLoading}
            isLoading={isStarting}
            onClick={onStart}
            label={labels.startButton}
            permission={AppPermission.SessionUpdateStatusStart}
            icon={<PlayArrowOutlined />}
            component={StyledStartActionButton}
          />
          <ActionButton
            id={`live-absent-${classInstanceId}`}
            disabled={isAnyLoading}
            isLoading={isMarkingAbsent}
            onClick={onAbsentClick}
            label={labels.absentButton}
            permission={AppPermission.SessionUpdateStatusAbsent}
            icon={<HighlightOffOutlined />}
            component={StyledAbsentActionButton}
          />
          <ActionButton
            id={`live-leave-${classInstanceId}`}
            variant="outlined"
            disabled={isAnyLoading}
            isLoading={isProcessingLeave}
            onClick={onLeaveClick}
            label={labels.leaveButton}
            permission={AppPermission.SessionUpdateStatusLeave}
            icon={<ExitToAppOutlined />}
            component={StyledLeaveActionButton}
          />
        </>
      )}

      <ActionButton
        id={`live-reset-${classInstanceId}`}
        disabled={isAnyLoading}
        isLoading={isResetting}
        onClick={onResetClick}
        label={labels.resetButton}
        permission={AppPermission.SessionReset}
        icon={<RestartAltOutlined />}
        component={StyledResetActionButton}
      />
    </Box>
  );
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
  const t = useAppTranslation().dashboardTranslations.classDetails.liveSession;

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [absentDialogOpen, setAbsentDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Only show toolbar when session is ACTIVATED or RUNNING
  if (executionState !== "ACTIVATED" && executionState !== "RUNNING") {
    return null;
  }

  const isAnyLoading = isStarting || isMarkingAbsent || isProcessingLeave || isResetting;

  const handleLeaveClick = () => {
    setLeaveReason("");
    setLeaveDialogOpen(true);
  };

  const handleLeaveClose = () => {
    setLeaveDialogOpen(false);
  };

  const handleLeaveSubmit = () => {
    if (leaveReason.trim()) {
      onLeave(leaveReason.trim());
      setLeaveDialogOpen(false);
    }
  };

  const handleAbsentClick = () => {
    setAbsentDialogOpen(true);
  };

  const handleAbsentClose = () => {
    setAbsentDialogOpen(false);
  };

  const handleAbsentSubmit = () => {
    onAbsent();
    setAbsentDialogOpen(false);
  };

  const handleResetClick = () => {
    setResetDialogOpen(true);
  };

  const handleResetClose = () => {
    setResetDialogOpen(false);
  };

  const handleResetSubmit = () => {
    onReset();
    setResetDialogOpen(false);
  };

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
        onAbsentClick={handleAbsentClick}
        onLeaveClick={handleLeaveClick}
        onResetClick={handleResetClick}
        labels={{
          startButton: t.startButton,
          absentButton: t.absentButton,
          leaveButton: t.leaveButton,
          resetButton: t.resetButton,
        }}
      />

      {/* Mark Absent Confirmation Dialog */}
      <ConfirmationDialog
        open={absentDialogOpen}
        isProcessing={isMarkingAbsent}
        onClose={handleAbsentClose}
        onSubmit={handleAbsentSubmit}
        submitColor="warning"
        labels={{
          title: t.absentDialogTitle,
          confirmation: t.absentConfirmation,
          cancel: t.cancel,
          submit: t.absentConfirm,
        }}
      />

      {/* Leave Reason Dialog */}
      <LeaveDialog
        open={leaveDialogOpen}
        reason={leaveReason}
        isProcessing={isProcessingLeave}
        onReasonChange={setLeaveReason}
        onClose={handleLeaveClose}
        onSubmit={handleLeaveSubmit}
        labels={{
          title: t.leaveDialogTitle,
          reasonLabel: t.leaveReasonLabel,
          cancel: t.cancel,
          submit: t.leaveSubmit,
        }}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={resetDialogOpen}
        isProcessing={isResetting}
        onClose={handleResetClose}
        onSubmit={handleResetSubmit}
        submitColor="error"
        labels={{
          title: t.resetDialogTitle,
          confirmation: t.resetConfirmation,
          cancel: t.cancel,
          submit: t.resetConfirm,
        }}
      />
    </Box>
  );
}
