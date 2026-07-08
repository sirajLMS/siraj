import type { NotificationEventType } from "@/backend/enum";

export interface EmailPayload {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
}

export interface EmailSendResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
}

export interface IEmailChannel {
  send(payload: EmailPayload, locale?: string): Promise<EmailSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export type EmailProvider = "resend";
