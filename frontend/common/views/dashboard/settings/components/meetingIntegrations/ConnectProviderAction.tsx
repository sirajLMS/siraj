"use client";

import { LinkOutlined } from "@mui/icons-material";
import { Alert, AlertTitle, Box, CircularProgress } from "@mui/material";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button";
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
          <FilterButton size="small" color="error" onClick={handleConnect} aria-label={ariaLabel}>
            {labels.connectProvider}
          </FilterButton>
        }
      >
        <AlertTitle>{labels.connectProviderError}</AlertTitle>
      </Alert>
    );
  }

  return (
    <Box>
      <PrimaryPageAction
        color="primary"
        size="small"
        disabled={connecting}
        startIcon={connecting ? <CircularProgress size={16} /> : <LinkOutlined />}
        onClick={handleConnect}
        aria-label={ariaLabel}
      >
        {connecting ? labels.connecting : labels.connectProvider}
      </PrimaryPageAction>
    </Box>
  );
}
