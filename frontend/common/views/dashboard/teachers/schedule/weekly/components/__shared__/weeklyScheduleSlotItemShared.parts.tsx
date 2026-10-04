"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography, type TypographyProps } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type { BaseDeleteDialogSharedProps } from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { classHref } from "@/frontend/common/utils/profileHref";
import type { useWeeklyScheduleSlotItem } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { Link } from "@/shared/i18n";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

const linkTypographySx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
} as const;

export function SlotItemSubject({
  classInstanceId,
  subjectLabel,
  variant,
}: Readonly<{
  classInstanceId: string;
  subjectLabel: string;
  variant: TypographyProps["variant"];
}>) {
  if (classInstanceId) {
    return (
      <Link href={classHref(classInstanceId)} style={{ textDecoration: "none", minWidth: 0 }}>
        <Typography
          variant={variant}
          sx={theme => ({
            ...linkTypographySx,
            fontWeight: 700,
            color: theme.palette.primary.main,
            lineHeight: 1.25,
            "&:hover": { textDecoration: "underline" },
          })}
        >
          {subjectLabel}
        </Typography>
      </Link>
    );
  }
  return (
    <Typography variant={variant} sx={{ ...linkTypographySx, fontWeight: 700, lineHeight: 1.25 }}>
      {subjectLabel}
    </Typography>
  );
}

export function SlotItemActions({
  classItem,
  canJoin,
  showDelete,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
  options,
  handleDeleteClick,
}: Readonly<{
  classItem: ScheduledClass;
  canJoin: boolean;
  showDelete: boolean;
  hasScheduleDeleteClass: boolean;
  labels: TeacherWeeklyScheduleLabels;
  meetingJoinLabels: MeetingConfigJoinLabels;
  options: {
    readonly actionsGap: number;
    readonly actionsMinHeight: number;
    readonly deleteButtonPadding?: number;
    readonly JoinAction: ComponentType<MeetingJoinActionProps>;
  };
  handleDeleteClick: ReturnType<typeof useWeeklyScheduleSlotItem>["handleDeleteClick"];
}>) {
  const { JoinAction } = options;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: options.actionsGap,
        minHeight: options.actionsMinHeight,
      }}
    >
      {canJoin ? (
        <JoinAction
          variant="icon"
          joinUrl={classItem.meetingJoinUrl}
          meeting={classItem.effectiveMeeting}
          emptyRole="teacher"
          label={meetingJoinLabels.joinMeeting}
          setupHref="/profile?tab=meeting"
        />
      ) : null}
      {showDelete && hasScheduleDeleteClass ? (
        <Tooltip title={labels.actions.deleteClass}>
          <IconButton
            size="small"
            aria-label={labels.actions.deleteClass}
            onClick={handleDeleteClick}
            sx={theme => ({
              p: options.deleteButtonPadding,
              color: theme.palette.onPrimaryContainer,
              opacity: 0.7,
              "&:hover": { color: theme.palette.error.main, opacity: 1 },
            })}
          >
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

export function SlotItemDeleteDialog({
  open,
  onClose,
  onConfirm,
  labels,
  DeleteDialog,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  labels: TeacherWeeklyScheduleLabels;
  DeleteDialog: ComponentType<BaseDeleteDialogSharedProps>;
}>): ReactNode {
  return (
    <DeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={false}
      title={labels.dialogs.deleteClassTitle}
      body={labels.dialogs.deleteClassMessage}
      cancelLabel={labels.dialogs.cancel}
      confirmLabel={labels.dialogs.confirmYes}
    />
  );
}
