"use client";

import { CheckOutlined, ContentCopyOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import {
  srOnlySx,
  useCopyFeedback,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

type EndpointListLabels = Pick<SettingsMeetingIntegrationsLabels, "endpoints" | "copyEndpointUrl" | "endpointCopied">;

type EndpointListProps = {
  readonly endpoints: readonly string[];
  readonly labels: EndpointListLabels;
};

export function EndpointList({ endpoints, labels }: EndpointListProps) {
  return (
    <Box>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary, mb: 0.5 })}>
        {labels.endpoints}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }} aria-label={labels.endpoints}>
        {endpoints.map(endpoint => (
          <EndpointRow key={endpoint} url={endpoint} labels={labels} />
        ))}
      </Box>
    </Box>
  );
}

type EndpointRowProps = {
  readonly url: string;
  readonly labels: EndpointListLabels;
};

function EndpointRow({ url, labels }: EndpointRowProps) {
  const [copied, copy] = useCopyFeedback();

  const handleCopy = () => copy(url);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      <Typography sx={{ typography: "bodyMd", fontFamily: "monospace", wordBreak: "break-all" }}>{url}</Typography>
      <Button
        size="small"
        variant="outlined"
        startIcon={copied ? <CheckOutlined /> : <ContentCopyOutlined />}
        onClick={handleCopy}
        aria-label={labels.copyEndpointUrl}
      >
        {copied ? labels.endpointCopied : labels.copyEndpointUrl}
      </Button>
      <Box component="output" aria-live="polite" sx={srOnlySx}>
        {copied ? labels.endpointCopied : ""}
      </Box>
    </Box>
  );
}
