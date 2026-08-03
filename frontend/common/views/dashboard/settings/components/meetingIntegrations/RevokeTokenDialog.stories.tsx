import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import { RevokeTokenDialog } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog",
  component: RevokeTokenDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof RevokeTokenDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: SettingsMeetingIntegrationsLabels = createMeetingIntegrationLabelsMock();

export const Open: Story = {
  args: {
    labels,
    open: true,
    revoking: false,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Closed: Story = {
  args: {
    labels,
    open: false,
    revoking: false,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Revoking: Story = {
  args: {
    labels,
    open: true,
    revoking: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
};
