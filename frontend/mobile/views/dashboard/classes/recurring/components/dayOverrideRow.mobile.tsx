"use client";

import { EventRepeatOutlined, ScheduleOutlined, TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { AppTimePicker } from "@/frontend/common/components/ui/form";
import type { MobileDayOverrideRowProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { formatTimeValue, parseTimeValue } from "@/frontend/common/views/dashboard/classes/recurring/utils";

const StyledDayCard = styled(Box)(({ theme }) => ({
  border: 2,
  borderColor: theme.palette.sidebar,
  borderRadius: theme.layout.radius.card,
  p: 2,
  backgroundColor: theme.palette.surface,
  boxShadow: theme.palette.shadow.card,
}));

const StyledDayCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.outline,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

const StyledDayLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.sidebar,
}));

const StyledOverrideIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.sidebar,
  color: theme.palette.onSidebar,
  "&:hover": { backgroundColor: theme.palette.surfaceContainer },
}));

const StyledTimeOverrideRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  p: 1.5,
  border: 1,
  borderColor: theme.palette.outlineVariant,
  borderRadius: theme.layout.radius.button,
  backgroundColor: theme.palette.surfaceContainerLowest,
}));

const StyledEventRepeatIcon = styled(EventRepeatOutlined)(({ theme }) => ({
  color: theme.palette.sidebar,
}));

const StyledOverrideLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

const StyledScheduleIcon = styled(ScheduleOutlined)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const mobileOverrideInputSx = { typography: "titleLg" as const };

export function MobileDayOverrideRow({
  day,
  dayLabel,
  timeOverrideLabel,
  index,
  onToggleDay,
  onToggleOverride,
  onTimeOverrideChange,
}: MobileDayOverrideRowProps) {
  return (
    <StyledDayCard>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <FormControlLabel
          control={
            <StyledDayCheckbox
              checked={day.enabled}
              onChange={e => {
                onToggleDay(index, e.target.checked);
              }}
            />
          }
          label={<StyledDayLabel variant="titleLg">{dayLabel}</StyledDayLabel>}
        />
        <StyledOverrideIconButton
          onClick={() => {
            onToggleOverride(index);
          }}
          aria-label={timeOverrideLabel}
        >
          <TuneOutlined />
        </StyledOverrideIconButton>
      </Box>
      <StyledTimeOverrideRow>
        <StyledEventRepeatIcon />
        <Box sx={{ flex: 1 }}>
          <StyledOverrideLabel variant="labelMd">{timeOverrideLabel}</StyledOverrideLabel>
          <AppTimePicker
            value={parseTimeValue(day.timeOverride)}
            onChange={(date: Date | null) => {
              onTimeOverrideChange(index, formatTimeValue(date));
            }}
            slotProps={{
              textField: {
                variant: "standard",
                sx: { width: "100%" },
                slotProps: {
                  input: {
                    disableUnderline: true,
                    sx: mobileOverrideInputSx,
                  },
                },
              },
            }}
          />
        </Box>
        <StyledScheduleIcon />
      </StyledTimeOverrideRow>
    </StyledDayCard>
  );
}
