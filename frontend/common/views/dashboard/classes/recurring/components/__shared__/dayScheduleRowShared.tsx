"use client";

import { TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Tooltip, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time";
import type { DayScheduleRowProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  formatTimeValue,
  overrideTimePickerInputSx,
  parseTimeValue,
} from "@/frontend/common/views/dashboard/classes/recurring/utils";

export interface DayScheduleRowSharedOptions {
  readonly containerSx: (theme: Theme) => Record<string, unknown>;
  readonly checkboxSize: "small" | "medium";
  readonly iconButtonSize: "small" | "medium";
  readonly iconNameSize: "small" | "medium" | "large" | "inherit";
  readonly timePickerTextFieldSx: (theme: Theme) => Record<string, unknown>;
  readonly labelTypographyVariant: "bodyMd" | "inherit" | undefined;
  readonly labelSx: object;
  readonly controlsBoxSx: object;
}

const StyledDayScheduleRowContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
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

function DayScheduleLabel({
  dayLabel,
  enabled,
  onToggle,
  checkboxSize,
  labelTypographyVariant,
  labelSx,
}: Readonly<{
  dayLabel: string;
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  checkboxSize: "small" | "medium";
  labelTypographyVariant: "bodyMd" | "inherit" | undefined;
  labelSx: object;
}>) {
  return (
    <FormControlLabel
      control={
        <StyledDayCheckbox
          size={checkboxSize}
          checked={enabled}
          onChange={e => {
            onToggle(e.target.checked);
          }}
        />
      }
      label={
        labelTypographyVariant ? (
          <StyledDayLabelTypography variant={labelTypographyVariant}>{dayLabel}</StyledDayLabelTypography>
        ) : (
          <StyledDayLabelTypography>{dayLabel}</StyledDayLabelTypography>
        )
      }
      sx={labelSx}
    />
  );
}

export function DayScheduleRowShared({
  day,
  dayLabel,
  timeOverrideLabel,
  index,
  onToggleDay,
  onToggleOverride,
  onTimeOverrideChange,
  options,
}: DayScheduleRowProps & { readonly options: DayScheduleRowSharedOptions }) {
  const isActiveOverride = day.showOverride && day.enabled;

  return (
    <StyledDayScheduleRowContainer isActiveOverride={isActiveOverride} sx={options.containerSx}>
      <DayScheduleLabel
        dayLabel={dayLabel}
        enabled={day.enabled}
        onToggle={checked => {
          onToggleDay(index, checked);
        }}
        checkboxSize={options.checkboxSize}
        labelSx={options.labelSx}
        labelTypographyVariant={options.labelTypographyVariant}
      />

      <Box sx={options.controlsBoxSx}>
        {isActiveOverride && (
          <AppTimePicker
            value={parseTimeValue(day.timeOverride)}
            onChange={(date: Date | null) => {
              onTimeOverrideChange(index, formatTimeValue(date));
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: options.timePickerTextFieldSx,
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
              size={options.iconButtonSize}
              isActiveOverride={isActiveOverride}
              onClick={() => {
                onToggleOverride(index);
              }}
              disabled={!day.enabled}
              aria-label={timeOverrideLabel}
            >
              <TuneOutlined fontSize={options.iconNameSize} />
            </StyledOverrideToggleIconButton>
          </span>
        </Tooltip>
      </Box>
    </StyledDayScheduleRowContainer>
  );
}
