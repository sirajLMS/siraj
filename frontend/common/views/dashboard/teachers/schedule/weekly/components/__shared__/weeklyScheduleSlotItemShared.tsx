"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography, type TypographyProps } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type { BaseDeleteDialogSharedProps } from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { classHref, studentHref } from "@/frontend/common/utils/profileHref";
import { useWeeklyScheduleSlotItem } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
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

export interface WeeklyScheduleSlotItemSharedOptions {
  readonly cardBorderRadius: number;
  readonly cardPaddingX: number;
  readonly cardPaddingY: number;
  readonly cardGap: number;
  readonly subjectVariant: TypographyProps["variant"];
  readonly actionsGap: number;
  readonly actionsMinHeight: number;
  readonly deleteButtonPadding?: number;
  readonly JoinAction: ComponentType<MeetingJoinActionProps>;
  readonly DeleteDialog: ComponentType<BaseDeleteDialogSharedProps>;
  readonly renderStudentLink: (href: string | undefined, name: string) => ReactNode;
}

export interface WeeklyScheduleSlotItemSharedProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
  readonly options: WeeklyScheduleSlotItemSharedOptions;
}

/**
 * Tier-agnostic weekly-schedule slot card: subject link, student link, duration
 * line, join/delete actions, and the delete confirmation dialog. Tier variants
 * pass spacing/typography config plus their tier-specific PersonLink / JoinAction
 * / DeleteDialog components via `options`.
 */
export function WeeklyScheduleSlotItemShared({
  classItem,
  onRemove,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
  options,
}: Readonly<WeeklyScheduleSlotItemSharedProps>) {
  const {
    classInstanceId,
    deleteDialogOpen,
    subjectLabel,
    statusLabel,
    canJoin,
    isTerminal,
    showDelete,
    closeDeleteConfirm,
    handleDeleteDialogConfirm,
    handleDeleteClick,
  } = useWeeklyScheduleSlotItem(classItem, labels, onRemove);

  const { JoinAction, DeleteDialog, renderStudentLink } = options;
  const showActions = canJoin || (showDelete && hasScheduleDeleteClass);

  return (
    <>
      <Box
        sx={theme => ({
          flex: 1,
          width: "100%",
          minHeight: 0,
          backgroundColor: isTerminal ? theme.palette.surfaceContainerHigh : theme.palette.primaryContainer,
          color: isTerminal ? theme.palette.onSurface : theme.palette.onPrimaryContainer,
          borderRadius: options.cardBorderRadius,
          px: options.cardPaddingX,
          py: options.cardPaddingY,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: options.cardGap,
          border: `1px solid ${isTerminal ? theme.palette.outlineVariant : theme.palette.primary.main}`,
          borderInlineStart: `3px solid ${theme.palette.primary.main}`,
          opacity: isTerminal ? 0.9 : 1,
        })}
      >
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
          {classInstanceId ? (
            <Link href={classHref(classInstanceId)} style={{ textDecoration: "none", minWidth: 0 }}>
              <Typography
                variant={options.subjectVariant}
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
          ) : (
            <Typography
              variant={options.subjectVariant}
              sx={{ ...linkTypographySx, fontWeight: 700, lineHeight: 1.25 }}
            >
              {subjectLabel}
            </Typography>
          )}

          {renderStudentLink(
            classItem.studentId ? studentHref(classItem.studentId) : undefined,
            classItem.studentName ?? "—"
          )}

          <Typography variant="caption" sx={{ color: "inherit", opacity: 0.85, lineHeight: 1.2 }}>
            {labels.grid.minutesShort(classItem.duration ?? 0)} · {statusLabel}
          </Typography>
        </Box>

        {showActions ? (
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
        ) : null}
      </Box>

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteDialogConfirm}
        isLoading={false}
        title={labels.dialogs.deleteClassTitle}
        body={labels.dialogs.deleteClassMessage}
        cancelLabel={labels.dialogs.cancel}
        confirmLabel={labels.dialogs.confirmYes}
      />
    </>
  );
}
