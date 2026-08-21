import { EventOutlined, InfoOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import { NotificationRowBase } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/NotificationRowBase";

// NOTIFICATIONS-SPEC: Storybook mock fixtures — not user-facing UI strings (F13 exemption).
interface MockNotificationAlert {
  readonly id: string;
  readonly deliveryId: string | null;
  readonly type: "complaint" | "notification" | "system";
  readonly eventType: NotificationEventType | null;
  readonly channel: NotificationChannel | null;
  readonly metadata: {
    readonly entityKind: "invoice" | "class";
    readonly entityId: string;
    readonly classInstanceId?: string;
    readonly proofPending?: boolean;
    readonly newStatus?: string;
  } | null;
  readonly title: string;
  readonly body: string | null;
  readonly createdAt: string;
  readonly severity: "info" | "warning" | "error";
  readonly readAt: string | null;
}

const infoAccent = (theme: Theme) => theme.palette.info.main;
const warningAccent = (theme: Theme) => theme.palette.warning.main;

const baseHandlers = {
  onMarkRead: (deliveryId: string) => {
    logger.info("Storybook mark read", { deliveryId });
  },
  onViewEntity: () => {
    logger.info("Storybook view entity");
  },
};

const unreadInfoAlert: MockNotificationAlert = {
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

const classRescheduledAlert: MockNotificationAlert = {
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

const invoiceProofPendingAlert: MockNotificationAlert = {
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

const meta: Meta<typeof NotificationRowBase> = {
  title: "Dashboard/Notifications/NotificationRowBase",
  component: NotificationRowBase,
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

type Story = StoryObj<typeof NotificationRowBase>;

export const UnreadInfo: Story = {
  args: {
    alert: unreadInfoAlert,
    icon: <InfoOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
    ...baseHandlers,
  },
};

export const ClassRescheduled: Story = {
  args: {
    alert: classRescheduledAlert,
    icon: <EventOutlined fontSize="small" />,
    iconColor: warningAccent,
    accentColor: warningAccent,
    secondaryActions: (
      <Button
        size="small"
        variant="outlined"
        onClick={() => {
          logger.info("Storybook reschedule clicked");
        }}
      >
        Reschedule
      </Button>
    ),
    ...baseHandlers,
  },
};

export const InvoiceProofPending: Story = {
  args: {
    alert: invoiceProofPendingAlert,
    icon: <ReceiptLongOutlined fontSize="small" />,
    iconColor: infoAccent,
    accentColor: infoAccent,
    secondaryActions: (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            logger.info("Storybook approve invoice clicked");
          }}
          sx={theme => ({
            backgroundColor: theme.palette.success.main,
            color: theme.palette.onSuccess,
            "&:hover": {
              backgroundColor: theme.palette.success.dark,
            },
          })}
        >
          Approve
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            logger.info("Storybook reject invoice clicked");
          }}
          sx={theme => ({
            borderColor: theme.palette.error.main,
            color: theme.palette.error.main,
            "&:hover": {
              borderColor: theme.palette.error.dark,
              backgroundColor: theme.palette.action.hover,
            },
          })}
        >
          Reject
        </Button>
      </Stack>
    ),
    ...baseHandlers,
  },
};
