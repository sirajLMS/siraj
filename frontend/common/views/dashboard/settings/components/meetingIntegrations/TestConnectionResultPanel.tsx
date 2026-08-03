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

export function TestConnectionResultPanel({
  labels,
  result,
  testing,
  providerSlug,
  onRunTest,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult | null;
  readonly testing: boolean;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly onRunTest: (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — silently ignore
    }
  };

  const marketplaceUrl = getMarketplaceUrl(providerSlug);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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

      {result && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{labels.testResult}</Typography>
            <Chip
              size="small"
              label={result.ok ? labels.testSuccess : labels.testFailure}
              color={result.ok ? "success" : "error"}
              variant="outlined"
            />
          </Box>
          <Typography sx={{ typography: "bodySm" }}>
            {labels.latency}: {result.latencyMs}ms
          </Typography>
          {result.testJoinUrl && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
              <Typography sx={{ typography: "bodySm" }}>
                {labels.joinUrl}: {result.testJoinUrl}
              </Typography>
              <Chip
                size="small"
                icon={<ContentCopyOutlined sx={{ fontSize: 14 }} />}
                label={copied ? labels.testPanel.copied : labels.testPanel.copyUrl}
                variant="outlined"
                clickable
                onClick={() => result.testJoinUrl && handleCopyUrl(result.testJoinUrl)}
              />
            </Box>
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

          {result.rawUpstreamPayload && (
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
                {JSON.stringify(result.rawUpstreamPayload, null, 2)}
              </Box>
            </details>
          )}

          {marketplaceUrl && (
            <Link
              href={marketplaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, typography: "bodySm" }}
            >
              {labels.testPanel.marketplaceHint}
              <OpenInNewOutlined sx={{ fontSize: 14 }} />
            </Link>
          )}
        </Box>
      )}
    </Box>
  );
}
