import type { NotificationEventType } from "@/backend/enum";
import type { NotificationMetadata } from "@/backend/types";

export interface SmsPayload {
  readonly to: string;
  readonly body: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
  readonly metadata?: NotificationMetadata | null;
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

/** Data shape for the urgent complaint response SMS template. */
export interface UrgentComplaintResponseSmsData {
  readonly parentName: string;
  readonly complaintTitle: string;
  readonly responseSummary: string;
}
