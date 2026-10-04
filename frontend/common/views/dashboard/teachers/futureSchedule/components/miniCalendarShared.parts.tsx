"use client";

import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, Grid, IconButton, Stack, Typography } from "@mui/material";
import type { MiniCalendarDate } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

interface MiniCalendarHeaderProps {
  readonly monthName: string;
  readonly year: number;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly labels: TeacherFutureScheduleLabels;
}

export function MiniCalendarHeader({ monthName, year, onPrev, onNext, labels }: Readonly<MiniCalendarHeaderProps>) {
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

interface MiniCalendarDayCellProps {
  readonly date: MiniCalendarDate;
  readonly onClick: (num: number, muted?: boolean) => void;
  readonly labels: TeacherFutureScheduleLabels;
}

export function MiniCalendarDayCell({ date, onClick, labels }: Readonly<MiniCalendarDayCellProps>) {
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
