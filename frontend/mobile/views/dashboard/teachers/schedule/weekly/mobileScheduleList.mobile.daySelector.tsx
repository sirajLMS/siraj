"use client";

import { Box, Button } from "@mui/material";
import { WEEKLY_SCHEDULE_DAYS } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import { isDayKey } from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile.utils";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";

interface DaySelectorProps {
  readonly selectedDay: string;
  readonly onSelect: (day: string) => void;
  readonly labels: TeacherWeeklyScheduleLabels;
}

export function DaySelector({ selectedDay, onSelect, labels }: Readonly<DaySelectorProps>) {
  const t = labels;
  return (
    <Box
      sx={theme => ({
        py: 2,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <MobileHorizontalScrollRow leadSpacing={0} sx={theme => ({ gap: theme.spacing(1.25), paddingBottom: 0 })}>
        {WEEKLY_SCHEDULE_DAYS.map(day => {
          const abbr = day.slice(0, 3);
          const dayKey = isDayKey(abbr, t.days) ? abbr : day;
          const isSelected = selectedDay === day;

          return (
            <Button
              key={day}
              variant={isSelected ? "contained" : "outlined"}
              onClick={() => {
                onSelect(day);
              }}
              sx={theme => ({
                flexShrink: 0,
                scrollSnapAlign: "start",
                minWidth: 56,
                minHeight: 40,
                borderRadius: "9999px",
                px: 2.5,
                py: 1,
                typography: "labelMd",
                fontWeight: isSelected ? 700 : 500,
                textTransform: "none",
                backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.surfaceContainerLow,
                color: isSelected ? theme.palette.onPrimary : theme.palette.onSurfaceVariant,
                borderColor: isSelected ? theme.palette.primary.main : theme.palette.outlineVariant,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: isSelected ? theme.palette.primary.dark : theme.palette.action.hover,
                  boxShadow: "none",
                },
              })}
            >
              {t.days[dayKey]}
            </Button>
          );
        })}
      </MobileHorizontalScrollRow>
    </Box>
  );
}
