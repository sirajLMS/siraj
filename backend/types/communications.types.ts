import type { NotificationEventType } from "@/shared/lib/enum";

export type CommunicationChannelType = "on_app" | "email" | "sms" | "push";

export type CommunicationPayload = {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: CommunicationChannelType;
  readonly eventType: NotificationEventType;
  readonly metadata?: Record<string, unknown>;
};

export type ChannelDispatchResult = {
  readonly channel: CommunicationChannelType;
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
};
