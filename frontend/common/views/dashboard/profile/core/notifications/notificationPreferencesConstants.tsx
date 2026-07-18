// NEW FOR PLAN v5 (newly created for the migration wave)
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import PhoneIphoneOutlined from "@mui/icons-material/PhoneIphoneOutlined";
import SmsOutlined from "@mui/icons-material/SmsOutlined";
import { NotificationChannel } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { NOTIFICATION_CHANNELS } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";

export type NotificationChannelId = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationChannelAccent = "primary" | "info" | "warning" | "secondary";

export const NOTIFICATION_CHANNEL_ICONS: Readonly<Record<NotificationChannelId, typeof EmailOutlined>> = {
  [NotificationChannel.Email]: EmailOutlined,
  [NotificationChannel.Sms]: SmsOutlined,
  [NotificationChannel.Push]: NotificationsActiveOutlined,
  [NotificationChannel.OnApp]: PhoneIphoneOutlined,
};

export const NOTIFICATION_CHANNEL_ACCENTS: Readonly<Record<NotificationChannelId, NotificationChannelAccent>> = {
  [NotificationChannel.Email]: "primary",
  [NotificationChannel.Sms]: "info",
  [NotificationChannel.Push]: "warning",
  [NotificationChannel.OnApp]: "secondary",
};
