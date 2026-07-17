"use client";

import { TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid, parse } from "date-fns";
import { AppTimePicker } from "@/frontend/common/components/ui/form";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { WeekendDayRow } from "@/frontend/common/views/dashboard/classes/recurring/WeekendDayRow";

const TIME_FORMAT = "HH:mm";

function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

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

const StyledDayCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.outline,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

const StyledDayLabelTypography = styled(Typography, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  fontWeight: 600,
  color: isActiveOverride ? theme.palette.sidebar : theme.palette.primary.main,
}));

const overrideTimePickerTextFieldSx = (theme: { palette: { sidebar: string } }) => ({
  width: 150,
  "& .MuiOutlinedInput-root": {
    borderColor: theme.palette.sidebar,
    borderWidth: 2,
  },
});

const overrideTimePickerInputSx = (theme: { palette: { sidebar: string } }) => ({
  fontWeight: 700,
  color: theme.palette.sidebar,
});

export interface DayScheduleRowDesktopProps {
  readonly day: DayScheduleConfig;
  readonly dayLabel: string;
  readonly weekendOffLabel: string;
  readonly timeOverrideLabel: string;
  readonly index: number;
  readonly onToggleDay: (index: number, enabled: boolean) => void;
  readonly onToggleOverride: (index: number) => void;
  readonly onTimeOverrideChange: (index: number, time: string) => void;
}

export function DayScheduleRowDesktop({
  day,
  dayLabel,
  weekendOffLabel,
  timeOverrideLabel,
  index,
  onToggleDay,
  onToggleOverride,
  onTimeOverrideChange,
}: DayScheduleRowDesktopProps) {
  const isActiveOverride = day.showOverride && day.enabled && !day.isWeekend;

  if (day.isWeekend) {
    return <WeekendDayRow dayLabel={dayLabel} weekendOffLabel={weekendOffLabel} />;
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
        {isActiveOverride && (
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
