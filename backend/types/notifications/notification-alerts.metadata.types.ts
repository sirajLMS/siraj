import type { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";

export type {
  ClassMetadata,
  ComplaintMetadata,
  InvoiceMetadata,
  LessonReportMetadata,
  NotificationEntityKind,
  NotificationMetadata,
  NotificationMetadataBase,
  PaymentMethodMetadata,
  ScheduleMetadata,
  StudentMetadata,
  SuggestionMetadata,
} from "@/shared/types/notification-alerts.types";

export type UnansweredComplaintRow = {
  id: string;
  body: string;
  createdAt: Date;
};

export type RecentNotificationRow = {
  id: string;
  title: string | null;
  body: string | null;
  createdAt: Date;
  status: NotificationDeliveryStatus;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  metadata: unknown;
  openedAt: Date | null;
};

export type MarkableDeliveryRow = {
  id: string;
  status: NotificationDeliveryStatus;
};
