"use client";

import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { Alert, AlertTitle, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { OAuthConnectionStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "expiring" | "expired";

export type ConnectProviderAccountLabels = Pick<
  ProfileNotificationsLabels["connectAccount"],
  | "connectButton"
  | "connectingLabel"
  | "connectedAs"
  | "disconnectButton"
  | "reconnectButton"
  | "reconnectCallout"
  | "statusConnected"
  | "statusExpiring"
  | "statusExpired"
  | "statusDisconnected"
>;

export interface ConnectProviderAccountProps {
  readonly labels: ConnectProviderAccountLabels;
  readonly providerSlug: string;
  readonly providerName: string;
  readonly connectionState: ConnectionState;
  readonly connectedEmail?: string;
  readonly onConnect: (providerSlug: string) => void;
  readonly onReconnect: (providerSlug: string) => void;
  readonly onDisconnect: (providerSlug: string) => void;
  readonly loading?: boolean;
}

// ---------------------------------------------------------------------------
// Loading overlay — rendered above content during OAuth redirect
// ---------------------------------------------------------------------------

function OAuthLoadingOverlay({ labels }: { readonly labels: ConnectProviderAccountLabels }) {
  return (
    <Stack
      sx={{
        position: "absolute",
        inset: 0,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 1.5,
        zIndex: 1,
      }}
    >
      <CircularProgress size={20} />
      <Typography sx={{ typography: "bodyMd" }}>{labels.connectingLabel}</Typography>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Disconnected state
// ---------------------------------------------------------------------------

function DisconnectedState({
  providerName,
  labels,
  loading,
  onConnect,
}: {
  readonly providerName: string;
  readonly labels: ConnectProviderAccountLabels;
  readonly loading: boolean;
  readonly onConnect: () => void;
}) {
  return (
    <Box sx={{ position: "relative" }}>
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Typography sx={{ typography: "bodyMd" }}>{providerName}</Typography>
        <OAuthConnectionStatusBadge status="disconnected" />
      </Stack>
      <Button
        variant="contained"
        color="primary"
        disabled={loading}
        startIcon={loading ? undefined : <LinkOutlinedIcon />}
        onClick={onConnect}
        aria-label={`${labels.connectButton} ${providerName}`}
        sx={theme => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          minHeight: 48,
        })}
      >
        {labels.connectButton}
      </Button>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Connecting state
// ---------------------------------------------------------------------------

function ConnectingState({
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

function ConnectedState({
  labels,
  providerName,
  connectedEmail,
  loading,
  onDisconnect,
}: {
  readonly labels: ConnectProviderAccountLabels;
  readonly providerName: string;
  readonly connectedEmail: string | undefined;
  readonly loading: boolean;
  readonly onDisconnect: () => void;
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
      <Button
        variant="outlined"
        color="error"
        disabled={loading}
        startIcon={<LinkOffOutlinedIcon />}
        onClick={onDisconnect}
        aria-label={`${labels.disconnectButton} ${providerName}`}
        sx={theme => ({
          color: theme.palette.error.main,
          borderColor: theme.palette.error.main,
          minHeight: 48,
        })}
      >
        {labels.disconnectButton}
      </Button>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// ReconnectAlertState — shared by expiring and expired states
// ---------------------------------------------------------------------------

function ReconnectAlertState({
  labels,
  providerName,
  connectedEmail,
  loading,
  onReconnect,
  status,
  severity,
  paletteColor,
}: {
  readonly labels: ConnectProviderAccountLabels;
  readonly providerName: string;
  readonly connectedEmail: string | undefined;
  readonly loading: boolean;
  readonly onReconnect: () => void;
  readonly status: "expiring" | "expired";
  readonly severity: "warning" | "error";
  readonly paletteColor: "warning" | "error";
}) {
  return (
    <Stack sx={{ gap: 1.5 }}>
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography sx={{ typography: "bodyMd" }}>{providerName}</Typography>
        <OAuthConnectionStatusBadge status={status} />
        {connectedEmail ? (
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
            {labels.connectedAs(connectedEmail)}
          </Typography>
        ) : null}
      </Stack>
      <Alert
        severity={severity}
        icon={false}
        sx={theme => ({
          typography: "bodyMd",
          borderColor: theme.palette[paletteColor].main,
        })}
      >
        <AlertTitle>{labels.reconnectCallout}</AlertTitle>
        <Box sx={{ position: "relative" }}>
          <Button
            variant="outlined"
            color={paletteColor}
            disabled={loading}
            startIcon={loading ? undefined : <RefreshOutlinedIcon />}
            onClick={onReconnect}
            aria-label={`${labels.reconnectButton} ${providerName}`}
            sx={theme => ({
              color: theme.palette[paletteColor].main,
              borderColor: theme.palette[paletteColor].main,
              minHeight: 48,
            })}
          >
            {labels.reconnectButton}
          </Button>
          {loading ? <OAuthLoadingOverlay labels={labels} /> : null}
        </Box>
      </Alert>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ConnectProviderAccount({
  labels,
  providerSlug,
  providerName,
  connectionState,
  connectedEmail,
  onConnect,
  onReconnect,
  onDisconnect,
  loading = false,
}: ConnectProviderAccountProps) {
  const handleConnect = () => onConnect(providerSlug);
  const handleReconnect = () => onReconnect(providerSlug);
  const handleDisconnect = () => onDisconnect(providerSlug);

  switch (connectionState) {
    case "connecting":
      return <ConnectingState providerName={providerName} labels={labels} />;
    case "connected":
      return (
        <ConnectedState
          labels={labels}
          providerName={providerName}
          connectedEmail={connectedEmail}
          loading={loading}
          onDisconnect={handleDisconnect}
        />
      );
    case "expiring":
      return (
        <ReconnectAlertState
          labels={labels}
          providerName={providerName}
          connectedEmail={connectedEmail}
          loading={loading}
          onReconnect={handleReconnect}
          status="expiring"
          severity="warning"
          paletteColor="warning"
        />
      );
    case "expired":
      return (
        <ReconnectAlertState
          labels={labels}
          providerName={providerName}
          connectedEmail={connectedEmail}
          loading={loading}
          onReconnect={handleReconnect}
          status="expired"
          severity="error"
          paletteColor="error"
        />
      );
    default:
      return (
        <DisconnectedState providerName={providerName} labels={labels} loading={loading} onConnect={handleConnect} />
      );
  }
}
