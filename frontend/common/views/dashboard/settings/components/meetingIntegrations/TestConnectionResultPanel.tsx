"use client";

import { Box } from "@mui/material";
import type * as React from "react";
import type {
  MeetingConnectionTestMode,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { SuccessContent } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.content";
import {
  deriveState,
  getMarketplaceUrl,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.helpers";
import {
  FailureContent,
  IdleContent,
  TestButtonRow,
  TestingContent,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.parts";
import type { TestMeetingConnectionResult } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

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
