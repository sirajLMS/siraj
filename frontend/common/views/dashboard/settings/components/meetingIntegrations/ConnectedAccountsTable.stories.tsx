import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug as MeetingIntegrationProviderSlugEnum,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { ConnectedAccountsTable } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable";
import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable",
  component: ConnectedAccountsTable,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ConnectedAccountsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: SettingsMeetingIntegrationsLabels = createMeetingIntegrationLabelsMock();

const providerSlug: MeetingIntegrationProviderSlug = MeetingIntegrationProviderSlugEnum.Zoom;

const accounts: MeetingIntegrationConnectedAccount[] = [
  {
    id: "a1",
    userId: "user1",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@example.com",
    connectedAt: new Date("2026-06-15T09:00:00Z"),
    expiresAt: new Date("2026-09-15T09:00:00Z"),
    lastRefreshedAt: new Date("2026-08-01T03:00:00Z"),
    status: MeetingIntegrationConnectedAccountStatus.Connected,
  },
  {
    id: "a2",
    userId: "user2",
    name: "Fatima Ali",
    email: "fatima.ali@example.com",
    connectedAt: new Date("2026-05-01T12:00:00Z"),
    expiresAt: new Date("2026-08-05T12:00:00Z"),
    lastRefreshedAt: new Date("2026-07-28T12:00:00Z"),
    status: MeetingIntegrationConnectedAccountStatus.ExpiringSoon,
  },
  {
    id: "a3",
    userId: "user3",
    name: "Omar Saeed",
    email: "omar.saeed@example.com",
    connectedAt: new Date("2026-03-10T14:00:00Z"),
    expiresAt: new Date("2026-06-10T14:00:00Z"),
    lastRefreshedAt: new Date("2026-06-10T14:00:00Z"),
    status: MeetingIntegrationConnectedAccountStatus.ReauthNeeded,
  },
  {
    id: "a4",
    userId: "user4",
    name: null,
    email: "no.name@example.com",
    connectedAt: new Date("2026-01-20T08:00:00Z"),
    expiresAt: null,
    lastRefreshedAt: null,
    status: MeetingIntegrationConnectedAccountStatus.Revoked,
  },
];

export const WithAccounts: Story = {
  args: {
    labels,
    accounts,
    loading: false,
    providerSlug,
    canEdit: true,
    revokingFor: null,
    onRevokeRequest: () => {},
    onMetadataDialogOpen: () => {},
  },
};

export const Empty: Story = {
  args: {
    labels,
    accounts: [],
    loading: false,
    providerSlug,
    canEdit: true,
    revokingFor: null,
    onRevokeRequest: () => {},
    onMetadataDialogOpen: () => {},
  },
};

export const Loading: Story = {
  args: {
    labels,
    accounts: [],
    loading: true,
    providerSlug,
    canEdit: true,
    revokingFor: null,
    onRevokeRequest: () => {},
    onMetadataDialogOpen: () => {},
  },
};

export const RevokingInProgress: Story = {
  args: {
    labels,
    accounts,
    loading: false,
    providerSlug,
    canEdit: true,
    revokingFor: { userId: "user2", providerSlug: MeetingIntegrationProviderSlugEnum.Zoom },
    onRevokeRequest: () => {},
    onMetadataDialogOpen: () => {},
  },
};

export const ReadOnly: Story = {
  args: {
    labels,
    accounts,
    loading: false,
    providerSlug,
    canEdit: false,
    revokingFor: null,
    onRevokeRequest: () => {},
    onMetadataDialogOpen: () => {},
  },
};
