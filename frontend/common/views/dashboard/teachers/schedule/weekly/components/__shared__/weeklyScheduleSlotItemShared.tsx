"use client";

import { Box, Typography, type TypographyProps } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type { BaseDeleteDialogSharedProps } from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { studentHref } from "@/frontend/common/utils/profileHref";
import {
  SlotItemActions,
  SlotItemDeleteDialog,
  SlotItemSubject,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/weeklyScheduleSlotItemShared.parts";
import { useWeeklyScheduleSlotItem } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

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

  const { renderStudentLink } = options;
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
          <SlotItemSubject
            classInstanceId={classInstanceId}
            subjectLabel={subjectLabel}
            variant={options.subjectVariant}
          />

          {renderStudentLink(
            classItem.studentId ? studentHref(classItem.studentId) : undefined,
            classItem.studentName ?? "—"
          )}

          <Typography variant="caption" sx={{ color: "inherit", opacity: 0.85, lineHeight: 1.2 }}>
            {labels.grid.minutesShort(classItem.duration ?? 0)} · {statusLabel}
          </Typography>
        </Box>

        {showActions ? (
          <SlotItemActions
            classItem={classItem}
            canJoin={canJoin}
            showDelete={showDelete}
            hasScheduleDeleteClass={hasScheduleDeleteClass}
            labels={labels}
            meetingJoinLabels={meetingJoinLabels}
            options={options}
            handleDeleteClick={handleDeleteClick}
          />
        ) : null}
      </Box>

      <SlotItemDeleteDialog
        open={deleteDialogOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteDialogConfirm}
        labels={labels}
        DeleteDialog={options.DeleteDialog}
      />
    </>
  );
}
