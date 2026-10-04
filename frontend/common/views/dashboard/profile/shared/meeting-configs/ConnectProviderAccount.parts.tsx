"use client";

import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { OAuthConnectionStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge";
import type { ConnectProviderAccountLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/connectProviderAccount.types";
import type { MeetingConfigActionSlots } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigActionSlots";

// ---------------------------------------------------------------------------
// Disconnected state
// ---------------------------------------------------------------------------

export function DisconnectedState({
  providerName,
  labels,
  loading,
  onConnect,
  PrimaryAction,
}: {
  readonly providerName: string;
  readonly labels: ConnectProviderAccountLabels;
  readonly loading: boolean;
  readonly onConnect: () => void;
  readonly PrimaryAction: MeetingConfigActionSlots["primary"];
}) {
  return (
    <Box sx={{ position: "relative" }}>
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Typography sx={{ typography: "bodyMd" }}>{providerName}</Typography>
        <OAuthConnectionStatusBadge status="disconnected" />
      </Stack>
      <PrimaryAction
        disabled={loading}
        startIcon={loading ? undefined : <LinkOutlinedIcon />}
        onClick={onConnect}
        aria-label={`${labels.connectButton} ${providerName}`}
      >
        {labels.connectButton}
      </PrimaryAction>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Connecting state
// ---------------------------------------------------------------------------

export function ConnectingState({
  providerName,
  labels,
}: {
  readonly providerName: string;
  readonly labels: ConnectProviderAccountLabels;
}) {
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
      <Typography sx={{ typography: "bodyMd" }}>{providerName}</Typography>
      <CircularProgress size={20} aria-label={labels.connectingLabel} />
      <Typography sx={{ typography: "bodyMd" }}>{labels.connectingLabel}</Typography>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Connected state
// ---------------------------------------------------------------------------

export function ConnectedState({
  labels,
  providerName,
  connectedEmail,
  loading,
  onDisconnect,
  OutlinedAction,
}: {
  readonly labels: ConnectProviderAccountLabels;
  readonly providerName: string;
  readonly connectedEmail: string | undefined;
  readonly loading: boolean;
  readonly onDisconnect: () => void;
  readonly OutlinedAction: MeetingConfigActionSlots["outlined"];
}) {
  return (
    <Stack sx={{ gap: 1.5 }}>
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography sx={{ typography: "bodyMd" }}>{providerName}</Typography>
        <OAuthConnectionStatusBadge status="connected" />
        {connectedEmail ? (
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
            {labels.connectedAs(connectedEmail)}
          </Typography>
        ) : null}
      </Stack>
      <OutlinedAction
        color="error"
        disabled={loading}
        startIcon={<LinkOffOutlinedIcon />}
        onClick={onDisconnect}
        aria-label={`${labels.disconnectButton} ${providerName}`}
        sx={theme => ({
          color: theme.palette.error.main,
          borderColor: theme.palette.error.main,
        })}
      >
        {labels.disconnectButton}
      </OutlinedAction>
    </Stack>
  );
}
