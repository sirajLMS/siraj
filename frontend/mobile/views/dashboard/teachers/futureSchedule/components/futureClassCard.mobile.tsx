"use client";

import { BlockOutlined, EventBusyOutlined, PersonOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import type { FutureClass } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classHref } from "@/frontend/common/utils/profileHref";
import type { FutureClassCardProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { isFutureClassJoinable } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppTranslation } from "@/shared/locale";

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
  const t = useAppTranslation().dashboardTranslations.teacherFutureSchedule;
  const isRescheduled = item.isRescheduled === true;

  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <MobileClassProfileLink
          href={item.id ? classHref(item.id) : undefined}
          name={item.courseName?.trim() || item.subjectName?.trim() || "—"}
          avatarUrl={item.avatarUrl}
          typographyVariant="titleLg"
          fontWeight={700}
        />
        {isRescheduled && <MobileStatusBadge category="trackingStatus" status="rescheduled" label={t.reScheduled} />}
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.onSurfaceVariant })}>
          <ScheduleOutlined sx={{ fontSize: 16 }} />
          <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
            {item.startTime} - {item.endTime}
          </Typography>
        </Box>
        <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.onSurfaceVariant })}>
          {isFutureClassJoinable(item) ? (
            <MobileMeetingJoinAction
              variant="icon"
              joinUrl={item.meetingJoinUrl}
              meeting={item.effectiveMeeting}
              emptyRole="teacher"
              label={t.actions.joinVideo}
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
            {item.studentCount} {t.students}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ActionButtons({ item, onRequestLeave }: Readonly<{ item: FutureClass; onRequestLeave?: () => void }>) {
  const t = useAppTranslation().dashboardTranslations.teacherFutureSchedule;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: "center",
        alignSelf: "stretch",
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
            flex: 1,
          })}
        >
          {item.leaveRequestDisabledReason === "quota" ? t.quotaReached : t.requestLeave}
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
            flex: 1,
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
            },
          })}
        >
          {t.requestLeave}
        </Button>
      )}
      <Tooltip title={t.notifications.noSubjectAssigned}>
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
              px: 2,
              flex: 1,
            })}
          >
            {t.viewMaterials}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

export function FutureClassCardMobile({ item, onRequestLeave }: Readonly<FutureClassCardProps>) {
  const isRescheduled = item.isRescheduled === true;

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack direction="column" spacing={2} sx={{ justifyContent: "space-between" }}>
        <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
          <DateSquare date={item.scheduledDate ?? ""} isRescheduled={isRescheduled} />
          <ClassInfo item={item} />
        </Stack>
        <ActionButtons item={item} onRequestLeave={onRequestLeave} />
      </Stack>
    </MobileCardListItem>
  );
}
