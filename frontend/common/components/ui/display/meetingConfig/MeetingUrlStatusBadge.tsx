"use client";

import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { Box, CircularProgress, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { type ReactNode, useMemo } from "react";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { MeetingUrlStatusLabels } from "@/shared/locale/types/dashboard/meeting-url-status";

export type MeetingUrlStatus = "pending" | "generated" | "failed" | "expired";
export type MeetingUrlStatusBadgeSize = "small" | "medium";

export interface MeetingUrlStatusBadgeProps {
  readonly status: MeetingUrlStatus;
  readonly size?: MeetingUrlStatusBadgeSize;
  readonly tooltip?: string | null;
  readonly sx?: SxProps<Theme>;
}

interface StatusConfig {
  readonly icon: (iconSize: number) => ReactNode;
  readonly iconColor: (theme: Theme) => string;
  readonly label: keyof MeetingUrlStatusLabels;
}

const SIZE_MAP: Readonly<Record<MeetingUrlStatusBadgeSize, number>> = { small: 16, medium: 24 } as const;

const COLOR_TRANSITION_MS = 200;

const STATUS_CONFIGS: Readonly<Record<MeetingUrlStatus, StatusConfig>> = {
  pending: {
    icon: (iconSize: number) => <CircularProgress size={iconSize} />,
    iconColor: (theme: Theme) => theme.palette.info.main,
    label: "urlPending",
  },
  generated: {
    icon: (iconSize: number) => <CheckCircleOutlinedIcon sx={{ fontSize: iconSize }} />,
    iconColor: (theme: Theme) => theme.palette.success.main,
    label: "urlReady",
  },
  failed: {
    icon: (iconSize: number) => <ErrorOutlinedIcon sx={{ fontSize: iconSize }} />,
    iconColor: (theme: Theme) => theme.palette.error.main,
    label: "urlFailed",
  },
  expired: {
    icon: (iconSize: number) => <ScheduleOutlinedIcon sx={{ fontSize: iconSize }} />,
    iconColor: (theme: Theme) => theme.palette.warning.main,
    label: "urlExpired",
  },
} as const;

function getStatusLabel(t: MeetingUrlStatusLabels, status: MeetingUrlStatus): string {
  return t[STATUS_CONFIGS[status].label];
}

export function MeetingUrlStatusBadge({
  status,
  size = "medium",
  tooltip = null,
  sx,
}: Readonly<MeetingUrlStatusBadgeProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Dashboard.MeetingUrlStatus);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const config = STATUS_CONFIGS[status];
  const label = useMemo(() => getStatusLabel(t, status), [t, status]);

  const colorTransition = reducedMotion ? "none" : `color ${COLOR_TRANSITION_MS}ms ease-in-out`;

  const badgeContent = (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <Box
        sx={(theme: Theme) => ({
          display: "flex",
          alignItems: "center",
          color: config.iconColor(theme),
          transition: colorTransition,
        })}
      >
        {config.icon(SIZE_MAP[size])}
      </Box>
      <Typography
        variant="labelUppercase"
        sx={(theme: Theme) => ({
          color: config.iconColor(theme),
          transition: colorTransition,
        })}
      >
        {label}
      </Typography>
    </Stack>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        <Box component="output" aria-label={label} title={tooltip} sx={sx}>
          {badgeContent}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box component="output" aria-label={label} sx={sx}>
      {badgeContent}
    </Box>
  );
}
