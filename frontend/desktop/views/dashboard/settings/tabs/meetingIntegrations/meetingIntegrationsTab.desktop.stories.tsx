import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createConnectedAccountsMock,
  createMeetingIntegrationLabelsMock,
  createProvidersMock,
  createViewModelConnected,
  createViewModelDefault,
  createViewModelError,
  createViewModelMetadataOpen,
  createViewModelTestResult,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import { MeetingIntegrationsTabDesktopView } from "@/frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.desktop";

const labels = createMeetingIntegrationLabelsMock();
const providers = createProvidersMock();
const connectedAccounts = createConnectedAccountsMock();

const meta = {
  title: "Desktop/views/dashboard/settings/tabs/meetingIntegrations/MeetingIntegrationsTab",
  component: MeetingIntegrationsTabDesktopView,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingIntegrationsTabDesktopView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: createViewModelDefault(labels, providers),
};

export const ConnectedState: Story = {
  args: createViewModelConnected(labels, providers, connectedAccounts),
};

export const TestResultState: Story = {
  args: createViewModelTestResult(labels, providers),
};

export const ErrorState: Story = {
  args: createViewModelError(labels, providers),
};

export const MetadataDialogOpen: Story = {
  args: createViewModelMetadataOpen(labels, providers, connectedAccounts),
};
