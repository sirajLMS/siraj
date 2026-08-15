"use client";

import { LinkOutlined } from "@mui/icons-material";
import { Alert, AlertTitle, Box, Button, CircularProgress } from "@mui/material";
import type { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export type ConnectProviderActionLabels = Pick<
  SettingsMeetingIntegrationsLabels,
  "connectProvider" | "connecting" | "connectProviderError"
>;

export interface ConnectProviderActionProps {
  readonly labels: ConnectProviderActionLabels;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly providerName: string;
  readonly connecting: boolean;
  readonly connectError: string | null;
  readonly onConnect: (providerSlug: MeetingIntegrationProviderSlug) => void;
}

export function ConnectProviderAction({
  labels,
  providerSlug,
  providerName,
  connecting,
  connectError,
  onConnect,
}: ConnectProviderActionProps) {
  const ariaLabel = `Connect ${providerName} OAuth`;

  const handleConnect = () => {
    onConnect(providerSlug);
  };

  if (connectError && !connecting) {
    return (
      <Alert
        severity="error"
        icon={false}
        sx={theme => ({ borderColor: theme.palette.error.main })}
        action={
          <Button size="small" color="error" onClick={handleConnect} aria-label={ariaLabel}>
            {labels.connectProvider}
          </Button>
        }
      >
        <AlertTitle>{labels.connectProviderError}</AlertTitle>
      </Alert>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        size="small"
        disabled={connecting}
        startIcon={connecting ? <CircularProgress size={16} /> : <LinkOutlined />}
        onClick={handleConnect}
        aria-label={ariaLabel}
        sx={theme => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
        })}
      >
        {connecting ? labels.connecting : labels.connectProvider}
      </Button>
    </Box>
  );
}
