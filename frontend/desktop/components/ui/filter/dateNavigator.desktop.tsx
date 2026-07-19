"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid } from "date-fns";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDatePicker";
import { rtlFlipIconSxDesktop } from "@/frontend/desktop/components/ui/utils/rtlFlipIconSx.desktop";
import {
  getTodayScheduleFilterDateDesktop,
  isScheduleFilterDateTodayDesktop,
  parseScheduleFilterDateDesktop,
  shiftScheduleFilterDateDesktop,
} from "@/frontend/desktop/components/ui/utils/scheduleFilterDate.desktop";

const StyledDateControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  gap: theme.spacing(1),
  flexShrink: 0,
  width: "auto",
}));

const StyledDateNavButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: Number(theme.shape.borderRadius),
  backgroundColor: theme.palette.surfaceContainerLowest,
  flexShrink: 0,
  width: 40,
  height: 40,
  "&.Mui-disabled": {
    opacity: 0.5,
  },
}));

const DATE_FILTER_FORMAT = "yyyy-MM-dd";

export interface DateNavigatorDesktopProps {
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel?: string;
  readonly onDateChange: (date: string) => void;
}

export function DateNavigatorDesktop({
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  dateLabel,
  onDateChange,
}: Readonly<DateNavigatorDesktopProps>) {
  const selectedDate = parseScheduleFilterDateDesktop(dateValue);
  const isTodaySelected = isScheduleFilterDateTodayDesktop(dateValue);

  return (
    <StyledDateControls>
      <Tooltip title={previousDayLabel}>
        <StyledDateNavButton
          size="small"
          aria-label={previousDayLabel}
          onClick={() => onDateChange(shiftScheduleFilterDateDesktop(dateValue, -1))}
        >
          <ChevronLeft fontSize="small" sx={rtlFlipIconSxDesktop} />
        </StyledDateNavButton>
      </Tooltip>

      <DesktopAppDatePicker
        label={dateLabel}
        value={selectedDate}
        onChange={(date: Date | null) => {
          onDateChange(date && isValid(date) ? format(date, DATE_FILTER_FORMAT) : "");
        }}
        slotProps={{
          textField: {
            size: "small",
            sx: {
              minWidth: 180,
              flex: "initial",
            },
            slotProps: { htmlInput: { autoComplete: "off" } },
          },
        }}
      />

      <Tooltip title={nextDayLabel}>
        <StyledDateNavButton
          size="small"
          aria-label={nextDayLabel}
          onClick={() => onDateChange(shiftScheduleFilterDateDesktop(dateValue, 1))}
        >
          <ChevronRight fontSize="small" sx={rtlFlipIconSxDesktop} />
        </StyledDateNavButton>
      </Tooltip>

      <Button
        variant="text"
        size="small"
        disabled={isTodaySelected}
        onClick={() => onDateChange(getTodayScheduleFilterDateDesktop())}
        sx={{
          flexShrink: 0,
          minWidth: "auto",
          px: 1.5,
          height: 40,
          whiteSpace: "nowrap",
        }}
      >
        {todayLabel}
      </Button>
    </StyledDateControls>
  );
}
