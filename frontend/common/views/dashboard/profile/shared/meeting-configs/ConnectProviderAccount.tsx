"use client";

import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { Alert, AlertTitle, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Translation } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale/client";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reauthNeeded";

export interface ConnectProviderAccountProps {
  readonly providerSlug: string;
  readonly providerName: string;
  readonly connectionState: ConnectionState;
  readonly connectedEmail?: string;
  readonly onConnect: (providerSlug: string) => void;
  readonly onDisconnect: (providerSlug: string) => void;
  readonly loading?: boolean;
}

type ConnectLabels = ProfileNotificationsLabels["connectAccount"];

function DisconnectedState({
  providerName,
  labels,
  loading,
  onConnect,
}: {
  readonly providerName: string;
  readonly labels: ConnectLabels;
  readonly loading: boolean;
  readonly onConnect: () => void;
}) {
  return (
    <Box>
      <Typography sx={{ typography: "bodyMd", mb: 1.5 }}>{providerName}</Typography>
      <Button
        variant="contained"
        color="primary"
        size="small"
        disabled={loading}
        startIcon={<LinkOutlinedIcon />}
        onClick={onConnect}
        sx={theme => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
        })}
      >
        {labels.connectButton}
      </Button>
    </Box>
  );
}

function ConnectingState({ labels }: { readonly labels: ConnectLabels }) {
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
      <CircularProgress size={20} />
      <Typography sx={{ typography: "bodyMd" }}>{labels.connectingLabel}</Typography>
    </Stack>
  );
}

function ConnectedState({
  labels,
  connectedEmail,
  loading,
  onDisconnect,
}: {
  readonly labels: ConnectLabels;
  readonly connectedEmail: string | undefined;
  readonly loading: boolean;
  readonly onDisconnect: () => void;
}) {
  return (
    <Stack
      sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}
    >
      <Typography sx={{ typography: "bodyMd" }}>
        {connectedEmail ? labels.connectedAs(connectedEmail) : labels.connectButton}
      </Typography>
      <Button
        variant="outlined"
        color="error"
        size="small"
        disabled={loading}
        startIcon={<LinkOffOutlinedIcon />}
        onClick={onDisconnect}
        sx={theme => ({
          color: theme.palette.error.main,
          borderColor: theme.palette.error.main,
        })}
      >
        {labels.disconnectButton}
      </Button>
    </Stack>
  );
}

function ReauthNeededState({
  labels,
  loading,
  onConnect,
}: {
  readonly labels: ConnectLabels;
  readonly loading: boolean;
  readonly onConnect: () => void;
}) {
  return (
    <Alert
      severity="warning"
      icon={false}
      sx={theme => ({
        typography: "bodyMd",
        borderColor: theme.palette.warning.main,
      })}
    >
      <AlertTitle>{labels.reconnectCallout}</AlertTitle>
      <Button
        variant="outlined"
        color="warning"
        size="small"
        disabled={loading}
        startIcon={<RefreshOutlinedIcon />}
        onClick={onConnect}
      >
        {labels.reconnectButton}
      </Button>
    </Alert>
  );
}

export function ConnectProviderAccount({
  providerSlug,
  providerName,
  connectionState,
  connectedEmail,
  onConnect,
  onDisconnect,
  loading = false,
}: ConnectProviderAccountProps) {
  const labels = useAppTranslation(Translation.Profile.Notifications).connectAccount;

  const handleConnect = () => onConnect(providerSlug);
  const handleDisconnect = () => onDisconnect(providerSlug);

  switch (connectionState) {
    case "connecting":
      return <ConnectingState labels={labels} />;
    case "connected":
      return (
        <ConnectedState
          labels={labels}
          connectedEmail={connectedEmail}
          loading={loading}
          onDisconnect={handleDisconnect}
        />
      );
    case "reauthNeeded":
      return <ReauthNeededState labels={labels} loading={loading} onConnect={handleConnect} />;
    default:
      return (
        <DisconnectedState providerName={providerName} labels={labels} loading={loading} onConnect={handleConnect} />
      );
  }
}
