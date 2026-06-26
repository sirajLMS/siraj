"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid } from "date-fns";
import { AppDatePicker } from "@/frontend/components/ui/form/AppDatePicker";
import { rtlFlipIconSx } from "@/frontend/utils/rtlFlipIconSx";
import {
  getTodayScheduleFilterDate,
  isScheduleFilterDateToday,
  parseScheduleFilterDate,
  shiftScheduleFilterDate,
} from "@/frontend/utils/scheduleFilterDate";

const StyledDateControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  gap: theme.spacing(1),
}));

const StyledDateNavButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: Number(theme.shape.borderRadius),
  backgroundColor: theme.palette.surfaceContainerLowest,
  width: 40,
  height: 40,
  "&.Mui-disabled": {
    opacity: 0.5,
  },
}));

const DATE_FILTER_FORMAT = "yyyy-MM-dd";

export interface DateNavigatorProps {
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel?: string;
  readonly onDateChange: (date: string) => void;
}

export function DateNavigator({
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  dateLabel,
  onDateChange,
}: Readonly<DateNavigatorProps>) {
  const selectedDate = parseScheduleFilterDate(dateValue);
  const isTodaySelected = isScheduleFilterDateToday(dateValue);

  return (
    <StyledDateControls>
      <Tooltip title={previousDayLabel}>
        <StyledDateNavButton
          size="small"
          aria-label={previousDayLabel}
          onClick={() => onDateChange(shiftScheduleFilterDate(dateValue, -1))}
        >
          <ChevronLeft fontSize="small" sx={rtlFlipIconSx} />
        </StyledDateNavButton>
      </Tooltip>

      <AppDatePicker
        label={dateLabel}
        value={selectedDate}
        onChange={(date: Date | null) => {
          onDateChange(date && isValid(date) ? format(date, DATE_FILTER_FORMAT) : "");
        }}
        slotProps={{
          textField: {
            size: "small",
            sx: { minWidth: 180 },
            slotProps: { htmlInput: { autoComplete: "off" } },
          },
        }}
      />

      <Tooltip title={nextDayLabel}>
        <StyledDateNavButton
          size="small"
          aria-label={nextDayLabel}
          onClick={() => onDateChange(shiftScheduleFilterDate(dateValue, 1))}
        >
          <ChevronRight fontSize="small" sx={rtlFlipIconSx} />
        </StyledDateNavButton>
      </Tooltip>

      <Button
        variant="text"
        size="small"
        disabled={isTodaySelected}
        onClick={() => onDateChange(getTodayScheduleFilterDate())}
        sx={{ minWidth: 64, height: 40 }}
      >
        {todayLabel}
      </Button>
    </StyledDateControls>
  );
}
