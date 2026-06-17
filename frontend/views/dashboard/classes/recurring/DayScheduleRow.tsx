"use client";

import { TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { AppTimePicker } from "@/frontend/components/ui/form";
import type { DayScheduleConfig } from "@/frontend/stores/mockCreateRecurringClassStore";
import { MobileDayOverrideRow } from "./MobileDayOverrideRow";
import { WeekendDayRow } from "./WeekendDayRow";

const TIME_FORMAT = "HH:mm";

function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

interface DayScheduleRowProps {
  readonly day: DayScheduleConfig;
  readonly dayLabel: string;
  readonly weekendOffLabel: string;
  readonly timeOverrideLabel: string;
  readonly index: number;
  readonly isMobile: boolean;
  readonly onToggleDay: (index: number, enabled: boolean) => void;
  readonly onToggleOverride: (index: number) => void;
  readonly onTimeOverrideChange: (index: number, time: string) => void;
}

export function DayScheduleRow({
  day,
  dayLabel,
  weekendOffLabel,
  timeOverrideLabel,
  index,
  isMobile,
  onToggleDay,
  onToggleOverride,
  onTimeOverrideChange,
}: DayScheduleRowProps) {
  const isActiveOverride = day.showOverride && day.enabled && !day.isWeekend;

  if (day.isWeekend) {
    return <WeekendDayRow dayLabel={dayLabel} weekendOffLabel={weekendOffLabel} />;
  }

  if (isMobile && isActiveOverride) {
    return (
      <MobileDayOverrideRow
        day={day}
        dayLabel={dayLabel}
        timeOverrideLabel={timeOverrideLabel}
        index={index}
        onToggleDay={onToggleDay}
        onToggleOverride={onToggleOverride}
        onTimeOverrideChange={onTimeOverrideChange}
      />
    );
  }

  return (
    <DayScheduleRowContainer isActiveOverride={isActiveOverride}>
      <DayScheduleLabel
        dayLabel={dayLabel}
        enabled={day.enabled}
        isActiveOverride={isActiveOverride}
        onToggle={checked => {
          onToggleDay(index, checked);
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {isActiveOverride && !isMobile && (
          <AppTimePicker
            value={parseTimeValue(day.timeOverride)}
            onChange={(date: Date | null) => {
              onTimeOverrideChange(index, date && isValid(date) ? format(date, TIME_FORMAT) : "");
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: theme => ({
                  width: 150,
                  "& .MuiOutlinedInput-root": {
                    borderColor: theme.palette.sidebar,
                    borderWidth: 2,
                  },
                }),
                slotProps: {
                  input: {
                    sx: theme => ({
                      fontWeight: 700,
                      color: theme.palette.sidebar,
                    }),
                  },
                },
              },
            }}
          />
        )}
        <IconButton
          onClick={() => {
            onToggleOverride(index);
          }}
          disabled={!day.enabled}
          sx={theme => ({
            color: isActiveOverride ? theme.palette.sidebar : theme.palette.onSurfaceVariant,
            bgcolor: isActiveOverride ? theme.palette.surfaceContainerHighest : undefined,
            "&:hover": {
              color: theme.palette.sidebar,
              bgcolor: theme.palette.surfaceContainerHighest,
            },
          })}
          aria-label={timeOverrideLabel}
        >
          <TuneOutlined />
        </IconButton>
      </Box>
    </DayScheduleRowContainer>
  );
}

function DayScheduleRowContainer({
  isActiveOverride,
  children,
}: Readonly<{ isActiveOverride: boolean; children: React.ReactNode }>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 1.5,
        borderRadius: 3,
        border: isActiveOverride ? 2 : 1,
        borderColor: isActiveOverride ? theme.palette.sidebar : theme.palette.outlineVariant,
        bgcolor: isActiveOverride ? theme.palette.surfaceContainerHigh : theme.palette.surface,
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: isActiveOverride ? theme.palette.surfaceContainerHighest : theme.palette.surfaceContainerLow,
        },
      })}
    >
      {children}
    </Box>
  );
}

function DayScheduleLabel({
  dayLabel,
  enabled,
  isActiveOverride,
  onToggle,
}: Readonly<{
  dayLabel: string;
  enabled: boolean;
  isActiveOverride: boolean;
  onToggle: (checked: boolean) => void;
}>) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={enabled}
          onChange={e => {
            onToggle(e.target.checked);
          }}
          sx={theme => ({
            color: theme.palette.outline,
            "&.Mui-checked": {
              color: theme.palette.primary.main,
            },
          })}
        />
      }
      label={
        <Typography
          sx={theme => ({
            fontWeight: 600,
            color: isActiveOverride ? theme.palette.sidebar : theme.palette.primary.main,
          })}
        >
          {dayLabel}
        </Typography>
      }
      sx={{ ml: 0 }}
    />
  );
}
