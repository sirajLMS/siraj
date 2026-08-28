"use client";

import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, Grid, IconButton, Stack, Typography } from "@mui/material";
import type { ComponentType } from "react";
import {
  getCalendarGrid,
  useViewingMonth,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/hooks/useMiniCalendar.hooks";
import type {
  MiniCalendarDate,
  MiniCalendarProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { useAppLocale } from "@/shared/locale";

export type MiniCalendarCardComponent = ComponentType<{
  readonly sx?: object;
  readonly children: React.ReactNode;
}>;

export function MiniCalendarShared({
  selectedDate,
  onSelectDate,
  classDates,
  labels,
  CardComponent,
}: Readonly<MiniCalendarProps> & {
  readonly CardComponent: MiniCalendarCardComponent;
}) {
  const locale = useAppLocale();
  const [{ year, month }, shiftMonth] = useViewingMonth(selectedDate);
  const dates = getCalendarGrid(year, month, classDates, selectedDate);
  const monthName = new Date(year, month).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { month: "long" });
  // Distinct slot keys: abbreviated weekday labels repeat (S/S, T/T), so the
  // label alone is not a valid React key.
  const weekdayLabels = [
    { key: "sun", label: labels.weekdays.sun },
    { key: "mon", label: labels.weekdays.mon },
    { key: "tue", label: labels.weekdays.tue },
    { key: "wed", label: labels.weekdays.wed },
    { key: "thu", label: labels.weekdays.thu },
    { key: "fri", label: labels.weekdays.fri },
    { key: "sat", label: labels.weekdays.sat },
  ];

  const handleDateClick = (num: number, muted?: boolean) => {
    if (muted) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`;
    onSelectDate(dateStr);
  };

  return (
    <CardComponent sx={{ p: 2 }}>
      <MiniCalendarHeader
        monthName={monthName}
        year={year}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        labels={labels}
      />
      <Grid container columns={7} sx={{ textAlign: "center" }}>
        {weekdayLabels.map(({ key, label }) => (
          <Grid size={{ xs: 1 }} key={key}>
            <Typography
              variant="labelSm"
              sx={theme => ({
                fontWeight: 700,
                color: theme.palette.onSurfaceVariant,
              })}
            >
              {label}
            </Typography>
          </Grid>
        ))}
        {dates.map(date => (
          <MiniCalendarDayCell
            key={`date-${date.num}-${date.muted}`}
            date={date}
            onClick={handleDateClick}
            labels={labels}
          />
        ))}
      </Grid>
    </CardComponent>
  );
}

function MiniCalendarHeader({
  monthName,
  year,
  onPrev,
  onNext,
  labels,
}: {
  readonly monthName: string;
  readonly year: number;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly labels: MiniCalendarProps["labels"];
}) {
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
        {labels.monthDisplay(monthName, String(year))}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" aria-label={labels.ariaLabels.previousMonth} onClick={onPrev} sx={{ p: 0.5 }}>
          <ChevronLeftOutlined sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" aria-label={labels.ariaLabels.nextMonth} onClick={onNext} sx={{ p: 0.5 }}>
          <ChevronRightOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function MiniCalendarDayCell({
  date,
  onClick,
  labels,
}: {
  readonly date: MiniCalendarDate;
  readonly onClick: (num: number, muted?: boolean) => void;
  readonly labels: MiniCalendarProps["labels"];
}) {
  return (
    <Grid size={{ xs: 1 }} key={`date-${date.num}-${date.muted}`} sx={{ p: 0.25 }}>
      <Box
        role={date.muted ? undefined : "button"}
        tabIndex={date.muted ? -1 : 0}
        aria-label={date.muted ? undefined : labels.ariaLabels.selectDate}
        onClick={() => onClick(date.num, date.muted)}
        onKeyDown={
          date.muted
            ? undefined
            : e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick(date.num, date.muted);
                }
              }
        }
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
          variant="labelSm"
          sx={theme => ({
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
