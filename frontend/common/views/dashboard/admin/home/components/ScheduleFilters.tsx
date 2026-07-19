"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { DateNavigator } from "@/frontend/common/components/ui";

const StyledFiltersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "stretch",
  width: "100%",
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
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

const StyledTeacherSelectSlot = styled(Box)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  [theme.breakpoints.up("md")]: {
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
}

export function ScheduleFilters({
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  teacherSelect,
  onDateChange,
}: Readonly<ScheduleFiltersProps>) {
  return (
    <StyledFiltersContainer>
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

      <StyledTeacherSelectSlot>{teacherSelect}</StyledTeacherSelectSlot>
    </StyledFiltersContainer>
  );
}
