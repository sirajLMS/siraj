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
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ScheduledClass } from "./WeeklyScheduleGrid";

interface MobileScheduleListProps {
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
}

interface MobileSlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly deleteConfirmMessage: string;
}

function MobileSlotItem({ classItem, onRemove, deleteConfirmMessage }: Readonly<MobileSlotItemProps>) {
  const [open, setOpen] = useState(false);

  const handleDeleteClick = () => {
    setOpen(true);
  };

  const handleConfirm = () => {
    setOpen(false);
    onRemove(classItem.id);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <Box
        sx={theme => ({
          bgcolor: theme.palette.primary.dark,
          color: theme.palette.onPrimary,
          borderRadius: 2,
          px: 2,
          py: 1.5,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderLeft: `4px solid ${theme.palette.status.confirmed}`,
        })}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="titleLg" sx={{ fontSize: "1rem", color: "inherit" }}>
            {classItem.studentName} ({classItem.duration}m)
          </Typography>
        </Box>
        <Box
          component="span"
          className="material-symbols-outlined"
          sx={theme => ({
            fontSize: 20,
            cursor: "pointer",
            "&:hover": { color: theme.palette.error.light },
          })}
          onClick={handleDeleteClick}
        >
          delete
        </Box>
      </Box>

      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteConfirmMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCancel}>Cancel</MuiButton>
          <MuiButton onClick={handleConfirm} color="error" variant="contained" autoFocus>
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const TIMES = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

interface DaySelectorProps {
  readonly selectedDay: string;
  readonly onSelect: (day: string) => void;
}

function DaySelector({ selectedDay, onSelect }: Readonly<DaySelectorProps>) {
  const t = useTranslations("dashboard.teacherWeeklySchedule");

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        overflowX: "auto",
        pb: 1,
        "::-webkit-scrollbar": { display: "none" },
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {DAYS.map(day => (
        <Button
          key={day}
          variant={selectedDay === day ? "contained" : "outlined"}
          onClick={() => {
            onSelect(day);
          }}
          sx={theme => ({
            borderRadius: 10,
            px: 3,
            whiteSpace: "nowrap",
            bgcolor: selectedDay === day ? theme.palette.primary.main : theme.palette.background.paper,
            color: selectedDay === day ? theme.palette.onPrimary : theme.palette.text.secondary,
            borderColor: selectedDay === day ? theme.palette.primary.main : theme.palette.border.light,
            "&:hover": {
              bgcolor: selectedDay === day ? theme.palette.primary.dark : theme.palette.action.hover,
            },
          })}
        >
          {t(`days.${day.slice(0, 3)}`)}
        </Button>
      ))}
    </Box>
  );
}

interface TimeSlotRowProps {
  readonly time: string;
  readonly slotClasses: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
}

function TimeSlotRow({ time, slotClasses, onRemoveClass }: Readonly<TimeSlotRowProps>) {
  const t = useTranslations("dashboard.teacherWeeklySchedule");
  const isLunch = time === "12:00 PM";

  let content = (
    <Typography sx={theme => ({ m: "auto", color: theme.palette.text.disabled, fontSize: "0.85rem" })}>
      {t("grid.available")}
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
          {t("grid.lunchBreak")}
        </Typography>
      </Box>
    );
  } else if (slotClasses.length > 0) {
    content = (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
        {slotClasses.map(c => (
          <MobileSlotItem
            key={c.id}
            classItem={c}
            onRemove={onRemoveClass}
            deleteConfirmMessage={t("dialogs.deleteConfirmClass")}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={theme => ({
        display: "flex",
        minHeight: isLunch ? 48 : 80,
        bgcolor: theme.palette.background.paper,
      })}
    >
      <Box
        sx={theme => ({
          width: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.border.light}`,
        })}
      >
        <Typography
          variant="labelUppercase"
          sx={theme => ({ fontSize: "0.7rem", color: theme.palette.text.secondary })}
        >
          {time}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, p: 1, display: "flex", alignItems: "center" }}>{content}</Box>
    </Box>
  );
}

export default function MobileScheduleList({ classes, onRemoveClass }: Readonly<MobileScheduleListProps>) {
  const [selectedDay, setSelectedDay] = useState<string>("monday");

  const getClassesForSlot = (day: string, time: string) => {
    return classes.filter(c => c.day.toLowerCase() === day && c.startTime === time);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <DaySelector selectedDay={selectedDay} onSelect={setSelectedDay} />

      {/* Slots */}
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          bgcolor: theme.palette.border.light,
          borderRadius: theme.layout.radius.card,
          overflow: "hidden",
          border: `1px solid ${theme.palette.border.light}`,
        })}
      >
        {TIMES.map(time => (
          <TimeSlotRow
            key={time}
            time={time}
            slotClasses={getClassesForSlot(selectedDay, time)}
            onRemoveClass={onRemoveClass}
          />
        ))}
      </Box>
    </Box>
  );
}
