"use client";

import { TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { DayScheduleRowProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { WeekendDayRow } from "@/frontend/common/views/dashboard/classes/recurring/WeekendDayRow";
import { MobileDayOverrideRow } from "@/frontend/mobile/views/dashboard/classes/recurring/components/dayOverrideRow.mobile";

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

export function DayScheduleRowMobile({
  day,
  dayLabel,
  weekendOffLabel,
  timeOverrideLabel,
  index,
  onToggleDay,
  onToggleOverride,
  onTimeOverrideChange,
}: DayScheduleRowProps) {
  const isActiveOverride = day.showOverride && day.enabled && !day.isWeekend;

  if (day.isWeekend) {
    return <WeekendDayRow dayLabel={dayLabel} weekendOffLabel={weekendOffLabel} />;
  }

  if (isActiveOverride) {
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
