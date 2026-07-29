"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { DateNavigator } from "@/frontend/common/components/ui";

interface StyledFiltersContainerProps {
  readonly centerOnDesktop?: boolean;
}

const StyledFiltersContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "centerOnDesktop",
})<StyledFiltersContainerProps>(({ theme, centerOnDesktop }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "stretch",
  width: "100%",
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: centerOnDesktop ? "nowrap" : "wrap",
    ...(centerOnDesktop
      ? {
          width: "100%",
          justifyContent: "space-between",
          gap: theme.spacing(2),
        }
      : {}),
  },
}));

const StyledDateNavigatorSlot = styled(Box)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  [theme.breakpoints.up("md")]: {
    width: "auto",
    flexShrink: 0,
  },
}));

interface StyledTeacherSelectSlotProps {
  readonly centerOnDesktop?: boolean;
}

const StyledTeacherSelectSlot = styled(Box, {
  shouldForwardProp: prop => prop !== "centerOnDesktop",
})<StyledTeacherSelectSlotProps>(({ theme, centerOnDesktop }) => ({
  width: "100%",
  minWidth: 0,
  [theme.breakpoints.up("md")]: centerOnDesktop
    ? {
        flex: "0 0 auto",
        width: 280,
        minWidth: 200,
        maxWidth: 360,
      }
    : {
        flex: "1 1 200px",
        minWidth: 200,
        maxWidth: 360,
      },
}));

interface ScheduleFiltersProps {
  readonly dateLabel: string;
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly teacherSelect: ReactNode;
  readonly onDateChange: (date: string) => void;
  /** When true, the filter row spans full width with space-between on desktop. */
  readonly centerOnDesktop?: boolean;
}

export function ScheduleFilters({
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  teacherSelect,
  onDateChange,
  centerOnDesktop = false,
}: Readonly<ScheduleFiltersProps>) {
  return (
    <StyledFiltersContainer centerOnDesktop={centerOnDesktop}>
      <StyledDateNavigatorSlot>
        <DateNavigator
          dateValue={dateValue}
          todayLabel={todayLabel}
          previousDayLabel={previousDayLabel}
          nextDayLabel={nextDayLabel}
          dateLabel={dateLabel}
          onDateChange={onDateChange}
        />
      </StyledDateNavigatorSlot>

      <StyledTeacherSelectSlot centerOnDesktop={centerOnDesktop}>{teacherSelect}</StyledTeacherSelectSlot>
    </StyledFiltersContainer>
  );
}
