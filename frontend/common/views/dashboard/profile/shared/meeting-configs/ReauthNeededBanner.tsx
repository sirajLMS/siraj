"use client";

import { Alert, AlertTitle, Button, Stack } from "@mui/material";
import type { MeetingConfigReauthNeededLabels } from "@/shared/locale/types/ui";

export type ExpiryState = "expiring_soon" | "expired" | "unknown";

export type ReauthProvider = {
  readonly slug: string;
  readonly name: string;
  readonly expiryState?: ExpiryState;
};

export type ReauthNeededBannerProps = {
  readonly reauthProviders: readonly ReauthProvider[];
  readonly labels: MeetingConfigReauthNeededLabels;
  readonly onReconnect: (providerSlug: string) => void;
};

function expiryLabel(state: ExpiryState | undefined, labels: MeetingConfigReauthNeededLabels): string {
  switch (state) {
    case "expiring_soon":
      return labels.reauthExpiringSoon;
    case "expired":
      return labels.reauthExpired;
    default:
      return labels.reconnectRequiredBadge;
  }
}

export function ReauthNeededBanner({ reauthProviders, labels, onReconnect }: ReauthNeededBannerProps) {
  if (reauthProviders.length === 0) return null;

  return (
    <Alert severity="warning" sx={{ typography: "bodyMd" }}>
      <AlertTitle>{labels.reauthNeededTitle}</AlertTitle>
      {labels.reauthNeededMessage}
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, mt: 2 }}>
        {reauthProviders.map(provider => (
          <Button
            key={provider.slug}
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => onReconnect(provider.slug)}
          >
            {`${labels.reconnectButton} · ${provider.name} (${expiryLabel(provider.expiryState, labels)})`}
          </Button>
        ))}
      </Stack>
    </Alert>
  );
}
