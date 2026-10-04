"use client";

import { Box, Drawer } from "@mui/material";
import {
  DrawerContent,
  DrawerHeader,
  MonthNavigator,
} from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawerShared.parts";
import type { TeacherAvailabilityMonthDrawerSharedProps } from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawerShared.types";

export function TeacherAvailabilityMonthDrawerShared({
  labels,
  open,
  teacher,
  currentMonth,
  monthDrawerLoading,
  monthDrawerError,
  daysByDate,
  onClose,
  onMonthChange,
  CalendarGridComponent,
  drawerAnchor,
  drawerPaperSx,
}: Readonly<TeacherAvailabilityMonthDrawerSharedProps>) {
  return (
    <Drawer
      anchor={drawerAnchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: drawerPaperSx,
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DrawerHeader title={labels.monthScheduleTitle(teacher?.name ?? "")} labels={labels} onClose={onClose} />
        <MonthNavigator labels={labels} currentMonth={currentMonth} onMonthChange={onMonthChange} />
        <DrawerContent
          labels={labels}
          loading={monthDrawerLoading}
          error={monthDrawerError}
          currentMonth={currentMonth}
          daysByDate={daysByDate}
          CalendarGridComponent={CalendarGridComponent}
        />
      </Box>
    </Drawer>
  );
}
