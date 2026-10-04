"use client";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useId } from "react";
import type { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatDate } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TokenMetadataDialog.helpers";
import {
  MetadataField,
  ScopesChips,
  TokenIdRow,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TokenMetadataDialog.parts";
import { getProviderLabel } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.helpers";
import type { MeetingIntegrationConnectedAccount } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

type TokenMetadataDialogProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly locale: "en" | "ar";
  readonly account: MeetingIntegrationConnectedAccount | null;
  readonly providerSlug: MeetingIntegrationProviderSlug | null;
  readonly loading?: boolean;
  readonly open: boolean;
  readonly onClose: () => void;
};

export function TokenMetadataDialog({
  labels,
  locale,
  account,
  providerSlug,
  loading = false,
  open,
  onClose,
}: TokenMetadataDialogProps) {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{labels.metadata.title}</DialogTitle>
      <DialogContent>
        {account && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <MetadataField label={labels.metadata.provider}>
              <Typography sx={{ typography: "bodyMd" }}>
                {providerSlug ? getProviderLabel(providerSlug, labels) : "—"}
              </Typography>
            </MetadataField>

            {account.email && (
              <MetadataField label={labels.metadata.email}>
                <Typography sx={{ typography: "bodyMd" }}>{account.email}</Typography>
              </MetadataField>
            )}

            <MetadataField label={labels.metadata.tokenId}>
              <TokenIdRow tokenId={account.id} labels={labels} />
            </MetadataField>

            <MetadataField label={labels.metadata.scopes}>
              <ScopesChips scopes={account.scopes} labels={labels} />
            </MetadataField>

            <MetadataField label={labels.metadata.expiry}>
              <Typography sx={{ typography: "bodyMd" }}>{formatDate(account.expiresAt, locale)}</Typography>
            </MetadataField>

            <MetadataField label={labels.metadata.connectedAt}>
              <Typography sx={{ typography: "bodyMd" }}>{formatDate(account.connectedAt, locale)}</Typography>
            </MetadataField>

            <MetadataField label={labels.metadata.lastRefreshed}>
              <Typography sx={{ typography: "bodyMd" }}>{formatDate(account.lastRefreshedAt, locale)}</Typography>
            </MetadataField>
          </Box>
        )}

        {loading && !account && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 3 }}>
            <CircularProgress size={20} />
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
              {labels.metadata.loadingHint}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.actions.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}
