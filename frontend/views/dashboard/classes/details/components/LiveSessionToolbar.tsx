"use client";

import { ExitToAppOutlined, HighlightOffOutlined, PlayArrowOutlined, RestartAltOutlined } from "@mui/icons-material";
import { Alert, alpha, Box, Button, CircularProgress } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

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

interface StartButtonProps {
  readonly classInstanceId: string;
  readonly isAnyLoading: boolean;
  readonly isStarting: boolean;
  readonly onStart: () => void;
  readonly startLabel: string;
}

function StartButton({ classInstanceId, isAnyLoading, isStarting, onStart, startLabel }: StartButtonProps) {
  return (
    <RequirePermission permissions={[AppPermission.SessionUpdateStatusStart]}>
      <Button
        id={`live-start-${classInstanceId}`}
        variant="contained"
        disabled={isAnyLoading}
        onClick={onStart}
        startIcon={isStarting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowOutlined />}
        sx={(theme) => ({
          bgcolor: theme.palette.success.main,
          color: theme.palette.onSuccess,
          borderRadius: theme.layout.radius.button,
          "&:hover": {
            bgcolor: theme.palette.success.dark,
          },
        })}
      >
        {startLabel}
      </Button>
    </RequirePermission>
  );
}

interface AbsentButtonProps {
  readonly classInstanceId: string;
  readonly isAnyLoading: boolean;
  readonly isMarkingAbsent: boolean;
  readonly onAbsent: () => void;
  readonly absentLabel: string;
}

function AbsentButton({ classInstanceId, isAnyLoading, isMarkingAbsent, onAbsent, absentLabel }: AbsentButtonProps) {
  return (
    <RequirePermission permissions={[AppPermission.SessionUpdateStatusAbsent]}>
      <Button
        id={`live-absent-${classInstanceId}`}
        variant="contained"
        disabled={isAnyLoading}
        onClick={onAbsent}
        startIcon={isMarkingAbsent ? <CircularProgress size={16} color="inherit" /> : <HighlightOffOutlined />}
        sx={(theme) => ({
          bgcolor: theme.palette.warning.main,
          color: theme.palette.onWarning,
          borderRadius: theme.layout.radius.button,
          "&:hover": {
            bgcolor: theme.palette.warning.dark,
          },
        })}
      >
        {absentLabel}
      </Button>
    </RequirePermission>
  );
}

interface LeaveButtonProps {
  readonly classInstanceId: string;
  readonly isAnyLoading: boolean;
  readonly isProcessingLeave: boolean;
  readonly onLeaveClick: () => void;
  readonly leaveLabel: string;
}

function LeaveButton({ classInstanceId, isAnyLoading, isProcessingLeave, onLeaveClick, leaveLabel }: LeaveButtonProps) {
  return (
    <RequirePermission permissions={[AppPermission.SessionUpdateStatusLeave]}>
      <Button
        id={`live-leave-${classInstanceId}`}
        variant="outlined"
        disabled={isAnyLoading}
        onClick={onLeaveClick}
        startIcon={isProcessingLeave ? <CircularProgress size={16} color="inherit" /> : <ExitToAppOutlined />}
        sx={(theme) => ({
          color: theme.palette.secondary.main,
          borderColor: theme.palette.secondary.main,
          borderRadius: theme.layout.radius.button,
          "&:hover": {
            borderColor: theme.palette.secondary.dark,
            bgcolor: alpha(theme.palette.secondary.main, 0.08),
          },
        })}
      >
        {leaveLabel}
      </Button>
    </RequirePermission>
  );
}

interface ResetButtonProps {
  readonly classInstanceId: string;
  readonly isAnyLoading: boolean;
  readonly isResetting: boolean;
  readonly onResetClick: () => void;
  readonly resetLabel: string;
}

function ResetButton({ classInstanceId, isAnyLoading, isResetting, onResetClick, resetLabel }: ResetButtonProps) {
  return (
    <RequirePermission permissions={[AppPermission.SessionReset]}>
      <Button
        id={`live-reset-${classInstanceId}`}
        variant="contained"
        disabled={isAnyLoading}
        onClick={onResetClick}
        startIcon={isResetting ? <CircularProgress size={16} color="inherit" /> : <RestartAltOutlined />}
        sx={(theme) => ({
          bgcolor: theme.palette.error.main,
          color: theme.palette.onError,
          borderRadius: theme.layout.radius.button,
          "&:hover": {
            bgcolor: theme.palette.error.dark,
          },
        })}
      >
        {resetLabel}
      </Button>
    </RequirePermission>
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
  const t = useTranslations("dashboard.classDetails.liveSession");

  // Only show toolbar when session is ACTIVATED or RUNNING
  if (executionState !== "ACTIVATED" && executionState !== "RUNNING") {
    return null;
  }

  const isAnyLoading = isStarting || isMarkingAbsent || isProcessingLeave || isResetting;

  const handleLeaveClick = () => {
    const reason = prompt(t("leaveReasonPrompt"));
    if (reason?.trim()) {
      onLeave(reason.trim());
    }
  };

  const handleResetClick = () => {
    if (confirm(t("resetConfirmation"))) {
      onReset();
    }
  };

  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {executionState === "ACTIVATED" && (
          <>
            <StartButton
              classInstanceId={classInstanceId}
              isAnyLoading={isAnyLoading}
              isStarting={isStarting}
              onStart={onStart}
              startLabel={t("startButton")}
            />
            <AbsentButton
              classInstanceId={classInstanceId}
              isAnyLoading={isAnyLoading}
              isMarkingAbsent={isMarkingAbsent}
              onAbsent={onAbsent}
              absentLabel={t("absentButton")}
            />
            <LeaveButton
              classInstanceId={classInstanceId}
              isAnyLoading={isAnyLoading}
              isProcessingLeave={isProcessingLeave}
              onLeaveClick={handleLeaveClick}
              leaveLabel={t("leaveButton")}
            />
          </>
        )}

        <ResetButton
          classInstanceId={classInstanceId}
          isAnyLoading={isAnyLoading}
          isResetting={isResetting}
          onResetClick={handleResetClick}
          resetLabel={t("resetButton")}
        />
      </Box>
    </Box>
  );
}
