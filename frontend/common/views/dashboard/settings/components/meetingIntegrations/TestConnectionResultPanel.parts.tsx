"use client";

import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { FilterButton } from "@/frontend/common/components/ui/button";
import {
  MeetingConnectionTestMode,
  type MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  ConnectionSummaryMetrics,
  RawPayloadSection,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.content";
import type { TestMeetingConnectionResult } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

type RunTestHandler = (providerSlug: MeetingIntegrationProviderSlug, mode: MeetingConnectionTestMode) => Promise<void>;

export function TestButtonRow({
  labels,
  testing,
  providerSlug,
  onRunTest,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly testing: boolean;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly onRunTest: RunTestHandler;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <FilterButton
        size="small"
        disabled={testing}
        onClick={() => onRunTest(providerSlug, MeetingConnectionTestMode.ValidateConfig)}
        startIcon={testing ? <CircularProgress size={16} /> : undefined}
      >
        {labels.validateConfig}
      </FilterButton>
      <FilterButton
        size="small"
        disabled={testing}
        onClick={() => onRunTest(providerSlug, MeetingConnectionTestMode.GenerateAndDelete)}
      >
        {labels.generateAndDelete}
      </FilterButton>
    </Box>
  );
}

export function IdleContent({ labels }: { readonly labels: SettingsMeetingIntegrationsLabels }) {
  return (
    <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
      {labels.testPanel.idleHint}
    </Typography>
  );
}

export function TestingContent({ labels }: { readonly labels: SettingsMeetingIntegrationsLabels }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CircularProgress size={20} />
      <Typography sx={{ typography: "bodyMd" }}>{labels.testConnectionTesting}</Typography>
    </Box>
  );
}

export function FailureContent({
  labels,
  result,
  providerSlug,
  onRunTest,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly result: TestMeetingConnectionResult;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly onRunTest: RunTestHandler;
}) {
  return (
    <Alert
      severity="error"
      icon={false}
      action={
        <FilterButton size="small" onClick={() => onRunTest(providerSlug, MeetingConnectionTestMode.ValidateConfig)}>
          {labels.retryTest}
        </FilterButton>
      }
    >
      <Stack sx={{ gap: 0.5 }}>
        <Typography sx={{ fontWeight: 600 }}>{labels.testConnectionFailure}</Typography>
        <ConnectionSummaryMetrics labels={labels} result={result} authStatusLabel={labels.testPanel.authFailure} />
        {result.errorCode && (
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>
            {labels.errorCode}: {result.errorCode}
          </Typography>
        )}
        {result.errorMessage && (
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>
            {labels.errorMessage}: {result.errorMessage}
          </Typography>
        )}
        {result.rawUpstreamPayload && <RawPayloadSection labels={labels} payload={result.rawUpstreamPayload} />}
      </Stack>
    </Alert>
  );
}
