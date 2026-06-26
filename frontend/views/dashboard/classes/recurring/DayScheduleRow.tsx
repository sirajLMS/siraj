"use client";

import { TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid, parse } from "date-fns";
import { AppTimePicker } from "@/frontend/components/ui/form";
import { MobileDayOverrideRow } from "./MobileDayOverrideRow";
import type { DayScheduleConfig } from "./types";
import { WeekendDayRow } from "./WeekendDayRow";

const TIME_FORMAT = "HH:mm";

function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

// Row container for a day schedule entry with dynamic border/bg based on override state
const StyledDayScheduleRowContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  p: 1.5,
  borderRadius: 3,
  border: isActiveOverride ? 2 : 1,
  borderColor: isActiveOverride ? theme.palette.sidebar : theme.palette.outlineVariant,
  backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHigh : theme.palette.surface,
  transition: "background-color 0.2s",
  "&:hover": {
    backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHighest : theme.palette.surfaceContainerLow,
  },
}));

// Toggle icon button for time override with dynamic color based on override state
const StyledOverrideToggleIconButton = styled(IconButton, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  color: isActiveOverride ? theme.palette.sidebar : theme.palette.onSurfaceVariant,
  backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHighest : undefined,
  "&:hover": {
    color: theme.palette.sidebar,
    backgroundColor: theme.palette.surfaceContainerHighest,
  },
}));

// Checkbox for enabling/disabling a day with outline and primary checked colors
const StyledDayCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.outline,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

// Day label typography with dynamic color based on override state
const StyledDayLabelTypography = styled(Typography, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  fontWeight: 600,
  color: isActiveOverride ? theme.palette.sidebar : theme.palette.primary.main,
}));

// Sidebar-tinted outlined time-picker text field used when a day has an active override
const overrideTimePickerTextFieldSx = (theme: { palette: { sidebar: string } }) => ({
  width: 150,
  "& .MuiOutlinedInput-root": {
    borderColor: theme.palette.sidebar,
    borderWidth: 2,
  },
});

// Bold sidebar-colored input typography for the override time picker value
const overrideTimePickerInputSx = (theme: { palette: { sidebar: string } }) => ({
  fontWeight: 700,
  color: theme.palette.sidebar,
});

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
    <StyledDayScheduleRowContainer isActiveOverride={isActiveOverride}>
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
                sx: overrideTimePickerTextFieldSx,
                slotProps: {
                  input: {
                    sx: overrideTimePickerInputSx,
                  },
                },
              },
            }}
          />
        )}
        <StyledOverrideToggleIconButton
          isActiveOverride={isActiveOverride}
          onClick={() => {
            onToggleOverride(index);
          }}
          disabled={!day.enabled}
          aria-label={timeOverrideLabel}
        >
          <TuneOutlined />
        </StyledOverrideToggleIconButton>
      </Box>
    </StyledDayScheduleRowContainer>
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
        <StyledDayCheckbox
          checked={enabled}
          onChange={e => {
            onToggle(e.target.checked);
          }}
        />
      }
      label={<StyledDayLabelTypography isActiveOverride={isActiveOverride}>{dayLabel}</StyledDayLabelTypography>}
      sx={{ ml: 0 }}
    />
  );
}
