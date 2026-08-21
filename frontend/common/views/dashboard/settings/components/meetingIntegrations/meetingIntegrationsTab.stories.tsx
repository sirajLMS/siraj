import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createConnectedAccountsMock,
  createMeetingIntegrationLabelsMock,
  createProvidersMock,
  createViewModelMock,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { MeetingIntegrationsTabDesktopView } from "@/frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.desktop";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const labels: SettingsMeetingIntegrationsLabels = createMeetingIntegrationLabelsMock();
const providers = createProvidersMock();
const connectedAccounts = createConnectedAccountsMock();

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsTab",
  component: MeetingIntegrationsTabDesktopView,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingIntegrationsTabDesktopView>;

export default meta;
type Story = StoryObj<typeof meta>;

const viewModelDefault: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers,
  expandedSlug: MeetingIntegrationProviderSlug.Zoom,
});

const viewModelConnected: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers,
  expandedSlug: MeetingIntegrationProviderSlug.Zoom,
  connectedAccountsByProvider: {
    [MeetingIntegrationProviderSlug.Zoom]: connectedAccounts,
    [MeetingIntegrationProviderSlug.GoogleMeet]: [],
    [MeetingIntegrationProviderSlug.MicrosoftTeams]: [],
  },
});

const viewModelTestResult: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers,
  expandedSlug: MeetingIntegrationProviderSlug.Zoom,
  lastTestResultByProvider: {
    [MeetingIntegrationProviderSlug.Zoom]: {
      ok: true,
      latencyMs: 245,
      mode: MeetingConnectionTestMode.ValidateConfig,
      testJoinUrl: "https://zoom.us/j/123456789?pwd=abc123",
      deleted: null,
      upstreamResponseSummary: "200 OK — scopes verified",
      errorCode: null,
      errorMessage: null,
      rawUpstreamPayload: { token_type: "bearer", scope: "user:write:admin meeting:write" },
      requiredScopes: ["user:write:admin", "meeting:write"],
      grantedScopes: ["user:write:admin", "meeting:write", "user:read"],
    },
    [MeetingIntegrationProviderSlug.GoogleMeet]: null,
    [MeetingIntegrationProviderSlug.MicrosoftTeams]: null,
  },
});

const viewModelError: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers,
  expandedSlug: MeetingIntegrationProviderSlug.GoogleMeet,
  lastTestResultByProvider: {
    [MeetingIntegrationProviderSlug.GoogleMeet]: {
      ok: false,
      latencyMs: 1200,
      mode: MeetingConnectionTestMode.ValidateConfig,
      testJoinUrl: null,
      deleted: null,
      upstreamResponseSummary: "401 Unauthorized",
      errorCode: "INVALID_CREDENTIALS",
      errorMessage: "The provided service account credentials are invalid or expired.",
      rawUpstreamPayload: { error: "invalid_grant", error_description: "Token has been expired or revoked." },
      requiredScopes: null,
      grantedScopes: null,
    },
    [MeetingIntegrationProviderSlug.Zoom]: null,
    [MeetingIntegrationProviderSlug.MicrosoftTeams]: null,
  },
});

const viewModelMetadataOpen: MeetingIntegrationsViewModel = createViewModelMock({
  labels,
  providers,
  expandedSlug: MeetingIntegrationProviderSlug.Zoom,
  connectedAccountsByProvider: {
    [MeetingIntegrationProviderSlug.Zoom]: connectedAccounts,
    [MeetingIntegrationProviderSlug.GoogleMeet]: [],
    [MeetingIntegrationProviderSlug.MicrosoftTeams]: [],
  },
  metadataDialogAccount: {
    id: "a1",
    userId: "user1",
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    connectedAt: new Date("2026-06-15T09:00:00Z"),
    expiresAt: new Date("2026-09-15T09:00:00Z"),
    lastRefreshedAt: new Date("2026-08-01T03:00:00Z"),
    status: MeetingIntegrationConnectedAccountStatus.Connected,
  },
  metadataDialogProviderSlug: MeetingIntegrationProviderSlug.Zoom,
});

export const Default: Story = {
  args: viewModelDefault,
};

export const ConnectedState: Story = {
  args: viewModelConnected,
};

export const TestResultState: Story = {
  args: viewModelTestResult,
};

export const ErrorState: Story = {
  args: viewModelError,
};

export const MetadataDialogOpen: Story = {
  args: viewModelMetadataOpen,
};
