"use client";

import { CalendarToday, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, type Theme, Typography } from "@mui/material";
import type { SystemStyleObject } from "@mui/system/styleFunctionSx";

export interface MonthNavigatorLabels {
  readonly previousMonth: string;
  readonly nextMonth: string;
}

export interface MonthNavigatorProps {
  readonly monthLabel: string;
  readonly canGoNext: boolean;
  readonly labels: MonthNavigatorLabels;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  /** Extra sx on the outer flex container. Desktop passes `{ mb: 2, gap: 2 }`, mobile passes `{}`. */
  readonly outerSx?: SystemStyleObject<Theme>;
  /** Gap between calendar icon and month text. Desktop: 1, mobile: 0.75. */
  readonly innerGap?: number;
  /** Calendar icon font size. Desktop: 20, mobile: 18. */
  readonly iconFontSize?: number;
}

function navButtonSx(theme: Theme) {
  return {
    minWidth: 40,
    transform: theme.direction === "rtl" ? ("scaleX(-1)" as const) : undefined,
  };
}

const BASE_SX = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
} as const satisfies SystemStyleObject<Theme>;

/**
 * Shared month navigator with prev/next buttons and calendar icon.
 * Used by both desktop and mobile student history/sessions views.
 */
export function MonthNavigator({
  monthLabel,
  canGoNext,
  labels,
  onPrevMonth,
  onNextMonth,
  outerSx,
  innerGap = 0.75,
  iconFontSize = 18,
}: Readonly<MonthNavigatorProps>) {
  return (
    <Box sx={outerSx ? [BASE_SX, outerSx] : BASE_SX}>
      <Button aria-label={labels.previousMonth} onClick={onPrevMonth} sx={navButtonSx}>
        <ChevronLeft />
      </Button>
      <Box sx={{ display: "flex", alignItems: "center", gap: innerGap }}>
        <CalendarToday sx={theme => ({ fontSize: iconFontSize, color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {monthLabel}
        </Typography>
      </Box>
      <Button
        aria-label={labels.nextMonth}
        onClick={onNextMonth}
        disabled={!canGoNext}
        sx={theme => ({ ...navButtonSx(theme), opacity: canGoNext ? 1 : 0.5 })}
      >
        <ChevronRight />
      </Button>
    </Box>
  );
}
