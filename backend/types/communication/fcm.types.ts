import type { Messaging } from "firebase-admin/messaging";

export interface FcmPushContext {
  readonly messaging: Messaging;
  readonly projectId: string;
}

export interface FcmMulticastResult {
  readonly successCount: number;
  readonly failureCount: number;
  readonly responses: FcmSendResponse[];
}

export interface FcmSendResponse {
  readonly success: boolean;
  readonly messageId?: string;
  readonly error?: FcmErrorInfo;
}

export interface FcmErrorInfo {
  readonly code: string;
  readonly message: string;
}
