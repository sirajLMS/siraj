import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { DisconnectConfirmDialogLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/DisconnectConfirmDialog";
import { DisconnectConfirmDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/DisconnectConfirmDialog";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/DisconnectConfirmDialog",
  component: DisconnectConfirmDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof DisconnectConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: DisconnectConfirmDialogLabels = {
  disconnectConfirmTitle: "Disconnect provider?",
  disconnectConfirm:
    "Are you sure you want to disconnect this provider? You will need to reconnect it to use it again.",
  confirmDisconnect: "Disconnect",
  cancel: "Cancel",
};

const noop = () => {};

export const Open: Story = {
  args: {
    labels,
    open: true,
    disconnecting: false,
    onConfirm: noop,
    onCancel: noop,
  },
};

export const Loading: Story = {
  args: {
    labels,
    open: true,
    disconnecting: true,
    onConfirm: noop,
    onCancel: noop,
  },
};

export const Closed: Story = {
  args: {
    labels,
    open: false,
    disconnecting: false,
    onConfirm: noop,
    onCancel: noop,
  },
};
