import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/common/utils/logger";
import { NotificationDrawerRow } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/NotificationDrawerRow";
import type {
  NotificationDrawerAlert,
  NotificationsDrawerViewModel,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";

// NOTIFICATIONS-SPEC: Storybook mock fixtures — not user-facing UI strings (F13 exemption).

/** Stub body for event-specific label fields — returns placeholder copy. */
const stubBody = (): string => "Storybook mock body";

const mockLabels: NotificationsDrawerViewModel["labels"] = {
  invoiceGenerated: { title: "Invoice generated", body: stubBody },
  invoiceStatusChanged: {
    proofSubmitted: { title: "Proof submitted", body: stubBody },
    proofApproved: { title: "Proof approved", body: stubBody },
    proofRejected: { title: "Proof rejected", body: stubBody },
    markedPaid: { title: "Marked paid", body: stubBody },
  },
  paymentMethodChanged: {
    created: { title: "Payment method created", body: stubBody },
    updated: { title: "Payment method updated", body: stubBody },
    deleted: { title: "Payment method deleted", body: stubBody },
    setDefault: { title: "Payment method set as default", body: stubBody },
    verified: { title: "Payment method verified", body: stubBody },
  },
  classScheduled: { title: "Class scheduled", body: stubBody },
  classActivated: { title: "Class activated", body: stubBody },
  classStarted: { title: "Class started", body: stubBody },
  classCompleted: { title: "Class completed", body: stubBody },
  classMarkedAbsent: { title: "Class marked absent", body: stubBody },
  classMarkedMissed: { title: "Class marked missed", body: stubBody },
  classLeaveRequested: { title: "Leave requested", body: stubBody },
  classRescheduled: { title: "Class rescheduled", body: stubBody },
  classCancelled: { title: "Class cancelled", body: stubBody },
  classReset: { title: "Class reset", body: stubBody },
  studentTeacherReassigned: {
    parent: { title: "Teacher reassigned", body: stubBody },
    oldTeacher: { title: "Teacher reassigned", body: stubBody },
    newTeacher: { title: "Teacher reassigned", body: stubBody },
  },
  studentStatusChanged: { title: "Student status changed", body: stubBody },
  studentQuotaOverridden: { title: "Student quota overridden", body: stubBody },
  lessonReportSubmitted: { title: "Lesson report submitted", body: stubBody },
  lessonReportReviewed: { title: "Lesson report reviewed", body: stubBody },
  newComplaint: { title: "New complaint", body: stubBody },
  complaintResponse: { title: "Complaint response" },
  newSuggestion: { title: "New suggestion" },
  suggestionResponse: { title: "Suggestion response" },
  suggestionMarkedDuplicate: { title: "Suggestion marked duplicate", body: stubBody },
  quotaExpiringSoon: { title: "Quota expiring soon", body: stubBody },
  quotaExpired: { title: "Quota expired", body: stubBody },
  quotaLowBalance: { title: "Quota low balance", body: stubBody },
  onDemandInstancePendingCredit: { title: "On-demand pending credit", body: stubBody },
  onDemandInstanceReminderT3: { title: "On-demand reminder T-3", body: stubBody },
  onDemandInstanceReminderT1: { title: "On-demand reminder T-1", body: stubBody },
  onDemandTeacherDailyDigest: { title: "Teacher daily digest", body: stubBody },
  // Drawer UI keys
  drawerTitle: "Notifications",
  managePreferences: "Manage preferences",
  markAllRead: "Mark all read",
  markAsRead: "Mark as read",
  reschedule: "Reschedule",
  viewEntity: "View",
  approveInvoice: "Approve",
  rejectInvoice: "Reject",
  noNotifications: "No notifications",
  unreadCount: (count: number) => `${count} unread`,
  whatsappDeliveryFailed: "WhatsApp delivery failed",
  whatsappDeliveryFailedWithReason: (reason: string) => `WhatsApp delivery failed: ${reason}`,
};

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

function createMockViewModel(): NotificationsDrawerViewModel {
  return {
    labels: mockLabels,
    errorLoadingMessage: "Failed to load notifications.",
    alerts: [],
    unreadCount: 1,
    totalCount: 1,
    loading: false,
    error: undefined,
    drawerOpen: true,
    openDrawer: () => {
      logger.info("Storybook open drawer");
    },
    closeDrawer: () => {
      logger.info("Storybook close drawer");
    },
    markOneRead: async deliveryId => {
      logger.info("Storybook mark read", { deliveryId });
    },
    markAllRead: async () => {
      logger.info("Storybook mark all read");
    },
    handleViewEntity: metadata => {
      logger.info("Storybook view entity", { metadata });
    },
    handleReschedule: classInstanceId => {
      logger.info("Storybook reschedule", { classInstanceId });
    },
    handleApproveInvoice: async (deliveryId, invoiceId) => {
      logger.info("Storybook approve invoice", { deliveryId, invoiceId });
    },
    handleRejectInvoice: async (deliveryId, invoiceId) => {
      logger.info("Storybook reject invoice", { deliveryId, invoiceId });
    },
    handleManagePreferences: () => {
      logger.info("Storybook manage preferences");
    },
  };
}

const mockViewModel = createMockViewModel();

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
