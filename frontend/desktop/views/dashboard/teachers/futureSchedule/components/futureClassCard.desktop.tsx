"use client";

import { BlockOutlined, EventBusyOutlined, PersonOutlined, ScheduleOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import type { FutureClass } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { FutureClassCardProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { isFutureClassJoinable } from "@/shared/lib/meeting/isJoinableByExecutionState";

function DateSquare({ date, isRescheduled }: Readonly<{ date: string; isRescheduled: boolean }>) {
  const dateObj = new Date(date);
  const dayNum = dateObj.getDate();
  const monthStr = dateObj.toLocaleString("en-US", { month: "short" });

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
        variant="labelUppercase"
        sx={theme => ({
          color: isRescheduled ? theme.palette.status.onBlockedContainer : theme.palette.onSurfaceVariant,
          fontSize: 10,
          opacity: 0.8,
        })}
      >
        {monthStr}
      </Typography>
    </Box>
  );
}

function ClassInfo({ item }: Readonly<{ item: FutureClass }>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  const isRescheduled = item.isRescheduled === true;

  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {item.courseName}
        </Typography>
        {isRescheduled && <StatusBadge category="trackingStatus" status="rescheduled" label={t("reScheduled")} />}
      </Box>

      <Stack direction="row" spacing={3} sx={{ mt: 1, flexWrap: "wrap", gap: 0 }}>
        <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.onSurfaceVariant })}>
          <ScheduleOutlined sx={{ fontSize: 16 }} />
          <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
            {item.startTime} - {item.endTime}
          </Typography>
        </Box>
        <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.onSurfaceVariant })}>
          {isFutureClassJoinable(item) ? (
            <MeetingJoinAction
              variant="icon"
              joinUrl={item.meetingJoinUrl}
              meeting={item.effectiveMeeting}
              emptyRole="teacher"
              label={t("actions.joinVideo")}
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
            {item.studentCount} {t("students")}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ActionButtons({ item, onRequestLeave }: Readonly<{ item: FutureClass; onRequestLeave?: () => void }>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: "center",
        alignSelf: "center",
      }}
    >
      {item.leaveRequestDisabled ? (
        <Button
          variant="outlined"
          disabled
          startIcon={item.leaveRequestDisabledReason === "quota" ? <BlockOutlined /> : <EventBusyOutlined />}
          sx={theme => ({
            borderRadius: 2,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.05em",
            backgroundColor: theme.palette.surfaceContainerLow,
            color: theme.palette.onSurface,
            borderColor: theme.palette.outlineVariant,
            opacity: 0.38,
            flex: "initial",
          })}
        >
          {item.leaveRequestDisabledReason === "quota" ? t("quotaReached") : t("requestLeave")}
        </Button>
      ) : (
        <Button
          variant="outlined"
          startIcon={<EventBusyOutlined />}
          onClick={onRequestLeave}
          sx={theme => ({
            borderRadius: 2,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            flex: "initial",
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
            },
          })}
        >
          {t("requestLeave")}
        </Button>
      )}
      <Tooltip title={t("notifications.noSubjectAssigned")}>
        <span>
          <Button
            variant="contained"
            disabled
            sx={theme => ({
              borderRadius: 2,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              px: 3,
              flex: "initial",
            })}
          >
            {t("viewMaterials")}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

export function FutureClassCardDesktop({ item, onRequestLeave }: Readonly<FutureClassCardProps>) {
  const isRescheduled = item.isRescheduled === true;

  return (
    <BaseCard
      sx={theme => ({
        p: 3,
        "&:hover": { border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` },
        transition: "all 0.2s",
      })}
    >
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
        <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
          <DateSquare date={item.scheduledDate ?? ""} isRescheduled={isRescheduled} />
          <ClassInfo item={item} />
        </Stack>
        <ActionButtons item={item} onRequestLeave={onRequestLeave} />
      </Stack>
    </BaseCard>
  );
}
