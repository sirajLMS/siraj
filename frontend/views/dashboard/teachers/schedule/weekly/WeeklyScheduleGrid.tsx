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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

export interface ScheduledClass {
  readonly id: string;
  readonly studentName: string;
  readonly studentId: string;
  readonly duration: number;
  readonly startTime: string;
  readonly day: string;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
}

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
}

function SlotItem({ classItem, onRemove }: Readonly<SlotItemProps>) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("dashboard.teacherWeeklySchedule");

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
          backgroundColor: theme.palette.primary.main,
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
          <Typography variant="bodyMd" sx={{ fontWeight: "bold", color: "inherit" }}>
            {classItem.studentName} ({classItem.duration}m)
          </Typography>
        </Box>
        <RequirePermission permissions={[AppPermission.ScheduleDeleteClass]}>
          <Box
            component="span"
            className="material-symbols-outlined"
            sx={theme => ({
              fontSize: 18,
              cursor: "pointer",
              "&:hover": { color: theme.palette.error.main },
            })}
            onClick={handleDeleteClick}
          >
            delete
          </Box>
        </RequirePermission>
      </Box>

      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle>{t("dialogs.deleteClassTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("dialogs.deleteClassMessage")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>{t("dialogs.cancel")}</Button>
          <Button onClick={handleConfirm} color="error" variant="contained" autoFocus>
            {t("dialogs.confirmYes")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
    return classes.filter(c => c.day.toLowerCase() === day && c.startTime === time);
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
                  {t("grid.lunchBreak")}
                </Typography>
              </Box>
            ) : (
              slotClasses.map(c => <SlotItem key={c.id} classItem={c} onRemove={onRemoveClass} />)
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
        backgroundColor: theme.palette.background.paper,
      })}
    >
      <GridHeader />
      {TIMES.map(time => (
        <GridRow key={time} time={time} classes={classes} onRemoveClass={onRemoveClass} />
      ))}
    </Box>
  );
}
