"use client";

import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, Grid, IconButton, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import {
  getCalendarGrid,
  MINI_CALENDAR_WEEKDAYS,
  useViewingMonth,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/hooks";
import type {
  MiniCalendarDate,
  MiniCalendarProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { useAppTranslation } from "@/shared/locale";

/**
 * Desktop variant of the mini-calendar.
 *
 * Plan v5: per specs.md §3 N7 (state), N9 (pure-data helpers), N25
 * (`function useX` declarations), and §5 (custom hooks live in common), the
 * previously inline `useState`/`useViewingMonth`/`getCalendarGrid`/`DAYS`
 * constant were lifted to
 * `frontend/common/views/dashboard/teachers/futureSchedule/hooks/useMiniCalendar.hooks.ts`.
 * Per specs.md §3 N15 + §4.1 Class B, the byte-identical inline
 * `MiniCalendarProps` interface was lifted to
 * `frontend/common/views/dashboard/teachers/futureSchedule/types.ts`.
 */
export function MiniCalendarDesktop({ selectedDate, onSelectDate, classDates }: Readonly<MiniCalendarProps>) {
  const [{ year, month }, shiftMonth] = useViewingMonth(selectedDate);
  const dates = getCalendarGrid(year, month, classDates, selectedDate);
  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });

  const handleDateClick = (num: number, muted?: boolean) => {
    if (muted) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`;
    onSelectDate(dateStr);
  };

  return (
    <BaseCard sx={{ p: 3 }}>
      <MiniCalendarHeader
        monthName={monthName}
        year={year}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
      />
      <Grid container columns={7} sx={{ textAlign: "center" }}>
        {MINI_CALENDAR_WEEKDAYS.map(day => (
          <Grid size={{ xs: 1 }} key={day.id}>
            <Typography
              variant="labelMd"
              sx={theme => ({
                fontWeight: 700,
                color: theme.palette.onSurfaceVariant,
                fontSize: 10,
              })}
            >
              {day.label}
            </Typography>
          </Grid>
        ))}
        {dates.map(date => (
          <MiniCalendarDayCell key={`date-${date.num}-${date.muted}`} date={date} onClick={handleDateClick} />
        ))}
      </Grid>
    </BaseCard>
  );
}

function MiniCalendarHeader({
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
      spacing={2}
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
        {t.monthDisplay(monthName, String(year))}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={onPrev}>
          <ChevronLeftOutlined sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" onClick={onNext}>
          <ChevronRightOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function MiniCalendarDayCell({
  date,
  onClick,
}: {
  readonly date: MiniCalendarDate;
  readonly onClick: (num: number, muted?: boolean) => void;
}) {
  return (
    <Grid size={{ xs: 1 }} key={`date-${date.num}-${date.muted}`} sx={{ p: 0.5 }}>
      <Box
        onClick={() => onClick(date.num, date.muted)}
        sx={theme => ({
          width: 28,
          height: 28,
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
            fontSize: 11,
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
              width: 4,
              height: 4,
              backgroundColor: theme.palette.status.blocked,
              borderRadius: "50%",
              position: "absolute",
              bottom: 2,
              left: "50%",
              transform: "translateX(-50%)",
            })}
          />
        )}
      </Box>
    </Grid>
  );
}
