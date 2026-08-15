import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DisconnectConfirmDialog,
  type DisconnectConfirmDialogLabels,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog",
  component: DisconnectConfirmDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof DisconnectConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: DisconnectConfirmDialogLabels = {
  disconnectWarningTitle: "Disconnect provider?",
  disconnectWarningMessage: "Disconnecting will revoke the saved OAuth token.",
  disconnectWarningImpact: "Existing meeting URLs remain valid but new ones cannot be generated until reconnect.",
  disconnect: "Disconnect",
  cancel: "Cancel",
};

const noop = () => {};

export const Open: Story = {
  args: {
    labels,
    open: true,
    providerName: "Zoom",
    providerSlug: "zoom",
    isLoading: false,
    errorMessage: null,
    onConfirm: noop,
    onClose: noop,
  },
};

export const Loading: Story = {
  args: {
    labels,
    open: true,
    providerName: "Zoom",
    providerSlug: "zoom",
    isLoading: true,
    errorMessage: null,
    onConfirm: noop,
    onClose: noop,
  },
};

export const WithError: Story = {
  args: {
    labels,
    open: true,
    providerName: "Google Meet",
    providerSlug: "google_meet",
    isLoading: false,
    errorMessage: "Failed to disconnect: provider returned 503. Try again.",
    onConfirm: noop,
    onClose: noop,
  },
};

export const Closed: Story = {
  args: {
    labels,
    open: false,
    providerName: "Zoom",
    providerSlug: "zoom",
    isLoading: false,
    errorMessage: null,
    onConfirm: noop,
    onClose: noop,
  },
};

export const MicrosoftTeams: Story = {
  args: {
    labels,
    open: true,
    providerName: "Microsoft Teams",
    providerSlug: "microsoft_teams",
    isLoading: false,
    errorMessage: null,
    onConfirm: noop,
    onClose: noop,
  },
  render: args => (
    <Stack sx={{ width: 480 }}>
      <DisconnectConfirmDialog {...args} />
    </Stack>
  ),
};
