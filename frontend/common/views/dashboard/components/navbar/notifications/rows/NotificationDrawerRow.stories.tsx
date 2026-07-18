import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/common/utils/logger";
import { NotificationDrawerRow } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/NotificationDrawerRow";
import type {
  NotificationDrawerAlert,
  NotificationsDrawerViewModel,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";

// NOTIFICATIONS-SPEC: Storybook mock fixtures — not user-facing UI strings (F13 exemption).
const unreadInfoAlert: NotificationDrawerAlert = {
  id: "notification-delivery-001",
  deliveryId: "delivery-001",
  type: "notification",
  eventType: NotificationEventType.ClassReminder,
  channel: NotificationChannel.OnApp,
  metadata: {
    entityKind: "class",
    entityId: "class-instance-001",
    classInstanceId: "class-instance-001",
  },
  title: "Upcoming class reminder",
  body: "Your session starts in 30 minutes.",
  createdAt: new Date().toISOString(),
  severity: "info",
  readAt: null,
};

const classRescheduledAlert: NotificationDrawerAlert = {
  id: "notification-delivery-002",
  deliveryId: "delivery-002",
  type: "notification",
  eventType: NotificationEventType.ClassRescheduled,
  channel: NotificationChannel.OnApp,
  metadata: {
    entityKind: "class",
    entityId: "class-instance-002",
    classInstanceId: "class-instance-002",
  },
  title: "Class rescheduled",
  body: "Your teacher moved the session to tomorrow at 4:00 PM.",
  createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  severity: "warning",
  readAt: null,
};

const invoiceProofPendingAlert: NotificationDrawerAlert = {
  id: "notification-delivery-003",
  deliveryId: "delivery-003",
  type: "notification",
  eventType: NotificationEventType.InvoiceStatusChanged,
  channel: NotificationChannel.OnApp,
  metadata: {
    entityKind: "invoice",
    entityId: "invoice-003",
    proofPending: true,
    newStatus: "PROOF_SUBMITTED",
  },
  title: "Payment proof submitted",
  body: "A parent uploaded proof of payment for review.",
  createdAt: new Date(Date.now() - 7_200_000).toISOString(),
  severity: "info",
  readAt: null,
};

function createMockVm(overrides?: Partial<NotificationsDrawerViewModel>): NotificationsDrawerViewModel {
  return {
    alerts: [],
    unreadCount: 0,
    totalCount: 0,
    loading: false,
    error: undefined,
    drawerOpen: true,
    openDrawer: () => {
      logger.info("Storybook openDrawer");
    },
    closeDrawer: () => {
      logger.info("Storybook closeDrawer");
    },
    markOneRead: async deliveryId => {
      logger.info("Storybook markOneRead", { deliveryId });
    },
    markAllRead: async () => {
      logger.info("Storybook markAllRead");
    },
    handleViewEntity: metadata => {
      logger.info("Storybook handleViewEntity", { entityKind: metadata.entityKind, entityId: metadata.entityId });
    },
    handleReschedule: classInstanceId => {
      logger.info("Storybook handleReschedule", { classInstanceId });
    },
    handleApproveInvoice: async (deliveryId, invoiceId) => {
      logger.info("Storybook handleApproveInvoice", { deliveryId, invoiceId });
    },
    handleRejectInvoice: async (deliveryId, invoiceId) => {
      logger.info("Storybook handleRejectInvoice", { deliveryId, invoiceId });
    },
    handleManagePreferences: () => {
      logger.info("Storybook handleManagePreferences");
    },
    ...overrides,
  };
}

const mockVm = createMockVm();

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
    vm: mockVm,
  },
};

export const ClassRescheduled: Story = {
  args: {
    alert: classRescheduledAlert,
    vm: mockVm,
  },
};

export const InvoiceProofPending: Story = {
  args: {
    alert: invoiceProofPendingAlert,
    vm: mockVm,
  },
};
