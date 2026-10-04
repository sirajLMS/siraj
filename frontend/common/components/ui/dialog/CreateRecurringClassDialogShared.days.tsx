"use client";

import { Box, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { buildDayLabels } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/constants";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale";

/** A single weekday row with an optional per-day time override. */
function DayScheduleItem({
  dayConfig,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  mutationLoading,
  t,
  direction,
}: {
  readonly dayConfig: DayScheduleConfig;
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly direction: "row" | "column";
}) {
  const d = dayConfig;
  const dayLabels = buildDayLabels(t);
  return (
    <Box
      sx={theme => ({
        display: "flex",
        flexDirection: direction,
        alignItems: direction === "row" ? "center" : undefined,
        justifyContent: direction === "row" ? "space-between" : undefined,
        gap: direction === "column" ? 1 : undefined,
        p: 1,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
      })}
    >
      <FormControlLabel
        control={<Checkbox checked={d.enabled} onChange={() => toggleDay(d.day)} disabled={mutationLoading} />}
        label={dayLabels[d.day.toLowerCase()]}
      />
      {d.enabled && (
        <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={d.showOverride}
                onChange={() => toggleTimeOverride(d.day)}
                disabled={mutationLoading}
              />
            }
            label={t.timeOverride.addOverride}
          />
          {d.showOverride && (
            <TextField
              size="small"
              type="time"
              value={d.timeOverride}
              onChange={e => setTimeOverride(d.day, e.target.value)}
              disabled={mutationLoading}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          )}
        </Stack>
      )}
    </Box>
  );
}

/** Weekday schedule list with its section heading. */
export function DayScheduleList({
  days,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  mutationLoading,
  t,
  dayItemDirection,
}: {
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly dayItemDirection: "row" | "column";
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t.fields.days}
      </Typography>
      <Stack sx={{ gap: 1 }}>
        {days.map(d => (
          <DayScheduleItem
            key={d.day}
            dayConfig={d}
            toggleDay={toggleDay}
            toggleTimeOverride={toggleTimeOverride}
            setTimeOverride={setTimeOverride}
            mutationLoading={mutationLoading}
            t={t}
            direction={dayItemDirection}
          />
        ))}
      </Stack>
    </Box>
  );
}
