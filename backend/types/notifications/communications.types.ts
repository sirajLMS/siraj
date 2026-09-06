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
  /**
   * Machine-readable domain error code surfaced by channel pre-flight
   * failures (e.g. WhatsApp `whatsapp.noSenderForPurpose` /
   * `whatsapp.accountOffboarded`).
   */
  readonly errorCode?: string;
  /**
   * Whether a provider API call was actually attempted.
   * Only set for WhatsApp sends — failed sends that reached Meta still
   * consume `portfolioMessagingLimitTier` budget.  `undefined` for other
   * channels (no budget accounting needed).
   */
  readonly sendAttempted?: boolean;
};
