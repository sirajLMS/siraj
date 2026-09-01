import type { NotificationEventType } from "@/backend/enum";
import type { NotificationMetadata } from "@/backend/types";

export interface PushPayload {
  readonly userId: string;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
  readonly eventType: NotificationEventType;
  readonly metadata?: NotificationMetadata | null;
}

export interface PushSendResult {
  readonly success: boolean;
  readonly successCount: number;
  readonly failureCount: number;
  readonly errors?: string[];
}

export interface IPushChannel {
  send(payload: PushPayload, locale?: string): Promise<PushSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}
