import type { SvgIconComponent } from "@mui/icons-material";
import ChatOutlined from "@mui/icons-material/ChatOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import PhoneIphoneOutlined from "@mui/icons-material/PhoneIphoneOutlined";
import SmsOutlined from "@mui/icons-material/SmsOutlined";
import { NotificationChannel } from "@/frontend/common/graphql/generated/gql/graphql";

export type NotificationChannelAccent = "primary" | "info" | "warning" | "secondary";

export const NOTIFICATION_CHANNEL_ICONS: Readonly<Record<NotificationChannel, SvgIconComponent>> = {
  [NotificationChannel.Email]: EmailOutlined,
  [NotificationChannel.Sms]: SmsOutlined,
  [NotificationChannel.Push]: NotificationsActiveOutlined,
  [NotificationChannel.OnApp]: PhoneIphoneOutlined,
  [NotificationChannel.Whatsapp]: ChatOutlined,
};

export const NOTIFICATION_CHANNEL_ACCENTS: Readonly<Record<NotificationChannel, NotificationChannelAccent>> = {
  [NotificationChannel.Email]: "primary",
  [NotificationChannel.Sms]: "info",
  [NotificationChannel.Push]: "warning",
  [NotificationChannel.OnApp]: "secondary",
  [NotificationChannel.Whatsapp]: "primary",
};
