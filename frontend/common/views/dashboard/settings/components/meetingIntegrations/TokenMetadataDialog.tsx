"use client";

import { CheckOutlined, ContentCopyOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useId } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import type { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql";
import { getProviderLabel } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/connectedAccounts.helpers";
import {
  srOnlySx,
  useCopyFeedback,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback";
import type { MeetingIntegrationConnectedAccount } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

function formatDate(date: Date | null | undefined, locale: "en" | "ar"): string {
  if (!date) {
    return "—";
  }
  return getDateTimeFormatter(locale === "ar" ? "ar" : "en", DATE_FORMAT_OPTIONS).format(date);
}

const labelUppercaseSx = (theme: Theme) => ({
  typography: "labelUppercase",
  color: theme.palette.text.secondary,
  mb: 0.5,
});

type MetadataFieldProps = {
  readonly label: string;
  readonly children: React.ReactNode;
};

function MetadataField({ label, children }: MetadataFieldProps) {
  return (
    <Box>
      <Typography sx={labelUppercaseSx}>{label}</Typography>
      {children}
    </Box>
  );
}

type TokenIdRowProps = {
  readonly tokenId: string;
  readonly labels: SettingsMeetingIntegrationsLabels;
};

function TokenIdRow({ tokenId, labels }: TokenIdRowProps) {
  const [copied, copy] = useCopyFeedback();

  const handleCopy = () => copy(tokenId);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography sx={{ typography: "bodyMd", fontFamily: "monospace", wordBreak: "break-all" }}>{tokenId}</Typography>
      <Tooltip title={copied ? labels.metadata.tokenIdCopied : labels.metadata.copyTokenId}>
        <Button
          size="small"
          variant="outlined"
          startIcon={copied ? <CheckOutlined /> : <ContentCopyOutlined />}
          onClick={handleCopy}
          aria-label={labels.metadata.copyTokenId}
        >
          {copied ? labels.metadata.tokenIdCopied : labels.metadata.copyTokenId}
        </Button>
      </Tooltip>
      <Box component="output" sx={srOnlySx} aria-live="polite">
        {copied ? labels.metadata.tokenIdCopied : ""}
      </Box>
    </Box>
  );
}

type ScopesChipsProps = {
  readonly scopes: readonly string[] | undefined;
  readonly labels: SettingsMeetingIntegrationsLabels;
};

function ScopesChips({ scopes, labels }: ScopesChipsProps) {
  const visibleScopes = scopes ?? [];
  if (visibleScopes.length === 0) {
    return (
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
        {labels.metadata.noScopes}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {visibleScopes.map(scope => (
        <Chip key={scope} size="small" label={scope} variant="outlined" />
      ))}
    </Box>
  );
}

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
