"use client";

import { ExitToAppOutlined, HighlightOffOutlined, PlayArrowOutlined, RestartAltOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, type SxProps, type Theme } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  StyledAbsentActionButton,
  StyledLeaveActionButton,
  StyledResetActionButton,
  StyledStartActionButton,
} from "@/frontend/common/views/dashboard/classes/details/components/liveSessionToolbar.styled";

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

export function ActionButtonsGroup({
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
