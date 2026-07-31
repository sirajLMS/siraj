import type { NotificationChannel, NotificationEventType } from "@/backend/enum";

export type CommunicationPayload = {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: NotificationChannel;
  readonly eventType: NotificationEventType;
  readonly metadata?: Record<string, unknown>;
};

export type ChannelDispatchResult = {
  readonly channel: NotificationChannel;
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
};
