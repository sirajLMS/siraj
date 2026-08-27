"use client";

import { BlockOutlined, EventBusyOutlined, PersonOutlined, ScheduleOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Stack, type Theme, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { TeacherFutureScheduleQuery_teacherFutureSchedule_classes as FutureClass } from "@/frontend/common/graphql/generated/gql/graphql";
import { classHref } from "@/frontend/common/utils/profileHref";
import type {
  FutureClassCardScaffoldProps,
  FutureClassCardSlots,
  FutureClassCardStyleProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types/futureClassCardShared.types";
import { isFutureClassJoinable } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

function DateSquare({ date, isRescheduled }: Readonly<{ date: string; isRescheduled: boolean }>) {
  const locale = useAppLocale();
  const dateObj = new Date(date);
  const dayNum = dateObj.getDate();
  const monthStr = dateObj.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { month: "short" });

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

function ClassInfo({ item, labels, slots, style }: Readonly<ClassInfoProps>) {
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
  readonly style: FutureClassCardStyleProps;
}

function ActionButtons({ item, onRequestLeave, labels, style }: Readonly<ActionButtonsProps>) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: "center",
        alignSelf: style.actionButtonsAlignSelf,
      }}
    >
      {item.leaveRequestDisabled ? (
        <Button
          variant="outlined"
          disabled
          startIcon={item.leaveRequestDisabledReason === "quota" ? <BlockOutlined /> : <EventBusyOutlined />}
          sx={theme => ({
            borderRadius: 2,
            fontSize: theme.typography.labelUppercase.fontSize,
            fontWeight: 700,
            letterSpacing: "0.05em",
            backgroundColor: theme.palette.surfaceContainerLow,
            color: theme.palette.onSurface,
            borderColor: theme.palette.outlineVariant,
            opacity: 0.38,
            flex: style.actionButtonFlex,
          })}
        >
          {item.leaveRequestDisabledReason === "quota" ? labels.quotaReached : labels.requestLeave}
        </Button>
      ) : (
        <Button
          variant="outlined"
          startIcon={<EventBusyOutlined />}
          onClick={onRequestLeave}
          sx={theme => ({
            borderRadius: 2,
            fontSize: theme.typography.labelUppercase.fontSize,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            flex: style.actionButtonFlex,
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
            },
          })}
        >
          {labels.requestLeave}
        </Button>
      )}
      <Tooltip title={labels.notifications.noSubjectAssigned}>
        <span>
          <Button
            variant="contained"
            disabled
            sx={theme => ({
              borderRadius: 2,
              fontSize: theme.typography.labelUppercase.fontSize,
              fontWeight: 700,
              letterSpacing: "0.05em",
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              px: style.materialsButtonPx,
              flex: style.actionButtonFlex,
            })}
          >
            {labels.viewMaterials}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

const desktopCardSx = (theme: Theme) => ({
  p: 3,
  "&:hover": { border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` },
  transition: theme.transitions.create("all", { duration: 200 }),
});

function buildCardSx(outerDirection: "row" | "column") {
  return outerDirection === "row" ? desktopCardSx : undefined;
}

export function FutureClassCardShared({
  item,
  onRequestLeave,
  labels,
  slots,
  style,
}: Readonly<FutureClassCardScaffoldProps>) {
  const { CardComponent } = slots;
  const isRescheduled = item.isRescheduled === true;
  const cardSx = buildCardSx(style.outerDirection);

  const innerContent: ReactNode = (
    <Stack direction={style.outerDirection} spacing={2} sx={{ justifyContent: "space-between" }}>
      <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
        <DateSquare date={item.scheduledDate ?? ""} isRescheduled={isRescheduled} />
        <ClassInfo item={item} labels={labels} slots={slots} style={style} />
      </Stack>
      <ActionButtons item={item} onRequestLeave={onRequestLeave} labels={labels} style={style} />
    </Stack>
  );

  return <CardComponent sx={cardSx}>{innerContent}</CardComponent>;
}
