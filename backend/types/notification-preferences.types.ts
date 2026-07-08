import type { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";

export type NotificationPreferenceReturnType = {
  readonly id: string;
  readonly channel: NotificationChannel;
  readonly eventType: NotificationEventType;
  readonly enabled: boolean;
};

export type NotificationPreferenceUpdateInput = {
  readonly channel: NotificationChannel;
  readonly eventType: NotificationEventType;
  readonly enabled: boolean;
};
