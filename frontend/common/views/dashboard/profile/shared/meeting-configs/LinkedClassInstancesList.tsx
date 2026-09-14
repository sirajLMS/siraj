"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import { MeetingUrlCell, MeetingUrlStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig";
import type { MeetingConfigLinkedClassInstancesLabels } from "@/shared/locale/types/ui";

// Design decision: instances are passed as props rather than fetched internally.
// The parent component is responsible for data fetching (Apollo query / parameterized
// query). This keeps the component presentational and testable in isolation.
// Apollo filtering happens client-side on the existing class-instance query OR a
// new parameterized query — either way, the parent manages the data lifecycle.

export interface LinkedClassInstance {
  readonly id: string;
  readonly title: string;
  readonly startTime: string | null;
  readonly meetingJoinUrl: string | null;
}

export interface LinkedClassInstancesListProps {
  readonly meetingConfigId: string;
  readonly instances: readonly LinkedClassInstance[];
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly labels: MeetingConfigLinkedClassInstancesLabels;
}

function formatStartTime(startTime: string | null): string {
  if (!startTime) return "";
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return startTime;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LinkedClassInstancesList({
  instances,
  loading,
  emptyMessage,
  labels,
}: Readonly<LinkedClassInstancesListProps>) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
        <CircularProgress size={16} />
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {labels.linkedClassInstancesTitle}
        </Typography>
      </Box>
    );
  }

  if (instances.length === 0) {
    return (
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary, py: 1 })}>
        {emptyMessage ?? labels.linkedClassInstancesEmpty}
      </Typography>
    );
  }

  return (
    <Stack spacing={1} sx={{ maxHeight: 300, overflow: "auto" }}>
      {instances.map(instance => {
        const joinUrl = instance.meetingJoinUrl;
        return (
          <BaseCard key={instance.id}>
            <Stack spacing={0.75}>
              <Typography sx={{ typography: "labelMd", fontWeight: 600 }}>
                {instance.title || labels.classInstanceTitle}
              </Typography>
              {instance.startTime ? (
                <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
                  {labels.startTime}: {formatStartTime(instance.startTime)}
                </Typography>
              ) : null}
              {joinUrl ? (
                <MeetingUrlCell meetingUrl={joinUrl} joinLabel={labels.meetingUrl} compact badgeSize="small" />
              ) : (
                <MeetingUrlStatusBadge status="pending" size="small" tooltip={labels.urlPendingBadge} />
              )}
            </Stack>
          </BaseCard>
        );
      })}
    </Stack>
  );
}
