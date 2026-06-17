"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ScheduledClass } from "@/frontend/stores/mockTeacherScheduleStore";

interface WeeklyScheduleGridProps {
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
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

interface SlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly deleteConfirmMessage: string;
}

function SlotItem({ classItem, onRemove, deleteConfirmMessage }: Readonly<SlotItemProps>) {
  const handleDelete = () => {
    if (globalThis.confirm(deleteConfirmMessage)) {
      onRemove(classItem.id);
    }
  };

  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
        borderRadius: 1,
        p: 1,
        fontSize: "0.75rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "100%",
      })}
    >
      <Box>
        <Typography variant="labelUppercase" sx={{ opacity: 0.8 }}>
          {classItem.subjectName}
        </Typography>
        <Typography variant="bodyMd" sx={{ fontWeight: "bold", color: "inherit" }}>
          {classItem.studentName} ({classItem.duration}m)
        </Typography>
      </Box>
      <Box
        component="span"
        className="material-symbols-outlined"
        sx={theme => ({
          fontSize: 18,
          cursor: "pointer",
          "&:hover": { color: theme.palette.error.main },
        })}
        onClick={handleDelete}
      >
        delete
      </Box>
    </Box>
  );
}

function GridHeader() {
  const t = useTranslations("dashboard.teacherWeeklySchedule");

  return (
    <Box
      sx={theme => ({
        gridColumn: "span 8",
        display: "grid",
        gridTemplateColumns: "100px repeat(7, 1fr)",
        bgcolor: theme.palette.sidebar,
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
        <Typography variant="labelUppercase">{t("grid.teacherTime")}</Typography>
      </Box>
      {DAYS.map(day => (
        <Box
          key={day}
          sx={theme => ({
            p: 2,
            borderRight: `1px solid ${theme.palette.outlineVariant}`,
            textAlign: "center",
          })}
        >
          <Typography variant="titleLg" sx={{ color: "inherit" }}>
            {t(`days.${day}`)}
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
}

function GridRow({ time, classes, onRemoveClass }: Readonly<GridRowProps>) {
  const t = useTranslations("dashboard.teacherWeeklySchedule");

  const getClassesForSlot = (day: string) => {
    return classes.filter(c => c.day === day && c.startTime === time);
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
      {/* Time Column */}
      <Box
        sx={theme => ({
          p: 2,
          bgcolor: theme.palette.background.default,
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

      {/* Day Columns */}
      {DAYS.map(day => {
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
              bgcolor: isLunch ? theme.palette.action.hover : "transparent",
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
                  {t("grid.lunchBreak")}
                </Typography>
              </Box>
            ) : (
              slotClasses.map(c => (
                <SlotItem
                  key={c.id}
                  classItem={c}
                  onRemove={onRemoveClass}
                  deleteConfirmMessage={t("dialogs.deleteConfirm")}
                />
              ))
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function WeeklyScheduleGrid({ classes, onRemoveClass }: Readonly<WeeklyScheduleGridProps>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: "100px repeat(7, 1fr)",
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.layout.radius.card,
        overflow: "hidden",
        bgcolor: theme.palette.background.paper,
      })}
    >
      <GridHeader />
      {TIMES.map(time => (
        <GridRow key={time} time={time} classes={classes} onRemoveClass={onRemoveClass} />
      ))}
    </Box>
  );
}
