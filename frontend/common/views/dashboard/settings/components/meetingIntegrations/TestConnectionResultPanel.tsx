"use client";

import { ContentCopyOutlined, OpenInNewOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Chip, CircularProgress, Link, Stack, Typography } from "@mui/material";
import type * as React from "react";
import { useState } from "react";
import {
  MeetingConnectionTestMode,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TestConnectionState } from "@/frontend/common/views/dashboard/settings/types/meeting-ui.types";
import type { TestMeetingConnectionResult } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const marketplaceUrls: Partial<Record<MeetingIntegrationProviderSlug, string>> = {
  [MeetingIntegrationProviderSlug.Zoom]: "https://marketplace.zoom.us/",
  [MeetingIntegrationProviderSlug.GoogleMeet]: "https://console.cloud.google.com/",
  [MeetingIntegrationProviderSlug.MicrosoftTeams]: "https://entra.microsoft.com/",
};

function getMarketplaceUrl(slug: MeetingIntegrationProviderSlug): string | null {
  return marketplaceUrls[slug] ?? null;
}

function deriveState(testing: boolean, result: TestMeetingConnectionResult | null): TestConnectionState {
  if (testing) return "testing";
  if (result === null) return "idle";
  return result.ok ? "success" : "failure";
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
        onClick={() => onRunTest(providerSlug, MeetingConnectionTestMode.ValidateConfig)}
        startIcon={testing ? <CircularProgress size={16} /> : undefined}
      >
        {labels.validateConfig}
      </Button>
      <Button
        size="small"
        variant="outlined"
        disabled={testing}
        onClick={() => onRunTest(providerSlug, MeetingConnectionTestMode.GenerateAndDelete)}
      >
        {labels.generateAndDelete}
      </Button>
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
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

type SuccessContentProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult;
  readonly marketplaceUrl: string | null;
};

function SuccessContent({ labels, result, marketplaceUrl }: SuccessContentProps) {
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
    <Alert severity="success" icon={false}>
      <Stack sx={{ gap: 0.5 }}>
        <Typography sx={{ fontWeight: 600 }}>{labels.testPanel.successMessage}</Typography>
        <Typography sx={{ typography: "bodySm" }}>
          {labels.latency}: {result.latencyMs}ms
        </Typography>
        <Typography sx={{ typography: "bodySm" }}>
          {labels.testPanel.endpointReached}: {result.upstreamResponseSummary}
        </Typography>
        <Typography sx={{ typography: "bodySm" }}>
          {labels.testPanel.authStatus}: {labels.testPanel.authSuccess}
        </Typography>
        {result.testJoinUrl && (
          <TestJoinUrlRow labels={labels} url={result.testJoinUrl} copied={copied} onCopy={handleCopyUrl} />
        )}
        {result.deleted !== null && (
          <Typography sx={{ typography: "bodySm" }}>
            {labels.deleted}: {result.deleted ? labels.testSuccess : labels.notDeleted}
          </Typography>
        )}
        {result.rawUpstreamPayload && <RawPayloadSection labels={labels} payload={result.rawUpstreamPayload} />}
        <MarketplaceLink labels={labels} marketplaceUrl={marketplaceUrl} />
      </Stack>
    </Alert>
  );
}

type FailureContentProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly onRunTest: (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;
};

function FailureContent({ labels, result, providerSlug, onRunTest }: FailureContentProps) {
  return (
    <Alert
      severity="error"
      icon={false}
      action={
        <Button
          size="small"
          variant="outlined"
          onClick={() => onRunTest(providerSlug, MeetingConnectionTestMode.ValidateConfig)}
        >
          {labels.retryTest}
        </Button>
      }
    >
      <Stack sx={{ gap: 0.5 }}>
        <Typography sx={{ fontWeight: 600 }}>{labels.testConnectionFailure}</Typography>
        <Typography sx={{ typography: "bodySm" }}>
          {labels.latency}: {result.latencyMs}ms
        </Typography>
        <Typography sx={{ typography: "bodySm" }}>
          {labels.testPanel.endpointReached}: {result.upstreamResponseSummary}
        </Typography>
        <Typography sx={{ typography: "bodySm" }}>
          {labels.testPanel.authStatus}: {labels.testPanel.authFailure}
        </Typography>
        {result.errorCode && (
          <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.error.main })}>
            {labels.errorCode}: {result.errorCode}
          </Typography>
        )}
        {result.errorMessage && (
          <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.error.main })}>
            {labels.errorMessage}: {result.errorMessage}
          </Typography>
        )}
        {result.rawUpstreamPayload && <RawPayloadSection labels={labels} payload={result.rawUpstreamPayload} />}
      </Stack>
    </Alert>
  );
}

type IdleContentProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
};

function IdleContent({ labels }: IdleContentProps) {
  return <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.testPanel.idleHint}</Typography>;
}

type TestingContentProps = {
  readonly labels: SettingsMeetingIntegrationsLabels;
};

function TestingContent({ labels }: TestingContentProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CircularProgress size={20} />
      <Typography sx={{ typography: "bodySm" }}>{labels.testConnectionTesting}</Typography>
    </Box>
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
  const state = deriveState(testing, result);

  let statusContent: React.ReactNode;
  if (state === "idle") {
    statusContent = <IdleContent labels={labels} />;
  } else if (state === "testing") {
    statusContent = <TestingContent labels={labels} />;
  } else if (state === "success" && result) {
    statusContent = <SuccessContent labels={labels} result={result} marketplaceUrl={marketplaceUrl} />;
  } else if (state === "failure" && result) {
    statusContent = (
      <FailureContent labels={labels} result={result} providerSlug={providerSlug} onRunTest={onRunTest} />
    );
  } else {
    statusContent = null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <TestButtonRow labels={labels} testing={testing} providerSlug={providerSlug} onRunTest={onRunTest} />
      <Box aria-live="polite">{statusContent}</Box>
    </Box>
  );
}
