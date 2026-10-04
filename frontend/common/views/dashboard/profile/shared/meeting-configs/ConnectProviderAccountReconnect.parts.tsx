"use client";

import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { Alert, AlertTitle, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { OAuthConnectionStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge";
import type { ConnectProviderAccountLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/connectProviderAccount.types";
import type { MeetingConfigActionSlots } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigActionSlots";

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
// ReconnectAlertState — shared by expiring and expired states
// ---------------------------------------------------------------------------

export function ReconnectAlertState({
  labels,
  providerName,
  connectedEmail,
  loading,
  onReconnect,
  status,
  severity,
  paletteColor,
  OutlinedAction,
}: {
  readonly labels: ConnectProviderAccountLabels;
  readonly providerName: string;
  readonly connectedEmail: string | undefined;
  readonly loading: boolean;
  readonly onReconnect: () => void;
  readonly status: "expiring" | "expired";
  readonly severity: "warning" | "error";
  readonly paletteColor: "warning" | "error";
  readonly OutlinedAction: MeetingConfigActionSlots["outlined"];
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
          <OutlinedAction
            color={paletteColor}
            disabled={loading}
            startIcon={loading ? undefined : <RefreshOutlinedIcon />}
            onClick={onReconnect}
            aria-label={`${labels.reconnectButton} ${providerName}`}
            sx={theme => ({
              color: theme.palette[paletteColor].main,
              borderColor: theme.palette[paletteColor].main,
            })}
          >
            {labels.reconnectButton}
          </OutlinedAction>
          {loading ? <OAuthLoadingOverlay labels={labels} /> : null}
        </Box>
      </Alert>
    </Stack>
  );
}
