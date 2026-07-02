"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material";
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
  alignItems: "center",
  gap: theme.spacing(0.75),
  minWidth: 0,
  width: "100%",
  [theme.breakpoints.up("md")]: {
    alignItems: "flex-end",
    gap: theme.spacing(1),
    width: "auto",
  },
}));

const StyledDateNavButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: Number(theme.shape.borderRadius),
  backgroundColor: theme.palette.surfaceContainerLowest,
  flexShrink: 0,
  width: 36,
  height: 36,
  [theme.breakpoints.up("md")]: {
    width: 40,
    height: 40,
  },
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
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
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
        label={isCompact ? undefined : dateLabel}
        value={selectedDate}
        onChange={(date: Date | null) => {
          onDateChange(date && isValid(date) ? format(date, DATE_FILTER_FORMAT) : "");
        }}
        slotProps={{
          textField: {
            size: "small",
            sx: theme => ({
              flex: 1,
              minWidth: 0,
              [theme.breakpoints.up("md")]: {
                minWidth: 180,
                flex: "initial",
              },
            }),
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
        sx={{
          flexShrink: 0,
          minWidth: "auto",
          px: { xs: 0.75, md: 1.5 },
          height: { xs: 36, md: 40 },
          whiteSpace: "nowrap",
        }}
      >
        {todayLabel}
      </Button>
    </StyledDateControls>
  );
}
