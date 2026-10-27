"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system/styleFunctionSx";
import type {
  MonthNavigatorLabels,
  MonthNavigatorTierOptions,
} from "@/frontend/common/views/dashboard/students/history/components/__shared__/monthNavigatorShared.types";

interface MonthNavigatorSharedProps {
  readonly monthStr: string;
  readonly yearStr: number;
  readonly canGoPrev: boolean;
  readonly canGoNext: boolean;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly labels: MonthNavigatorLabels;
  readonly tier: MonthNavigatorTierOptions;
}

export function MonthNavigatorShared({
  monthStr,
  yearStr,
  canGoPrev,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  labels,
  tier,
}: Readonly<MonthNavigatorSharedProps>) {
  const { MonthDisplay, chevronSize, stepperButtonSx, containerSx } = tier;

  const buttonSx =
    (enabled: boolean) =>
    (theme: Theme): SystemStyleObject<Theme> => ({
      transform: theme.direction === "rtl" ? ("scaleX(-1)" as const) : undefined,
      ...(stepperButtonSx ? stepperButtonSx(enabled)(theme) : {}),
    });

  const prevButton = (
    <IconButton
      onClick={onPrevMonth}
      size={chevronSize}
      disabled={!canGoPrev}
      aria-label={labels.previousMonth}
      sx={buttonSx(canGoPrev)}
    >
      <ChevronLeft />
    </IconButton>
  );

  const nextButton = (
    <IconButton
      onClick={onNextMonth}
      size={chevronSize}
      disabled={!canGoNext}
      aria-label={labels.nextMonth}
      sx={buttonSx(canGoNext)}
    >
      <ChevronRight />
    </IconButton>
  );

  return (
    <Box sx={containerSx}>
      <Tooltip title={labels.previousMonth}>
        {!canGoPrev ? (
          <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
            {prevButton}
          </Box>
        ) : (
          prevButton
        )}
      </Tooltip>
      <MonthDisplay monthStr={monthStr} yearStr={yearStr} />
      <Tooltip title={labels.nextMonth}>
        {!canGoNext ? (
          <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
            {nextButton}
          </Box>
        ) : (
          nextButton
        )}
      </Tooltip>
    </Box>
  );
}
