"use client";

import { Alert, AlertTitle, Button, Stack } from "@mui/material";
import {
  expiryLabel,
  type ReauthNeededBannerProps,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";

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
