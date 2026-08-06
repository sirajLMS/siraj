"use client";

import { ContentCopyOutlined, OpenInNewOutlined } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Link, Typography } from "@mui/material";
import { useState } from "react";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  MeetingConnectionTestMode,
  TestMeetingConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const marketplaceUrls: Partial<Record<MeetingIntegrationProviderSlug, string>> = {
  [MeetingIntegrationProviderSlug.Zoom]: "https://marketplace.zoom.us/",
  [MeetingIntegrationProviderSlug.GoogleMeet]: "https://console.cloud.google.com/",
  [MeetingIntegrationProviderSlug.MicrosoftTeams]: "https://entra.microsoft.com/",
};

function getMarketplaceUrl(slug: MeetingIntegrationProviderSlug): string | null {
  return marketplaceUrls[slug] ?? null;
}

type TestButtonRowProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly testing: boolean;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly onRunTest: (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;
};

function TestButtonRow({ labels, testing, providerSlug, onRunTest }: TestButtonRowProps) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <Button
        size="small"
        variant="outlined"
        disabled={testing}
        onClick={() => onRunTest(providerSlug, "VALIDATE_CONFIG" as MeetingConnectionTestMode)}
        startIcon={testing ? <CircularProgress size={16} /> : undefined}
      >
        {labels.validateConfig}
      </Button>
      <Button
        size="small"
        variant="outlined"
        disabled={testing}
        onClick={() => onRunTest(providerSlug, "GENERATE_AND_DELETE" as MeetingConnectionTestMode)}
      >
        {labels.generateAndDelete}
      </Button>
    </Box>
  );
}

type TestResultDetailsProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult;
  readonly marketplaceUrl: string | null;
};

function TestResultDetails({ labels, result, marketplaceUrl }: TestResultDetailsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — silently ignore
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <TestResultHeaderRow labels={labels} ok={result.ok} />
      <Typography sx={{ typography: "bodySm" }}>
        {labels.latency}: {result.latencyMs}ms
      </Typography>
      {result.testJoinUrl && (
        <TestJoinUrlRow labels={labels} url={result.testJoinUrl} copied={copied} onCopy={handleCopyUrl} />
      )}
      {result.deleted !== null && (
        <Typography sx={{ typography: "bodySm" }}>
          {labels.deleted}: {result.deleted ? labels.testSuccess : labels.notDeleted}
        </Typography>
      )}
      {result.errorCode && (
        <Typography sx={{ typography: "bodySm", color: "error.main" }}>
          {labels.errorCode}: {result.errorCode}
        </Typography>
      )}
      {result.errorMessage && (
        <Typography sx={{ typography: "bodySm", color: "error.main" }}>
          {labels.errorMessage}: {result.errorMessage}
        </Typography>
      )}
      {result.rawUpstreamPayload && <RawPayloadSection labels={labels} payload={result.rawUpstreamPayload} />}
      <MarketplaceLink labels={labels} marketplaceUrl={marketplaceUrl} />
    </Box>
  );
}

type TestResultHeaderRowProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly ok: boolean;
};

function TestResultHeaderRow({ labels, ok }: TestResultHeaderRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{labels.testResult}</Typography>
      <Chip
        size="small"
        label={ok ? labels.testSuccess : labels.testFailure}
        color={ok ? "success" : "error"}
        variant="outlined"
      />
    </Box>
  );
}

type TestJoinUrlRowProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly url: string;
  readonly copied: boolean;
  readonly onCopy: (url: string) => Promise<void>;
};

function TestJoinUrlRow({ labels, url, copied, onCopy }: TestJoinUrlRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      <Typography sx={{ typography: "bodySm" }}>
        {labels.joinUrl}: {url}
      </Typography>
      <Chip
        size="small"
        icon={<ContentCopyOutlined sx={{ fontSize: 14 }} />}
        label={copied ? labels.testPanel.copied : labels.testPanel.copyUrl}
        variant="outlined"
        clickable
        onClick={() => onCopy(url)}
      />
    </Box>
  );
}

type RawPayloadSectionProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly payload: unknown;
};

function RawPayloadSection({ labels, payload }: RawPayloadSectionProps) {
  return (
    <details>
      <summary>
        <Typography component="span" sx={{ typography: "bodySm", color: "text.secondary", cursor: "pointer" }}>
          {labels.testPanel.rawResponse}
        </Typography>
      </summary>
      <Box
        component="pre"
        sx={{
          typography: "bodySm",
          fontFamily: "monospace",
          p: 1,
          m: 0,
          mt: 0.5,
          overflow: "auto",
          maxHeight: 240,
          bgcolor: "action.hover",
        }}
      >
        {JSON.stringify(payload, null, 2)}
      </Box>
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
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, typography: "bodySm" }}
    >
      {labels.testPanel.marketplaceHint}
      <OpenInNewOutlined sx={{ fontSize: 14 }} />
    </Link>
  );
}

type TestConnectionResultPanelProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult | null;
  readonly testing: boolean;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly onRunTest: (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;
};

export function TestConnectionResultPanel({
  labels,
  result,
  testing,
  providerSlug,
  onRunTest,
}: TestConnectionResultPanelProps) {
  const marketplaceUrl = getMarketplaceUrl(providerSlug);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <TestButtonRow labels={labels} testing={testing} providerSlug={providerSlug} onRunTest={onRunTest} />
      {result && <TestResultDetails labels={labels} result={result} marketplaceUrl={marketplaceUrl} />}
    </Box>
  );
}
