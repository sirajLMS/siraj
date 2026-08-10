"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button as MuiButton,
  Typography,
} from "@mui/material";
import { classHref, studentHref } from "@/frontend/common/utils/profileHref";
import {
  isTerminalClassInstance,
  resolveWeeklyScheduleSlotStatus,
  useDeleteConfirmDialog,
  useSelectedDayFilter,
  WEEKLY_SCHEDULE_DAYS,
  WEEKLY_SCHEDULE_TIMES,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  MobileScheduleListProps,
  ScheduledClass,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { Link } from "@/shared/i18n";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

const linkTypographySx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
} as const;

interface MobileSlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

// --- Sub-components for MobileSlotItem ---

interface DeleteConfirmDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  cancelLabel,
  confirmLabel,
}: Readonly<DeleteConfirmDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <MuiButton onClick={onClose}>{cancelLabel}</MuiButton>
        <MuiButton onClick={onConfirm} color="error" variant="contained">
          {confirmLabel}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}

interface SlotItemActionsProps {
  readonly canJoin: boolean;
  readonly showDelete: boolean;
  readonly hasScheduleDeleteClass: boolean;
  readonly classItem: ScheduledClass;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
  readonly onDeleteClick: (event: React.MouseEvent) => void;
}

function SlotItemActions({
  canJoin,
  showDelete,
  hasScheduleDeleteClass,
  classItem,
  meetingJoinLabels,
  onDeleteClick,
}: Readonly<SlotItemActionsProps>) {
  if (!canJoin && !(showDelete && hasScheduleDeleteClass)) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75, minHeight: 24 }}>
      {canJoin ? (
        <MobileMeetingJoinAction
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
            fontSize: 20,
            cursor: "pointer",
            opacity: 0.7,
            "&:hover": { color: theme.palette.error.main, opacity: 1 },
          })}
          onClick={onDeleteClick}
        >
          delete
        </Box>
      ) : null}
    </Box>
  );
}

interface SlotItemContentProps {
  readonly classItem: ScheduledClass;
  readonly classInstanceId: string;
  readonly subjectLabel: string;
  readonly statusLabel: string;
}

function SlotItemContent({ classItem, classInstanceId, subjectLabel, statusLabel }: Readonly<SlotItemContentProps>) {
  return (
    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
      {classInstanceId ? (
        <Link href={classHref(classInstanceId)} style={{ textDecoration: "none", minWidth: 0 }}>
          <Typography
            variant="bodyMd"
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
        <Typography variant="bodyMd" sx={{ ...linkTypographySx, fontWeight: 700, lineHeight: 1.25 }}>
          {subjectLabel}
        </Typography>
      )}

      <MobilePersonProfileLink
        href={classItem.studentId ? studentHref(classItem.studentId) : undefined}
        name={classItem.studentName || "—"}
        showAvatar={false}
        typographyVariant="bodySm"
        fontWeight={500}
      />

      <Typography variant="caption" sx={{ color: "inherit", opacity: 0.85, lineHeight: 1.2 }}>
        {classItem.duration}m · {statusLabel}
      </Typography>
    </Box>
  );
}

function MobileSlotItem({
  classItem,
  onRemove,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<MobileSlotItemProps>) {
  const { open, openDialog, closeDialog } = useDeleteConfirmDialog();
  const t = labels;
  const classInstanceId = classItem.id ?? "";
  const subjectLabel = classItem.subjectName?.trim() || t.grid.unknownSubject;
  const statusLabel = resolveWeeklyScheduleSlotStatus(classItem, t.grid.status);

  const canJoin = isJoinableClassInstance(classItem.executionState, classItem.outcome, {
    isFrozen: classItem.isFrozen ?? false,
  });
  const isTerminal = isTerminalClassInstance(classItem.executionState, classItem.outcome);
  const showDelete = !classItem.isFrozen && !isTerminal;

  const handleConfirm = () => {
    closeDialog();
    onRemove(classInstanceId);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openDialog();
  };

  return (
    <>
      <Box
        sx={theme => ({
          flex: 1,
          width: "100%",
          minHeight: 0,
          backgroundColor: isTerminal ? theme.palette.surfaceContainerHigh : theme.palette.primaryContainer,
          color: isTerminal ? theme.palette.onSurface : theme.palette.onPrimaryContainer,
          borderRadius: 1.5,
          px: 1.5,
          py: 1.25,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 0.75,
          border: `1px solid ${isTerminal ? theme.palette.outlineVariant : theme.palette.primary.main}`,
          borderInlineStart: `3px solid ${theme.palette.primary.main}`,
          opacity: isTerminal ? 0.9 : 1,
        })}
      >
        <SlotItemContent
          classItem={classItem}
          classInstanceId={classInstanceId}
          subjectLabel={subjectLabel}
          statusLabel={statusLabel}
        />

        <SlotItemActions
          canJoin={canJoin}
          showDelete={showDelete}
          hasScheduleDeleteClass={hasScheduleDeleteClass}
          classItem={classItem}
          meetingJoinLabels={meetingJoinLabels}
          onDeleteClick={handleDeleteClick}
        />
      </Box>

      <DeleteConfirmDialog
        open={open}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={t.dialogs.deleteClassTitle}
        message={t.dialogs.deleteClassMessage}
        cancelLabel={t.dialogs.cancel}
        confirmLabel={t.dialogs.confirmYes}
      />
    </>
  );
}

interface DaySelectorProps {
  readonly selectedDay: string;
  readonly onSelect: (day: string) => void;
  readonly labels: TeacherWeeklyScheduleLabels;
}

function isDayKey<T extends Record<string, unknown>>(key: string, days: T): key is keyof T & string {
  return key in days;
}

function DaySelector({ selectedDay, onSelect, labels }: Readonly<DaySelectorProps>) {
  const t = labels;
  return (
    <Box
      sx={theme => ({
        py: 2,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <MobileHorizontalScrollRow leadSpacing={0} sx={theme => ({ gap: theme.spacing(1.25), paddingBottom: 0 })}>
        {WEEKLY_SCHEDULE_DAYS.map(day => {
          const abbr = day.slice(0, 3);
          const dayKey = isDayKey(abbr, t.days) ? abbr : day;
          const isSelected = selectedDay === day;

          return (
            <Button
              key={day}
              variant={isSelected ? "contained" : "outlined"}
              onClick={() => {
                onSelect(day);
              }}
              sx={theme => ({
                flexShrink: 0,
                scrollSnapAlign: "start",
                minWidth: 56,
                minHeight: 40,
                borderRadius: 999,
                px: 2.5,
                py: 1,
                typography: "labelMd",
                fontWeight: isSelected ? 700 : 500,
                textTransform: "none",
                backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.surfaceContainerLow,
                color: isSelected ? theme.palette.onPrimary : theme.palette.onSurfaceVariant,
                borderColor: isSelected ? theme.palette.primary.main : theme.palette.outlineVariant,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: isSelected ? theme.palette.primary.dark : theme.palette.action.hover,
                  boxShadow: "none",
                },
              })}
            >
              {t.days[dayKey]}
            </Button>
          );
        })}
      </MobileHorizontalScrollRow>
    </Box>
  );
}

interface TimeSlotRowProps {
  readonly time: string;
  readonly slotClasses: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

function TimeSlotRow({
  time,
  slotClasses,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<TimeSlotRowProps>) {
  const t = labels;
  const isLunch = time === "12:00 PM";

  let content = (
    <Typography
      sx={theme => ({ m: "auto", color: theme.palette.text.disabled, fontSize: theme.typography.bodyMd.fontSize })}
    >
      {t.grid.available}
    </Typography>
  );

  if (isLunch) {
    content = (
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.text.secondary,
          m: "auto",
        })}
      >
        <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 18 }}>
          restaurant
        </Box>
        <Typography variant="labelUppercase" sx={{ fontStyle: "italic" }}>
          {t.grid.lunchBreak}
        </Typography>
      </Box>
    );
  } else if (slotClasses.length > 0) {
    content = (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.75, py: 0.5 }}>
        {slotClasses.map(c => (
          <MobileSlotItem
            key={c.id}
            classItem={c}
            onRemove={onRemoveClass}
            hasScheduleDeleteClass={hasScheduleDeleteClass}
            labels={labels}
            meetingJoinLabels={meetingJoinLabels}
          />
        ))}
      </Box>
    );
  }

  const slotMinHeight = isLunch ? 48 : slotClasses.length > 0 ? 96 : 64;

  return (
    <Box
      sx={theme => ({
        display: "flex",
        minHeight: slotMinHeight,
        backgroundColor: theme.palette.background.paper,
      })}
    >
      <Box
        sx={theme => ({
          width: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.border.light}`,
        })}
      >
        <Typography
          variant="labelUppercase"
          sx={theme => ({ fontSize: theme.typography.labelUppercase.fontSize, color: theme.palette.text.secondary })}
        >
          {time}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, px: 1, py: 0.5, display: "flex", alignItems: "stretch" }}>{content}</Box>
    </Box>
  );
}

export default function MobileScheduleList({
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<MobileScheduleListProps>) {
  const { selectedDay, setSelectedDay } = useSelectedDayFilter("monday");

  const getClassesForSlot = (day: string, time: string) => {
    return classes.filter(c => c.day?.toLowerCase() === day && c.startTime === time);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <DaySelector selectedDay={selectedDay} onSelect={setSelectedDay} labels={labels} />

      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          mt: 2,
          backgroundColor: theme.palette.border.light,
          borderRadius: theme.layout.radius.card,
          overflow: "hidden",
          border: `1px solid ${theme.palette.border.light}`,
        })}
      >
        {WEEKLY_SCHEDULE_TIMES.map(time => (
          <TimeSlotRow
            key={time}
            time={time}
            slotClasses={getClassesForSlot(selectedDay, time)}
            onRemoveClass={onRemoveClass}
            hasScheduleDeleteClass={hasScheduleDeleteClass}
            labels={labels}
            meetingJoinLabels={meetingJoinLabels}
          />
        ))}
      </Box>
    </Box>
  );
}
