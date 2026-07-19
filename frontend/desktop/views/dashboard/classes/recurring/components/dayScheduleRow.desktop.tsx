"use client";

import { TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { AppTimePicker } from "@/frontend/common/components/ui/form";
import type { DayScheduleRowProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  formatTimeValue,
  overrideTimePickerInputSx,
  overrideTimePickerTextFieldSx,
  parseTimeValue,
} from "@/frontend/common/views/dashboard/classes/recurring/utils";

const StyledDayScheduleRowContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  p: 1.5,
  borderRadius: 3,
  border: isActiveOverride ? 2 : 1,
  borderColor: isActiveOverride ? theme.palette.primary.main : theme.palette.outlineVariant,
  backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHigh : theme.palette.surface,
  transition: "background-color 0.2s",
  "&:hover": {
    backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHighest : theme.palette.surfaceContainerLow,
  },
}));

const StyledOverrideToggleIconButton = styled(IconButton, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  color: isActiveOverride ? theme.palette.primary.main : theme.palette.onSurfaceVariant,
  backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHighest : undefined,
  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.surfaceContainerHighest,
  },
}));

const StyledDayCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.outline,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

const StyledDayLabelTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

export function DayScheduleRowDesktop({
  day,
  dayLabel,
  timeOverrideLabel,
  index,
  onToggleDay,
  onToggleOverride,
  onTimeOverrideChange,
}: DayScheduleRowProps) {
  const isActiveOverride = day.showOverride && day.enabled;

  return (
    <StyledDayScheduleRowContainer isActiveOverride={isActiveOverride}>
      <DayScheduleLabel
        dayLabel={dayLabel}
        enabled={day.enabled}
        onToggle={checked => {
          onToggleDay(index, checked);
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {isActiveOverride && (
          <AppTimePicker
            value={parseTimeValue(day.timeOverride)}
            onChange={(date: Date | null) => {
              onTimeOverrideChange(index, formatTimeValue(date));
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
        <Tooltip title={timeOverrideLabel}>
          <span>
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
          </span>
        </Tooltip>
      </Box>
    </StyledDayScheduleRowContainer>
  );
}

function DayScheduleLabel({
  dayLabel,
  enabled,
  onToggle,
}: Readonly<{
  dayLabel: string;
  enabled: boolean;
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
      label={<StyledDayLabelTypography>{dayLabel}</StyledDayLabelTypography>}
      sx={{ ml: 0 }}
    />
  );
}
