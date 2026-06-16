"use client";

import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, Grid, IconButton, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui/BaseCard";

interface CalendarDate {
  num: number;
  muted?: boolean;
  active?: boolean;
  selected?: boolean;
  dot?: boolean;
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
const DATES: CalendarDate[] = [
  { num: 1, muted: true },
  { num: 2, muted: true },
  { num: 3, muted: true },
  { num: 4, muted: true },
  { num: 5, muted: true },
  { num: 6, muted: true },
  { num: 7, muted: true },
  { num: 22 },
  { num: 23, active: true },
  { num: 24, dot: true, selected: true },
  { num: 25, dot: true, selected: true },
  { num: 26 },
  { num: 27 },
  { num: 28 },
];

function CalendarHeader() {
  const t = useTranslations("dashboard.teacherFutureSchedule");
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
        {t("monthDisplay", { month: "October", year: "2023" })}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small">
          <ChevronLeftOutlined sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small">
          <ChevronRightOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function CalendarDateCell({ date }: Readonly<{ date: CalendarDate }>) {
  return (
    <Grid size={{ xs: 1 }} sx={{ p: 0.5 }}>
      <Box
        sx={theme => ({
          width: 28,
          height: 28,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          position: "relative",
          cursor: "pointer",
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

export function MiniCalendar() {
  return (
    <BaseCard sx={{ p: 3 }}>
      <CalendarHeader />

      <Grid container columns={7} sx={{ textAlign: "center" }}>
        {DAYS.map(day => (
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
        {DATES.map(date => (
          <CalendarDateCell key={`date-${date.num}`} date={date} />
        ))}
      </Grid>
    </BaseCard>
  );
}
