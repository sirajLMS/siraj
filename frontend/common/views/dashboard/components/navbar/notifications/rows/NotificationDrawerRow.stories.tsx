import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationDrawerRow } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/NotificationDrawerRow";
import { mockViewModel } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/NotificationDrawerRow.fixtures";
import {
  classRescheduledAlert,
  invoiceProofPendingAlert,
  unreadInfoAlert,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/notificationRowFixtures";

const meta: Meta<typeof NotificationDrawerRow> = {
  title: "Dashboard/Notifications/NotificationDrawerRow",
  component: NotificationDrawerRow,
  parameters: {
    layout: "centered",
  },
  decorators: [
    Story => (
      <Box sx={{ width: 420, maxWidth: "100%" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof NotificationDrawerRow>;

export const UnreadInfo: Story = {
  args: {
    alert: unreadInfoAlert,
    vm: mockViewModel,
  },
};

export const ClassRescheduled: Story = {
  args: {
    alert: classRescheduledAlert,
    vm: mockViewModel,
  },
};

export const InvoiceProofPending: Story = {
  args: {
    alert: invoiceProofPendingAlert,
    vm: mockViewModel,
  },
};
