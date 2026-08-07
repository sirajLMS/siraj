"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { classHref, studentHref } from "@/frontend/common/utils/profileHref";
import {
  isTerminalClassInstance,
  resolveWeeklyScheduleSlotStatus,
  useDeleteConfirmDialog,
  WEEKLY_SCHEDULE_DAYS,
  WEEKLY_SCHEDULE_TIMES,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  ScheduledClass,
  WeeklyScheduleGridProps,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display";
import { Link } from "@/shared/i18n";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

const TIME_COLUMN_WIDTH = 88;
const GRID_COLUMNS = `${TIME_COLUMN_WIDTH}px repeat(7, minmax(0, 1fr))`;

const linkTypographySx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
} as const;

interface SlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

function SlotItem({ classItem, onRemove, hasScheduleDeleteClass, labels, meetingJoinLabels }: Readonly<SlotItemProps>) {
  const { open, openDialog, closeDialog } = useDeleteConfirmDialog();
  const t = labels;
  const classInstanceId = classItem.id ?? "";
  const subjectLabel = classItem.subjectName?.trim() || t.grid.unknownSubject;
  const statusLabel = resolveWeeklyScheduleSlotStatus(classItem, t.grid.status);

  const handleConfirm = () => {
    closeDialog();
    onRemove(classInstanceId);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openDialog();
  };

  const canJoin = isJoinableClassInstance(classItem.executionState, classItem.outcome, {
    isFrozen: classItem.isFrozen ?? false,
  });
  const isTerminal = isTerminalClassInstance(classItem.executionState, classItem.outcome);
  const showDelete = !classItem.isFrozen && !isTerminal;

  return (
    <>
      <Box
        sx={theme => ({
          flex: 1,
          width: "100%",
          minHeight: 0,
          backgroundColor: isTerminal ? theme.palette.surfaceContainerHigh : theme.palette.primaryContainer,
          color: isTerminal ? theme.palette.onSurface : theme.palette.onPrimaryContainer,
          borderRadius: 1,
          px: 1,
          py: 0.75,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 0.5,
          border: `1px solid ${isTerminal ? theme.palette.outlineVariant : theme.palette.primary.main}`,
          borderInlineStart: `3px solid ${theme.palette.primary.main}`,
          opacity: isTerminal ? 0.9 : 1,
        })}
      >
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
          {classInstanceId ? (
            <Link href={classHref(classInstanceId)} style={{ textDecoration: "none", minWidth: 0 }}>
              <Typography
                variant="labelMd"
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
            <Typography variant="labelMd" sx={{ ...linkTypographySx, fontWeight: 700, lineHeight: 1.25 }}>
              {subjectLabel}
            </Typography>
          )}

          <DesktopPersonProfileLink
            href={classItem.studentId ? studentHref(classItem.studentId) : undefined}
            name={classItem.studentName || "—"}
            showAvatar={false}
            typographyVariant="caption"
            fontWeight={500}
          />

          <Typography variant="caption" sx={{ color: "inherit", opacity: 0.85, lineHeight: 1.2 }}>
            {classItem.duration}m · {statusLabel}
          </Typography>
        </Box>

        {canJoin || (showDelete && hasScheduleDeleteClass) ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5, minHeight: 20 }}>
            {canJoin ? (
              <MeetingJoinAction
                variant="icon"
                joinUrl={classItem.meetingJoinUrl}
                meeting={classItem.effectiveMeeting}
                emptyRole="teacher"
                label={meetingJoinLabels.joinMeeting}
                setupHref="/profile?tab=meeting"
              />
            ) : null}
            {showDelete && hasScheduleDeleteClass ? (
              <Box
                component="span"
                className="material-symbols-outlined"
                sx={theme => ({
                  fontSize: 16,
                  cursor: "pointer",
                  opacity: 0.7,
                  "&:hover": { color: theme.palette.error.main, opacity: 1 },
                })}
                onClick={handleDeleteClick}
              >
                delete
              </Box>
            ) : null}
          </Box>
        ) : null}
      </Box>

      <Dialog open={open} onClose={closeDialog}>
        <DialogTitle>{t.dialogs.deleteClassTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.dialogs.deleteClassMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t.dialogs.cancel}</Button>
          <Button onClick={handleConfirm} color="error" variant="contained" >
            {t.dialogs.confirmYes}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function GridHeader({ labels }: Readonly<{ labels: TeacherWeeklyScheduleLabels }>) {
  const t = labels;
  return (
    <Box
      sx={theme => ({
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        backgroundColor: theme.palette.sidebar,
        color: theme.palette.onSidebar,
      })}
    >
      <Box
        sx={theme => ({
          px: 1,
          py: 1.5,
          borderRight: `1px solid ${theme.palette.outlineVariant}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="labelUppercase" sx={{ fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>
          {t.grid.teacherTime}
        </Typography>
      </Box>
      {WEEKLY_SCHEDULE_DAYS.map(day => (
        <Box
          key={day}
          sx={theme => ({
            px: 1,
            py: 1.5,
            borderRight: `1px solid ${theme.palette.outlineVariant}`,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:last-child": { borderRight: "none" },
          })}
        >
          <Typography variant="labelMd" sx={{ color: "inherit", fontWeight: 600 }}>
            {t.days[day]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

interface GridRowProps {
  readonly time: string;
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

function GridRow({
  time,
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<GridRowProps>) {
  const t = labels;
  const getClassesForSlot = (day: string) => {
    return classes.filter(c => c.day?.toLowerCase() === day && c.startTime === time);
  };

  return (
    <Box
      sx={theme => ({
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        borderTop: `1px solid ${theme.palette.border.light}`,
        minHeight: 68,
      })}
    >
      <Box
        sx={theme => ({
          px: 1,
          py: 1,
          backgroundColor: theme.palette.surfaceContainerLow,
          borderRight: `1px solid ${theme.palette.border.light}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 600 })}>
          {time}
        </Typography>
      </Box>

      {WEEKLY_SCHEDULE_DAYS.map(day => {
        const slotClasses = getClassesForSlot(day);
        const isLunch = time === "12:00 PM";

        return (
          <Box
            key={day}
            sx={theme => ({
              p: 0.5,
              borderRight: `1px solid ${theme.palette.border.light}`,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              minHeight: 88,
              backgroundColor: isLunch ? theme.palette.action.hover : theme.palette.background.default,
              "&:last-child": { borderRight: "none" },
            })}
          >
            {isLunch ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                  {t.grid.lunchBreak}
                </Typography>
              </Box>
            ) : (
              slotClasses.map(c => (
                <SlotItem
                  key={c.id}
                  classItem={c}
                  onRemove={onRemoveClass}
                  hasScheduleDeleteClass={hasScheduleDeleteClass}
                  labels={labels}
                  meetingJoinLabels={meetingJoinLabels}
                />
              ))
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function WeeklyScheduleGrid({
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<WeeklyScheduleGridProps>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.layout.radius.card,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        width: "100%",
      })}
    >
      <GridHeader labels={labels} />
      {WEEKLY_SCHEDULE_TIMES.map(time => (
        <GridRow
          key={time}
          time={time}
          classes={classes}
          onRemoveClass={onRemoveClass}
          hasScheduleDeleteClass={hasScheduleDeleteClass}
          labels={labels}
          meetingJoinLabels={meetingJoinLabels}
        />
      ))}
    </Box>
  );
}
