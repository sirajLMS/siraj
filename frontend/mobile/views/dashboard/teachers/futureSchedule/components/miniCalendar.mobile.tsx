"use client";

import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, Grid, IconButton, Stack, Typography } from "@mui/material";
import { useState } from "react";
import type { MiniCalendarDate } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { useAppTranslation } from "@/shared/locale";

interface MiniCalendarProps {
  readonly selectedDate: string;
  readonly onSelectDate: (date: string) => void;
  readonly classDates: readonly string[];
}

const DAYS = [
  { id: "sun", label: "S" },
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
];

function getCalendarGrid(
  year: number,
  month: number,
  classDates: readonly string[],
  selectedDate: string
): MiniCalendarDate[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const classDateSet = new Set(classDates);
  const dates: MiniCalendarDate[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    dates.push({ num: daysInPrevMonth - i, muted: true });
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dates.push({
      num: d,
      active: dateStr === todayStr,
      selected: dateStr === selectedDate,
      dot: classDateSet.has(dateStr),
    });
  }

  const remaining = 7 - (dates.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      dates.push({ num: i, muted: true });
    }
  }

  return dates;
}

type ViewingMonth = { year: number; month: number };

function useViewingMonth(selectedDate: string): [ViewingMonth, (delta: number) => void] {
  const [viewingMonth, setViewingMonth] = useState<ViewingMonth>(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const shiftMonth = (delta: number) => {
    setViewingMonth(prev => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return [viewingMonth, shiftMonth];
}

function CalendarHeader({
  monthName,
  year,
  onPrev,
  onNext,
}: {
  readonly monthName: string;
  readonly year: number;
  readonly onPrev: () => void;
  readonly onNext: () => void;
}) {
  const t = useAppTranslation().dashboardTranslations.teacherFutureSchedule;
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1.5,
      }}
    >
      <Typography variant="labelMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
        {t.monthDisplay(monthName, String(year))}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={onPrev} sx={{ p: 0.5 }}>
          <ChevronLeftOutlined sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" onClick={onNext} sx={{ p: 0.5 }}>
          <ChevronRightOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function CalendarWeekdays() {
  return (
    <>
      {DAYS.map(day => (
        <Grid size={{ xs: 1 }} key={day.id}>
          <Typography
            variant="labelMd"
            sx={theme => ({
              fontWeight: 700,
              color: theme.palette.onSurfaceVariant,
              fontSize: 9,
            })}
          >
            {day.label}
          </Typography>
        </Grid>
      ))}
    </>
  );
}

function CalendarDayCell({
  date,
  onClick,
}: {
  readonly date: MiniCalendarDate;
  readonly onClick: (num: number, muted?: boolean) => void;
}) {
  return (
    <Grid size={{ xs: 1 }} key={`date-${date.num}-${date.muted}`} sx={{ p: 0.25 }}>
      <Box
        onClick={() => onClick(date.num, date.muted)}
        sx={theme => ({
          width: 24,
          height: 24,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          position: "relative",
          cursor: date.muted ? "default" : "pointer",
          ...(date.active && {
            backgroundColor: theme.palette.header,
            color: theme.palette.onHeader,
          }),
          ...(date.selected && {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontWeight: 700,
          }),
          ...(date.muted && { color: theme.palette.onSurface, opacity: 0.38 }),
        })}
      >
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontSize: 10,
            position: "relative",
            zIndex: 1,
            ...(date.selected && {
              color: theme.palette.primary.main,
              fontWeight: 700,
            }),
          })}
        >
          {date.num}
        </Typography>
        {date.dot && (
          <Box
            sx={theme => ({
              width: 3,
              height: 3,
              backgroundColor: theme.palette.status.blocked,
              borderRadius: "50%",
              position: "absolute",
              bottom: 1,
              left: "50%",
              transform: "translateX(-50%)",
            })}
          />
        )}
      </Box>
    </Grid>
  );
}

export function MiniCalendarMobile({ selectedDate, onSelectDate, classDates }: Readonly<MiniCalendarProps>) {
  const [{ year, month }, shiftMonth] = useViewingMonth(selectedDate);
  const dates = getCalendarGrid(year, month, classDates, selectedDate);
  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });

  const handleDateClick = (num: number, muted?: boolean) => {
    if (muted) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`;
    onSelectDate(dateStr);
  };

  return (
    <MobileBaseCard sx={{ p: 2 }}>
      <CalendarHeader monthName={monthName} year={year} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
      <Grid container columns={7} sx={{ textAlign: "center" }}>
        <CalendarWeekdays />
        {dates.map(date => (
          <CalendarDayCell key={`date-${date.num}-${date.muted}`} date={date} onClick={handleDateClick} />
        ))}
      </Grid>
    </MobileBaseCard>
  );
}
