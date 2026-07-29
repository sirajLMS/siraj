"use client";

import { CalendarToday, ChevronLeft, ChevronRight, CloseOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Drawer, IconButton, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type {
  TeacherAvailabilityGapItem,
  TeacherAvailabilityMonthDrawerProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";
import { shiftMonth } from "@/frontend/common/views/dashboard/search-schedule/utils";
import { TeacherAvailabilityCalendarGridMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityCalendarGrid.mobile";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

function DrawerHeader({
  labels,
  title,
  onClose,
}: {
  readonly labels: SearchScheduleLabels;
  readonly title: string;
  readonly onClose: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleLg" sx={{ color: (theme: Theme) => theme.palette.primary.main }}>
          {title}
        </Typography>
      </Box>
      <IconButton aria-label={labels.closeMonthSchedule} onClick={onClose} size="small">
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}

function MonthNavigator({
  labels,
  currentMonth,
  onMonthChange,
}: {
  readonly labels: SearchScheduleLabels;
  readonly currentMonth: Date;
  readonly onMonthChange: (next: Date) => void;
}) {
  const monthStr = currentMonth.toLocaleString("en-US", { month: "long" });
  const yearStr = currentMonth.getFullYear();

  const flipSx = (theme: Theme) => ({
    transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
  });

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 2 }}>
      <IconButton
        aria-label={labels.previousMonth}
        onClick={() => onMonthChange(shiftMonth(currentMonth, -1))}
        sx={flipSx}
      >
        <ChevronLeft />
      </IconButton>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarToday sx={(theme: Theme) => ({ fontSize: 20, color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={(theme: Theme) => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {monthStr} {yearStr}
        </Typography>
      </Box>
      <IconButton aria-label={labels.nextMonth} onClick={() => onMonthChange(shiftMonth(currentMonth, 1))} sx={flipSx}>
        <ChevronRight />
      </IconButton>
    </Box>
  );
}

function DrawerContent({
  labels,
  loading,
  error,
  currentMonth,
  daysByDate,
}: {
  readonly labels: SearchScheduleLabels;
  readonly loading: boolean;
  readonly error: unknown;
  readonly currentMonth: Date;
  readonly daysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
}) {
  return (
    <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 3 }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {error ? (
        <Typography color="error" sx={{ textAlign: "center", py: 4 }}>
          {labels.monthScheduleError}
        </Typography>
      ) : null}

      {!loading && !error ? (
        <TeacherAvailabilityCalendarGridMobile labels={labels} currentMonth={currentMonth} daysByDate={daysByDate} />
      ) : null}
    </Box>
  );
}

export function TeacherAvailabilityMonthDrawerMobile({
  labels,
  open,
  teacher,
  currentMonth,
  monthDrawerLoading,
  monthDrawerError,
  daysByDate,
  onClose,
  onMonthChange,
}: Readonly<TeacherAvailabilityMonthDrawerProps>) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: "100vw",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHeader title={labels.monthScheduleTitle(teacher?.name ?? "")} labels={labels} onClose={onClose} />
        <MonthNavigator labels={labels} currentMonth={currentMonth} onMonthChange={onMonthChange} />
        <DrawerContent
          labels={labels}
          loading={monthDrawerLoading}
          error={monthDrawerError}
          currentMonth={currentMonth}
          daysByDate={daysByDate}
        />
      </Box>
    </Drawer>
  );
}
