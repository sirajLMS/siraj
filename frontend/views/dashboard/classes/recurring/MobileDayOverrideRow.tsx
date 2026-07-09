"use client";

import { EventRepeatOutlined, ScheduleOutlined, TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid, parse } from "date-fns";
import { AppTimePicker } from "@/frontend/components/ui/form";
import type { DayScheduleConfig } from "@/frontend/views/dashboard/classes/recurring/types";

const TIME_FORMAT = "HH:mm";

function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

// Card container for a mobile day override row with surface background and sidebar border
const StyledDayCard = styled(Box)(({ theme }) => ({
  border: 2,
  borderColor: theme.palette.sidebar,
  borderRadius: theme.layout.radius.card,
  p: 2,
  backgroundColor: theme.palette.surface,
  boxShadow: theme.palette.shadow.card,
}));

// Checkbox styled with outline color and primary checked state
const StyledDayCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.outline,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

// Day label typography using sidebar color
const StyledDayLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.sidebar,
}));

// Circular icon button for toggling override with sidebar background
const StyledOverrideIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.sidebar,
  color: theme.palette.onSidebar,
  "&:hover": { backgroundColor: theme.palette.surfaceContainer },
}));

// Inner row container for time override controls with outline border
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

// Event repeat icon styled with sidebar color
const StyledEventRepeatIcon = styled(EventRepeatOutlined)(({ theme }) => ({
  color: theme.palette.sidebar,
}));

// Uppercase label for the time override section
const StyledOverrideLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

// Schedule icon styled with onSurfaceVariant color
const StyledScheduleIcon = styled(ScheduleOutlined)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

// Title-sized typography used as the mobile override time picker input
const mobileOverrideInputSx = { typography: "titleLg" as const };

interface MobileDayOverrideRowProps {
  readonly day: DayScheduleConfig;
  readonly dayLabel: string;
  readonly timeOverrideLabel: string;
  readonly index: number;
  readonly onToggleDay: (index: number, enabled: boolean) => void;
  readonly onToggleOverride: (index: number) => void;
  readonly onTimeOverrideChange: (index: number, time: string) => void;
}

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
              onTimeOverrideChange(index, date && isValid(date) ? format(date, TIME_FORMAT) : "");
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
