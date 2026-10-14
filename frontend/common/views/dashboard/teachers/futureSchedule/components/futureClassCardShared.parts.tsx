"use client";

import { BlockOutlined, EventBusyOutlined, PersonOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { TeacherFutureScheduleQuery_teacherFutureSchedule_classes as FutureClass } from "@/frontend/common/graphql/generated/gql/graphql";
import { classHref } from "@/frontend/common/utils/profileHref";
import type {
  FutureClassCardSlots,
  FutureClassCardStyleProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types/futureClassCardShared.types";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { isFutureClassJoinable } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

const MONTH_SHORT_OPTIONS: Intl.DateTimeFormatOptions = { month: "short" };

interface DateSquareProps {
  readonly date: string;
  readonly isRescheduled: boolean;
}

export function DateSquare({ date, isRescheduled }: Readonly<DateSquareProps>) {
  const locale = useAppLocale();
  const dateObj = new Date(date);
  const dayNum = dateObj.getDate();
  // Cache Intl.DateTimeFormat via getDateTimeFormatter to avoid expensive ICU / DateTimeFormat instantiation on every render
  const monthStr = getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_SHORT_OPTIONS).format(dateObj);

  return (
    <Box
      sx={theme => ({
        width: 56,
        height: 56,
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isRescheduled ? theme.palette.status.blockedContainer : theme.palette.surfaceContainerLow,
        border: `1px solid ${isRescheduled ? theme.palette.status.blocked : theme.palette.outlineVariant}`,
        flexShrink: 0,
      })}
    >
      <Typography
        variant="titleLg"
        sx={theme => ({
          color: isRescheduled ? theme.palette.status.onBlockedContainer : theme.palette.primary.main,
          lineHeight: 1,
        })}
      >
        {dayNum}
      </Typography>
      <Typography
        variant="labelSm"
        sx={theme => ({
          color: isRescheduled ? theme.palette.status.onBlockedContainer : theme.palette.onSurfaceVariant,
          opacity: 0.8,
        })}
      >
        {monthStr}
      </Typography>
    </Box>
  );
}

interface ClassInfoProps {
  readonly item: FutureClass;
  readonly labels: TeacherFutureScheduleLabels;
  readonly slots: FutureClassCardSlots;
  readonly style: FutureClassCardStyleProps;
}

export function ClassInfo({ item, labels, slots, style }: Readonly<ClassInfoProps>) {
  const isRescheduled = item.isRescheduled === true;
  const { StatusBadge, MeetingJoinAction } = slots;
  const classProfileLink = slots.ClassProfileLink;

  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {classProfileLink({
          href: item.id ? classHref(item.id) : undefined,
          name: item.courseName?.trim() ?? item.subjectName?.trim() ?? "—",
          avatarUrl: item.avatarUrl,
        })}
        {isRescheduled ? (
          <StatusBadge category="trackingStatus" status="rescheduled" label={labels.reScheduled} />
        ) : null}
      </Box>

      <Stack direction="row" spacing={style.infoStackSpacing} sx={{ mt: 1, flexWrap: "wrap", gap: style.infoStackGap }}>
        <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.onSurfaceVariant })}>
          <ScheduleOutlined sx={{ fontSize: 16 }} />
          <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
            {labels.timeRange(item.startTime ?? "", item.endTime ?? "")}
          </Typography>
        </Box>
        <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.onSurfaceVariant })}>
          {isFutureClassJoinable(item) ? (
            <MeetingJoinAction
              variant="icon"
              meeting={item.effectiveMeeting}
              emptyRole="teacher"
              label={labels.actions.joinVideo}
              setupHref="/profile?tab=meeting"
            />
          ) : null}
          <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
            {item.location}
          </Typography>
        </Box>
        <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.onSurfaceVariant })}>
          <PersonOutlined sx={{ fontSize: 16 }} />
          <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
            {labels.studentCount(item.studentCount ?? 0)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

interface ActionButtonsProps {
  readonly item: FutureClass;
  readonly onRequestLeave?: () => void;
  readonly labels: TeacherFutureScheduleLabels;
  readonly slots: FutureClassCardSlots;
  readonly style: FutureClassCardStyleProps;
}

export function ActionButtons({ item, onRequestLeave, labels, slots, style }: Readonly<ActionButtonsProps>) {
  const { LeaveRequestButton, ViewMaterialsButton } = slots;
  const quotaDisabled = item.leaveRequestDisabled === true && item.leaveRequestDisabledReason === "quota";
  const leaveLabel = quotaDisabled ? labels.quotaReached : labels.requestLeave;
  const leaveIcon = quotaDisabled ? <BlockOutlined /> : <EventBusyOutlined />;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: "center",
        alignSelf: style.actionButtonsAlignSelf,
      }}
    >
      <LeaveRequestButton
        startIcon={leaveIcon}
        disabled={item.leaveRequestDisabled === true}
        onClick={onRequestLeave}
        sx={{ flex: style.actionButtonFlex }}
      >
        {leaveLabel}
      </LeaveRequestButton>
      <Tooltip title={labels.notifications.noSubjectAssigned}>
        <span>
          <ViewMaterialsButton disabled sx={{ px: style.materialsButtonPx, flex: style.actionButtonFlex }}>
            {labels.viewMaterials}
          </ViewMaterialsButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
