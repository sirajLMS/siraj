"use client";

import { TuneOutlined } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time";
import { DayScheduleLabel } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.parts";
import {
  StyledDayScheduleRowContainer,
  StyledOverrideToggleIconButton,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.styled";
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
