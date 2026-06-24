import type { NotificationEventType } from "@/shared/lib/enum";

export interface SmsPayload {
  readonly to: string;
  readonly body: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
}

export interface SmsSendResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
  readonly rateLimited?: boolean;
}

export interface ISmsChannel {
  send(payload: SmsPayload, locale?: string): Promise<SmsSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export type SmsProvider = "twilio";
