import type { NotificationEventType } from "@/backend/enum";
import type { NotificationMetadata } from "@/backend/types";

export interface EmailPayload {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
  readonly metadata?: NotificationMetadata | null;
}

export interface EmailSendResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
  readonly rateLimited?: boolean;
}

export interface IEmailChannel {
  send(payload: EmailPayload, locale?: string): Promise<EmailSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}
