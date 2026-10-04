"use client";

import { OpenInNewOutlined } from "@mui/icons-material";
import { Alert, Box, Link, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui";
import type { TestMeetingConnectionResult } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const StyledPre = styled("pre")(({ theme }) => ({
  typography: "bodyMd",
  fontFamily: "monospace",
  p: 1,
  m: 0,
  mt: 0.5,
  overflow: "auto",
  maxHeight: 240,
  bgcolor: theme.palette.action.hover,
}));

type TestJoinUrlRowProps = {
  readonly joinUrlLabel: string;
  readonly url: string;
};

function TestJoinUrlRow({ joinUrlLabel, url }: TestJoinUrlRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
      <Typography sx={{ typography: "bodyMd" }}>
        {joinUrlLabel}: {url}
      </Typography>
      <CopyMeetingUrlButton meetingUrl={url} variant="icon" size="small" />
    </Box>
  );
}

type RawPayloadSectionProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly payload: unknown;
};

export function RawPayloadSection({ labels, payload }: RawPayloadSectionProps) {
  return (
    <details>
      <summary>
        <Box sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary, cursor: "pointer" })}>
          {labels.testPanel.rawResponse}
        </Box>
      </summary>
      <StyledPre>{JSON.stringify(payload, null, 2)}</StyledPre>
    </details>
  );
}

type MarketplaceLinkProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly marketplaceUrl: string | null;
};

function MarketplaceLink({ labels, marketplaceUrl }: MarketplaceLinkProps) {
  if (!marketplaceUrl) {
    return null;
  }
  return (
    <Link
      href={marketplaceUrl}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, typography: "bodyMd" }}
    >
      {labels.testPanel.marketplaceHint}
      <OpenInNewOutlined sx={{ fontSize: 14 }} />
    </Link>
  );
}

type ConnectionSummaryMetricsProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult;
  readonly authStatusLabel: string;
};

export function ConnectionSummaryMetrics({ labels, result, authStatusLabel }: ConnectionSummaryMetricsProps) {
  return (
    <>
      <Typography sx={{ typography: "bodyMd" }}>
        {labels.latency}: {result.latencyMs}ms
      </Typography>
      <Typography sx={{ typography: "bodyMd" }}>
        {labels.testPanel.endpointReached}: {result.upstreamResponseSummary}
      </Typography>
      <Typography sx={{ typography: "bodyMd" }}>
        {labels.testPanel.authStatus}: {authStatusLabel}
      </Typography>
    </>
  );
}

export function SuccessContent({
  labels,
  result,
  marketplaceUrl,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult;
  readonly marketplaceUrl: string | null;
}) {
  return (
    <Alert severity="success" icon={false}>
      <Stack sx={{ gap: 0.5 }}>
        <Typography sx={{ fontWeight: 600 }}>{labels.testPanel.successMessage}</Typography>
        <ConnectionSummaryMetrics labels={labels} result={result} authStatusLabel={labels.testPanel.authSuccess} />
        {result.testJoinUrl && <TestJoinUrlRow joinUrlLabel={labels.joinUrl} url={result.testJoinUrl} />}
        {result.deleted !== null && (
          <Typography sx={{ typography: "bodyMd" }}>
            {labels.deleted}: {result.deleted ? labels.testSuccess : labels.notDeleted}
          </Typography>
        )}
        {result.rawUpstreamPayload && <RawPayloadSection labels={labels} payload={result.rawUpstreamPayload} />}
        <MarketplaceLink labels={labels} marketplaceUrl={marketplaceUrl} />
      </Stack>
    </Alert>
  );
}
