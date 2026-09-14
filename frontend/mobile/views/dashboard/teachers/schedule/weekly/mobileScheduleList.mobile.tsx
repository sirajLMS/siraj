"use client";

import { Box, Button, Typography } from "@mui/material";
import {
  WeeklyScheduleSlotItemShared,
  type WeeklyScheduleSlotItemSharedOptions,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/weeklyScheduleSlotItemShared";
import {
  WEEKLY_SCHEDULE_DAYS,
  WEEKLY_SCHEDULE_TIMES,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  MobileScheduleListProps,
  ScheduledClass,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import { MobileBaseDeleteDialog } from "@/frontend/mobile/components/ui/dialog";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

interface MobileSlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

const MOBILE_SLOT_ITEM_OPTIONS: WeeklyScheduleSlotItemSharedOptions = {
  cardBorderRadius: 1.5,
  cardPaddingX: 1.5,
  cardPaddingY: 1.25,
  cardGap: 0.75,
  subjectVariant: "bodyMd",
  actionsGap: 0.75,
  actionsMinHeight: 24,
  JoinAction: MobileMeetingJoinAction,
  DeleteDialog: MobileBaseDeleteDialog,
  renderStudentLink: (href, name) => (
    <MobilePersonProfileLink href={href} name={name} showAvatar={false} typographyVariant="bodyMd" fontWeight={500} />
  ),
};

function MobileSlotItem(props: Readonly<MobileSlotItemProps>) {
  return <WeeklyScheduleSlotItemShared {...props} options={MOBILE_SLOT_ITEM_OPTIONS} />;
}

interface DaySelectorProps {
  readonly selectedDay: string;
  readonly onSelect: (day: string) => void;
  readonly labels: TeacherWeeklyScheduleLabels;
}

function isDayKey<T extends Record<string, unknown>>(key: string, days: T): key is keyof T & string {
  return key in days;
}

function DaySelector({ selectedDay, onSelect, labels }: Readonly<DaySelectorProps>) {
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

interface TimeSlotRowProps {
  readonly time: string;
  readonly slotClasses: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

function TimeSlotRow({
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

export default function MobileScheduleList({
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
  selectedDay,
  onSelectDay,
}: Readonly<MobileScheduleListProps>) {
  const getClassesForSlot = (day: string, time: string) => {
    return classes.filter(c => c.day?.toLowerCase() === day && c.startTime === time);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <DaySelector selectedDay={selectedDay} onSelect={onSelectDay} labels={labels} />

      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          mt: 2,
          backgroundColor: theme.palette.border.light,
          borderRadius: theme.layout.radius.card,
          overflow: "hidden",
          border: `1px solid ${theme.palette.border.light}`,
        })}
      >
        {WEEKLY_SCHEDULE_TIMES.map(time => (
          <TimeSlotRow
            key={time}
            time={time}
            slotClasses={getClassesForSlot(selectedDay, time)}
            onRemoveClass={onRemoveClass}
            hasScheduleDeleteClass={hasScheduleDeleteClass}
            labels={labels}
            meetingJoinLabels={meetingJoinLabels}
          />
        ))}
      </Box>
    </Box>
  );
}
