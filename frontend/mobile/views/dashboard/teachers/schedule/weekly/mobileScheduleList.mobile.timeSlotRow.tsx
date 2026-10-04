"use client";

import { Box, Typography } from "@mui/material";
import { WeeklyScheduleSlotItemShared } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/weeklyScheduleSlotItemShared";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { MOBILE_SLOT_ITEM_OPTIONS } from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile.options";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

interface MobileSlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

function MobileSlotItem(props: Readonly<MobileSlotItemProps>) {
  return <WeeklyScheduleSlotItemShared {...props} options={MOBILE_SLOT_ITEM_OPTIONS} />;
}

interface TimeSlotRowProps {
  readonly time: string;
  readonly slotClasses: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

export function TimeSlotRow({
  time,
  slotClasses,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<TimeSlotRowProps>) {
  const t = labels;
  const isLunch = time === "12:00 PM";

  let content = (
    <Typography
      sx={theme => ({ m: "auto", color: theme.palette.text.disabled, fontSize: theme.typography.bodyMd.fontSize })}
    >
      {t.grid.available}
    </Typography>
  );

  if (isLunch) {
    content = (
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.text.secondary,
          m: "auto",
        })}
      >
        <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 18 }}>
          restaurant
        </Box>
        <Typography variant="labelUppercase" sx={{ fontStyle: "italic" }}>
          {t.grid.lunchBreak}
        </Typography>
      </Box>
    );
  } else if (slotClasses.length > 0) {
    content = (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.75, py: 0.5 }}>
        {slotClasses.map(c => (
          <MobileSlotItem
            key={c.id}
            classItem={c}
            onRemove={onRemoveClass}
            hasScheduleDeleteClass={hasScheduleDeleteClass}
            labels={labels}
            meetingJoinLabels={meetingJoinLabels}
          />
        ))}
      </Box>
    );
  }

  let slotMinHeight = 64;
  if (isLunch) {
    slotMinHeight = 48;
  } else if (slotClasses.length > 0) {
    slotMinHeight = 96;
  }

  return (
    <Box
      sx={theme => ({
        display: "flex",
        minHeight: slotMinHeight,
        backgroundColor: theme.palette.background.paper,
      })}
    >
      <Box
        sx={theme => ({
          width: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.border.light}`,
        })}
      >
        <Typography
          variant="labelUppercase"
          sx={theme => ({ fontSize: theme.typography.labelUppercase.fontSize, color: theme.palette.text.secondary })}
        >
          {time}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, px: 1, py: 0.5, display: "flex", alignItems: "stretch" }}>{content}</Box>
    </Box>
  );
}
