"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RouterIcon from "@mui/icons-material/Router";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui";

interface MetadataCardProps {
  readonly scheduledDate: string;
  readonly durationMinutes: number;
  readonly latencyMs: number;
  readonly authorization: string;
  readonly labels: {
    readonly metadata: string;
    readonly scheduledDate: string;
    readonly duration: string;
    readonly latency: string;
    readonly authorization: string;
    readonly minutes: string;
    readonly optimal: string;
  };
}

interface MetadataRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: React.ReactNode;
}

function MetadataRow({ icon, label, value }: MetadataRowProps) {
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
        <Stack
          direction="row"
          sx={theme => ({
            alignItems: "center",
            gap: 1,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <Box sx={{ fontSize: 18, display: "flex" }}>{icon}</Box>
          <Typography variant="body2">{label}</Typography>
        </Stack>
        {value}
      </Stack>
      <Divider sx={theme => ({ borderColor: theme.palette.outlineVariant })} />
    </>
  );
}

export function MetadataCard({ scheduledDate, durationMinutes, latencyMs, authorization, labels }: MetadataCardProps) {
  return (
    <BaseCard sx={{ height: "100%" }}>
      <Typography
        variant="labelUppercase"
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
          display: "block",
          mb: 2,
        })}
      >
        {labels.metadata}
      </Typography>

      <Stack sx={{ gap: 0 }}>
        <MetadataRow
          icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
          label={labels.scheduledDate}
          value={
            <Typography variant="caption" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {scheduledDate}
            </Typography>
          }
        />
        <MetadataRow
          icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
          label={labels.duration}
          value={
            <Typography variant="caption" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {durationMinutes} {labels.minutes}
            </Typography>
          }
        />
        <MetadataRow
          icon={<RouterIcon sx={{ fontSize: 18 }} />}
          label={labels.latency}
          value={
            <Typography variant="caption" sx={theme => ({ color: theme.palette.status.active, fontWeight: 700 })}>
              {latencyMs}ms ({labels.optimal})
            </Typography>
          }
        />
        <MetadataRow
          icon={<VerifiedUserIcon sx={{ fontSize: 18 }} />}
          label={labels.authorization}
          value={
            <Typography variant="caption" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {authorization}
            </Typography>
          }
        />
      </Stack>
    </BaseCard>
  );
}
