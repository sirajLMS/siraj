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
  gap: 1,
  px: 1.5,
  py: 1,
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

function mobileOverrideTimePickerTextFieldSx(theme: Parameters<typeof overrideTimePickerTextFieldSx>[0]) {
  return {
    ...overrideTimePickerTextFieldSx(theme),
    width: 168,
    minWidth: 168,
    flexShrink: 0,
  };
}

export function DayScheduleRowMobile({
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexShrink: 0 }}>
        {isActiveOverride && (
          <AppTimePicker
            value={parseTimeValue(day.timeOverride)}
            onChange={(date: Date | null) => {
              onTimeOverrideChange(index, formatTimeValue(date));
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: mobileOverrideTimePickerTextFieldSx,
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
              size="small"
              isActiveOverride={isActiveOverride}
              onClick={() => {
                onToggleOverride(index);
              }}
              disabled={!day.enabled}
              aria-label={timeOverrideLabel}
            >
              <TuneOutlined fontSize="small" />
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
          size="small"
          checked={enabled}
          onChange={e => {
            onToggle(e.target.checked);
          }}
        />
      }
      label={<StyledDayLabelTypography variant="bodyMd">{dayLabel}</StyledDayLabelTypography>}
      sx={{ ml: 0, mr: 0, minWidth: 0 }}
    />
  );
}
