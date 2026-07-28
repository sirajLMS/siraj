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
import {
  isTerminalClassInstance,
  useDeleteConfirmDialog,
  WEEKLY_SCHEDULE_DAYS,
  WEEKLY_SCHEDULE_TIMES,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  ScheduledClass,
  WeeklyScheduleGridProps,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

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

  const handleConfirm = () => {
    closeDialog();
    onRemove(classItem.id ?? "");
  };

  const canJoin = isJoinableClassInstance(classItem.executionState, classItem.outcome, {
    isFrozen: classItem.isFrozen ?? false,
  });
  const isTerminal = isTerminalClassInstance(classItem.executionState, classItem.outcome);
  const showDelete = !classItem.isFrozen && !isTerminal;

  const slotAction = canJoin ? (
    <MeetingJoinAction
      variant="icon"
      joinUrl={classItem.meetingJoinUrl}
      meeting={classItem.effectiveMeeting}
      emptyRole="teacher"
      label={meetingJoinLabels.joinMeeting}
      setupHref="/profile?tab=meeting"
    />
  ) : isTerminal ? (
    <Typography variant="labelMd" sx={{ opacity: 0.7, color: "inherit", fontSize: 10 }}>
      {t.grid.sessionEnded}
    </Typography>
  ) : null;

  return (
    <>
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          borderRadius: 1,
          p: 1,
          typography: "labelMd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "100%",
        })}
      >
        <Box>
          <Typography variant="bodyMd" sx={{ fontWeight: "bold", color: "inherit" }}>
            {classItem.studentName} ({classItem.duration}m)
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {slotAction}
          {showDelete && hasScheduleDeleteClass ? (
            <Box
              component="span"
              className="material-symbols-outlined"
              sx={theme => ({
                fontSize: 18,
                cursor: "pointer",
                "&:hover": { color: theme.palette.error.main },
              })}
              onClick={openDialog}
            >
              delete
            </Box>
          ) : null}
        </Box>
      </Box>

      <Dialog open={open} onClose={closeDialog}>
        <DialogTitle>{t.dialogs.deleteClassTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.dialogs.deleteClassMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t.dialogs.cancel}</Button>
          <Button onClick={handleConfirm} color="error" variant="contained" autoFocus>
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
        gridColumn: "span 8",
        display: "grid",
        gridTemplateColumns: "100px repeat(7, 1fr)",
        backgroundColor: theme.palette.sidebar,
        color: theme.palette.onSidebar,
      })}
    >
      <Box
        sx={theme => ({
          p: 2,
          borderRight: `1px solid ${theme.palette.outlineVariant}`,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="labelUppercase">{t.grid.teacherTime}</Typography>
      </Box>
      {WEEKLY_SCHEDULE_DAYS.map(day => (
        <Box
          key={day}
          sx={theme => ({
            p: 2,
            borderRight: `1px solid ${theme.palette.outlineVariant}`,
            textAlign: "center",
          })}
        >
          <Typography variant="titleLg" sx={{ color: "inherit" }}>
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
        gridColumn: "span 8",
        display: "grid",
        gridTemplateColumns: "100px repeat(7, 1fr)",
        borderBottom: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <Box
        sx={theme => ({
          p: 2,
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.border.light}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
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
              minHeight: 80,
              borderRight: `1px solid ${theme.palette.border.light}`,
              position: "relative",
              backgroundColor: isLunch ? theme.palette.action.hover : "transparent",
            })}
          >
            {isLunch ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  opacity: 0.6,
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
        gridTemplateColumns: "100px repeat(7, 1fr)",
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.layout.radius.card,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
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
