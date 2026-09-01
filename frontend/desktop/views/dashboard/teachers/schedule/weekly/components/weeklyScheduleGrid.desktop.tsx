"use client";

import { Box, Typography } from "@mui/material";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import {
  WeeklyScheduleSlotItemShared,
  type WeeklyScheduleSlotItemSharedOptions,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/weeklyScheduleSlotItemShared";
import {
  WEEKLY_SCHEDULE_DAYS,
  WEEKLY_SCHEDULE_TIMES,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  ScheduledClass,
  WeeklyScheduleGridProps,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

const TIME_COLUMN_WIDTH = 88;
const GRID_COLUMNS = `${TIME_COLUMN_WIDTH}px repeat(7, minmax(0, 1fr))`;

interface SlotItemProps {
  readonly classItem: ScheduledClass;
  readonly onRemove: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

const DESKTOP_SLOT_ITEM_OPTIONS: WeeklyScheduleSlotItemSharedOptions = {
  cardBorderRadius: 1,
  cardPaddingX: 1,
  cardPaddingY: 0.75,
  cardGap: 0.5,
  subjectVariant: "labelMd",
  actionsGap: 0.5,
  actionsMinHeight: 20,
  deleteButtonPadding: 0.25,
  JoinAction: MeetingJoinAction,
  DeleteDialog: BaseDeleteDialog,
  renderStudentLink: (href, name) => (
    <DesktopPersonProfileLink href={href} name={name} showAvatar={false} typographyVariant="caption" fontWeight={500} />
  ),
};

function SlotItem(props: Readonly<SlotItemProps>) {
  return <WeeklyScheduleSlotItemShared {...props} options={DESKTOP_SLOT_ITEM_OPTIONS} />;
}

function GridHeader({ labels }: Readonly<{ labels: TeacherWeeklyScheduleLabels }>) {
  const t = labels;
  return (
    <Box
      sx={theme => ({
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        backgroundColor: theme.palette.sidebar,
        color: theme.palette.onSidebar,
      })}
    >
      <Box
        sx={theme => ({
          px: 1,
          py: 1.5,
          borderRight: `1px solid ${theme.palette.outlineVariant}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="labelUppercase" sx={{ fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>
          {t.grid.teacherTime}
        </Typography>
      </Box>
      {WEEKLY_SCHEDULE_DAYS.map(day => (
        <Box
          key={day}
          sx={theme => ({
            px: 1,
            py: 1.5,
            borderRight: `1px solid ${theme.palette.outlineVariant}`,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:last-child": { borderRight: "none" },
          })}
        >
          <Typography variant="labelMd" sx={{ color: "inherit", fontWeight: 600 }}>
            {t.days[day]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

interface GridRowProps {
  readonly time: string;
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
  readonly hasScheduleDeleteClass: boolean;
  readonly labels: TeacherWeeklyScheduleLabels;
  readonly meetingJoinLabels: MeetingConfigJoinLabels;
}

function GridRow({
  time,
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<GridRowProps>) {
  const t = labels;
  const getClassesForSlot = (day: string) => {
    return classes.filter(c => c.day?.toLowerCase() === day && c.startTime === time);
  };

  return (
    <Box
      sx={theme => ({
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        borderTop: `1px solid ${theme.palette.border.light}`,
        minHeight: 68,
      })}
    >
      <Box
        sx={theme => ({
          px: 1,
          py: 1,
          backgroundColor: theme.palette.surfaceContainerLow,
          borderRight: `1px solid ${theme.palette.border.light}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 600 })}>
          {time}
        </Typography>
      </Box>

      {WEEKLY_SCHEDULE_DAYS.map(day => {
        const slotClasses = getClassesForSlot(day);
        const isLunch = time === "12:00 PM";

        return (
          <Box
            key={day}
            sx={theme => ({
              p: 0.5,
              borderRight: `1px solid ${theme.palette.border.light}`,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              minHeight: 88,
              backgroundColor: isLunch ? theme.palette.action.hover : theme.palette.background.default,
              "&:last-child": { borderRight: "none" },
            })}
          >
            {isLunch ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                  {t.grid.lunchBreak}
                </Typography>
              </Box>
            ) : (
              slotClasses.map(c => (
                <SlotItem
                  key={c.id}
                  classItem={c}
                  onRemove={onRemoveClass}
                  hasScheduleDeleteClass={hasScheduleDeleteClass}
                  labels={labels}
                  meetingJoinLabels={meetingJoinLabels}
                />
              ))
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function WeeklyScheduleGrid({
  classes,
  onRemoveClass,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
}: Readonly<WeeklyScheduleGridProps>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.layout.radius.card,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        width: "100%",
      })}
    >
      <GridHeader labels={labels} />
      {WEEKLY_SCHEDULE_TIMES.map(time => (
        <GridRow
          key={time}
          time={time}
          classes={classes}
          onRemoveClass={onRemoveClass}
          hasScheduleDeleteClass={hasScheduleDeleteClass}
          labels={labels}
          meetingJoinLabels={meetingJoinLabels}
        />
      ))}
    </Box>
  );
}
