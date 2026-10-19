"use client";

import { CalendarToday, PictureAsPdf } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  type MonthNavigatorMonthDisplayProps,
  MonthNavigatorShared,
} from "@/frontend/common/views/dashboard/students/history/components/__shared__";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

const MONTH_LONG_OPTIONS: Intl.DateTimeFormatOptions = { month: "long" };

function MobileMonthDisplay({ monthStr, yearStr }: Readonly<MonthNavigatorMonthDisplayProps>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: theme.palette.primary.main,
        px: 2,
        py: 1,
        borderRadius: 2,
        color: theme.palette.onPrimary,
      })}
    >
      <CalendarToday sx={{ fontSize: 18 }} />
      <Typography variant="buttonText">{`${monthStr} ${yearStr}`}</Typography>
    </Box>
  );
}

export function HistoryMobileActions({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onPrint,
  canGoPrev,
  canGoNext,
}: Readonly<{
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrint: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}>) {
  const t = useStudentHistoryLabels();
  const locale = useAppLocale();
  const monthStr = getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_LONG_OPTIONS)
    .format(currentMonth)
    .toUpperCase();
  const yearStr = currentMonth.getFullYear();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      }}
    >
      <MonthNavigatorShared
        monthStr={monthStr}
        yearStr={yearStr}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        labels={t}
        tier={{
          MonthDisplay: MobileMonthDisplay,
          chevronSize: "small",
          stepperButtonSx: enabled => theme => ({
            backgroundColor: enabled ? theme.palette.primary.main : theme.palette.action.disabledBackground,
            color: enabled ? theme.palette.onPrimary : theme.palette.action.disabled,
            borderRadius: 2,
            "&:hover": {
              backgroundColor: enabled ? theme.palette.primary.dark : theme.palette.action.disabledBackground,
            },
          }),
          containerSx: { display: "flex", alignItems: "center", gap: 1 },
        }}
      />
      <Tooltip title={t.exportPdf}>
        <IconButton
          type="button"
          aria-label={t.exportPdf}
          onClick={onPrint}
          sx={theme => ({
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.surfaceContainerHigh,
            borderRadius: 2,
            color: theme.palette.primary.main,
            boxShadow: theme.palette.shadow.button,
            border: "none",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: theme.palette.surfaceContainerHigh,
            },
          })}
        >
          <PictureAsPdf />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
