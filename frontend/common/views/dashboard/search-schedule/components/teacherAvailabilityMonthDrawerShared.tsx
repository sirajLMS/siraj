"use client";

import { CalendarToday, ChevronLeft, ChevronRight, CloseOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Drawer, IconButton, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type {
  TeacherAvailabilityGapItem,
  TeacherAvailabilityMonthDrawerProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";
import { shiftMonth } from "@/frontend/common/views/dashboard/search-schedule/utils";
import { useAppLocale } from "@/shared/locale";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

interface TeacherAvailabilityMonthDrawerSlotProps {
  /** Tier-specific calendar grid component (desktop or mobile). */
  readonly CalendarGridComponent: React.FC<{
    readonly labels: SearchScheduleLabels;
    readonly currentMonth: Date;
    readonly daysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
  }>;
  /** Drawer anchor position — "right" for desktop, "bottom" for mobile. */
  readonly drawerAnchor: "right" | "bottom";
  /** Drawer paper sx — tier-specific width/maxWidth/borderRadius. */
  readonly drawerPaperSx: Record<string, unknown>;
}

type TeacherAvailabilityMonthDrawerSharedProps = TeacherAvailabilityMonthDrawerProps &
  TeacherAvailabilityMonthDrawerSlotProps;

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
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
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

function getFlipSx(theme: Theme) {
  return {
    transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
  };
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
  const locale = useAppLocale();
  const monthStr = currentMonth.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { month: "long" });
  const yearStr = currentMonth.getFullYear();

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 2 }}>
      <IconButton
        aria-label={labels.previousMonth}
        onClick={() => onMonthChange(shiftMonth(currentMonth, -1))}
        sx={getFlipSx}
      >
        <ChevronLeft />
      </IconButton>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarToday sx={(theme: Theme) => ({ fontSize: 20, color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={(theme: Theme) => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {monthStr} {yearStr}
        </Typography>
      </Box>
      <IconButton
        aria-label={labels.nextMonth}
        onClick={() => onMonthChange(shiftMonth(currentMonth, 1))}
        sx={getFlipSx}
      >
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
  CalendarGridComponent,
}: {
  readonly labels: SearchScheduleLabels;
  readonly loading: boolean;
  readonly error: unknown;
  readonly currentMonth: Date;
  readonly daysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
  readonly CalendarGridComponent: TeacherAvailabilityMonthDrawerSlotProps["CalendarGridComponent"];
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
        <CalendarGridComponent labels={labels} currentMonth={currentMonth} daysByDate={daysByDate} />
      ) : null}
    </Box>
  );
}

export function TeacherAvailabilityMonthDrawerShared({
  labels,
  open,
  teacher,
  currentMonth,
  monthDrawerLoading,
  monthDrawerError,
  daysByDate,
  onClose,
  onMonthChange,
  CalendarGridComponent,
  drawerAnchor,
  drawerPaperSx,
}: Readonly<TeacherAvailabilityMonthDrawerSharedProps>) {
  return (
    <Drawer
      anchor={drawerAnchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: drawerPaperSx,
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
          CalendarGridComponent={CalendarGridComponent}
        />
      </Box>
    </Drawer>
  );
}
