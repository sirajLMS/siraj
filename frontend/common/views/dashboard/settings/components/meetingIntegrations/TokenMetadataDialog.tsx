"use client";

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingIntegrationConnectedAccount } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

function getProviderLabel(slug: MeetingIntegrationProviderSlug, labels: SettingsMeetingIntegrationsLabels): string {
  switch (slug) {
    case MeetingIntegrationProviderSlug.Zoom:
      return labels.provider.zoom;
    case MeetingIntegrationProviderSlug.GoogleMeet:
      return labels.provider.googleMeet;
    case MeetingIntegrationProviderSlug.MicrosoftTeams:
      return labels.provider.microsoftTeams;
    default:
      return String(slug);
  }
}

function formatDate(date: Date | null | undefined, locale: "en" | "ar"): string {
  if (!date) {
    return "—";
  }
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function TokenMetadataDialog({
  labels,
  locale,
  account,
  providerSlug,
  open,
  onClose,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly locale: "en" | "ar";
  readonly account: MeetingIntegrationConnectedAccount | null;
  readonly providerSlug: MeetingIntegrationProviderSlug | null;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{labels.metadata.title}</DialogTitle>
      <DialogContent>
        {account && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box>
              <Typography
                sx={{
                  typography: "labelUppercase",
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                {labels.metadata.provider}
              </Typography>
              <Typography sx={{ typography: "bodyMd" }}>
                {providerSlug ? getProviderLabel(providerSlug, labels) : "—"}
              </Typography>
            </Box>

            {account.email && (
              <Box>
                <Typography
                  sx={{
                    typography: "labelUppercase",
                    color: "text.secondary",
                    mb: 0.5,
                  }}
                >
                  {labels.metadata.email}
                </Typography>
                <Typography sx={{ typography: "bodyMd" }}>{account.email}</Typography>
              </Box>
            )}

            <Box>
              <Typography
                sx={{
                  typography: "labelUppercase",
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                {labels.metadata.scopes}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {(account.scopes ?? []).map(scope => (
                  <Chip key={scope} size="small" label={scope} variant="outlined" />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{
                  typography: "labelUppercase",
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                {labels.metadata.expiry}
              </Typography>
              <Typography sx={{ typography: "bodyMd" }}>{formatDate(account.expiresAt, locale)}</Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  typography: "labelUppercase",
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                {labels.metadata.connectedAt}
              </Typography>
              <Typography sx={{ typography: "bodyMd" }}>{formatDate(account.connectedAt, locale)}</Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  typography: "labelUppercase",
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                {labels.metadata.lastRefreshed}
              </Typography>
              <Typography sx={{ typography: "bodyMd" }}>{formatDate(account.lastRefreshedAt, locale)}</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.actions.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}
