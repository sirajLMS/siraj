"use client";

import { CheckOutlined, ContentCopyOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  srOnlySx,
  useCopyFeedback,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const labelUppercaseSx = (theme: Theme) => ({
  typography: "labelUppercase",
  color: theme.palette.text.secondary,
  mb: 0.5,
});

export function MetadataField({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={labelUppercaseSx}>{label}</Typography>
      {children}
    </Box>
  );
}

export function TokenIdRow({
  tokenId,
  labels,
}: {
  readonly tokenId: string;
  readonly labels: SettingsMeetingIntegrationsLabels;
}) {
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

export function ScopesChips({
  scopes,
  labels,
}: {
  readonly scopes: readonly string[] | undefined;
  readonly labels: SettingsMeetingIntegrationsLabels;
}) {
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
