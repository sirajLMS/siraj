import { EventOutlined, InfoOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { logger } from "@/frontend/common/utils/logger";
import { NotificationRowBase } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/NotificationRowBase";
import {
  classRescheduledAlert,
  invoiceProofPendingAlert,
  unreadInfoAlert,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/notificationRowFixtures";

// NOTIFICATIONS-SPEC: Storybook mock fixtures — not user-facing UI strings (F13 exemption).

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
